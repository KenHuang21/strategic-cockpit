#!/usr/bin/env python3
"""
Strategic Cockpit Dashboard - Notification System
Handles broadcasting alerts via Telegram and Email
"""

import os
import requests
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Dict, Any
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")


def format_alert_message(alert: Dict[str, Any], alert_type: str = "metric") -> str:
    """
    Format an alert into a readable message

    Args:
        alert: Alert dictionary with metric details
        alert_type: Type of alert (metric, calendar, polymarket)

    Returns:
        Formatted message string
    """
    if alert_type == "metric":
        direction_emoji = "📈" if alert["direction"] == "increased" else "📉"

        message = f"""🚨 *{alert['metric']} Alert*

{direction_emoji} {alert['direction'].upper()} by {alert['pct_change']:.2f}%

*Previous:* {alert['old_formatted']}
*Current:* {alert['new_formatted']}

*Threshold:* {alert['threshold_pct']:.2f}%
*Change:* {alert['pct_change']:.2f}%

_Automated alert from Strategic Cockpit Dashboard_"""

    elif alert_type == "calendar_warning":
        message = f"""⚠️ *Economic Event Warning*

📅 {alert['event_name']}
🕐 {alert['time']}
📊 Forecast: {alert.get('forecast', 'N/A')}
🔴 Impact: {alert['impact']}

*This high-impact event is in 12 hours!*

_Automated alert from Strategic Cockpit Dashboard_"""

    elif alert_type == "calendar_release":
        surprise = alert.get('surprise', '')
        surprise_emoji = "🟢" if surprise > 0 else "🔴" if surprise < 0 else "⚪"

        message = f"""📊 *Economic Data Released*

📅 {alert['event_name']}
📈 Forecast: {alert.get('forecast', 'N/A')}
📉 Actual: {alert.get('actual', 'N/A')}
{surprise_emoji} Surprise: {surprise}

_Automated alert from Strategic Cockpit Dashboard_"""

    elif alert_type == "polymarket":
        message = f"""💹 *Polymarket Odds Flip*

📊 {alert['market_title']}

Previous: {alert['old_probability']:.0f}%
Current: {alert['new_probability']:.0f}%
Change: {abs(alert['new_probability'] - alert['old_probability']):.1f}%

_Automated alert from Strategic Cockpit Dashboard_"""

    else:
        message = str(alert)

    return message


def send_telegram_message(chat_id: str, message: str) -> bool:
    """
    Send a message via Telegram Bot API

    Args:
        chat_id: Telegram chat ID
        message: Message text (Markdown supported)

    Returns:
        True if successful, False otherwise
    """
    if not TELEGRAM_BOT_TOKEN:
        print(f"⚠️  TELEGRAM_BOT_TOKEN not configured, skipping Telegram notification")
        return False

    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"

        payload = {
            "chat_id": chat_id,
            "text": message,
            "parse_mode": "Markdown"
        }

        # Try with SSL verification first
        try:
            response = requests.post(url, json=payload, timeout=30, verify=True)
        except requests.exceptions.SSLError:
            # Fallback without SSL verification
            import urllib3
            urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
            response = requests.post(url, json=payload, timeout=30, verify=False)

        if response.status_code == 200:
            print(f"✅ Telegram message sent to {chat_id}")
            return True
        else:
            print(f"❌ Telegram API error: {response.status_code} - {response.text}")
            return False

    except Exception as e:
        print(f"❌ Error sending Telegram message to {chat_id}: {e}")
        return False


def send_email_message(to_address: str, subject: str, message: str) -> bool:
    """
    Send an email via SMTP

    Args:
        to_address: Recipient email address
        subject: Email subject line
        message: Email body (plain text or HTML)

    Returns:
        True if successful, False otherwise
    """
    if not SMTP_USER or not SMTP_PASS:
        print(f"⚠️  SMTP credentials not configured, skipping email notification")
        return False

    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = SMTP_USER
        msg['To'] = to_address

        # Convert markdown-style message to HTML
        html_message = message.replace('*', '<strong>').replace('_', '<em>')
        html_message = html_message.replace('\n', '<br>\n')
        html_message = f"""
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
              {html_message}
            </div>
          </body>
        </html>
        """

        # Attach both plain and HTML versions
        part1 = MIMEText(message, 'plain')
        part2 = MIMEText(html_message, 'html')
        msg.attach(part1)
        msg.attach(part2)

        # Send via SMTP
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.send_message(msg)

        print(f"✅ Email sent to {to_address}")
        return True

    except Exception as e:
        print(f"❌ Error sending email to {to_address}: {e}")
        return False


def broadcast_alert(alert: Dict[str, Any], subscribers: List[Dict[str, str]], alert_type: str = "metric") -> Dict[str, Any]:
    """
    Broadcast an alert to all subscribers

    Args:
        alert: Alert dictionary with details
        subscribers: List of subscriber dictionaries with type, id/address, name
        alert_type: Type of alert (metric, calendar_warning, calendar_release, polymarket)

    Returns:
        Dictionary with success counts and any errors
    """
    if not subscribers:
        print("ℹ️  No subscribers configured")
        return {"telegram_sent": 0, "email_sent": 0, "errors": []}

    # Format the message
    message = format_alert_message(alert, alert_type)

    # Determine subject for emails
    if alert_type == "metric":
        subject = f"🚨 Alert: {alert['metric']} {alert['direction']} by {alert['pct_change']:.2f}%"
    elif alert_type == "calendar_warning":
        subject = f"⚠️ Upcoming Event: {alert['event_name']}"
    elif alert_type == "calendar_release":
        subject = f"📊 Data Released: {alert['event_name']}"
    elif alert_type == "polymarket":
        subject = f"💹 Polymarket: {alert['market_title']}"
    else:
        subject = "Strategic Cockpit Alert"

    # Track results
    telegram_sent = 0
    email_sent = 0
    errors = []

    # Iterate through subscribers
    for subscriber in subscribers:
        try:
            if subscriber["type"] == "telegram":
                chat_id = subscriber.get("id", "")
                name = subscriber.get("name", "Unknown")

                if chat_id:
                    success = send_telegram_message(chat_id, message)
                    if success:
                        telegram_sent += 1
                    else:
                        errors.append(f"Telegram failed for {name} ({chat_id})")
                else:
                    errors.append(f"Telegram subscriber {name} missing chat_id")

            elif subscriber["type"] == "email":
                address = subscriber.get("address", "")
                name = subscriber.get("name", "Unknown")

                if address:
                    success = send_email_message(address, subject, message)
                    if success:
                        email_sent += 1
                    else:
                        errors.append(f"Email failed for {name} ({address})")
                else:
                    errors.append(f"Email subscriber {name} missing address")

        except Exception as e:
            errors.append(f"Error processing subscriber {subscriber.get('name', 'Unknown')}: {e}")

    # Log summary
    total = telegram_sent + email_sent
    print(f"\n📤 Alert broadcast complete: {total}/{len(subscribers)} sent")
    print(f"   • Telegram: {telegram_sent}")
    print(f"   • Email: {email_sent}")

    if errors:
        print(f"⚠️  {len(errors)} error(s) occurred:")
        for error in errors:
            print(f"   • {error}")

    return {
        "telegram_sent": telegram_sent,
        "email_sent": email_sent,
        "total_sent": total,
        "errors": errors
    }


def broadcast_alerts(alerts: List[Dict[str, Any]], subscribers: List[Dict[str, str]], alert_type: str = "metric") -> Dict[str, Any]:
    """
    Broadcast multiple alerts to all subscribers

    Args:
        alerts: List of alert dictionaries
        subscribers: List of subscriber dictionaries
        alert_type: Type of alerts

    Returns:
        Dictionary with aggregated results
    """
    if not alerts:
        print("ℹ️  No alerts to broadcast")
        return {"telegram_sent": 0, "email_sent": 0, "total_sent": 0, "errors": []}

    print(f"\n📢 Broadcasting {len(alerts)} alert(s) to {len(subscribers)} subscriber(s)...")

    total_telegram = 0
    total_email = 0
    all_errors = []

    for i, alert in enumerate(alerts, 1):
        print(f"\n🚨 Alert {i}/{len(alerts)}:")
        result = broadcast_alert(alert, subscribers, alert_type)

        total_telegram += result["telegram_sent"]
        total_email += result["email_sent"]
        all_errors.extend(result["errors"])

    print(f"\n✅ Broadcast summary:")
    print(f"   • Total alerts: {len(alerts)}")
    print(f"   • Telegram messages: {total_telegram}")
    print(f"   • Emails: {total_email}")

    return {
        "telegram_sent": total_telegram,
        "email_sent": total_email,
        "total_sent": total_telegram + total_email,
        "errors": all_errors
    }


if __name__ == "__main__":
    # Test the notification system
    print("=" * 60)
    print("Testing Notification System")
    print("=" * 60)

    # Test alert
    test_alert = {
        "metric": "Bitcoin Price",
        "old_value": 100000,
        "new_value": 102000,
        "old_formatted": "$100,000.00",
        "new_formatted": "$102,000.00",
        "pct_change": 2.0,
        "direction": "increased",
        "threshold_pct": 1.0
    }

    # Test subscribers
    test_subscribers = [
        {
            "type": "telegram",
            "name": "Test User",
            "id": "577628610"
        }
    ]

    # Broadcast test
    broadcast_alert(test_alert, test_subscribers, "metric")
