"""
Voice Analysis Module
Voice authentication, biometric analysis, and behavioral drift detection
"""

import os
import logging
import numpy as np
from typing import Optional, Dict, Any, Tuple
import librosa
from resemblyzer import VoiceEncoder

logger = logging.getLogger(__name__)

class VoiceAnalyzer:
    """Analyzes voice for authentication and behavioral analysis"""
    
    def __init__(self):
        self.enabled = os.getenv("ENABLE_VOICE_ANALYSIS", "true").lower() == "true"
        self.model_path = os.getenv("VOICE_MODEL_PATH", "./models")
        self.encoder: Optional[VoiceEncoder] = None
        
        if self.enabled:
            try:
                self.encoder = VoiceEncoder()
                logger.info("Voice analyzer initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize voice encoder: {e}")
                self.enabled = False
    
    async def extract_features(
        self,
        audio_data: bytes,
        sr: int = 16000
    ) -> Dict[str, Any]:
        """
        Extract voice features from audio
        
        Args:
            audio_data: Raw audio bytes
            sr: Sample rate (default 16000 Hz)
            
        Returns:
            Dictionary of audio features
        """
        if not self.enabled or not self.encoder:
            return {}
        
        try:
            # Convert bytes to numpy array
            audio_array = np.frombuffer(audio_data, dtype=np.int16)
            audio_float = audio_array.astype(np.float32) / 32768.0
            
            # Extract mel-frequency cepstral coefficients
            mfcc = librosa.feature.mfcc(y=audio_float, sr=sr, n_mfcc=13)
            mfcc_mean = np.mean(mfcc, axis=1).tolist()
            mfcc_std = np.std(mfcc, axis=1).tolist()
            
            # Extract zero crossing rate
            zcr = librosa.feature.zero_crossing_rate(audio_float)
            zcr_mean = np.mean(zcr).item()
            zcr_std = np.std(zcr).item()
            
            # Extract spectral centroid
            spec_centroid = librosa.feature.spectral_centroid(y=audio_float, sr=sr)
            spec_centroid_mean = np.mean(spec_centroid).item()
            
            # Calculate RMS energy
            rms = librosa.feature.rms(y=audio_float)
            rms_mean = np.mean(rms).item()
            rms_std = np.std(rms).item()
            
            features = {
                "mfcc_mean": mfcc_mean,
                "mfcc_std": mfcc_std,
                "zcr_mean": zcr_mean,
                "zcr_std": zcr_std,
                "spectral_centroid": spec_centroid_mean,
                "rms_mean": rms_mean,
                "rms_std": rms_std,
                "duration_seconds": len(audio_array) / sr,
            }
            
            logger.info("Voice features extracted successfully")
            return features
            
        except Exception as e:
            logger.error(f"Error extracting voice features: {e}")
            return {}
    
    async def get_voice_embedding(
        self,
        audio_data: bytes,
        sr: int = 16000
    ) -> Optional[np.ndarray]:
        """
        Get voice embedding for speaker verification
        
        Args:
            audio_data: Raw audio bytes
            sr: Sample rate
            
        Returns:
            Voice embedding vector (256D)
        """
        if not self.enabled or not self.encoder:
            return None
        
        try:
            # Convert bytes to numpy array
            audio_array = np.frombuffer(audio_data, dtype=np.int16)
            audio_float = audio_array.astype(np.float32) / 32768.0
            
            # Resample if needed
            if sr != 16000:
                audio_float = librosa.resample(audio_float, orig_sr=sr, target_sr=16000)
            
            # Get embedding
            embedding = self.encoder.embed_utterance(audio_float)
            
            logger.info("Voice embedding generated successfully")
            return embedding
            
        except Exception as e:
            logger.error(f"Error generating voice embedding: {e}")
            return None
    
    async def compare_voice_embeddings(
        self,
        embedding1: np.ndarray,
        embedding2: np.ndarray,
        threshold: float = 0.7
    ) -> Tuple[bool, float]:
        """
        Compare two voice embeddings for speaker verification
        
        Args:
            embedding1: Reference embedding
            embedding2: Test embedding
            threshold: Similarity threshold (0-1)
            
        Returns:
            (is_match, similarity_score)
        """
        try:
            # Cosine similarity
            similarity = np.dot(embedding1, embedding2) / (
                np.linalg.norm(embedding1) * np.linalg.norm(embedding2)
            )
            
            is_match = similarity >= threshold
            
            logger.info(f"Voice comparison: similarity={similarity:.4f}, match={is_match}")
            return is_match, float(similarity)
            
        except Exception as e:
            logger.error(f"Error comparing voice embeddings: {e}")
            return False, 0.0
    
    async def detect_liveness(
        self,
        audio_data: bytes,
        sr: int = 16000
    ) -> Dict[str, Any]:
        """
        Basic liveness detection using audio characteristics
        
        Args:
            audio_data: Raw audio bytes
            sr: Sample rate
            
        Returns:
            Liveness detection results
        """
        if not self.enabled:
            return {"is_live": True, "confidence": 0.0, "reason": "liveness_disabled"}
        
        try:
            # Convert bytes to numpy array
            audio_array = np.frombuffer(audio_data, dtype=np.int16)
            audio_float = audio_array.astype(np.float32) / 32768.0
            
            # Check for silence
            rms = librosa.feature.rms(y=audio_float)
            energy_levels = rms[0]
            
            # Check for sufficient variation
            spectral_flux = np.std(energy_levels)
            
            # Simple heuristics for liveness
            is_live = spectral_flux > 0.01
            confidence = min(spectral_flux * 10, 1.0)  # Scale to 0-1
            
            reason = "sufficient_speech_variation" if is_live else "insufficient_variation"
            
            return {
                "is_live": is_live,
                "confidence": float(confidence),
                "reason": reason,
                "spectral_flux": float(spectral_flux)
            }
            
        except Exception as e:
            logger.error(f"Error in liveness detection: {e}")
            return {"is_live": False, "confidence": 0.0, "reason": str(e)}
    
    async def detect_behavioral_drift(
        self,
        current_features: Dict[str, Any],
        baseline_features: Dict[str, Any],
        threshold: float = 0.7
    ) -> Dict[str, Any]:
        """
        Detect behavioral drift in voice patterns
        
        Args:
            current_features: Current voice features
            baseline_features: Baseline/reference features
            threshold: Anomaly threshold (0-1)
            
        Returns:
            Drift detection results
        """
        try:
            # Compare MFCC features
            current_mfcc = np.array(current_features.get("mfcc_mean", []))
            baseline_mfcc = np.array(baseline_features.get("mfcc_mean", []))
            
            if len(current_mfcc) == 0 or len(baseline_mfcc) == 0:
                return {
                    "is_anomaly": False,
                    "score": 0.0,
                    "reason": "insufficient_features"
                }
            
            # Euclidean distance in feature space
            distance = np.linalg.norm(current_mfcc - baseline_mfcc)
            
            # Normalize distance (assuming max distance ~5)
            anomaly_score = min(distance / 5.0, 1.0)
            
            is_anomaly = anomaly_score > threshold
            
            return {
                "is_anomaly": is_anomaly,
                "score": float(anomaly_score),
                "reason": "behavioral_change_detected" if is_anomaly else "normal_behavior",
                "distance": float(distance)
            }
            
        except Exception as e:
            logger.error(f"Error in behavioral drift detection: {e}")
            return {
                "is_anomaly": False,
                "score": 0.0,
                "reason": str(e)
            }


# Global analyzer instance
_voice_analyzer: Optional[VoiceAnalyzer] = None

def get_voice_analyzer() -> VoiceAnalyzer:
    """Get or create voice analyzer"""
    global _voice_analyzer
    if _voice_analyzer is None:
        _voice_analyzer = VoiceAnalyzer()
    return _voice_analyzer
