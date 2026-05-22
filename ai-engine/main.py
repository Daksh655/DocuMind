import os
import logging
import time
from youtube_transcript_api import YouTubeTranscriptApi
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy import create_engine, text
import google.generativeai as genai
import requests
import pytesseract  # for pdf reading
from pdf2image import convert_from_path   # for pdf reading
from PIL import Image  # for pdf reading

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai-engine")

# Load configuration
DATABASE_URL = os.getenv("DATABASE_URL")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Configure Gemini
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

app = FastAPI(title="DocuMind AI Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = None
if DATABASE_URL:
    try:
        engine = create_engine(DATABASE_URL)
        logger.info("Database URL parsed successfully.")
    except Exception as e:
        logger.error(f"Error parsing database URL: {e}")

@app.on_event("startup")
def startup_db_test():
    if not engine:
        return
    try:
        with engine.connect() as connection:
            connection.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))

            # Auto-create the vector table to store PDF chunks
            connection.execute(text("""
                CREATE TABLE IF NOT EXISTS document_chunks (
                    id SERIAL PRIMARY KEY,
                    document_id INTEGER NOT NULL,
                    content TEXT NOT NULL,
                    embedding vector(768)
                )
            """))
            connection.commit()
            logger.info("Database and vector tables are ready!")
    except Exception as e:
        logger.error(f"Database startup error: {e}")

class ChatQuery(BaseModel):
    query: str
    user_id: int
    document_id: Optional[int] = None

class YouTubeRequest(BaseModel):
    url: str
    file_id: int

class ChatResponse(BaseModel):
    answer: str
    sources: List[str]

# --- 1. THE EXTRACTOR & EMBEDDING GENERATOR ---
def process_document_background(file_id: int, file_path: str, pdf_bytes: bytes):
    logger.info(f"AI Engine started processing document ID: {file_id}")
    try:
        # Save temporary file to read it
        temp_path = f"/tmp/{file_path}"
        with open(temp_path, "wb") as f:
            f.write(pdf_bytes)

        # --- NEW OCR VISION ENGINE ---
        # 1. Convert every page of the PDF into a high-quality image
        pages = convert_from_path(temp_path)
        full_text = ""

        # 2. Look at each image and extract the English text visually
        for page in pages:
            text_extracted = pytesseract.image_to_string(page)
            full_text += text_extracted + "\n"

        # Chop text into smaller 1000-character chunks
        chunk_size = 1000
        chunks = [full_text[i:i+chunk_size] for i in range(0, len(full_text), chunk_size)]

        with engine.connect() as conn:
            for chunk in chunks:
                if len(chunk.strip()) < 10:
                    continue

                # Ask Gemini to turn the text into numbers (vectors)
                embedding_result = genai.embed_content(
                    model="models/gemini-embedding-001",
                    content=chunk,
                    task_type="retrieval_document",
                    output_dimensionality=768
                )

                # Save the chunk and its vector to PostgreSQL
                conn.execute(
                    text("INSERT INTO document_chunks (document_id, content, embedding) VALUES (:doc_id, :content, :embedding)"),
                    {"doc_id": file_id, "content": chunk, "embedding": str(embedding_result['embedding'])}
                )
                time.sleep(3.5)
            conn.commit()

        logger.info(f"Successfully processed and embedded document ID: {file_id}")

        # Let Java know we finished! (Optional callback loop)
        try:
            requests.put(f"http://documind_backend:8080/api/documents/{file_id}/complete")
        except:
            pass # Ignore if Java doesn't have this endpoint yet

    except Exception as e:
        logger.error(f"Error processing document {file_id}: {e}")

@app.post("/api/ai/ingest")
async def ingest_document(
    background_tasks: BackgroundTasks,
    file_id: int = Form(...),
    file: UploadFile = File(...)
):
    pdf_bytes = await file.read()
    background_tasks.add_task(process_document_background, file_id, file.filename, pdf_bytes)
    return {"status": "indexed", "file_id": file_id}


@app.post("/api/ai/youtube")
async def ingest_youtube(request: YouTubeRequest):
    logger.info(f"Raw URL received: {request.url}")
    try:
        # 1. Bulletproof Video ID Extraction using Regex
        import re
        match = re.search(r"(?:v=|\/)([0-9A-Za-z_-]{11}).*", request.url)
        if not match:
            raise HTTPException(status_code=400, detail="Could not extract a valid YouTube ID.")

        video_id = match.group(1)
        logger.info(f"Successfully Extracted Video ID: {video_id}")

        # 2. transcript 1.2.4 SYNTAX
        ytt_api = YouTubeTranscriptApi()

        try:
            # Try grabbing English first
            transcript = ytt_api.fetch(video_id, languages=['en', 'en-US'])
        except Exception as e:
            logger.warning(f"Failed to find English, trying first available: {e}")
            # If English fails, fallback and grab the absolute first language available
            transcript_list = ytt_api.list(video_id)
            transcript_data = next(iter(transcript_list))
            transcript = transcript_data.fetch()

        # 3. Mash it together
        full_text = " ".join([chunk.text for chunk in transcript])

        # 4. Chop into chunks
        chunk_size = 1000
        chunks = [full_text[i:i+chunk_size] for i in range(0, len(full_text), chunk_size)]

        # 5. Save to Database
        with engine.connect() as conn:
            for chunk in chunks:
                if len(chunk.strip()) < 10:
                    continue

                embedding_result = genai.embed_content(
                    model="models/gemini-embedding-001",
                    content=chunk,
                    task_type="retrieval_document",
                    output_dimensionality=768
                )

                conn.execute(
                    text("INSERT INTO document_chunks (document_id, content, embedding) VALUES (:doc_id, :content, :embedding)"),
                    {"doc_id": request.file_id, "content": f"[YOUTUBE VIDEO TRANSCRIPT]: {chunk}", "embedding": str(embedding_result['embedding'])}
                )

                # Invisible throttle to protect your API key during the demo!
                time.sleep(3.5)

            conn.commit()

        # 6. Save a "Receipt" to your main backend
        try:
            requests.post("http://documind_backend:8080/api/documents", json={
                "fileName": request.url,
                "userId": 1,
                "status": "PROCESSED"
            })
            logger.info("Successfully saved video receipt to database.")
        except Exception as e:
            logger.error(f"CRITICAL: Failed to save video receipt: {e}")

        return {"status": "indexed", "file_id": request.file_id}

    except Exception as e:
        logger.error(f"Error processing YouTube video: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# --- 2. THE GEMINI BRAIN ---
@app.post("/api/ai/chat", response_model=ChatResponse)
async def chat(query_data: ChatQuery):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API key missing.")

    # 1. Turn the user's question into a vector
    question_embedding = genai.embed_content(
        model="models/gemini-embedding-001",
        content=query_data.query,
        task_type="retrieval_query",
        output_dimensionality=768
    )['embedding']

    # 2. Search PostgreSQL for the closest matching PDF paragraphs
    context_text = ""
    with engine.connect() as conn:
        results = conn.execute(
            text("""
                SELECT content FROM document_chunks
                ORDER BY embedding <-> :q_embed
                LIMIT 3
            """),
            {"q_embed": str(question_embedding)}
        ).fetchall()

        for row in results:
            context_text += row[0] + "\n---\n"

    # 3. Give the paragraphs and the question to Gemini to formulate an answer
    ai_model = genai.GenerativeModel('gemini-2.5-flash')
    prompt = f"""
    You are DocuMind, an intelligent and helpful learning assistant.
    Your goal is to answer the user's question using ONLY the provided context extracted from their uploaded documents.
    Context:
    {context_text}

    CRITICAL INSTRUCTIONS:
    1. Answer using clean bullet points.
    2. You MUST end your response exactly following the "External Resources" template below.
    3. ONLY use highly trusted, English-language websites (like w3schools, geeksforgeeks, mozilla, or official docs).
    4. NEVER output a raw URL in plain text. Always hide it inside markdown brackets like this: [Text](URL).
    5. NEVER output a YouTube "watch?v=" link. ONLY output YouTube search query links.

    --- START TEMPLATE ---
    [Insert your bulleted answer to the question here]

    ### External Resources
    * [Read official documentation on this topic](insert direct, verified website URL here)
    * [Read additional guide on this topic](insert direct, verified website URL here)
    * [Search YouTube for Video Tutorials](https://www.youtube.com/results?search_query=insert+topic+name+with+plus+signs)
    --- END TEMPLATE ---

    Question: {query_data.query}
    """

    # --- THE FIX: Auto-Retry Loop for Rate Limits ---
    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = ai_model.generate_content(prompt)
            break
        except Exception as e:
            if "429" in str(e) or "ResourceExhausted" in str(e):
                if attempt < max_retries - 1:
                    logger.warning(f"Hit Gemini rate limit. Pausing 30 seconds... (Attempt {attempt+1}/{max_retries})")
                    time.sleep(30)
                else:
                    raise e
            else:
                raise e

    return ChatResponse(
        answer=response.text,
        sources=["Extracted from PDF Database"]
    )

# --- 3. THE MEMORY WIPER (DELETE ROUTE) ---
@app.delete("/api/ai/delete/{file_id}")
async def delete_document(file_id: int):
    logger.info(f"Attempting to wipe memory for document ID: {file_id}")
    try:
        with engine.connect() as conn:
            conn.execute(
                text("DELETE FROM document_chunks WHERE document_id = :doc_id"),
                {"doc_id": file_id}
            )
            try:
                conn.execute(text("DELETE FROM documents WHERE id = :doc_id"), {"doc_id": file_id})
            except Exception as e:
                logger.warning(f"Could not delete from main documents table: {e}")
            conn.commit()
        return {"status": "deleted", "message": "Memory wiped successfully."}
    except Exception as e:
        logger.error(f"Error deleting document: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete document from AI memory.")
