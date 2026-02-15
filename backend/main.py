from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models import StrategyRequest, StrategyResponse, EntitySearchRequest, EntitySearchResponse
from services import generate_strategy, search_entities
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="CDM Strategy Generator API")

# Configure CORS
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",  # Add localhost IP explicitly
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("❌ STARTUP ERROR: GEMINI_API_KEY not found in environment!")
    elif api_key == "your_api_key_here":
        print("⚠️ WARNING: GEMINI_API_KEY is still set to placeholder 'your_api_key_here'.")
    else:
        print(f"✅ Backend started successfully. API Key loaded (starts with {api_key[:4]}...)")

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.post("/api/search_entity", response_model=EntitySearchResponse)
async def search_entity_endpoint(request: EntitySearchRequest):
    try:
        matches = search_entities(request.query)
        return EntitySearchResponse(matches=matches)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate", response_model=StrategyResponse)
async def generate_strategy_endpoint(request: StrategyRequest):
    import json
    try:
        raw_result = generate_strategy(
            product=request.product,
            industry=request.industry,
            rubie_pov_list=request.rubie_pov,
            scope_key=request.scope_key,
            show_ai_q=request.show_ai_q,
            show_customer_thinking=request.show_customer_thinking,
            show_sales_question=request.show_sales_question
        )
        
        # Parse the JSON response from services
        result_data = json.loads(raw_result)
        
        return StrategyResponse(
            markdown_content=result_data.get("markdown", ""),
            cleaned_table_data=result_data.get("table", [])
        )
    except ValueError as ve:
        # Client side configuration error (e.g. missing API key)
        raise HTTPException(status_code=400, detail=str(ve))
    except RuntimeError as re:
        # Upstream service error
        raise HTTPException(status_code=503, detail=str(re))
    except Exception as e:
        # Unexpected internal error
        print(f"INTERNAL ERROR: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
