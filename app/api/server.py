from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
import os
from app.core import BengaliRAGSystem
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(
    title="Bengali RAG System API",
    description="Retrieval-Augmented Generation System for Bengali Question-Answer Dataset",
    version="1.0.0",
    default_response_class=JSONResponse
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

rag_system = None


class SearchRequest(BaseModel):
    query: str
    k: Optional[int] = 5


class SearchResult(BaseModel):
    rank: int
    id: int
    question_id: int
    question: str
    question_cleaned: str
    option_1: Optional[str] = None
    option_2: Optional[str] = None
    option_3: Optional[str] = None
    option_4: Optional[str] = None
    option_5: Optional[str] = None
    answer: Optional[str] = None
    answer_text: Optional[str] = None
    explanation: Optional[str] = None
    difficulty: Optional[int] = None
    similarity_score: float
    distance: float


class SearchResponse(BaseModel):
    query: str
    results: List[SearchResult]
    total_results: int
    system_stats: dict


class SystemStats(BaseModel):
    total_questions: int
    model_name: str
    embedding_dimension: Optional[int]
    has_embeddings: bool
    has_index: bool


class ChatRequest(BaseModel):
    message: str
    k: Optional[int] = 3

class ChatResponse(BaseModel):
    user_message: str
    answer: Optional[str]
    match: Optional[dict]
    alternatives: Optional[list]


@app.on_event("startup")
async def startup_event():
    global rag_system
    try:
        print("Initializing RAG system...")
        rag_system = BengaliRAGSystem()

        if os.path.exists('embeddings.pkl'):
            print("Loading existing embeddings...")
            rag_system.load_embeddings('embeddings.pkl')
        else:
            print("Computing new embeddings...")
            rag_system.load_data('questions.csv')
            rag_system.compute_embeddings('embeddings.pkl')

        print("RAG system initialized successfully!")

    except Exception as e:
        print(f"Error initializing RAG system: {e}")
        raise e


@app.get("/")
async def root():
    return {
        "name": "Bengali RAG System API",
        "version": "1.0.0",
        "endpoints": {
            "search": {"method": "GET", "path": "/search", "params": ["query", "k"]},
            "stats": {"method": "GET", "path": "/stats"},
            "health": {"method": "GET", "path": "/health"}
        }
    }


@app.get("/search", response_model=SearchResponse)
async def search(query: str = Query(..., description="Search query"), k: int = Query(5, ge=1, le=50, description="Number of results to return")):
    if rag_system is None:
        raise HTTPException(status_code=503, detail="RAG system not initialized")
    try:
        results = rag_system.search(query, k=k)
        search_results = [SearchResult(**result) for result in results]
        return SearchResponse(query=query, results=search_results, total_results=len(search_results), system_stats=rag_system.get_stats())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search error: {str(e)}")


@app.get("/ask")
async def ask(query: str = Query(..., description="Question to ask"), k: int = Query(3, ge=1, le=10)):
    if rag_system is None:
        raise HTTPException(status_code=503, detail="RAG system not initialized")
    try:
        results = rag_system.search(query, k=k)
        top = results[0] if results else None
        return {
            "query": query,
            "answer": top.get("answer_text") if top else None,
            "match": top,
            "alternatives": results[1:]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ask error: {str(e)}")


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    if rag_system is None:
        raise HTTPException(status_code=503, detail="RAG system not initialized")
    try:
        results = rag_system.search(request.message, k=request.k)
        top = results[0] if results else None
        return ChatResponse(
            user_message=request.message,
            answer=top.get("answer_text") if top else None,
            match=top,
            alternatives=results[1:]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")


@app.get("/stats", response_model=SystemStats)
async def get_stats():
    if rag_system is None:
        raise HTTPException(status_code=503, detail="RAG system not initialized")
    return SystemStats(**rag_system.get_stats())


@app.get("/health")
async def health_check():
    return {"status": "healthy", "rag_system_initialized": rag_system is not None}


