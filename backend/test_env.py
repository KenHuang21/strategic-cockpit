#!/usr/bin/env python3
"""
Test script to verify .env file loading
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from backend/.env
env_path = Path(__file__).parent / ".env"
print(f"Loading .env from: {env_path}")
print(f"File exists: {env_path.exists()}")

load_dotenv(dotenv_path=env_path)

# Check FRED API key
fred_key = os.getenv("FRED_API_KEY", "")
print(f"\nFRED_API_KEY loaded: {'Yes' if fred_key else 'No'}")
if fred_key:
    print(f"Key length: {len(fred_key)} characters")
    print(f"Key preview: {fred_key[:4]}...{fred_key[-4:]}")

# Check Telegram token
telegram_token = os.getenv("TELEGRAM_BOT_TOKEN", "")
print(f"\nTELEGRAM_BOT_TOKEN loaded: {'Yes' if telegram_token else 'No'}")
if telegram_token:
    print(f"Token length: {len(telegram_token)} characters")

print("\n✅ Environment variable loading test complete")
