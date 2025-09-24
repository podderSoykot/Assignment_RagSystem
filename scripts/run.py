import os
import argparse
import uvicorn
from app.core import BengaliRAGSystem
from app.evaluation import RAGEvaluator


def initialize_system():
    print(" Initializing Bengali RAG System...")
    if not os.path.exists('questions.csv'):
        print(" Error: questions.csv not found!")
        return None
    rag = BengaliRAGSystem()
    rag.load_data('questions.csv')
    if os.path.exists('embeddings.pkl'):
        print(" Loading existing embeddings...")
        rag.load_embeddings('embeddings.pkl')
    else:
        print(" Computing new embeddings...")
        rag.compute_embeddings('embeddings.pkl')
    print(" System initialized successfully!")
    return rag


def run_evaluation():
    print("\n Running evaluation...")
    rag = initialize_system()
    if rag is None:
        return
    evaluator = RAGEvaluator(rag)
    results = evaluator.evaluate_retrieval_metrics()
    evaluator.print_evaluation_report()
    print("\n🔍 Generating qualitative examples...")
    examples = evaluator.get_qualitative_examples(5)
    for i, example in enumerate(examples, 1):
        print(f"\nExample {i}:")
        print(f"Query: {example['query']}")
        print(f"Original Question: {example['original_question']}")
        print(f"Original Answer: {example['original_answer']}")
        for result in example['results']:
            print(f"  Rank {result['rank']}: {result['question']}")
            print(f"    Answer: {result['answer']}")
            print(f"    Similarity: {result['similarity_score']:.3f}")
    # Save results to file
    import json
    with open('evaluation_results.json', 'w', encoding='utf-8') as f:
        json.dump({'metrics': results, 'examples': examples}, f, ensure_ascii=False, indent=2)


def run_api_server(host="0.0.0.0", port=8000):
    print(f"\n Starting API server on {host}:{port}...")
    try:
        uvicorn.run("app.api.server:app", host=host, port=port, reload=False)
    except KeyboardInterrupt:
        print("\n Server stopped by user")
    except Exception as e:
        print(f" Error starting server: {e}")


def interactive_search():
    print("\n🔍 Starting interactive search mode...")
    rag = initialize_system()
    if rag is None:
        return
    print("\nType your queries (or 'quit' to exit):")
    while True:
        try:
            query = input("\n Query: ").strip()
            if query.lower() in ['quit', 'exit', 'q']:
                print("👋 Goodbye!")
                break
            if not query:
                continue
            results = rag.search(query, k=5)
            print(f"\n Results for: '{query}'")
            print("=" * 50)
            for result in results:
                print(f"\nRank {result['rank']}: {result['question']}")
                print(f"Similarity: {result['similarity_score']:.3f}")
                print(f"Answer: {result['answer']}")
                if result['explanation']:
                    print(f"Explanation: {result['explanation'][:100]}...")
                print("-" * 30)
        except KeyboardInterrupt:
            print("\n👋 Goodbye!")
            break
        except Exception as e:
            print(f" Error: {e}")


def main():
    parser = argparse.ArgumentParser(description="Bengali RAG System")
    parser.add_argument("--mode", choices=["api", "eval", "search", "init"], default="api", help="Mode to run the system")
    parser.add_argument("--host", default="0.0.0.0", help="Host for API server")
    parser.add_argument("--port", type=int, default=8000, help="Port for API server")
    args = parser.parse_args()
    if args.mode == "init":
        rag = initialize_system()
        if rag:
            print(f"System ready! Stats: {rag.get_stats()}")
    elif args.mode == "eval":
        run_evaluation()
    elif args.mode == "search":
        interactive_search()
    elif args.mode == "api":
        run_api_server(args.host, args.port)
    else:
        print(" Invalid mode specified")


if __name__ == "__main__":
    main()



