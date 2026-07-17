"""Render-ready inference service for the currency-screening model."""

from io import BytesIO
from os import getenv

import numpy as np
import tensorflow as tf
from fastapi import FastAPI, File, HTTPException, UploadFile
from PIL import Image

MODEL_PATH = getenv("MODEL_PATH", "models/counterfeit-screening.keras")
app = FastAPI(title="Currency Screening API", version="1.0.0")
model: tf.keras.Model | None = None


@app.on_event("startup")
def load_model() -> None:
    global model
    model = tf.keras.models.load_model(MODEL_PATH)


@app.get("/health")
def health() -> dict[str, bool]:
    return {"ready": model is not None}


@app.post("/predict")
async def predict(image: UploadFile = File(...)) -> dict[str, object]:
    if model is None:
        raise HTTPException(status_code=503, detail="Model is not ready")
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="An image is required")

    try:
        raw = await image.read()
        note = Image.open(BytesIO(raw)).convert("RGB").resize((224, 224))
    except Exception as error:
        raise HTTPException(status_code=400, detail="Could not read this image") from error

    tensor = np.expand_dims(np.asarray(note, dtype=np.float32), axis=0)
    fake_probability = float(model.predict(tensor, verbose=0)[0][0])
    result = "counterfeit" if fake_probability >= 0.5 else "verified"
    confidence = fake_probability if result == "counterfeit" else 1 - fake_probability

    return {
        "result": result,
        "confidence": round(confidence, 4),
        "fake_probability": round(fake_probability, 4),
        "model_scope": "binary image screening only",
        "disclaimer": "This model is a screening aid and does not replace currency authentication by a trained examiner.",
    }
