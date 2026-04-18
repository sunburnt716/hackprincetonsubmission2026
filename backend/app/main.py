from fastapi import FastAPI

app = FastAPI(
    title="Kinovo Triage API",
    version="0.1.0",
    description="Backend for the Kinovo waiting-room triage dashboard.",
)


@app.get("/health")
async def health_check():
    return {"status": "ok"}
