import firebase_admin
from firebase_admin import credentials, firestore
from typing import Dict, Any, Optional
import os
import json

# In-memory storage for localhost development (when Firebase is not configured)
_in_memory_projects = {}

# Initialize Firebase
def init_firebase():
    """Initialize Firebase Admin SDK or return None if not configured"""
    # Check if already initialized
    if firebase_admin._apps:
        return firestore.client()
    
    # Try to get credentials from environment variable (JSON string)
    firebase_creds_json = os.getenv("FIREBASE_CREDENTIALS_JSON")
    
    if firebase_creds_json:
        try:
            # Use credentials from environment variable
            cred_dict = json.loads(firebase_creds_json)
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred)
            return firestore.client()
        except Exception:
            # Invalid JSON or credentials - use in-memory storage
            return None
    
    # Fall back to file path
    service_account_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "secrets/firebase_private.json")
    
    if not service_account_path or not service_account_path.strip():
        # Firebase not configured - return None to use in-memory storage
        return None
    
    if not os.path.exists(service_account_path):
        # Firebase file not found - return None to use in-memory storage
        return None
    
    try:
        cred = credentials.Certificate(service_account_path)
        firebase_admin.initialize_app(cred)
        return firestore.client()
    except Exception:
        # Failed to initialize Firebase - use in-memory storage
        return None

def save_project_data(project_id: str, reference_data: Dict[str, Any], graph_data: Dict[str, Any], pdf_content: Optional[str] = None):
    """
    Save project data to Firebase Firestore or in-memory storage
    """
    try:
        db = init_firebase()
        
        # Extract metadata from graph_data
        metadata = graph_data.get('graph_metadata', {})
        
        if db is None:
            # Firebase not configured - use in-memory storage
            from datetime import datetime
            print(f"💾 Saving to in-memory storage: {project_id}")
            print(f"   pdf_content provided: {pdf_content is not None}")
            if pdf_content:
                print(f"   pdf_content length: {len(pdf_content)} chars")
            _in_memory_projects[project_id] = {
                'title': metadata.get('title', 'Untitled Project'),
                'subject': metadata.get('subject', 'Unknown'),
                'total_concepts': metadata.get('total_concepts', 0),
                'depth_levels': metadata.get('depth_levels', 0),
                'digest_data': reference_data,
                'graph_data': graph_data,
                'pdf_content': pdf_content,
                'created_at': datetime.now(),
                'updated_at': datetime.now()
            }
            return True
        
        # Save project with metadata to Firebase
        db.collection('projects').document(project_id).set({
            'title': metadata.get('title', 'Untitled Project'),
            'subject': metadata.get('subject', 'Unknown'),
            'total_concepts': metadata.get('total_concepts', 0),
            'depth_levels': metadata.get('depth_levels', 0),
            'digest_data': reference_data,
            'graph_data': graph_data,
            'pdf_content': pdf_content,
            'created_at': firestore.SERVER_TIMESTAMP,
            'updated_at': firestore.SERVER_TIMESTAMP
        })
        
        return True
    
    except Exception as e:
        raise Exception(f"Failed to save project data: {str(e)}")

def get_project_data(project_id: str) -> Optional[Dict[str, Any]]:
    """
    Retrieve project data from Firebase Firestore or in-memory storage
    """
    try:
        db = init_firebase()
        
        if db is None:
            # Firebase not configured - use in-memory storage
            return _in_memory_projects.get(project_id)
        
        doc = db.collection('projects').document(project_id).get()
        
        if doc.exists:
            return doc.to_dict()
        return None
    
    except Exception as e:
        raise Exception(f"Failed to get project data: {str(e)}")

def list_projects() -> list:
    """
    List all projects from Firebase or in-memory storage
    """
    try:
        db = init_firebase()
        
        if db is None:
            # Firebase not configured - use in-memory storage
            return [{"id": pid, **data} for pid, data in _in_memory_projects.items()]
        
        projects = db.collection('projects').stream()
        
        return [{"id": doc.id, **doc.to_dict()} for doc in projects]
    
    except Exception as e:
        raise Exception(f"Failed to list projects: {str(e)}")

def update_project_title(project_id: str, new_title: str) -> bool:
    """
    Update project title in Firebase Firestore or in-memory storage
    """
    try:
        db = init_firebase()
        
        if db is None:
            # Firebase not configured - use in-memory storage
            if project_id in _in_memory_projects:
                from datetime import datetime
                _in_memory_projects[project_id]['title'] = new_title
                _in_memory_projects[project_id]['updated_at'] = datetime.now()
                return True
            return False
        
        doc_ref = db.collection('projects').document(project_id)
        
        # Check if document exists
        if doc_ref.get().exists:
            doc_ref.update({
                'title': new_title,
                'updated_at': firestore.SERVER_TIMESTAMP
            })
            return True
        return False
    
    except Exception as e:
        raise Exception(f"Failed to update project title: {str(e)}")

def delete_project_data(project_id: str) -> bool:
    """
    Delete project from Firebase Firestore or in-memory storage
    """
    try:
        db = init_firebase()
        
        if db is None:
            # Firebase not configured - use in-memory storage
            if project_id in _in_memory_projects:
                del _in_memory_projects[project_id]
                return True
            return False
        
        doc_ref = db.collection('projects').document(project_id)
        
        # Check if document exists
        if doc_ref.get().exists:
            doc_ref.delete()
            return True
        return False
    
    except Exception as e:
        raise Exception(f"Failed to delete project: {str(e)}")

async def get_project_pdf_content(project_id: str) -> Optional[str]:
    """
    Retrieve the original PDF text content for a project
    """
    try:
        db = init_firebase()
        
        if db is None:
            # Firebase not configured - use in-memory storage
            if project_id in _in_memory_projects:
                project = _in_memory_projects[project_id]
                return project.get('pdf_content', '')
            return None
        
        doc = db.collection('projects').document(project_id).get()
        
        if doc.exists:
            data = doc.to_dict()
            return data.get('pdf_content', '')
        
        return None
    
    except Exception as e:
        print(f"Error retrieving PDF content: {str(e)}")
        return None

