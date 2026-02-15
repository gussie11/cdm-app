from pydantic import BaseModel
from typing import List, Optional

class StrategyRequest(BaseModel):
    product: str
    industry: str
    rubie_pov: List[str]
    scope_key: str  # Matches keys in PROMPTS
    show_ai_q: bool
    show_customer_thinking: bool
    show_sales_question: bool

class StrategyResponse(BaseModel):
    markdown_content: str
    cleaned_table_data: Optional[List[List[str]]] = None

class EntityMatch(BaseModel):
    name: str
    type: str  # "Company" or "Industry"
    description: str

class EntitySearchRequest(BaseModel):
    query: str

class EntitySearchResponse(BaseModel):
    matches: List[EntityMatch]
