from fastapi import APIRouter, HTTPException
from services.db_service import save_project_data, get_project_data, list_projects, delete_project_data, update_project_title
from models.graph import ProjectSaveRequest, ProjectSaveResponse, ProjectGetResponse
from pydantic import BaseModel
from typing import Optional
import uuid

router = APIRouter()

class UpdateTitleRequest(BaseModel):
    title: str

class UpdateConceptNotesRequest(BaseModel):
    concept_name: str
    notes: str

class UpdateConceptConfidenceRequest(BaseModel):
    concept_name: str
    confidence: Optional[int] = None  # 1-5 or None to clear

@router.post("/project/save", response_model=ProjectSaveResponse)
async def save_project(request: ProjectSaveRequest):
    """
    Save project data (digest + graph) to Firebase
    """
    try:
        # Generate project ID
        project_id = str(uuid.uuid4())
        
        # DEBUG: Log what we received
        print(f"📌 Saving project {project_id}")
        print(f"   pdf_content provided: {request.pdf_content is not None}")
        if request.pdf_content:
            print(f"   pdf_content length: {len(request.pdf_content)} chars")
        
        # Save to Firebase
        success = save_project_data(
            project_id=project_id,
            reference_data=request.digest_data,
            graph_data=request.graph_data,
            pdf_content=request.pdf_content
        )
        
        if success:
            return ProjectSaveResponse(
                project_id=project_id,
                success=True
            )
        else:
            raise Exception("Failed to save to Firebase")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving project: {str(e)}")

@router.get("/projects/list")
async def list_all_projects():
    """
    List all projects from Firebase
    """
    try:
        projects = list_projects()
        return projects
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing projects: {str(e)}")

@router.get("/project/{project_id}", response_model=ProjectGetResponse)
async def get_project(project_id: str):
    """
    Retrieve project data from Firebase
    """
    try:
        project_data = get_project_data(project_id)
        
        if project_data:
            return ProjectGetResponse(
                project_data=project_data,
                success=True
            )
        else:
            raise HTTPException(status_code=404, detail="Project not found")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving project: {str(e)}")

@router.patch("/project/{project_id}/title")
async def update_title(project_id: str, request: UpdateTitleRequest):
    """
    Update project title in Firebase
    """
    try:
        success = update_project_title(project_id, request.title)
        
        if success:
            return {"success": True, "message": "Title updated successfully"}
        else:
            raise HTTPException(status_code=404, detail="Project not found")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating title: {str(e)}")

@router.patch("/project/{project_id}/concept-notes")
async def update_concept_notes(project_id: str, request: UpdateConceptNotesRequest):
    """
    Update notes for a specific concept in the project
    """
    try:
        # Get current project data
        project_data = get_project_data(project_id)
        if not project_data:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Update notes in graph_data
        graph_data = project_data.get('graph_data', {})
        nodes = graph_data.get('nodes', [])
        
        # Find and update the concept
        concept_found = False
        for node in nodes:
            if node.get('name') == request.concept_name:
                node['notes'] = request.notes
                concept_found = True
                break
        
        if not concept_found:
            raise HTTPException(status_code=404, detail="Concept not found in project")
        
        # Save updated project data
        success = save_project_data(
            project_id=project_id,
            reference_data=project_data.get('digest_data', {}),
            graph_data=graph_data
        )
        
        if success:
            return {"success": True, "message": "Concept notes updated successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to save updated project")
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating concept notes: {str(e)}")

@router.patch("/project/{project_id}/concept-confidence")
async def update_concept_confidence(project_id: str, request: UpdateConceptConfidenceRequest):
    """
    Update confidence level for a specific concept in the project
    """
    try:
        # Validate confidence value
        if request.confidence is not None and (request.confidence < 1 or request.confidence > 5):
            raise HTTPException(status_code=400, detail="Confidence must be between 1 and 5, or null")
        
        # Get current project data
        project_data = get_project_data(project_id)
        if not project_data:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Update confidence in graph_data
        graph_data = project_data.get('graph_data', {})
        nodes = graph_data.get('nodes', [])
        
        # Find and update the concept
        concept_found = False
        for node in nodes:
            if node.get('name') == request.concept_name:
                node['confidence'] = request.confidence
                concept_found = True
                break
        
        if not concept_found:
            raise HTTPException(status_code=404, detail="Concept not found in project")
        
        # Save updated project data
        success = save_project_data(
            project_id=project_id,
            reference_data=project_data.get('digest_data', {}),
            graph_data=graph_data
        )
        
        if success:
            return {"success": True, "message": "Concept confidence updated successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to save updated project")
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating concept confidence: {str(e)}")

@router.delete("/project/{project_id}")
async def delete_project(project_id: str):
    """
    Delete project from Firebase
    """
    try:
        success = delete_project_data(project_id)
        
        if success:
            return {"success": True, "message": "Project deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Project not found")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting project: {str(e)}")
