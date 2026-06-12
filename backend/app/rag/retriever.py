"""Context-aware retriever with access control filtering."""
from typing import Optional
from langchain_core.documents import Document
from langchain_core.retrievers import BaseRetriever
from pydantic import Field

from app.auth.rbac import UserRole
from app.auth.employee_context import EmployeeProfile
from app.rag.vectorstore import get_vectorstore


class ScopedRetriever:
    """Retriever that filters results based on user role and employee context."""

    def __init__(self, top_k: int = 5):
        self.vectorstore = get_vectorstore()
        self.top_k = top_k

    def retrieve(
        self,
        query: str,
        role: UserRole,
        profile: Optional[EmployeeProfile] = None,
        category_filter: Optional[list[str]] = None,
    ) -> list[Document]:
        """
        Retrieve relevant documents scoped to user's access level.

        - Employees: Cannot access hr_only documents
        - HR: Can access all documents
        - Category filter: Narrow search to specific policy domains
        """
        # Build metadata filter
        conditions = []

        # Role-based access control on documents
        if role == UserRole.EMPLOYEE:
            conditions.append({"access_scope": {"$eq": "all"}})

        # Category filtering if specified
        if category_filter:
            if len(category_filter) == 1:
                conditions.append({"category": {"$eq": category_filter[0]}})
            else:
                conditions.append({"category": {"$in": category_filter}})

        # Combine conditions with $and if multiple
        if len(conditions) > 1:
            where_filter = {"$and": conditions}
        elif len(conditions) == 1:
            where_filter = conditions[0]
        else:
            where_filter = None

        # Execute search
        if where_filter:
            results = self.vectorstore.similarity_search(
                query=query,
                k=self.top_k,
                filter=where_filter,
            )
        else:
            results = self.vectorstore.similarity_search(
                query=query,
                k=self.top_k,
            )

        # Post-process: inject employee context into results for personalization
        if profile:
            context_note = Document(
                page_content=(
                    f"[EMPLOYEE CONTEXT] Querying employee: {profile.employee_name}, "
                    f"ID: {profile.employee_id}, Department: {profile.department}, "
                    f"Grade: {profile.grade}, Location: {profile.location}, "
                    f"Employment Type: {profile.employment_type}, "
                    f"Work Mode: {profile.work_mode}, "
                    f"Joining Date: {profile.joining_date}"
                ),
                metadata={"category": "context", "access_scope": "all"},
            )
            results.insert(0, context_note)

        return results

    def retrieve_for_categories(
        self,
        query: str,
        categories: list[str],
        top_k: Optional[int] = None,
    ) -> list[Document]:
        """Retrieve from specific document categories (no access control)."""
        k = top_k or self.top_k
        return self.vectorstore.similarity_search(
            query=query,
            k=k,
            filter={"category": {"$in": categories}},
        )
