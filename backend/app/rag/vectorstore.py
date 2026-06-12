"""Vector store initialization and management."""
from langchain_chroma import Chroma
from langchain_core.embeddings import Embeddings
from chromadb.utils import embedding_functions as chroma_ef

from app.config import get_settings


class ChromaDefaultEmbeddings(Embeddings):
    """Wraps ChromaDB's default ONNX embedding function for LangChain compatibility."""

    def __init__(self):
        self._ef = chroma_ef.DefaultEmbeddingFunction()

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return self._ef(texts)

    def embed_query(self, text: str) -> list[float]:
        return self._ef([text])[0]


def get_embeddings() -> ChromaDefaultEmbeddings:
    return ChromaDefaultEmbeddings()


def get_vectorstore() -> Chroma:
    """Get or create the Chroma vector store."""
    settings = get_settings()
    embeddings = get_embeddings()
    return Chroma(
        collection_name=settings.chroma_collection_name,
        embedding_function=embeddings,
        persist_directory=settings.chroma_persist_dir,
    )


def initialize_vectorstore(documents: list) -> Chroma:
    """Create vector store from documents (run once during setup)."""
    settings = get_settings()
    embeddings = get_embeddings()
    vectorstore = Chroma.from_documents(
        documents=documents,
        embedding=embeddings,
        collection_name=settings.chroma_collection_name,
        persist_directory=settings.chroma_persist_dir,
    )
    return vectorstore
