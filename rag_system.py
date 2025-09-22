
import pandas as pd
import numpy as np
import pickle
import os
from typing import List, Dict, Tuple, Optional
from sentence_transformers import SentenceTransformer
from sklearn.neighbors import NearestNeighbors
from sklearn.metrics.pairwise import cosine_similarity
import re


class BengaliRAGSystem:
    def __init__(self, model_name: str = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"):
        self.model_name = model_name
        self.model = None
        self.data = None
        self.embeddings = None
        self.nn_index = None
        self.questions_cleaned = []
        
    def load_data(self, csv_path: str) -> pd.DataFrame:
        print(f"Loading data from {csv_path}...")
        self.data = pd.read_csv(csv_path)
        
        print("Cleaning data...")
        self.data = self.data.dropna(subset=['Question'])
        self.questions_cleaned = []
        for question in self.data['Question']:
            cleaned = self._clean_text(question)
            self.questions_cleaned.append(cleaned)
        self.data['Question_Cleaned'] = self.questions_cleaned
        self.data = self.data[self.data['Question_Cleaned'].str.strip() != '']
        
        print(f"Loaded {len(self.data)} questions after cleaning")
        return self.data
    
    def _clean_text(self, text: str) -> str:
        if pd.isna(text):
            return ""
        
        text = re.sub(r'<[^>]+>', '', text)
        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'[^\w\s\u0980-\u09FF]', ' ', text)
        
        return text.strip()
    
    def initialize_model(self):
        print(f"Loading model: {self.model_name}")
        self.model = SentenceTransformer(self.model_name)
        print("Model loaded successfully!")
    
    def compute_embeddings(self, save_path: Optional[str] = None):
        if self.model is None:
            self.initialize_model()
        
        print("Computing embeddings for questions...")
        
        texts_for_embedding = []
        for idx, row in self.data.iterrows():
            text = row['Question_Cleaned']
            if pd.notna(row['Explain']) and str(row['Explain']).strip():
                explanation = self._clean_text(str(row['Explain']))
                text = f"{text} {explanation}"
            texts_for_embedding.append(text)
        self.embeddings = self.model.encode(texts_for_embedding, show_progress_bar=True)
        print(f"Computed embeddings with shape: {self.embeddings.shape}")
        print("Building nearest neighbors index...")
        self.nn_index = NearestNeighbors(n_neighbors=min(50, len(self.data)), 
                                       metric='cosine', 
                                       algorithm='brute')
        self.nn_index.fit(self.embeddings)
        if save_path:
            self.save_embeddings(save_path)
    
    def save_embeddings(self, path: str):
        print(f"Saving embeddings to {path}")
        
        os.makedirs(os.path.dirname(path) if os.path.dirname(path) else '.', exist_ok=True)
        save_data = {
            'embeddings': self.embeddings,
            'model_name': self.model_name,
            'data': self.data
        }
        with open(path, 'wb') as f:
            pickle.dump(save_data, f)
        index_path = path.replace('.pkl', '_index.pkl')
        with open(index_path, 'wb') as f:
            pickle.dump(self.nn_index, f)
        
        print("Embeddings saved successfully!")
    
    def load_embeddings(self, path: str):
        print(f"Loading embeddings from {path}")
        
        with open(path, 'rb') as f:
            save_data = pickle.load(f)
        
        self.embeddings = save_data['embeddings']
        self.model_name = save_data['model_name']
        self.data = save_data['data']
        
        index_path = path.replace('.pkl', '_index.pkl')
        with open(index_path, 'rb') as f:
            self.nn_index = pickle.load(f)
        self.initialize_model()
        
        print("Embeddings loaded successfully!")
    
    def search(self, query: str, k: int = 5) -> List[Dict]:
        if self.nn_index is None or self.model is None:
            raise ValueError("System not initialized. Please load data and compute embeddings first.")
        
        query_cleaned = self._clean_text(query)
        query_embedding = self.model.encode([query_cleaned])
        distances, indices = self.nn_index.kneighbors(query_embedding, n_neighbors=k)
        results = []
        for i, (distance, idx) in enumerate(zip(distances[0], indices[0])):
            row = self.data.iloc[idx]
            similarity = 1 - distance
            
            result = {
                'rank': i + 1,
                'id': row['ID'],
                'question_id': row['Question ID'],
                'question': row['Question'],
                'question_cleaned': row['Question_Cleaned'],
                'option_1': row['Option 1'],
                'option_2': row['Option 2'],
                'option_3': row['Option 3'],
                'option_4': row['Option 4'],
                'option_5': row['Option 5'],
                'answer': row['Answer'],
                'explanation': row['Explain'],
                'difficulty': row['Difficulty'],
                'similarity_score': float(similarity),
                'distance': float(distance)
            }
            results.append(result)
        
        return results
    
    def get_stats(self) -> Dict:
        return {
            'total_questions': len(self.data),
            'model_name': self.model_name,
            'embedding_dimension': self.embeddings.shape[1] if self.embeddings is not None else None,
            'has_embeddings': self.embeddings is not None,
            'has_index': self.nn_index is not None
        }


def main():
    rag = BengaliRAGSystem()
    rag.load_data('questions.csv')
    rag.compute_embeddings('embeddings.pkl')
    query = "রবীন্দ্রনাথ ঠাকুর"
    results = rag.search(query, k=5)
    print(f"\nSearch results for: '{query}'")
    print("=" * 50)
    for result in results:
        print(f"Rank {result['rank']}: {result['question']}")
        print(f"Similarity: {result['similarity_score']:.3f}")
        print(f"Answer: {result['answer']}")
        print("-" * 30)


if __name__ == "__main__":
    main()
