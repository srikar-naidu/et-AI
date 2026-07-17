"""Mock currency-screening model service for local development."""

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import random

app = FastAPI(title="Currency Screening API (Mock)", version="1.0.0")

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, bool]:
    """Health check endpoint."""
    return {"ready": True}


@app.post("/predict")
async def predict(image: UploadFile = File(...)) -> dict[str, object]:
    """
    Mock currency screening endpoint.
    In production, this would run ML inference on the uploaded image.
    For local testing, returns random but realistic results.
    """
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="An image is required")

    try:
        raw = await image.read()
        if not raw or len(raw) == 0:
            raise HTTPException(status_code=400, detail="Could not read this image")
    except Exception as error:
        raise HTTPException(status_code=400, detail="Could not read this image") from error

    # Mock prediction: randomly return verified or counterfeit
    # In production, this would be actual ML model inference
    fake_probability = random.uniform(0, 1)
    result = "counterfeit" if fake_probability >= 0.5 else "verified"
    confidence = fake_probability if result == "counterfeit" else 1 - fake_probability

    return {
        "result": result,
        "confidence": round(confidence, 4),
        "fake_probability": round(fake_probability, 4),
        "model_scope": "binary image screening only",
        "disclaimer": "This model is a screening aid and does not replace currency authentication by a trained examiner.",
        "mode": "mock_local_development",
    }
