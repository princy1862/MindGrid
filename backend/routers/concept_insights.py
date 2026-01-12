from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.ai_service import generate_concept_insights, generate_concept_definition
from models.concept_insights import ConceptInsightsRequest, ConceptInsightsResponse
from typing import Optional

router = APIRouter()

class ConceptDefinitionRequest(BaseModel):
    concept_name: str
    project_id: str
    pdf_content: Optional[str] = None  # PDF text sent from frontend

class ConceptDefinitionResponse(BaseModel):
    concept_name: str
    definition: str
    success: bool
    error: str | None = None

@router.post("/concept-insights", response_model=ConceptInsightsResponse)
async def get_concept_insights(request: ConceptInsightsRequest):
    """
    Use Gemini 2.0 Flash Lite to generate concise insights about a concept
    """
    try:
        insights = await generate_concept_insights(
            concept_name=request.concept_name,
            context_data=request.context_data
        )
        
        return ConceptInsightsResponse(
            concept_name=insights["concept_name"],
            overview=insights["overview"],
            related_concepts=insights["related_concepts"],
            important_formulas=insights["important_formulas"],
            key_theorems=insights["key_theorems"],
            success=insights["success"],
            error=insights.get("error")
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating concept insights: {str(e)}")

@router.post("/concept-definition", response_model=ConceptDefinitionResponse)
async def get_concept_definition(request: ConceptDefinitionRequest):
    """
    Generate a concise AI-summarized definition of a concept from uploaded PDF
    """
    try:
        definition = await generate_concept_definition(
            concept_name=request.concept_name,
            project_id=request.project_id,
            pdf_content=request.pdf_content
        )
        
        return ConceptDefinitionResponse(
            concept_name=request.concept_name,
            definition=definition["definition"],
            success=definition["success"],
            error=definition.get("error")
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating concept definition: {str(e)}")
