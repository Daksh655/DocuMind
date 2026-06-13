# DocuMind

### Context-Aware AI Tutor & Document Intelligence Platform

![Java](https://img.shields.io/badge/Backend-Java_Spring_Boot-brightgreen?style=flat-square\&logo=spring)
![Python](https://img.shields.io/badge/AI_Engine-Python_FastAPI-blue?style=flat-square\&logo=fastapi)
![React](https://img.shields.io/badge/Frontend-React_JS-61DAFB?style=flat-square\&logo=react)
![Docker](https://img.shields.io/badge/Infrastructure-Docker-2496ED?style=flat-square\&logo=docker)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL_pgvector-4169E1?style=flat-square\&logo=postgresql)

---

## Live Demo

# Frontend: 

https://documind-frontend-38zj.onrender.com

---

## Overview

DocuMind is an AI-powered document intelligence platform that transforms static course materials into an interactive learning experience.

The system allows users to upload PDFs, process document content, generate embeddings, and interact with a context-aware AI tutor capable of answering questions based strictly on uploaded materials.

The platform combines Spring Boot, FastAPI, PostgreSQL with pgvector, and Google Gemini to implement a Retrieval-Augmented Generation (RAG) architecture that minimizes hallucinations and improves answer reliability.

---

## Problem Statement

Traditional Learning Management Systems act primarily as file repositories.

Students often rely on general-purpose AI tools that may provide answers inconsistent with instructor-approved material.

Challenges include:

* Time-consuming document review
* Generic AI responses
* Hallucinated information
* Lack of curriculum-specific guidance

---

## Solution

DocuMind introduces an AI-powered tutoring system that answers questions strictly from uploaded course documents.

By combining semantic search, vector embeddings, and Retrieval-Augmented Generation (RAG), the platform provides reliable, context-grounded responses aligned with the original learning materials.

---

## Key Features

### Document Processing

* Secure PDF Upload
* Text Extraction
* Intelligent Semantic Chunking
* Metadata Processing

### AI Tutor

* Retrieval-Augmented Generation (RAG)
* Context-Aware Question Answering
* AI Summarization
* Real-Time Response Streaming
* Hallucination Reduction

### User Features

* JWT Authentication
* Secure User Workspaces
* User-Specific Document Access
* Interactive Chat Interface

### Performance

* Vector Search Optimization
* Fast Semantic Retrieval
* Dockerized Microservices Architecture

---

## AI Workflow

```text
User Uploads PDF
       │
       ▼
Document Parsing & Chunking
       │
       ▼
Embedding Generation (Gemini)
       │
       ▼
Store Embeddings in pgvector
       │
       ▼
User Question
       │
       ▼
Semantic Search
       │
       ▼
Retrieve Relevant Chunks
       │
       ▼
Generate Context-Grounded Response
       │
       ▼
Stream Answer to UI
```

## System Architecture

```text
React Frontend
       │
       ▼
Spring Boot API Gateway
       │
       ▼
FastAPI AI Engine
       │
       ├──────────────► Google Gemini API
       │
       ▼
PostgreSQL + pgvector
```

## Screenshots

### Dashboard

<img width="100%" alt="Dashboard Image" src="https://github.com/user-attachments/assets/269da23e-bda6-4033-ab78-9b377a1b6592" />


### Document Upload

(Add Screenshot)

### AI Chat Interface

(Add Screenshot)

### Generated Summary

(Add Screenshot)

---

## Tech Stack

### Frontend

* React
* JavaScript
* TailwindCSS
* WebSockets

### Backend

* Java 17+
* Spring Boot
* Spring Security
* JWT Authentication

### AI Engine

* Python
* FastAPI
* LangChain

### Database

* PostgreSQL
* pgvector

### Infrastructure

* Docker
* Docker Compose

### AI Services

* Google Gemini API

---

## Core API Endpoints

### Authentication

```http
POST /api/auth/register
POST /api/auth/login
```

### Documents

```http
POST /api/documents/upload
GET /api/documents/list
```

### AI Services

```http
POST /api/ai/embed
POST /api/ai/chat
```

---

## Folder Structure

```text
documind
│
├── ai-engine
├── backend
├── frontend
├── .gitignore
├── docker-compose.yml
└── README.md
```

---

## Local Setup

### Prerequisites

* Git
* Docker Desktop
* Google Gemini API Key

### Start Application

```bash
git clone <repository-url>

cd documind

cp .env.example .env

docker-compose up -d --build
```

### Access Services

```text
Frontend : http://localhost:3000
Backend  : http://localhost:8080
AI Engine: http://localhost:8000
```

---

## Challenges Solved

* Reducing AI Hallucinations through RAG
* PDF Text Processing and Chunking
* Vector Database Integration
* Java ↔ Python Microservice Communication
* Real-Time AI Response Streaming
* Dockerized Multi-Service Deployment

---

## Learning Outcomes

This project provided hands-on experience with:

* Retrieval-Augmented Generation (RAG)
* Vector Databases
* Semantic Search
* Spring Boot Development
* FastAPI Microservices
* JWT Authentication
* Docker Containerization
* Full Stack Development
* Cloud Deployment Concepts

---

## Future Enhancements

* OCR Support
* Multi-Document Chat
* Hybrid Search
* AWS S3 Integration
* Automated Quiz Generation
* Learning Progress Analytics
* Team Collaboration Features

---

## Author

# GitHub

https://github.com/Daksh655/DocuMind

# LinkedIn

https://www.linkedin.com/in/daksh-tiwari-723964361

# Email

daksh.tiwari655@gmail.com
