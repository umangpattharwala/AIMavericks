from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # LLM
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-haiku-4-5-20251001"
    anthropic_advanced_model: str = "claude-sonnet-4-6-20250514"

    # Embeddings
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"

    # Vector Store
    chroma_persist_dir: str = "./data/vectorstore"
    chroma_collection_name: str = "nexacore_benefits"

    # Observability
    langfuse_public_key: str = ""
    langfuse_secret_key: str = ""
    langfuse_host: str = "https://cloud.langfuse.com"
    phoenix_collector_endpoint: str = "http://localhost:6006"

    # Web Research
    tavily_api_key: str = ""

    # Application
    app_env: str = "development"
    app_port: int = 8000
    cors_origins: str = "http://localhost:3000"

    # Auth
    jwt_secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 480

    # Paths
    rag_documents_dir: str = "../data/RAG Documents"
    employee_directory_path: str = "../data/RAG Documents/nexacore_employee_directory.csv"

    # Database
    database_url: str = "sqlite+aiosqlite:///./data/nexacore.db"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache()
def get_settings() -> Settings:
    return Settings()
