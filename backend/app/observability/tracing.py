"""Observability setup - Langfuse and/or Arize Phoenix tracing."""
from typing import Optional
from contextlib import contextmanager

from app.config import get_settings


_langfuse_handler = None
_phoenix_initialized = False


def init_langfuse():
    """Initialize Langfuse callback handler for LangChain."""
    global _langfuse_handler
    settings = get_settings()

    if not settings.langfuse_public_key or not settings.langfuse_secret_key:
        print("[Observability] Langfuse not configured, skipping...")
        return None

    try:
        from langfuse.callback import CallbackHandler
        _langfuse_handler = CallbackHandler(
            public_key=settings.langfuse_public_key,
            secret_key=settings.langfuse_secret_key,
            host=settings.langfuse_host,
        )
        print("[Observability] Langfuse initialized successfully")
        return _langfuse_handler
    except Exception as e:
        print(f"[Observability] Failed to initialize Langfuse: {e}")
        return None


def init_phoenix():
    """Initialize Arize Phoenix for local tracing."""
    global _phoenix_initialized
    settings = get_settings()

    try:
        import phoenix as px
        from opentelemetry import trace
        from opentelemetry.sdk.trace import TracerProvider
        from opentelemetry.sdk.trace.export import SimpleSpanProcessor
        from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter

        # Set up OTLP exporter to Phoenix
        endpoint = f"{settings.phoenix_collector_endpoint}/v1/traces"
        exporter = OTLPSpanExporter(endpoint=endpoint)
        provider = TracerProvider()
        provider.add_span_processor(SimpleSpanProcessor(exporter))
        trace.set_tracer_provider(provider)

        _phoenix_initialized = True
        print(f"[Observability] Phoenix tracing → {endpoint}")
    except Exception as e:
        print(f"[Observability] Failed to initialize Phoenix: {e}")


def get_langfuse_handler():
    """Get the Langfuse callback handler (or None)."""
    global _langfuse_handler
    if _langfuse_handler is None:
        return init_langfuse()
    return _langfuse_handler


def get_tracing_callbacks() -> list:
    """Get all configured tracing callbacks for LangChain invocations."""
    callbacks = []
    handler = get_langfuse_handler()
    if handler:
        callbacks.append(handler)
    return callbacks


@contextmanager
def trace_conversation(session_id: str, user_id: str):
    """Context manager for tracing a complete conversation turn."""
    handler = get_langfuse_handler()
    if handler:
        handler.session_id = session_id
        handler.user_id = user_id
    try:
        yield get_tracing_callbacks()
    finally:
        if handler:
            handler.flush()
