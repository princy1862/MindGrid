from pydantic import BaseModel
from typing import Dict, List, Any, Optional

class Concept(BaseModel):
    name: str
    description: str
    level: int  # hierarchy level
    special_notes: Optional[str] = None
    notes: Optional[str] = None  # User-added notes and annotations
    confidence: Optional[int] = None  # 1-5 star rating for mastery level

class Relationship(BaseModel):
    source: str
    target: str
    relationship_type: str  # "prerequisite", "related", "example", etc.

class StructuredTextRequest(BaseModel):
    text: str

class StructuredTextResponse(BaseModel):
    structured_data: Dict[str, Any]
    success: bool
    error_message: Optional[str] = None

class DigestRequest(BaseModel):
    text: str

class DigestResponse(BaseModel):
    digest_data: Dict[str, Any]
    success: bool
    error_message: Optional[str] = None

class RelationshipRequest(BaseModel):
    structured_data: Dict[str, Any]

class RelationshipResponse(BaseModel):
    graph_data: Dict[str, Any]
    success: bool
    error_message: Optional[str] = None

class OverviewRequest(BaseModel):
    digest_data: Dict[str, Any]
    graph_data: Optional[Dict[str, Any]] = None  # Optional, for backward compatibility

class OverviewResponse(BaseModel):
    overview_text: str
    success: bool
    error_message: Optional[str] = None

class AudioScriptRequest(BaseModel):
    digest_data: Dict[str, Any]
    graph_data: Optional[Dict[str, Any]] = None  # Optional, for backward compatibility

class AudioScriptResponse(BaseModel):
    script_text: str
    success: bool
    error_message: Optional[str] = None

class AudioRequest(BaseModel):
    script_text: str

class AudioResponse(BaseModel):
    audio_url: str
    success: bool
    error_message: Optional[str] = None

class ProjectSaveRequest(BaseModel):
    digest_data: Dict[str, Any]
    graph_data: Dict[str, Any]
    pdf_content: Optional[str] = None  # Original PDF text for definition extraction

class ProjectSaveResponse(BaseModel):
    project_id: str
    success: bool
    error_message: Optional[str] = None

class ProjectGetResponse(BaseModel):
    project_data: Dict[str, Any]
    success: bool
    error_message: Optional[str] = None

