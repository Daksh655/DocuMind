# DocuMind 🧠

DocuMind is a production-ready, enterprise-grade EdTech platform that implements a Retrieval-Augmented Generation (RAG) pipeline to allow interactive learning strictly constrained to course syllabus contexts.

## Architecture

* **Database:** PostgreSQL 15 + `pgvector` extension.
* **Backend:** Java 17, Spring Boot 3.2.x (Web, Security, Data JPA, Websocket).
* **AI Engine:** Python 3.11, FastAPI 0.109, LangChain, Google Gemini LLM API.
* **Frontend:** React 18.2, Vite 5.0, Tailwind CSS 3.4.

---

## Quick Start Setup

To spin up the entire multi-service monorepo:

```bash
# 1. Copy the environment template
copy .env.example .env

# 2. Open .env and populate details (specifically your GEMINI_API_KEY from Google AI Studio)

# 3. Spin up all containerized microservices in one command
docker-compose up --build
```

### Accessing services:
* **Frontend client:** [http://localhost:5173](http://localhost:5173)
* **Spring Boot API:** [http://localhost:8080](http://localhost:8080)
* **FastAPI AI Server:** [http://localhost:8000](http://localhost:8000)
* **Spring Health Check:** [http://localhost:8080/actuator/health](http://localhost:8080/actuator/health)
* **FastAPI Health Check:** [http://localhost:8000/health](http://localhost:8000/health)
