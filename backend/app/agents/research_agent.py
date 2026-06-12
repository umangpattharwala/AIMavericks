"""HR Research Agent v2 - multi-step planning with tool use."""
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import SystemMessage, AIMessage, ToolMessage
from langchain_core.tools import tool

from app.agents.state import AgentState
from app.agents.prompt_loader import load_prompt
from app.rag.retriever import ScopedRetriever
from app.config import get_settings

RESEARCH_PLANNER_PROMPT = load_prompt("research_agent")


@tool
def search_web(query: str) -> str:
    """Search the web for HR policies, benefits benchmarks, and regulatory information."""
    settings = get_settings()
    if not settings.tavily_api_key:
        return "[Web search unavailable - Tavily API key not configured]"
    try:
        from tavily import TavilyClient
        client = TavilyClient(api_key=settings.tavily_api_key)
        result = client.search(
            query=query,
            max_results=5,
            search_depth="advanced",
        )
        findings = []
        for r in result.get("results", []):
            findings.append(f"**{r.get('title', 'Untitled')}**\nURL: {r['url']}\n{r['content'][:600]}")
        return "\n\n---\n\n".join(findings) if findings else "No results found."
    except Exception as e:
        return f"Search error: {str(e)}"


@tool
def search_internal_policies(query: str) -> str:
    """Search NexaCore's internal policy documents for comparison and context."""
    retriever = ScopedRetriever(top_k=5)
    docs = retriever.retrieve_for_categories(
        query=query,
        categories=["benefits", "compensation", "compliance", "lifecycle"],
        top_k=5,
    )
    if not docs:
        return "No relevant internal policies found."
    results = []
    for doc in docs:
        source = doc.metadata.get("source_file", "unknown")
        results.append(f"[{source}]: {doc.page_content[:500]}")
    return "\n\n".join(results)


@tool
def analyze_benchmark(topic: str, regions: str = "US, India, UK, Singapore") -> str:
    """Analyze benefits benchmarking data for specific topics across regions.

    Args:
        topic: The benefits topic to benchmark (e.g., 'parental leave', 'stock options')
        regions: Comma-separated regions to compare
    """
    settings = get_settings()
    if not settings.tavily_api_key:
        return "[Benchmarking unavailable - Tavily API key not configured]"
    try:
        from tavily import TavilyClient
        client = TavilyClient(api_key=settings.tavily_api_key)
        result = client.search(
            query=f"employee benefits benchmark {topic} tech companies {regions} 2025 2026",
            max_results=5,
            search_depth="advanced",
        )
        findings = []
        for r in result.get("results", []):
            findings.append(f"**{r.get('title', '')}**\n{r['content'][:500]}")
        return "\n\n".join(findings) if findings else f"No benchmarking data found for '{topic}'."
    except Exception as e:
        return f"Benchmark analysis error: {str(e)}"


@tool
def check_regulatory_compliance(regulation: str, jurisdiction: str) -> str:
    """Check regulatory requirements for a specific jurisdiction.

    Args:
        regulation: The regulation or law to check (e.g., 'FMLA', 'Maternity Benefit Act')
        jurisdiction: Country or region (e.g., 'India', 'US-Federal', 'UK')
    """
    settings = get_settings()
    if not settings.tavily_api_key:
        return "[Regulatory check unavailable - Tavily API key not configured]"
    try:
        from tavily import TavilyClient
        client = TavilyClient(api_key=settings.tavily_api_key)
        result = client.search(
            query=f"{regulation} {jurisdiction} employee benefits compliance requirements 2025 2026",
            max_results=4,
            search_depth="advanced",
        )
        findings = []
        for r in result.get("results", []):
            findings.append(f"**{r.get('title', '')}** ({r['url']})\n{r['content'][:500]}")
        return "\n\n".join(findings) if findings else f"No regulatory data found for '{regulation}' in {jurisdiction}."
    except Exception as e:
        return f"Regulatory check error: {str(e)}"


RESEARCH_TOOLS = [search_web, search_internal_policies, analyze_benchmark, check_regulatory_compliance]


def research_agent_node(state: AgentState) -> dict:
    """Process HR research queries with multi-step tool-use planning."""
    settings = get_settings()
    retriever = ScopedRetriever(top_k=4)

    user_query = state.messages[-1].content if state.messages else ""

    # Get internal context for comparison
    internal_docs = retriever.retrieve_for_categories(
        query=user_query,
        categories=["benefits", "compensation", "compliance", "support_tickets"],
        top_k=4,
    )
    internal_context = "\n\n".join([
        f"[{doc.metadata.get('source_file', 'internal')}]: {doc.page_content[:400]}"
        for doc in internal_docs
    ])

    system_prompt = RESEARCH_PLANNER_PROMPT.format(internal_context=internal_context)

    # Create LLM with tool binding
    llm = ChatAnthropic(
        model=settings.anthropic_model,
        api_key=settings.anthropic_api_key,
        temperature=0.3,
        max_tokens=4000,
    )
    llm_with_tools = llm.bind_tools(RESEARCH_TOOLS)

    # Multi-step execution loop (max 5 tool calls)
    messages = [SystemMessage(content=system_prompt)] + list(state.messages)

    for _ in range(5):
        response = llm_with_tools.invoke(messages)
        messages.append(response)

        # If no tool calls, we have the final answer
        if not response.tool_calls:
            break

        # Execute tool calls
        for tool_call in response.tool_calls:
            tool_name = tool_call["name"]
            tool_args = tool_call["args"]

            tool_fn = next((t for t in RESEARCH_TOOLS if t.name == tool_name), None)
            if tool_fn:
                try:
                    result = tool_fn.invoke(tool_args)
                except Exception as e:
                    result = f"Tool error: {str(e)}"
            else:
                result = f"Unknown tool: {tool_name}"

            messages.append(ToolMessage(content=result, tool_call_id=tool_call["id"]))

    # Extract final response
    final_content = messages[-1].content if messages else "Research could not be completed."
    if isinstance(final_content, list):
        final_content = "\n".join(
            block.get("text", "") for block in final_content
            if isinstance(block, dict) and block.get("type") == "text"
        )

    return {
        "messages": [AIMessage(content=final_content)],
        "research_results": [final_content[:500]],
        "final_response": final_content,
    }
