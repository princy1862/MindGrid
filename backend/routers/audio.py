from fastapi import APIRouter, HTTPException
from services.ai_service import generate_audio
from models.graph import AudioRequest, AudioResponse
import traceback

router = APIRouter()

@router.post("/audio", response_model=AudioResponse)
async def generate_podcast_audio(request: AudioRequest):
    """
    Use ElevenLabs to generate audio from script and return base64 data URL
    """
    try:
        print(f"🎙️ Generating audio for script ({len(request.script_text)} chars)...")
        # Generate audio and get base64 data URL
        audio_data_url = await generate_audio(request.script_text)
        print(f"✅ Audio generated successfully!")
        
        return AudioResponse(
            audio_url=audio_data_url,
            success=True
        )
    
    except Exception as e:
        print(f"❌ Audio generation failed: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error generating audio: {str(e)}")

