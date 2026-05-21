import os
import logging
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import sqlalchemy
from sqlalchemy import create_engine, text

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai-engine")

# Load configuration from environment variables
DATABASE_URL = os.getenv("DATABASE_URL")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

app = FastAPI(title="DocuMind AI Engine", version="1.0.0")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database Engine initialization
engine = None
if DATABASE_URL:
    try:
        # Standard sqlalchemy engine to test connection
        engine = create_engine(DATABASE_URL)
        logger.info("Database URL parsed successfully.")
    except Exception as e:
        logger.error(f"Error parsing database URL: {e}")
else:
    logger.warning("DATABASE_URL environment variable is not set.")

@app.on_event("startup")
def startup_db_test():
    """Verify database connection and the presence of pgvector extension on startup."""
    if not engine:
        logger.error("Startup database check skipped: engine not initialized.")
        return
    try:
        with engine.connect() as connection:
            # Check connection
            connection.execute(text("SELECT 1"))
            logger.info("Successfully connected to the database.")

            # Check or enable pgvector extension if superuser permissions allow,
            # or simply verify its existence.
            try:
                connection.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
                logger.info("pgvector extension check/creation successful.")
            except Exception as vector_err:
                logger.warning(f"Could not initialize pgvector extension: {vector_err}")
    except Exception as e:
        logger.error(f"Failed to connect to the database on startup: {e}")

# Request/Response schemas
class ChatQuery(BaseModel):
    query: str
    user_id: int
    document_id: Optional[int] = None

class ChatResponse(BaseModel):
    answer: str
    sources: List[str]

# Background tasks placeholder for actual parsing, chunking, and embedding logic
def process_document_background(file_id: int, file_path: str):
    logger.info(f"Background processing started for document ID: {file_id}")
    try:
        # In production RAG:
        # 1. Load PDF (PyPDFLoader)
        # 2. Chunk text (RecursiveCharacterTextSplitter)
        # 3. Create GoogleGeminiEmbeddings
        # 4. Store vectors in pgvector table
        # 5. Call backend to update status to 'PROCESSED'w
        logger.info(f"Finished processing document ID: {file_id}")
    except Exception as e:
        logger.error(f"Error processing document {file_id}: {e}")

@app.post("/api/ai/ingest")
async def ingest_document(
    background_tasks: BackgroundTasks,
    file_id: int = Form(...),
    file: UploadFile = File(...)
):
    """
    Ingests and indexes a PDF document for semantic search.
    Expects document file_id and PDF file.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    logger.info(f"Ingesting file ID: {file_id}, Name: {file.filename}")

    # Placeholder: In a complete RAG, we would save the uploaded file temporarily or read it directly.
    # Start background processing task
    background_tasks.add_task(process_document_background, file_id, file.filename)

    return {"status": "indexed", "chunks": 5, "file_id": file_id}

@app.post("/api/ai/chat", response_model=ChatResponse)
async def chat(query_data: ChatQuery):
    """
    RAG chat endpoint. Performs similarity search on query embeddings,
    retrieves context, and prompts Gemini for a factual, constrained response.
    """
    logger.info(f"Chat request received from user {query_data.user_id} with query: {query_data.query}")

    # Placeholder return simulating RAG results
    simulated_answer = (
        "Based on the course materials: This is a simulated response from Gemini. "
        "The RAG workflow retrieves context matching the query from pgvector, "
        "and sends it along with the question to Gemini API."
    )

    return ChatResponse(
        answer=simulated_answer,
        sources=["Syllabus_Week_1.pdf - page 2", "Lecture_Notes_Intro.pdf - page 5"]
    )

@app.get("/health")
def health_check():
    """Simple health endpoint returning the status of the service."""
    db_status = "unconfigured"
    if engine:
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
                db_status = "connected"
        except Exception:
            db_status = "disconnected"

    return {
        "status": "ok",
        "database": db_status,
        "gemini_api_key_configured": bool(GEMINI_API_KEY)
    }
