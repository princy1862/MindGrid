from fastapi import APIRouter, HTTPException
from services.ai_service import generate_relationships
from models.graph import RelationshipRequest, RelationshipResponse
import traceback

router = APIRouter()

@router.post("/relationships", response_model=RelationshipResponse)
async def extract_relationships(request: RelationshipRequest):
    """
    Use Gemini 2.5 Flash Lite to extract concept relationships from structured JSON
    """
    try:
        print(f"🔗 Generating relationships from structured data...")
        relationships = await generate_relationships(request.structured_data)
        print(f"✅ Relationships generated successfully!")
        
        return RelationshipResponse(
            graph_data=relationships,
            success=True
        )
    
    except Exception as e:
        print(f"❌ Relationship generation failed: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error extracting relationships: {str(e)}")

