# Voice Analysis Module

Biometric voice authentication and behavioral analysis for BankChase.

## Features

- Voice feature extraction (MFCC, spectral analysis)
- Speaker verification using voice embeddings
- Liveness detection to prevent spoofing attacks
- Behavioral drift detection for anomaly detection
- Voice biometric enrollment and authentication

## Architecture

```
FastAPI Backend (main.py)
  ↓
/api/voice routes (routes.py)
  ↓
VoiceAnalyzer (analyzer.py)
  ↓
Librosa (audio processing)
Resemblyzer (speaker embeddings)
```

## Components

### 1. VoiceAnalyzer (`analyzer.py`)
Core voice analysis engine using deep learning models.

**Key Methods:**
- `extract_features()` - Extract MFCC and spectral features
- `get_voice_embedding()` - Generate 256D speaker embedding
- `compare_voice_embeddings()` - Compare embeddings for speaker verification
- `detect_liveness()` - Detect if audio is from live person
- `detect_behavioral_drift()` - Detect anomalies in voice patterns

### 2. Routes (`routes.py`)
FastAPI endpoints for voice operations:

- `POST /api/voice/analyze` - Extract voice features
- `POST /api/voice/embedding` - Generate voice embedding
- `POST /api/voice/verify` - Verify speaker identity
- `POST /api/voice/liveness` - Detect liveness
- `POST /api/voice/behavioral-drift` - Detect drift
- `POST /api/voice/enroll` - Enroll user voice
- `GET /api/voice/health` - Health check

## Usage Examples

### Extract Voice Features
```bash
curl -X POST http://localhost:8000/api/voice/analyze \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@voice_sample.wav"

# Response:
{
  "features": {
    "mfcc_mean": [...],
    "mfcc_std": [...],
    "zcr_mean": 0.05,
    "spectral_centroid": 1500.5,
    "rms_mean": 0.1,
    "rms_std": 0.02,
    "duration_seconds": 3.5
  },
  "duration_seconds": 3.5,
  "success": true
}
```

### Verify Speaker Identity
```bash
curl -X POST http://localhost:8000/api/voice/verify \
  -H "Authorization: Bearer TOKEN" \
  -F "reference_file=@reference.wav" \
  -F "test_file=@test.wav"

# Response:
{
  "is_match": true,
  "similarity": 0.92,
  "threshold": 0.7,
  "success": true
}
```

### Enroll User Voice
```bash
curl -X POST http://localhost:8000/api/voice/enroll \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@voice_enrollment.wav"

# Response:
{
  "status": "enrolled",
  "features_count": 7,
  "success": true
}
```

### Detect Behavioral Drift
```bash
curl -X POST http://localhost:8000/api/voice/behavioral-drift \
  -H "Authorization: Bearer TOKEN" \
  -F "current_file=@recent_voice.wav"

# Response:
{
  "is_anomaly": false,
  "score": 0.35,
  "reason": "normal_behavior"
}
```

## Audio Specifications

**Supported Formats:**
- WAV, MP3, FLAC, OGG
- Sample rate: 16000 Hz (automatically resampled)
- Duration: 1-30 seconds recommended
- Bitrate: 128kbps minimum

**Recording Guidelines:**
- Quiet environment (< 60dB noise)
- Clear pronunciation
- Natural speech patterns
- No background noise or music

## Voice Biometrics

### Speaker Embedding
- 256-dimensional vector
- Trained on large speech corpus
- Robust to speaker variations
- Cosine similarity for comparison

### Feature Extraction
- **MFCC**: 13 mel-frequency cepstral coefficients
- **Zero Crossing Rate**: Speech activity detection
- **Spectral Centroid**: Voice pitch characteristics
- **RMS Energy**: Loudness variation

### Thresholds
- **Speaker Verification**: 0.7 (70% similarity)
- **Behavioral Drift**: 0.7 (70% anomaly threshold)
- **Liveness**: spectral_flux > 0.01

## Integration with Workflows

Voice analysis can be integrated into workflows:

```python
# In workflow step
async def voice_authentication_step(user_id, audio_bytes):
    """Authenticate user via voice"""
    analyzer = get_voice_analyzer()
    
    # Get user baseline
    user = db.query(User).filter(User.id == user_id).first()
    baseline = user.voice_baseline
    
    # Extract features from current audio
    features = await analyzer.extract_features(audio_bytes)
    
    # Check for behavioral drift
    drift = await analyzer.detect_behavioral_drift(
        features,
        baseline,
        threshold=0.7
    )
    
    if drift["is_anomaly"]:
        # Require additional verification
        raise RequireAdditionalVerification()
    
    return {"authenticated": True}
```

## Database Integration

Voice data is stored with user profiles:

```sql
-- Add to users table
ALTER TABLE users ADD COLUMN voice_baseline JSONB;
ALTER TABLE users ADD COLUMN voice_embedding vector(256);
```

## Security Considerations

1. **Anti-Spoofing**
   - Liveness detection prevents recorded audio attacks
   - Spectral variation analysis
   - Background noise detection

2. **Privacy**
   - Voice data encrypted at rest
   - Features extracted locally, embeddings stored
   - No raw audio storage

3. **Accuracy**
   - Multiple voice samples for enrollment
   - Threshold optimization per user
   - Behavioral baselines updated periodically

## Performance

- **Feature Extraction**: ~100ms per second of audio
- **Embedding Generation**: ~200ms per second of audio
- **Speaker Verification**: ~10ms per comparison
- **Drift Detection**: ~50ms per analysis

## Environment Variables

```bash
# Voice Analysis
ENABLE_VOICE_ANALYSIS=true
VOICE_MODEL_PATH=./models

# Thresholds
VOICE_VERIFICATION_THRESHOLD=0.7
VOICE_DRIFT_THRESHOLD=0.7
```

## Error Handling

```python
try:
    embedding = await analyzer.get_voice_embedding(audio_data)
except Exception as e:
    logger.error(f"Voice processing error: {e}")
    # Handle gracefully, provide fallback auth method
```

## Testing

### Local Testing
```bash
# Record test audio
ffmpeg -f alsa -i default -t 5 test_audio.wav

# Test analysis
curl -X POST http://localhost:8000/api/voice/analyze \
  -H "Authorization: Bearer test-token" \
  -F "file=@test_audio.wav"
```

### Unit Tests
```python
async def test_voice_analysis():
    analyzer = VoiceAnalyzer()
    features = await analyzer.extract_features(audio_bytes)
    assert "mfcc_mean" in features
    assert features["duration_seconds"] > 0
```

## Troubleshooting

**Voice features not extracted:**
- Check audio format and sample rate
- Ensure audio is not silent
- Verify file is not corrupted

**Speaker verification fails:**
- Use same microphone and environment
- Ensure at least 2 seconds of speech
- Check similarity threshold

**Behavioral drift false positives:**
- Adjust threshold (0.5-0.9)
- Collect more baseline samples
- Consider speaker conditions

## Future Enhancements

- Real-time streaming voice analysis
- Emotion detection from voice
- Voice activity detection (VAD)
- Stress/fatigue detection
- Multilingual support
- Voice conversion attack detection

## References

- Librosa: https://librosa.org/
- Resemblyzer: https://github.com/resemble-ai/Resemblyzer
- MFCC: https://en.wikipedia.org/wiki/Mel-frequency_cepstral_coefficient
- Speaker Verification: https://arxiv.org/abs/1801.00062
