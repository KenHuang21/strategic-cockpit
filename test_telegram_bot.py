#!/usr/bin/env python3
"""
Test Telegram Bot - Get Updates and Send Test Message
"""
import os
import requests
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
env_path = Path(__file__).parent / "backend" / ".env"
load_dotenv(dotenv_path=env_path)

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")

def get_bot_info():
    """Get bot information"""
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getMe"
    response = requests.get(url, verify=False)
    print("Bot Info:")
    print(response.json())
    return response.json()

def get_updates():
    """Get updates (messages sent to the bot)"""
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getUpdates"
    response = requests.get(url, verify=False)
    data = response.json()
    print("\nRecent Updates:")
    print(data)

    if data.get("ok") and data.get("result"):
        print("\nChat IDs found:")
        for update in data["result"]:
            if "message" in update:
                chat_id = update["message"]["chat"]["id"]
                username = update["message"]["chat"].get("username", "N/A")
                first_name = update["message"]["chat"].get("first_name", "N/A")
                print(f"  Chat ID: {chat_id}, Name: {first_name}, Username: @{username}")
    return data

def send_test_message(chat_id):
    """Send a test message to a specific chat ID"""
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"

    message = """🧪 *Test Message from Strategic Cockpit*

This is a test notification to verify the Telegram bot is working correctly.

If you see this message, the bot is configured properly!

_Automated test from Strategic Cockpit Dashboard_"""

    params = {
        "chat_id": chat_id,
        "text": message,
        "parse_mode": "Markdown"
    }

    response = requests.post(url, json=params, verify=False)
    print(f"\nSend Message Response:")
    print(response.json())
    return response.json()

if __name__ == "__main__":
    print("=" * 60)
    print("Telegram Bot Test")
    print("=" * 60)

    if not TELEGRAM_BOT_TOKEN:
        print("❌ TELEGRAM_BOT_TOKEN not found in .env")
        exit(1)

    print(f"\n✅ Bot Token found: {TELEGRAM_BOT_TOKEN[:20]}...")

    # Get bot info
    bot_info = get_bot_info()

    # Get updates to find chat IDs
    updates = get_updates()

    # If we found chat IDs, offer to send a test message
    if updates.get("ok") and updates.get("result"):
        print("\n" + "=" * 60)
        print("To send a test message:")
        print("1. Send any message to the bot on Telegram")
        print("2. Run this script again to see your chat ID")
        print("3. Uncomment the send_test_message line below")
        print("=" * 60)

        # Example: Uncomment and replace with a real chat ID from the updates
        # send_test_message(123456789)
    else:
        print("\n" + "=" * 60)
        print("No messages found. To get your chat ID:")
        print("1. Open Telegram and search for the bot")
        print(f"2. Bot username: @{bot_info.get('result', {}).get('username', 'unknown')}")
        print("3. Send any message to the bot")
        print("4. Run this script again")
        print("=" * 60)
