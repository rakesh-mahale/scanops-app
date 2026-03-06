import time
import random
import requests
import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

load_dotenv()

app = FastAPI(title="ScanOps API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SERPAPI_KEY = os.getenv("SERPAPI_KEY")

class URLList(BaseModel):
    urls: List[str]

def random_delay():
    time.sleep(random.uniform(0.5, 1.5))

def get_index_status(url: str) -> dict:
    random_delay()

    clean_url = url.strip()
    if not clean_url.startswith("http"):
        clean_url = "https://" + clean_url

    try:
        params = {
            "engine": "google",
            "q": f"site:{clean_url}",
            "api_key": SERPAPI_KEY,
            "num": 5,
        }

        response = requests.get(
            "https://serpapi.com/search",
            params=params,
            timeout=15
        )
        data = response.json()

        # Pehle results aur total nikalo
        results = data.get("organic_results", [])
        total = data.get("search_information", {}).get("total_results", 0)

        # Error handle karo
        if "error" in data:
            error_msg = data.get("error", "")
            # Sirf no results wala case — Not Indexed hai
            if "hasn't returned any results" in error_msg:
                return {
                    "url": clean_url,
                    "status": "Not Indexed",
                    "message": "Google par yeh URL indexed nahi hai."
                }
            # Real API error
            return {
                "url": clean_url,
                "status": "Error",
                "message": f"API Error: {error_msg}"
            }

        # Results check karo
        if len(results) > 0:
            return {
                "url": clean_url,
                "status": "Indexed",
                "message": f"Google par {total} page(s) indexed hain."
            }
        else:
            return {
                "url": clean_url,
                "status": "Not Indexed",
                "message": "Google par koi indexed page nahi mila."
            }

    except requests.exceptions.Timeout:
        return {"url": clean_url, "status": "Error", "message": "Request timeout."}
    except requests.exceptions.ConnectionError:
        return {"url": clean_url, "status": "Error", "message": "Connection error."}
    except Exception as e:
        return {"url": clean_url, "status": "Error", "message": f"Error: {str(e)}"}


@app.post("/check-index")
def check_index(request: URLList):
    urls_to_check = request.urls[:50]
    results = []
    for url in urls_to_check:
        if url.strip():
            result = get_index_status(url)
            results.append(result)
    return {"results": results, "total": len(results)}

@app.get("/health")
def health():
    api_configured = SERPAPI_KEY is not None
    return {
        "status": "ok",
        "message": "ScanOps Backend chal raha hai!",
        "api_configured": api_configured,
        "version": "1.0.0"
    }

@app.get("/")
def root():
    return {
        "app": "ScanOps API",
        "docs": "http://127.0.0.1:8000/docs",
        "health": "http://127.0.0.1:8000/health"
    }