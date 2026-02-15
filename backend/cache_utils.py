import re
import sqlite3
import hashlib
import json
from datetime import datetime, timedelta

CACHE_FILE = "response_cache.db"

def init_cache():
    """Initializes the SQLite cache database."""
    conn = sqlite3.connect(CACHE_FILE)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS responses (
            key TEXT PRIMARY KEY,
            response TEXT,
            timestamp DATETIME
        )
    """)
    conn.commit()
    conn.close()

def get_cached_response(prompt_key, max_age_days=7):
    """Retrieves a cached response if it exists and is fresh."""
    conn = sqlite3.connect(CACHE_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT response, timestamp FROM responses WHERE key = ?", (prompt_key,))
    row = cursor.fetchone()
    conn.close()

    if row:
        cached_resp, timestamp_str = row
        timestamp = datetime.fromisoformat(timestamp_str)
        if datetime.now() - timestamp < timedelta(days=max_age_days):
            print("✅ Serving from cache!")
            return cached_resp
        else:
            print("⚠️ Cache expired.")
            # Optional: delete expired entry
    return None

def cache_response(prompt_key, response_text):
    """Saves a response to the cache."""
    conn = sqlite3.connect(CACHE_FILE)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT OR REPLACE INTO responses (key, response, timestamp)
        VALUES (?, ?, ?)
    """, (prompt_key, response_text, datetime.now().isoformat()))
    conn.commit()
    conn.close()

def generate_cache_key(prompt_string):
    """Creates a unique hash for the input prompt."""
    return hashlib.md5(prompt_string.encode('utf-8')).hexdigest()

def clean_html_input(html_content):
    """Strips HTML tags to reduce token usage."""
    # Basic regex to strip tags; for production, use BeautifulSoup
    clean_text = re.sub(r'<[^>]+>', ' ', html_content)
    # Remove excessive whitespace
    clean_text = re.sub(r'\s+', ' ', clean_text).strip()
    return clean_text
