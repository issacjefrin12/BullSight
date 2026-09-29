from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers.stocks import router
from .db import init_db

app=FastAPI(title="Bull Sight API",version="2.0.0",
            description="AI-Powered Stock Market Prediction & Investment Analysis")
app.add_middleware(CORSMiddleware,allow_origins=["*"],allow_credentials=True,
                   allow_methods=["*"],allow_headers=["*"])
app.include_router(router)

@app.on_event("startup")
def startup():
    init_db()

@app.get("/")
def root():
    return {"message":"Bull Sight API is running","docs":"/docs"}
