import requests
from bs4 import BeautifulSoup
import time
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class URLList(BaseModel):
    urls: list[str]

def get_index_status(url):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    try:
        search_url = f"https://www.google.com/search?q=site:{url}"
        response = requests.get(search_url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, "html.parser")
            text_lower = soup.get_text().lower()
            
            # Agar Google ye phrases dikhaye, toh pakka NOT INDEXED hai
            if "did not match any documents" in text_lower or "not find any results" in text_lower:
                return "Not Indexed"
            
            # Agar search results ka div mil jaye, toh INDEXED hai
            if soup.find("div", id="search") or soup.find("div", class_="g"):
                return "Indexed"
                
            return "Not Indexed"
        elif response.status_code == 429:
            return "Error: Captcha/Blocked"
        return "Error: Connection Issue"
    except Exception as e:
        return f"Error: {str(e)}"

@app.post("/check-index")
async def scan_urls(data: URLList):
    results = []
    for url in data.urls[:5]: 
        status = get_index_status(url)
        results.append({"url": url, "status": status})
        time.sleep(2) 
    return {"results": results}