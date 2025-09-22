
from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
import os
from rag_system import BengaliRAGSystem

app = FastAPI(
    title="Bengali RAG System API",
    description="Retrieval-Augmented Generation System for Bengali Question-Answer Dataset",
    version="1.0.0"
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

@app.get("/", response_class=HTMLResponse)
async def root():
    html_content = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bengali RAG System</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f5f5f5;
            }
            .container {
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 {
                color: #333;
                text-align: center;
                margin-bottom: 30px;
            }
            .search-form {
                margin-bottom: 30px;
            }
            .search-input {
                width: 70%;
                padding: 12px;
                font-size: 16px;
                border: 2px solid #ddd;
                border-radius: 5px;
                margin-right: 10px;
            }
            .search-button {
                padding: 12px 25px;
                font-size: 16px;
                background-color: #007bff;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
            }
            .search-button:hover {
                background-color: #0056b3;
            }
            .k-input {
                width: 80px;
                padding: 8px;
                margin-left: 10px;
                border: 1px solid #ddd;
                border-radius: 3px;
            }
            .results {
                margin-top: 20px;
            }
            .result-item {
                background: #f8f9fa;
                border: 1px solid #e9ecef;
                border-radius: 5px;
                padding: 20px;
                margin-bottom: 15px;
            }
            .result-question {
                font-size: 18px;
                font-weight: bold;
                color: #333;
                margin-bottom: 10px;
            }
            .result-meta {
                color: #666;
                font-size: 14px;
                margin-bottom: 10px;
            }
            .result-options {
                margin: 10px 0;
            }
            .result-explanation {
                background: #e3f2fd;
                padding: 15px;
                border-radius: 5px;
                margin-top: 10px;
            }
            .similarity-score {
                float: right;
                background: #28a745;
                color: white;
                padding: 5px 10px;
                border-radius: 15px;
                font-size: 12px;
            }
            .loading {
                text-align: center;
                color: #666;
                font-style: italic;
            }
            .error {
                background: #f8d7da;
                color: #721c24;
                padding: 15px;
                border-radius: 5px;
                margin: 20px 0;
            }
            .stats {
                background: #d1ecf1;
                color: #0c5460;
                padding: 15px;
                border-radius: 5px;
                margin: 20px 0;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🔍 Bengali RAG System</h1>
            <p style="text-align: center; color: #666;">Search through Bengali literature questions and get relevant answers</p>
            
            <div class="search-form">
                <input type="text" id="searchQuery" class="search-input" placeholder="Enter your search query in Bengali or English..." />
                <button onclick="search()" class="search-button">Search</button>
                <label for="kValue">Top K:</label>
                <input type="number" id="kValue" class="k-input" value="5" min="1" max="20" />
            </div>
            
            <div id="stats" class="stats" style="display: none;"></div>
            <div id="results"></div>
        </div>

        <script>
            async function search() {
                const query = document.getElementById('searchQuery').value.trim();
                const k = parseInt(document.getElementById('kValue').value);
                
                if (!query) {
                    alert('Please enter a search query');
                    return;
                }
                
                const resultsDiv = document.getElementById('results');
                resultsDiv.innerHTML = '<div class="loading">Searching...</div>';
                
                try {
                    const response = await fetch(`/search?query=${encodeURIComponent(query)}&k=${k}`);
                    const data = await response.json();
                    
                    if (response.ok) {
                        displayResults(data);
                    } else {
                        resultsDiv.innerHTML = `<div class="error">Error: ${data.detail}</div>`;
                    }
                } catch (error) {
                    resultsDiv.innerHTML = `<div class="error">Error: ${error.message}</div>`;
                }
            }
            
            function displayResults(data) {
                const resultsDiv = document.getElementById('results');
                const statsDiv = document.getElementById('stats');
                
                // Display stats
                statsDiv.innerHTML = `
                    <strong>System Stats:</strong> 
                    Total Questions: ${data.system_stats.total_questions} | 
                    Model: ${data.system_stats.model_name} | 
                    Embedding Dimension: ${data.system_stats.embedding_dimension}
                `;
                statsDiv.style.display = 'block';
                
                if (data.results.length === 0) {
                    resultsDiv.innerHTML = '<div class="error">No results found</div>';
                    return;
                }
                
                let html = `<h3>Search Results for: "${data.query}" (${data.total_results} results)</h3>`;
                
                data.results.forEach(result => {
                    html += `
                        <div class="result-item">
                            <div class="similarity-score">${(result.similarity_score * 100).toFixed(1)}% match</div>
                            <div class="result-question">${result.question}</div>
                            <div class="result-meta">
                                ID: ${result.id} | Question ID: ${result.question_id} | Difficulty: ${result.difficulty || 'N/A'}
                            </div>
                    `;
                    
                    if (result.option_1 || result.option_2 || result.option_3 || result.option_4) {
                        html += '<div class="result-options"><strong>Options:</strong><br>';
                        if (result.option_1) html += `ক) ${result.option_1}<br>`;
                        if (result.option_2) html += `খ) ${result.option_2}<br>`;
                        if (result.option_3) html += `গ) ${result.option_3}<br>`;
                        if (result.option_4) html += `ঘ) ${result.option_4}<br>`;
                        html += '</div>';
                    }
                    
                    if (result.answer) {
                        html += `<div><strong>Answer:</strong> ${result.answer}</div>`;
                    }
                    
                    if (result.explanation) {
                        html += `
                            <div class="result-explanation">
                                <strong>Explanation:</strong><br>
                                ${result.explanation.replace(/<br\s*\/?>/gi, '<br>')}
                            </div>
                        `;
                    }
                    
                    html += '</div>';
                });
                
                resultsDiv.innerHTML = html;
            }
            
            // Allow Enter key to trigger search
            document.getElementById('searchQuery').addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    search();
                }
            });
        </script>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)

@app.get("/search", response_model=SearchResponse)
async def search(
    query: str = Query(..., description="Search query"),
    k: int = Query(5, ge=1, le=50, description="Number of results to return")
):
    if rag_system is None:
        raise HTTPException(status_code=503, detail="RAG system not initialized")
    
    try:
        results = rag_system.search(query, k=k)
        
        search_results = [
            SearchResult(**result) for result in results
        ]
        
        return SearchResponse(
            query=query,
            results=search_results,
            total_results=len(search_results),
            system_stats=rag_system.get_stats()
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search error: {str(e)}")

@app.get("/stats", response_model=SystemStats)
async def get_stats():
    if rag_system is None:
        raise HTTPException(status_code=503, detail="RAG system not initialized")
    
    return SystemStats(**rag_system.get_stats())

@app.get("/health")
async def health_check():
    return {"status": "healthy", "rag_system_initialized": rag_system is not None}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
