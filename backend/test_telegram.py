#!/usr/bin/env python3
"""
Test Telegram Bot Integration - Simple HTTP approach
"""

import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
CHAT_ID = "577628610"

def send_test_message():
    """Send a test message via Telegram using direct HTTP"""
    
    if not TELEGRAM_BOT_TOKEN:
        print("❌ TELEGRAM_BOT_TOKEN not set in .env file")
        return False
    
    try:
        print(f"🤖 Testing Telegram Bot...")
        print(f"📱 Target Chat ID: {CHAT_ID}")
        
        # Telegram API endpoint
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        
        # Test message
        message = """🎉 *Telegram Bot Test Successful!*

✅ Your Strategic Cockpit Dashboard bot is working!

📊 *What's Next:*
• Dashboard data updates → Live notifications
• Economic calendar events → Pre-event warnings  
• Threshold breaches → Instant alerts

_This is an automated test message from your Strategic Cockpit Dashboard._"""
        
        payload = {
            "chat_id": CHAT_ID,
            "text": message,
            "parse_mode": "Markdown"
        }
        
        print(f"📤 Sending test message...")
        
        # Send with SSL verification disabled
        response = requests.post(url, json=payload, verify=False, timeout=30)
        
        if response.status_code == 200:
            print("✅ Test message sent successfully!")
            print(f"📱 Check your Telegram (Chat ID: {CHAT_ID})")
            return True
        else:
            print(f"❌ Failed to send message. Status: {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
    except Exception as e:
        print(f"❌ Error sending Telegram message: {e}")
        return False

if __name__ == "__main__":
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    
    result = send_test_message()
    exit(0 if result else 1)
