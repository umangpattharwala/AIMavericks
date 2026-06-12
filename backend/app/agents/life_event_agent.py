"""Life Event Simulator Agent - multi-document reasoning for life event impacts."""
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import SystemMessage, AIMessage
from langchain_core.tools import tool

from app.agents.state import AgentState
from app.agents.prompt_loader import load_prompt
from app.auth.rbac import UserRole
from app.rag.retriever import ScopedRetriever
from app.config import get_settings

LIFE_EVENT_PLANNER_PROMPT = load_prompt("life_event_agent")


@tool
def retrieve_benefits_policies(query: str, categories: str = "benefits,compensation,lifecycle,leave_attendance") -> str:
    """Retrieve relevant benefits and policy documents for life event analysis."""
    retriever = ScopedRetriever(top_k=6)
    cat_list = [c.strip() for c in categories.split(",")]
    docs = retriever.retrieve_for_categories(
        query=query,
        categories=cat_list,
        top_k=6,
    )
    if not docs:
        return "No relevant policy documents found for this query."
    results = []
    for doc in docs:
        source = doc.metadata.get("source_file", "unknown")
        category = doc.metadata.get("category", "unknown")
        results.append(f"[{source} | {category}]: {doc.page_content[:600]}")
    return "\n\n---\n\n".join(results)


@tool
def retrieve_location_specific_policies(location: str, topics: str) -> str:
    """Retrieve policies specific to a location (country/city) for relocation analysis."""
    retriever = ScopedRetriever(top_k=5)
    query = f"{topics} policies for employees in {location}"
    docs = retriever.retrieve_for_categories(
        query=query,
        categories=["benefits", "compensation", "compliance", "lifecycle"],
        top_k=5,
    )
    if not docs:
        return f"No location-specific policies found for {location}."
    results = []
    for doc in docs:
        source = doc.metadata.get("source_file", "unknown")
        results.append(f"[{source}]: {doc.page_content[:500]}")
    return "\n\n".join(results)


@tool
def calculate_tenure_eligibility(joining_date: str, benefit_type: str) -> str:
    """Calculate tenure-based eligibility for specific benefits (e.g., sabbatical, RSU grants, pension vesting)."""
    from datetime import datetime, date

    try:
        join_date = datetime.strptime(joining_date, "%Y-%m-%d").date()
        today = date.today()
        tenure_years = (today - join_date).days / 365.25
        tenure_months = int((today - join_date).days / 30.44)

        eligibility_rules = {
            "sabbatical": {"min_years": 5, "description": "Sabbatical leave (4-8 weeks paid)"},
            "rsu_acceleration": {"min_years": 4, "description": "RSU acceleration on life events"},
            "pension_vesting": {"min_years": 3, "description": "Full pension/PF employer matching"},
            "senior_healthcare": {"min_years": 2, "description": "Enhanced healthcare tier"},
            "relocation_support": {"min_years": 1, "description": "Full relocation package"},
            "parental_leave_enhanced": {"min_years": 1, "description": "Enhanced parental leave (beyond statutory)"},
        }

        if benefit_type.lower() in eligibility_rules:
            rule = eligibility_rules[benefit_type.lower()]
            eligible = tenure_years >= rule["min_years"]
            return (
                f"Benefit: {rule['description']}\n"
                f"Requirement: {rule['min_years']} years tenure\n"
                f"Employee tenure: {tenure_years:.1f} years ({tenure_months} months)\n"
                f"Eligible: {'✅ YES' if eligible else '❌ NO — ' + str(round(rule['min_years'] - tenure_years, 1)) + ' years remaining'}"
            )
        else:
            return (
                f"Employee tenure: {tenure_years:.1f} years ({tenure_months} months)\n"
                f"Available tenure-based benefits to check: {', '.join(eligibility_rules.keys())}"
            )
    except ValueError:
        return f"Could not parse joining date: {joining_date}"


def life_event_agent_node(state: AgentState) -> dict:
    """Simulate life event impacts across all benefit dimensions."""
    settings = get_settings()
    retriever = ScopedRetriever(top_k=10)

    user_query = state.messages[-1].content if state.messages else ""

    # Broad retrieval across multiple policy domains for comprehensive analysis
    docs = retriever.retrieve(
        query=user_query,
        role=UserRole(state.role),
        category_filter=None,  # Search ALL categories for cross-domain analysis
    )

    # Also retrieve specifically from key categories
    supplemental_docs = retriever.retrieve_for_categories(
        query=user_query,
        categories=["benefits", "compensation", "lifecycle", "leave_attendance", "compliance"],
        top_k=5,
    )

    # Deduplicate
    seen = set()
    all_docs = []
    for doc in docs + supplemental_docs:
        content_key = doc.page_content[:100]
        if content_key not in seen:
            seen.add(content_key)
            all_docs.append(doc)

    context = "\n\n---\n\n".join([
        f"[Source: {doc.metadata.get('source_file', 'unknown')} | Category: {doc.metadata.get('category', 'unknown')}]\n{doc.page_content}"
        for doc in all_docs[:12]  # Cap at 12 docs for context window
    ])

    system_prompt = LIFE_EVENT_PLANNER_PROMPT.format(
        employee_name=state.employee_name,
        employee_id=state.employee_id,
        grade=state.grade,
        location=state.location,
        employment_type=state.employment_type,
        department=state.department,
        work_mode=state.work_mode,
        joining_date=state.joining_date,
        context=context,
    )

    # Use tool-augmented LLM for multi-step reasoning (Sonnet for complex scenario analysis)
    tools = [retrieve_benefits_policies, retrieve_location_specific_policies, calculate_tenure_eligibility]

    llm = ChatAnthropic(
        model=settings.anthropic_advanced_model,
        api_key=settings.anthropic_api_key,
        temperature=0.2,
        max_tokens=4000,
    )
    llm_with_tools = llm.bind_tools(tools)

    messages = [SystemMessage(content=system_prompt)] + state.messages

    # Multi-step tool execution loop
    max_tool_calls = 3
    for _ in range(max_tool_calls):
        response = llm_with_tools.invoke(messages)
        messages.append(response)

        if not response.tool_calls:
            break

        # Execute tool calls
        from langchain_core.messages import ToolMessage
        for tool_call in response.tool_calls:
            tool_fn = {
                "retrieve_benefits_policies": retrieve_benefits_policies,
                "retrieve_location_specific_policies": retrieve_location_specific_policies,
                "calculate_tenure_eligibility": calculate_tenure_eligibility,
            }.get(tool_call["name"])

            if tool_fn:
                result = tool_fn.invoke(tool_call["args"])
                messages.append(ToolMessage(content=result, tool_call_id=tool_call["id"]))

    # Get final text response
    final_content = response.content if not response.tool_calls else ""
    if not final_content:
        # If the last response was still tool calls, get a final answer
        final_response = llm.invoke(messages)
        final_content = final_response.content

    return {
        "messages": [AIMessage(content=final_content)],
        "retrieved_documents": [doc.page_content[:200] for doc in all_docs[:5]],
        "final_response": final_content,
    }
