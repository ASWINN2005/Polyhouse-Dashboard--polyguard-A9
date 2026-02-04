from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import ollama
import os

# ---------------------------
# App setup
# ---------------------------
app = FastAPI()

# 🔥 VERY IMPORTANT: OPEN CORS FOR DEV
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------
# Load ML model
# ---------------------------
MODEL_PATH = "polyhouse_rf_model.pkl"
rf_model = joblib.load(MODEL_PATH) if os.path.exists(MODEL_PATH) else None

# ---------------------------
# Data models
# ---------------------------
class SensorInput(BaseModel):
    temperature: float
    humidity: float
    soilMoisture: float
    lightIntensity: float


class ChatRequest(BaseModel):
    prompt: str

# ---------------------------
# Root route (fixes 403 confusion)
# ---------------------------
@app.get("/")
def root():
    return {"message": "Polyhouse AI backend running"}

# ---------------------------
# Health check
# ---------------------------
@app.get("/health")
def health():
    return {"status": "ok"}

# ---------------------------
# ML prediction endpoint
# ---------------------------
@app.post("/predict_disease")
def predict_disease(data: SensorInput):
    if not rf_model:
        raise HTTPException(status_code=503, detail="ML model not loaded")

    prediction = rf_model.predict([
    [
        data.temperature,
        data.humidity,
        data.soilMoisture,
        data.lightIntensity
    ]
])

    return {"diagnosis": str(prediction[0])}

# ---------------------------
# Local AI (Ollama)
# ---------------------------
@app.post("/ask_local")
def ask_local(req: ChatRequest):
    try:
        response = ollama.chat(
            model="mistral",
            messages=[
                {"role": "system", "content": "You are an offline agronomist assistant."},
                {"role": "user", "content": req.prompt},
            ],
        )
        return {"response": response["message"]["content"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ---------------------------
# Run server
# ---------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001)
