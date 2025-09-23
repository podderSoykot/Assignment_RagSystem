import numpy as np
from typing import List, Dict
import random
from sklearn.model_selection import train_test_split
from app.core import BengaliRAGSystem


class RAGEvaluator:
    def __init__(self, rag_system: BengaliRAGSystem):
        self.rag_system = rag_system
        self.results: Dict = {}

    def evaluate_retrieval_metrics(self, test_size: float = 0.2, random_state: int = 42) -> Dict:
        print("Starting evaluation...")
        all_questions = self.rag_system.data['Question_Cleaned'].tolist()
        all_indices = list(range(len(all_questions)))
        _, test_indices = train_test_split(all_indices, test_size=test_size, random_state=random_state)
        print(f"Using {len(test_indices)} questions for evaluation")

        hit_at_1 = 0
        hit_at_3 = 0
        hit_at_5 = 0
        reciprocal_ranks: List[float] = []

        for i, test_idx in enumerate(test_indices):
            if i % 10 == 0:
                print(f"Evaluating question {i+1}/{len(test_indices)}")
            query = all_questions[test_idx]
            results = self.rag_system.search(query, k=20)
            ranks = [r['rank'] for r in results if r['id'] == self.rag_system.data.iloc[test_idx]['ID']]
            if ranks:
                rank = ranks[0]
                if rank <= 1:
                    hit_at_1 += 1
                if rank <= 3:
                    hit_at_3 += 1
                if rank <= 5:
                    hit_at_5 += 1
                reciprocal_ranks.append(1.0 / rank)
            else:
                reciprocal_ranks.append(0.0)

        total_questions = len(test_indices)
        hit_at_1_score = hit_at_1 / total_questions
        hit_at_3_score = hit_at_3 / total_questions
        hit_at_5_score = hit_at_5 / total_questions
        mrr = float(np.mean(reciprocal_ranks))

        self.results = {
            'hit_at_1': hit_at_1_score,
            'hit_at_3': hit_at_3_score,
            'hit_at_5': hit_at_5_score,
            'mrr': mrr,
            'total_questions_evaluated': total_questions,
            'hit_at_1_count': hit_at_1,
            'hit_at_3_count': hit_at_3,
            'hit_at_5_count': hit_at_5,
            'reciprocal_ranks': reciprocal_ranks
        }

        return self.results

    def get_qualitative_examples(self, num_examples: int = 5) -> List[Dict]:
        examples: List[Dict] = []
        sample_indices = random.sample(range(len(self.rag_system.data)), num_examples)
        for idx in sample_indices:
            row = self.rag_system.data.iloc[idx]
            query = row['Question_Cleaned']
            results = self.rag_system.search(query, k=3)
            example = {
                'query': query,
                'original_question': row['Question'],
                'original_answer': row['Answer'],
                'results': [
                    {
                        'rank': r['rank'],
                        'question': r['question'],
                        'answer': r['answer'],
                        'similarity_score': r['similarity_score']
                    }
                    for r in results
                ]
            }
            examples.append(example)
        return examples

    def print_evaluation_report(self):
        if not self.results:
            print("No evaluation results available. Run evaluate_retrieval_metrics() first.")
            return

        print("\n" + "="*60)
        print("BENGALI RAG SYSTEM EVALUATION REPORT")
        print("="*60)

        print(f"\nDataset Information:")
        print(f"- Total questions in dataset: {self.rag_system.get_stats()['total_questions']}")
        print(f"- Questions evaluated: {self.results['total_questions_evaluated']}")
        print(f"- Model used: {self.rag_system.model_name}")
        print(f"- Embedding dimension: {self.rag_system.get_stats()['embedding_dimension']}")

        print(f"\nRetrieval Metrics:")
        print(f"- Hit@1: {self.results['hit_at_1']:.3f} ({self.results['hit_at_1_count']}/{self.results['total_questions_evaluated']})")
        print(f"- Hit@3: {self.results['hit_at_3']:.3f} ({self.results['hit_at_3_count']}/{self.results['total_questions_evaluated']})")
        print(f"- Hit@5: {self.results['hit_at_5']:.3f} ({self.results['hit_at_5_count']}/{self.results['total_questions_evaluated']})")
        print(f"- Mean Reciprocal Rank (MRR): {self.results['mrr']:.3f}")

        ranks = [1/rr for rr in self.results['reciprocal_ranks'] if rr > 0]
        if ranks:
            print(f"\nRank Distribution:")
            print(f"- Average rank when found: {np.mean(ranks):.2f}")
            print(f"- Median rank when found: {np.median(ranks):.2f}")
            print(f"- Questions not found in top 20: {sum(1 for rr in self.results['reciprocal_ranks'] if rr == 0)}")

        print("\n" + "="*60)


``