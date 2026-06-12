"""Compensation Equity & Anomaly Detection Agent - HR-only analytics agent."""
import json
from typing import Optional

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import SystemMessage, AIMessage, ToolMessage
from langchain_core.tools import tool

from app.agents.state import AgentState
from app.agents.prompt_loader import load_prompt
from app.rag.retriever import ScopedRetriever
from app.config import get_settings

EQUITY_AGENT_PROMPT = load_prompt("equity_agent")


@tool
def analyze_workforce_demographics(department: str = "all", grade_prefix: str = "all") -> str:
    """Analyze workforce composition and distribution across dimensions.
    
    Args:
        department: Filter by department name or "all"
        grade_prefix: Filter by grade prefix (E, M, O, T, P, L) or "all"
    """
    import pandas as pd
    import os

    csv_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))),
        "data", "RAG Documents", "nexacore_employee_directory.csv"
    )

    try:
        df = pd.read_csv(csv_path)
    except FileNotFoundError:
        return "Employee directory not available for analysis."

    # Apply filters
    if department != "all":
        df = df[df["department"].str.lower() == department.lower()]
    if grade_prefix != "all":
        df = df[df["grade"].str.startswith(grade_prefix.upper())]

    if df.empty:
        return f"No employees found matching filters: department={department}, grade={grade_prefix}"

    # Compute demographics
    total = len(df)
    by_department = df["department"].value_counts().to_dict()
    by_grade = df["grade"].value_counts().to_dict()
    by_location = df["location"].value_counts().to_dict()
    by_employment_type = df["employment_type"].value_counts().to_dict()
    by_work_mode = df["work_mode"].value_counts().to_dict()

    # Tenure analysis
    df["joining_date"] = pd.to_datetime(df["joining_date"], errors="coerce")
    today = pd.Timestamp.now()
    df["tenure_years"] = (today - df["joining_date"]).dt.days / 365.25
    avg_tenure = df["tenure_years"].mean()
    tenure_dist = {
        "<1 year": int((df["tenure_years"] < 1).sum()),
        "1-3 years": int(((df["tenure_years"] >= 1) & (df["tenure_years"] < 3)).sum()),
        "3-5 years": int(((df["tenure_years"] >= 3) & (df["tenure_years"] < 5)).sum()),
        "5+ years": int((df["tenure_years"] >= 5).sum()),
    }

    return json.dumps({
        "total_employees": total,
        "by_department": dict(list(by_department.items())[:10]),
        "by_grade": dict(sorted(by_grade.items())),
        "by_location": dict(list(by_location.items())[:8]),
        "by_employment_type": by_employment_type,
        "by_work_mode": by_work_mode,
        "avg_tenure_years": round(avg_tenure, 1),
        "tenure_distribution": tenure_dist,
    }, indent=2)


@tool
def detect_grade_anomalies(department: str = "all", min_tenure_years: float = 0) -> str:
    """Detect employees who may be under-leveled based on tenure and grade progression patterns.
    
    Args:
        department: Filter by department or "all"
        min_tenure_years: Minimum tenure to consider (filters out recent hires)
    """
    import pandas as pd
    import os

    csv_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))),
        "data", "RAG Documents", "nexacore_employee_directory.csv"
    )

    try:
        df = pd.read_csv(csv_path)
    except FileNotFoundError:
        return "Employee directory not available for analysis."

    df["joining_date"] = pd.to_datetime(df["joining_date"], errors="coerce")
    today = pd.Timestamp.now()
    df["tenure_years"] = (today - df["joining_date"]).dt.days / 365.25

    if department != "all":
        df = df[df["department"].str.lower() == department.lower()]
    
    df = df[df["tenure_years"] >= min_tenure_years]

    if df.empty:
        return "No employees match the criteria."

    # Extract numeric grade level
    df["grade_level"] = df["grade"].str.extract(r'(\d+)').astype(float)
    df["grade_prefix"] = df["grade"].str.extract(r'([A-Z]+)')

    # For each grade track, calculate expected progression
    anomalies = []
    for prefix in df["grade_prefix"].dropna().unique():
        track_df = df[df["grade_prefix"] == prefix].copy()
        if len(track_df) < 3:
            continue

        # Expected: higher tenure → higher grade level
        # Flag: high tenure but low grade relative to peers
        avg_tenure_by_grade = track_df.groupby("grade_level")["tenure_years"].mean()
        
        for _, row in track_df.iterrows():
            grade_lvl = row["grade_level"]
            tenure = row["tenure_years"]
            
            # If tenure is significantly above average for their grade
            grade_avg_tenure = avg_tenure_by_grade.get(grade_lvl, tenure)
            if tenure > grade_avg_tenure * 1.5 and tenure > 3:
                # Check if peers with similar tenure are at higher grades
                similar_tenure = track_df[
                    (track_df["tenure_years"] >= tenure * 0.7) &
                    (track_df["tenure_years"] <= tenure * 1.3) &
                    (track_df["grade_level"] > grade_lvl)
                ]
                if len(similar_tenure) >= 2:
                    anomalies.append({
                        "department": row["department"],
                        "grade": row["grade"],
                        "tenure_years": round(tenure, 1),
                        "location": row["location"],
                        "employment_type": row["employment_type"],
                        "peer_avg_grade": f"{prefix}{int(similar_tenure['grade_level'].mean())}",
                        "flag": "Potential under-leveling",
                    })

    if not anomalies:
        return json.dumps({
            "status": "healthy",
            "message": f"No significant grade progression anomalies detected in {department} (n={len(df)})",
            "employees_analyzed": len(df),
        })

    return json.dumps({
        "anomalies_found": len(anomalies),
        "employees_analyzed": len(df),
        "flagged_cases": anomalies[:20],  # Cap at 20
        "note": "Anonymized — showing department/grade/tenure only",
    }, indent=2)


@tool
def analyze_location_pay_equity(grade_prefix: str = "E") -> str:
    """Analyze pay equity across locations for a given grade track.
    Compares grade distribution and tenure patterns to identify location-based disparities.
    
    Args:
        grade_prefix: Grade track to analyze (E, M, O, T, P, L)
    """
    import pandas as pd
    import os

    csv_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))),
        "data", "RAG Documents", "nexacore_employee_directory.csv"
    )

    try:
        df = pd.read_csv(csv_path)
    except FileNotFoundError:
        return "Employee directory not available for analysis."

    df["joining_date"] = pd.to_datetime(df["joining_date"], errors="coerce")
    today = pd.Timestamp.now()
    df["tenure_years"] = (today - df["joining_date"]).dt.days / 365.25
    df["grade_level"] = df["grade"].str.extract(r'(\d+)').astype(float)
    df["grade_prefix_col"] = df["grade"].str.extract(r'([A-Z]+)')

    track_df = df[df["grade_prefix_col"] == grade_prefix.upper()].copy()

    if track_df.empty:
        return f"No employees found in {grade_prefix} grade track."

    # Analyze by location
    location_stats = []
    for location, group in track_df.groupby("location"):
        stats = {
            "location": location,
            "headcount": len(group),
            "avg_grade_level": round(group["grade_level"].mean(), 2),
            "avg_tenure_years": round(group["tenure_years"].mean(), 1),
            "grade_distribution": group["grade"].value_counts().to_dict(),
            "employment_type_mix": group["employment_type"].value_counts().to_dict(),
        }
        location_stats.append(stats)

    # Identify disparities
    if len(location_stats) > 1:
        avg_grades = [s["avg_grade_level"] for s in location_stats]
        overall_avg = sum(avg_grades) / len(avg_grades)
        
        for stat in location_stats:
            deviation = stat["avg_grade_level"] - overall_avg
            stat["grade_deviation_from_avg"] = round(deviation, 2)
            if abs(deviation) > 0.5:
                stat["flag"] = "⚠️ Significant deviation from average"

    return json.dumps({
        "grade_track": grade_prefix,
        "total_employees": len(track_df),
        "locations_analyzed": len(location_stats),
        "location_breakdown": sorted(location_stats, key=lambda x: x["headcount"], reverse=True),
    }, indent=2)


@tool
def generate_equity_compliance_summary(jurisdiction: str = "all") -> str:
    """Generate a compliance-oriented summary of equal pay regulations by jurisdiction.
    
    Args:
        jurisdiction: "US", "UK", "India", "Singapore", "EU", or "all"
    """
    # Regulatory knowledge base
    regulations = {
        "US": {
            "laws": ["Equal Pay Act (1963)", "Lilly Ledbetter Fair Pay Act (2009)", "State-level pay transparency laws"],
            "requirements": [
                "Equal pay for substantially similar work regardless of sex",
                "Pay transparency in job postings (CA, CO, NY, WA)",
                "Annual pay data reporting (EEO-1 Component 2 — if reinstated)",
            ],
            "deadlines": "Annual EEO-1 filing (typically March); State-specific deadlines vary",
            "penalties": "Back pay + liquidated damages (up to 2x); state fines up to $250K",
        },
        "UK": {
            "laws": ["Equality Act 2010", "Gender Pay Gap Reporting Regulations 2017"],
            "requirements": [
                "Gender Pay Gap report for employers with 250+ employees",
                "Report mean/median hourly pay gap, bonus gap, pay quartiles",
                "Publish on company website AND gov.uk portal",
            ],
            "deadlines": "Snapshot date: 5 April; Reporting deadline: 4 April following year",
            "penalties": "Unlimited tribunal awards; Reputational damage; EHRC enforcement",
        },
        "India": {
            "laws": ["Equal Remuneration Act 1976", "Code on Wages 2019"],
            "requirements": [
                "Equal pay for equal work or work of similar nature",
                "No discrimination in recruitment or conditions of service",
                "Maintain registers of workers and wages",
            ],
            "deadlines": "Ongoing compliance; Annual returns under labor codes",
            "penalties": "Fine up to ₹1 lakh; imprisonment up to 3 months for repeat offenses",
        },
        "Singapore": {
            "laws": ["Employment Act", "Tripartite Guidelines on Fair Employment Practices"],
            "requirements": [
                "Fair consideration for all candidates regardless of characteristics",
                "TAFEP guidelines on non-discriminatory pay practices",
                "Job advertisements must not state discriminatory requirements",
            ],
            "deadlines": "Ongoing TAFEP compliance; respond to MOM investigations within 14 days",
            "penalties": "Work pass privileges curtailed; debarment from hiring foreign workers",
        },
        "EU": {
            "laws": ["EU Pay Transparency Directive (2023, effective June 2026)"],
            "requirements": [
                "Pay ranges in job postings",
                "Right to request pay information for same-category workers",
                "Gender pay gap reporting for 100+ employee companies",
                "Joint pay assessments if gap >5% and unjustified",
            ],
            "deadlines": "Member state transposition by June 2026; first reporting cycle 2027",
            "penalties": "Member state defined; must include compensation for workers",
        },
    }

    if jurisdiction.lower() == "all":
        result = regulations
    else:
        key = jurisdiction.upper()
        if key in regulations:
            result = {key: regulations[key]}
        else:
            return f"Jurisdiction '{jurisdiction}' not found. Available: US, UK, India, Singapore, EU"

    return json.dumps(result, indent=2)


@tool
def search_compensation_policies(query: str) -> str:
    """Search internal compensation and benefits policies for equity analysis context."""
    retriever = ScopedRetriever(top_k=5)
    docs = retriever.retrieve_for_categories(
        query=query,
        categories=["compensation", "compliance", "benefits"],
        top_k=5,
    )
    if not docs:
        return "No relevant compensation policies found."
    results = []
    for doc in docs:
        source = doc.metadata.get("source_file", "unknown")
        results.append(f"[{source}]: {doc.page_content[:500]}")
    return "\n\n".join(results)


def equity_agent_node(state: AgentState) -> dict:
    """Analyze compensation equity and detect anomalies."""
    settings = get_settings()
    retriever = ScopedRetriever(top_k=5)

    user_query = state.messages[-1].content if state.messages else ""

    # Retrieve compensation policies for context
    docs = retriever.retrieve_for_categories(
        query=user_query,
        categories=["compensation", "compliance"],
        top_k=5,
    )

    context = "\n\n---\n\n".join([
        f"[Source: {doc.metadata.get('source_file', 'unknown')}]\n{doc.page_content}"
        for doc in docs
    ])

    system_prompt = EQUITY_AGENT_PROMPT.format(context=context)

    # Tool-augmented LLM for data analysis
    tools = [
        analyze_workforce_demographics,
        detect_grade_anomalies,
        analyze_location_pay_equity,
        generate_equity_compliance_summary,
        search_compensation_policies,
    ]

    llm = ChatAnthropic(
        model=settings.anthropic_advanced_model,
        api_key=settings.anthropic_api_key,
        temperature=0.1,
        max_tokens=4000,
    )
    llm_with_tools = llm.bind_tools(tools)

    messages = [SystemMessage(content=system_prompt)] + state.messages

    # Multi-step tool execution for thorough analysis
    tool_map = {
        "analyze_workforce_demographics": analyze_workforce_demographics,
        "detect_grade_anomalies": detect_grade_anomalies,
        "analyze_location_pay_equity": analyze_location_pay_equity,
        "generate_equity_compliance_summary": generate_equity_compliance_summary,
        "search_compensation_policies": search_compensation_policies,
    }

    max_tool_calls = 4
    for _ in range(max_tool_calls):
        response = llm_with_tools.invoke(messages)
        messages.append(response)

        if not response.tool_calls:
            break

        # Execute tool calls
        for tool_call in response.tool_calls:
            tool_fn = tool_map.get(tool_call["name"])
            if tool_fn:
                result = tool_fn.invoke(tool_call["args"])
                messages.append(ToolMessage(content=result, tool_call_id=tool_call["id"]))

    # Get final text response
    final_content = response.content if not response.tool_calls else ""
    if not final_content:
        final_response = llm.invoke(messages)
        final_content = final_response.content

    return {
        "messages": [AIMessage(content=final_content)],
        "retrieved_documents": [doc.page_content[:200] for doc in docs],
        "final_response": final_content,
    }
