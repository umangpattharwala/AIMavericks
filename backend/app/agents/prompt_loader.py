"""Prompt loader — reads agent prompts from the external prompts/ directory."""
import os
from functools import lru_cache
from pathlib import Path

# Resolve prompts directory relative to the backend root
_PROMPTS_DIR = Path(__file__).resolve().parent.parent.parent / "prompts"


@lru_cache(maxsize=None)
def load_prompt(agent_name: str) -> str:
    """Load a prompt template from prompts/{agent_name}.md.

    Args:
        agent_name: Name of the agent (e.g. 'orchestrator', 'policy_agent')

    Returns:
        The prompt template string with {placeholders} intact.

    Raises:
        FileNotFoundError: If the prompt file doesn't exist.
    """
    prompt_path = _PROMPTS_DIR / f"{agent_name}.md"
    if not prompt_path.exists():
        raise FileNotFoundError(
            f"Prompt file not found: {prompt_path}. "
            f"Expected prompts directory at: {_PROMPTS_DIR}"
        )
    return prompt_path.read_text(encoding="utf-8")


def reload_prompts() -> None:
    """Clear the prompt cache to pick up file changes (useful for dev/hot-reload)."""
    load_prompt.cache_clear()
