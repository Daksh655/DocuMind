import os
import logging
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy import create_engine, text
import google.generativeai as genai
from pypdf import PdfReader
import requests

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

        # Read the PDF text
        reader = PdfReader(temp_path)
        full_text = ""
        for page in reader.pages:
            if page.extract_text():
                full_text += page.extract_text() + "\n"

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
        You are a helpful, conversational, and intelligent assistant for the FluxWork platform.
        Your goal is to help the user understand their uploaded document while maintaining a natural, friendly chat.

    Context extracted from the document:
    {context_text}

    Instructions:
    1. Answer the user's question directly and clearly using the provided context.
    2. Provide the exact amount of detail needed—be thorough but concise. Avoid unnecessary rambling or one-word answers.
    3. If the context does not contain the exact answer, politely mention that it is not in the document, but use your general knowledge to provide a helpful answer anyway.
    4. If the user asks for a summary, give a well-structured, easy-to-read overview of the main points.

    Question: {query_data.query}
    """

    response = ai_model.generate_content(prompt)

    return ChatResponse(
        answer=response.text,
        sources=["Extracted from PDF Database"]
    )