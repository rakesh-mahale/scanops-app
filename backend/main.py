import time
import random
import requests
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

app = FastAPI(title="ScanOps API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Apni API Keys yahan daalo ─────────────────────────────────────────────────
GOOGLE_API_KEY = "AIzaSyDnKyv5MwB8BYZ0eFfTH9-ZRLrG7Lk_vDM"    # console.cloud.google.com se lo
SEARCH_ENGINE_ID = "716edaf1fe2ab4368"  # programmablesearchengine.google.com se lo

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
        api_endpoint = "https://www.googleapis.com/customsearch/v1"
        params = {
            "key": GOOGLE_API_KEY,
            "cx": SEARCH_ENGINE_ID,
            "q": f"site:{clean_url}",
            "num": 5,
            "gl": "us",
            "hl": "en",
        }

        response = requests.get(api_endpoint, params=params, timeout=15)
        data = response.json()

        if "error" in data:
            error_code = data["error"]["code"]
            error_msg = data["error"]["message"]

            if error_code == 429 or "quota" in error_msg.lower():
                return {
                    "url": clean_url,
                    "status": "Error",
                    "message": "API daily limit khatam (100/day free). Kal try karo."
                }
            if error_code == 400 or "API key" in error_msg:
                return {
                    "url": clean_url,
                    "status": "Error",
                    "message": "API Key galat hai. main.py mein check karo."
                }
            return {
                "url": clean_url,
                "status": "Error",
                "message": f"API Error: {error_msg}"
            }

        total_results = int(data.get("searchInformation", {}).get("totalResults", "0"))
        items = data.get("items", [])

        if total_results > 0 and len(items) > 0:
            return {
                "url": clean_url,
                "status": "Indexed",
                "message": f"Google par {total_results} page(s) indexed hain."
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
    api_configured = GOOGLE_API_KEY != "YOUR_API_KEY_HERE"
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