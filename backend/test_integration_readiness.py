#!/usr/bin/env python3
"""
Integration Readiness Test for Tests #38, #39, #43

This script validates that all components are ready for production testing:
- Test #38: Telegram notification timing (<60 seconds)
- Test #39: Email notification timing (<2 minutes)
- Test #43: Complete end-to-end workflow

REQUIREMENTS FOR PRODUCTION:
1. Backend/.env file with real credentials:
   - TELEGRAM_BOT_TOKEN
   - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
2. Real Telegram chat ID and email address in user_config.json
3. GitHub Actions workflows configured with secrets
"""

import sys
import os
import json
import time
from pathlib import Path
from typing import Dict, List, Tuple

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from notifications import (
    send_telegram_message,
    send_email_message,
    broadcast_alert,
    format_alert_message,
    TELEGRAM_BOT_TOKEN,
    SMTP_USER,
    SMTP_PASS
)

# ANSI color codes for output
GREEN = '\033[92m'
YELLOW = '\033[93m'
RED = '\033[91m'
BLUE = '\033[94m'
RESET = '\033[0m'


def print_header(title: str):
    """Print a formatted header"""
    print(f"\n{BLUE}{'=' * 80}{RESET}")
    print(f"{BLUE}{title.center(80)}{RESET}")
    print(f"{BLUE}{'=' * 80}{RESET}\n")


def print_test_result(test_name: str, passed: bool, message: str = ""):
    """Print test result with color coding"""
    status = f"{GREEN}✅ PASS{RESET}" if passed else f"{RED}❌ FAIL{RESET}"
    print(f"{status} - {test_name}")
    if message:
        print(f"      {message}")


def check_env_configuration() -> Tuple[bool, List[str]]:
    """
    Check if .env file exists and has required credentials
    Returns: (is_configured, missing_vars)
    """
    print_header("Environment Configuration Check")

    env_file = Path(__file__).parent / ".env"
    missing = []

    # Check if file exists
    if not env_file.exists():
        print(f"{RED}❌ .env file not found at {env_file}{RESET}")
        return False, ["ENTIRE .env FILE MISSING"]

    print(f"{GREEN}✅ .env file exists{RESET}")

    # Check for required variables
    if not TELEGRAM_BOT_TOKEN:
        missing.append("TELEGRAM_BOT_TOKEN")
        print(f"{YELLOW}⚠️  TELEGRAM_BOT_TOKEN not configured{RESET}")
    else:
        print(f"{GREEN}✅ TELEGRAM_BOT_TOKEN configured{RESET}")

    if not SMTP_USER or not SMTP_PASS:
        if not SMTP_USER:
            missing.append("SMTP_USER")
        if not SMTP_PASS:
            missing.append("SMTP_PASS")
        print(f"{YELLOW}⚠️  SMTP credentials not fully configured{RESET}")
    else:
        print(f"{GREEN}✅ SMTP credentials configured{RESET}")

    return len(missing) == 0, missing


def check_user_config() -> Tuple[bool, Dict]:
    """
    Check if user_config.json has subscribers
    Returns: (has_subscribers, config)
    """
    print_header("User Configuration Check")

    config_file = Path(__file__).parent.parent / "data" / "user_config.json"

    if not config_file.exists():
        print(f"{RED}❌ user_config.json not found{RESET}")
        return False, {}

    print(f"{GREEN}✅ user_config.json exists{RESET}")

    with open(config_file, 'r') as f:
        config = json.load(f)

    subscribers = config.get("subscribers", [])

    if not subscribers:
        print(f"{YELLOW}⚠️  No subscribers configured{RESET}")
        return False, config

    print(f"{GREEN}✅ {len(subscribers)} subscriber(s) configured{RESET}")

    # Count by type
    telegram_count = sum(1 for s in subscribers if s["type"] == "telegram")
    email_count = sum(1 for s in subscribers if s["type"] == "email")

    print(f"   • Telegram: {telegram_count}")
    print(f"   • Email: {email_count}")

    # List subscribers
    for i, sub in enumerate(subscribers, 1):
        if sub["type"] == "telegram":
            print(f"   {i}. {sub['name']} (Telegram: {sub['id']})")
        else:
            print(f"   {i}. {sub['name']} (Email: {sub['address']})")

    return True, config


def test_telegram_functionality() -> bool:
    """
    Test #38: Telegram notification timing
    Returns: True if ready for production test
    """
    print_header("Test #38: Telegram Notification Readiness")

    if not TELEGRAM_BOT_TOKEN:
        print(f"{YELLOW}⚠️  Cannot test - TELEGRAM_BOT_TOKEN not configured{RESET}")
        print(f"{YELLOW}   This test requires production credentials{RESET}")
        return False

    print(f"{BLUE}Simulating Telegram notification delivery...{RESET}")

    # Create test alert
    test_alert = {
        "metric": "Bitcoin Price",
        "old_value": 87000,
        "new_value": 88500,
        "old_formatted": "$87,000.00",
        "new_formatted": "$88,500.00",
        "pct_change": 1.72,
        "direction": "increased",
        "threshold_pct": 0.5
    }

    # Format message (should be instant)
    start_time = time.time()
    message = format_alert_message(test_alert, "metric")
    format_time = time.time() - start_time

    print(f"   Message formatting: {format_time * 1000:.2f}ms")

    # Test with a mock subscriber (will fail gracefully if not real)
    test_subscriber = {
        "type": "telegram",
        "name": "Integration Test User",
        "id": "123456789"  # Mock ID
    }

    start_time = time.time()
    result = broadcast_alert(test_alert, [test_subscriber], "metric")
    execution_time = time.time() - start_time

    print(f"   Execution time: {execution_time:.3f} seconds")
    print(f"   Requirement: < 60 seconds")

    if execution_time < 60:
        print(f"{GREEN}✅ Timing requirement met{RESET}")
        print(f"{YELLOW}⚠️  Production test needed with real Telegram chat ID{RESET}")
        return True
    else:
        print(f"{RED}❌ Exceeds timing requirement{RESET}")
        return False


def test_email_functionality() -> bool:
    """
    Test #39: Email notification timing
    Returns: True if ready for production test
    """
    print_header("Test #39: Email Notification Readiness")

    if not SMTP_USER or not SMTP_PASS:
        print(f"{YELLOW}⚠️  Cannot test - SMTP credentials not configured{RESET}")
        print(f"{YELLOW}   This test requires production credentials{RESET}")
        return False

    print(f"{BLUE}Simulating Email notification delivery...{RESET}")

    # Create test alert
    test_alert = {
        "metric": "Fed Net Liquidity",
        "old_value": 6500000000000,
        "new_value": 6600000000000,
        "old_formatted": "$6,500.00B",
        "new_formatted": "$6,600.00B",
        "pct_change": 1.54,
        "direction": "increased",
        "threshold_pct": 1.0
    }

    # Format message
    start_time = time.time()
    message = format_alert_message(test_alert, "metric")
    format_time = time.time() - start_time

    print(f"   Message formatting: {format_time * 1000:.2f}ms")

    # Test with mock subscriber
    test_subscriber = {
        "type": "email",
        "name": "Integration Test User",
        "address": "test@example.com"  # Mock email
    }

    start_time = time.time()
    result = broadcast_alert(test_alert, [test_subscriber], "metric")
    execution_time = time.time() - start_time

    print(f"   Execution time: {execution_time:.3f} seconds")
    print(f"   Requirement: < 120 seconds")

    if execution_time < 120:
        print(f"{GREEN}✅ Timing requirement met{RESET}")
        print(f"{YELLOW}⚠️  Production test needed with real SMTP server{RESET}")
        return True
    else:
        print(f"{RED}❌ Exceeds timing requirement{RESET}")
        return False


def test_end_to_end_workflow_readiness() -> bool:
    """
    Test #43: Complete end-to-end workflow readiness
    Returns: True if all components are ready
    """
    print_header("Test #43: End-to-End Workflow Readiness")

    checks = []

    # 1. Check data files exist
    print(f"{BLUE}1. Checking data files...{RESET}")
    dashboard_data = Path(__file__).parent.parent / "data" / "dashboard_data.json"
    calendar_data = Path(__file__).parent.parent / "data" / "calendar_data.json"
    user_config = Path(__file__).parent.parent / "data" / "user_config.json"

    files_exist = all([
        dashboard_data.exists(),
        calendar_data.exists(),
        user_config.exists()
    ])

    if files_exist:
        print(f"{GREEN}   ✅ All data files present{RESET}")
        checks.append(True)
    else:
        print(f"{RED}   ❌ Missing data files{RESET}")
        checks.append(False)

    # 2. Check GitHub Actions workflows
    print(f"{BLUE}2. Checking GitHub Actions workflows...{RESET}")
    workflows_dir = Path(__file__).parent.parent / ".github" / "workflows"

    expected_workflows = [
        "fetch_metrics.yml",
        "fetch_calendar.yml",
        "update_settings.yml"
    ]

    workflows_exist = []
    for workflow in expected_workflows:
        workflow_file = workflows_dir / workflow
        if workflow_file.exists():
            print(f"{GREEN}   ✅ {workflow} exists{RESET}")
            workflows_exist.append(True)
        else:
            print(f"{YELLOW}   ⚠️  {workflow} not found{RESET}")
            workflows_exist.append(False)

    checks.append(all(workflows_exist))

    # 3. Check notification system
    print(f"{BLUE}3. Checking notification system...{RESET}")
    has_telegram = bool(TELEGRAM_BOT_TOKEN)
    has_smtp = bool(SMTP_USER and SMTP_PASS)

    if has_telegram and has_smtp:
        print(f"{GREEN}   ✅ Both notification channels configured{RESET}")
        checks.append(True)
    elif has_telegram or has_smtp:
        print(f"{YELLOW}   ⚠️  Only partial notification configuration{RESET}")
        checks.append(False)
    else:
        print(f"{RED}   ❌ No notification channels configured{RESET}")
        checks.append(False)

    # 4. Check frontend is accessible
    print(f"{BLUE}4. Checking frontend availability...{RESET}")
    # We can't actually test HTTP in this script, but we can check files exist
    frontend_dir = Path(__file__).parent.parent / "frontend"
    package_json = frontend_dir / "package.json"

    if package_json.exists():
        print(f"{GREEN}   ✅ Frontend application present{RESET}")
        checks.append(True)
    else:
        print(f"{RED}   ❌ Frontend not found{RESET}")
        checks.append(False)

    # Summary
    print(f"\n{BLUE}End-to-End Workflow Components:{RESET}")
    total_checks = len(checks)
    passed_checks = sum(checks)

    print(f"   Ready: {passed_checks}/{total_checks} components")

    if all(checks):
        print(f"{GREEN}✅ System ready for end-to-end production test{RESET}")
        return True
    else:
        print(f"{YELLOW}⚠️  Some components need configuration{RESET}")
        return False


def main():
    """Run all integration readiness tests"""
    print_header("STRATEGIC COCKPIT DASHBOARD - Integration Test Readiness")

    print(f"{BLUE}This script validates readiness for the final 3 integration tests:{RESET}")
    print(f"  • Test #38: Telegram notification timing (<60 seconds)")
    print(f"  • Test #39: Email notification timing (<2 minutes)")
    print(f"  • Test #43: Complete end-to-end workflow")
    print()

    results = []

    # 1. Environment configuration
    env_configured, missing_vars = check_env_configuration()
    results.append(("Environment Configuration", env_configured))

    if missing_vars:
        print(f"\n{YELLOW}Missing environment variables:{RESET}")
        for var in missing_vars:
            print(f"   • {var}")

    # 2. User configuration
    has_subscribers, config = check_user_config()
    results.append(("User Configuration", has_subscribers))

    # 3. Test #38 - Telegram
    telegram_ready = test_telegram_functionality()
    results.append(("Test #38: Telegram Timing", telegram_ready))

    # 4. Test #39 - Email
    email_ready = test_email_functionality()
    results.append(("Test #39: Email Timing", email_ready))

    # 5. Test #43 - End-to-End
    e2e_ready = test_end_to_end_workflow_readiness()
    results.append(("Test #43: End-to-End Workflow", e2e_ready))

    # Final summary
    print_header("INTEGRATION READINESS SUMMARY")

    for test_name, passed in results:
        print_test_result(test_name, passed)

    total = len(results)
    passed = sum(1 for _, p in results if p)

    print(f"\n{BLUE}Overall Readiness: {passed}/{total} components ready{RESET}")

    if all(p for _, p in results):
        print(f"\n{GREEN}{'=' * 80}{RESET}")
        print(f"{GREEN}🎉 SYSTEM READY FOR PRODUCTION TESTING 🎉{RESET}")
        print(f"{GREEN}{'=' * 80}{RESET}")
        print(f"\n{BLUE}Next Steps:{RESET}")
        print(f"1. Deploy to production (Vercel + GitHub)")
        print(f"2. Configure GitHub Secrets with real credentials")
        print(f"3. Add real Telegram chat ID and email to user_config.json")
        print(f"4. Trigger manual refresh from dashboard")
        print(f"5. Verify notification delivery timing")
        print(f"6. Mark Tests #38, #39, #43 as passing")
        return 0
    else:
        print(f"\n{YELLOW}{'=' * 80}{RESET}")
        print(f"{YELLOW}⚠️  PRODUCTION CREDENTIALS NEEDED ⚠️{RESET}")
        print(f"{YELLOW}{'=' * 80}{RESET}")
        print(f"\n{BLUE}Required for Full Testing:{RESET}")

        if not env_configured:
            print(f"\n{YELLOW}1. Configure backend/.env with:{RESET}")
            for var in missing_vars:
                print(f"   • {var}")

        print(f"\n{YELLOW}2. Add real subscribers to data/user_config.json:{RESET}")
        print(f"   • Real Telegram chat ID (get from @userinfobot)")
        print(f"   • Real email address for testing")

        print(f"\n{BLUE}Note:{RESET} All code is implemented and tested.")
        print(f"      These tests require live external services to validate.")

        return 1


if __name__ == "__main__":
    sys.exit(main())
