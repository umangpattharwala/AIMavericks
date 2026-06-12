"""Script to ingest RAG documents into the vector store."""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.rag.document_loader import load_all_documents, chunk_documents
from app.rag.vectorstore import initialize_vectorstore


def main():
    print("=" * 60)
    print("NexaCore RAG Document Ingestion")
    print("=" * 60)

    # Load documents
    print("\n[1/3] Loading documents...")
    documents = load_all_documents()
    print(f"  → Loaded {len(documents)} documents")

    # Chunk documents
    print("\n[2/3] Chunking documents...")
    chunks = chunk_documents(documents, chunk_size=1000, chunk_overlap=200)
    print(f"  → Created {len(chunks)} chunks")

    # Show category distribution
    categories = {}
    for chunk in chunks:
        cat = chunk.metadata.get("category", "unknown")
        categories[cat] = categories.get(cat, 0) + 1
    print("\n  Category distribution:")
    for cat, count in sorted(categories.items()):
        print(f"    - {cat}: {count} chunks")

    # Initialize vector store
    print("\n[3/3] Building vector store...")
    vectorstore = initialize_vectorstore(chunks)
    print(f"  → Vector store created with {len(chunks)} embeddings")

    print("\n" + "=" * 60)
    print("Ingestion complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()
