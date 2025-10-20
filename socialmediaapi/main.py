from fastapi import FastAPI

app = FastAPI()


@app.get("/")
async def root():
    return {"message": "API is running", "status": "success"}


@app.get("/health")
async def health():
    return {"message": "API is running", "status": "healthy"}
