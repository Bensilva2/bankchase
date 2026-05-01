"""
Voice Analysis API Routes
FastAPI routes for voice authentication and analysis
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
import io

from app.database import get_db
from app.auth.dependencies import get_current_user
from app.voice.analyzer import get_voice_analyzer
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/voice", tags=["voice"])

# ============================================================================
# Request/Response Models
# ============================================================================

class VoiceAnalysisResponse(BaseModel):
    """Voice analysis response"""
    features: dict
    duration_seconds: float
    success: bool


class VoiceEmbeddingResponse(BaseModel):
    """Voice embedding response"""
    embedding: Optional[list]
    success: bool


class LivenessResponse(BaseModel):
    """Liveness detection response"""
    is_live: bool
    confidence: float
    reason: str


class BehavioralDriftResponse(BaseModel):
    """Behavioral drift detection response"""
    is_anomaly: bool
    score: float
    reason: str


# ============================================================================
# Voice Analysis Endpoints
# ============================================================================

@router.post("/analyze", response_model=VoiceAnalysisResponse)
async def analyze_voice(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Analyze voice and extract features"""
    try:
        # Read audio file
        audio_data = await file.read()
        
        # Analyze voice
        analyzer = get_voice_analyzer()
        features = await analyzer.extract_features(audio_data)
        
        if not features:
            raise HTTPException(status_code=400, detail="Failed to extract voice features")
        
        return {
            "features": features,
            "duration_seconds": features.get("duration_seconds", 0),
            "success": True
        }
    except Exception as e:
        logger.error(f"Voice analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/embedding", response_model=VoiceEmbeddingResponse)
async def get_voice_embedding(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user),
):
    """Get voice embedding for speaker verification"""
    try:
        # Read audio file
        audio_data = await file.read()
        
        # Get embedding
        analyzer = get_voice_analyzer()
        embedding = await analyzer.get_voice_embedding(audio_data)
        
        if embedding is None:
            return {
                "embedding": None,
                "success": False
            }
        
        return {
            "embedding": embedding.tolist(),
            "success": True
        }
    except Exception as e:
        logger.error(f"Embedding generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/verify", response_model=dict)
async def verify_speaker(
    reference_file: UploadFile = File(...),
    test_file: UploadFile = File(...),
    user_id: str = Depends(get_current_user),
    threshold: float = 0.7
):
    """Verify speaker using two voice samples"""
    try:
        analyzer = get_voice_analyzer()
        
        # Get embeddings for both files
        ref_audio = await reference_file.read()
        test_audio = await test_file.read()
        
        ref_embedding = await analyzer.get_voice_embedding(ref_audio)
        test_embedding = await analyzer.get_voice_embedding(test_audio)
        
        if ref_embedding is None or test_embedding is None:
            raise HTTPException(status_code=400, detail="Failed to generate embeddings")
        
        # Compare embeddings
        is_match, similarity = await analyzer.compare_voice_embeddings(
            ref_embedding,
            test_embedding,
            threshold
        )
        
        return {
            "is_match": is_match,
            "similarity": similarity,
            "threshold": threshold,
            "success": True
        }
    except Exception as e:
        logger.error(f"Speaker verification error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/liveness", response_model=LivenessResponse)
async def detect_liveness(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user),
):
    """Detect if audio is from a live person"""
    try:
        audio_data = await file.read()
        
        analyzer = get_voice_analyzer()
        result = await analyzer.detect_liveness(audio_data)
        
        return LivenessResponse(**result)
    except Exception as e:
        logger.error(f"Liveness detection error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/behavioral-drift", response_model=BehavioralDriftResponse)
async def detect_behavioral_drift(
    current_file: UploadFile = File(...),
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
    threshold: float = 0.7
):
    """Detect behavioral drift in voice patterns"""
    try:
        from app.models import User
        
        # Get current features
        current_audio = await current_file.read()
        analyzer = get_voice_analyzer()
        current_features = await analyzer.extract_features(current_audio)
        
        # Get baseline from database
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.voice_baseline:
            raise HTTPException(status_code=400, detail="No baseline voice profile")
        
        # Compare
        result = await analyzer.detect_behavioral_drift(
            current_features,
            user.voice_baseline,
            threshold
        )
        
        return BehavioralDriftResponse(**result)
    except Exception as e:
        logger.error(f"Behavioral drift detection error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/enroll")
async def enroll_voice(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Enroll user voice for future authentication"""
    try:
        from app.models import User
        
        audio_data = await file.read()
        analyzer = get_voice_analyzer()
        features = await analyzer.extract_features(audio_data)
        
        if not features:
            raise HTTPException(status_code=400, detail="Failed to extract voice features")
        
        # Store in database
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user.voice_baseline = features
        db.commit()
        
        return {
            "status": "enrolled",
            "features_count": len(features),
            "success": True
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Voice enrollment error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Health Check
# ============================================================================

@router.get("/health")
async def voice_health():
    """Health check for voice analysis service"""
    analyzer = get_voice_analyzer()
    return {
        "status": "healthy",
        "service": "voice",
        "enabled": analyzer.enabled
    }
