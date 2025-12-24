#!/usr/bin/env python3
"""
Test script for Calendar Alerts (Pre-event and Data Release)
Verifies that notification logic works correctly without waiting for real events.
"""

import sys
import unittest
from unittest.mock import MagicMock, patch
from datetime import datetime, timedelta
import json

# Add backend directory to path
sys.path.append('.')

# Import after path setup
from fetch_calendar import check_pre_event_warnings, check_data_releases

class TestCalendarAlerts(unittest.TestCase):
    def setUp(self):
        self.user_config = {
            "subscribers": [
                {"type": "telegram", "id": "123456789", "name": "Test User"}
            ]
        }
        self.notification_states = {}

    @patch('notifications.broadcast_alerts')
    def test_pre_event_warning(self, mock_broadcast):
        """Test 12-hour pre-event warning"""
        print("\nTesting Pre-Event Warning...")
        
        # Create an event 6 hours in the future
        now = datetime.now()
        event_time = now + timedelta(hours=6)
        
        events = [{
            "id": "test_event_1",
            "name": "Test High Impact Event",
            "date": event_time.strftime("%Y-%m-%d"),
            "time": event_time.strftime("%H:%M"),
            "impact": "High",
            "status": "upcoming",
            "forecast": "5.0%"
        }]
        
        # Run check
        check_pre_event_warnings(events, self.notification_states, self.user_config)
        
        # Verify alert was sent
        mock_broadcast.assert_called_once()
        args = mock_broadcast.call_args[0]
        alerts = args[0]
        
        self.assertEqual(len(alerts), 1)
        self.assertEqual(alerts[0]['event_name'], "Test High Impact Event")
        self.assertTrue(0 < alerts[0]['hours_until'] <= 12)
        print("✅ Pre-event warning triggered correctly")

    @patch('notifications.broadcast_alerts')
    def test_data_release_alert(self, mock_broadcast):
        """Test data release alert logic"""
        print("\nTesting Data Release Alert...")
        
        # Existing state (before release)
        existing_events = [{
            "id": "test_event_2",
            "name": "GDP Growth",
            "actual": None,
            "status": "upcoming"
        }]
        
        # New state (after release)
        events = [{
            "id": "test_event_2",
            "name": "GDP Growth",
            "date": "2025-01-01",
            "time": "10:00",
            "impact": "High",
            "forecast": "2.0%",
            "actual": "2.5%", # Surprise!
            "previous": "1.9%",
            "status": "completed"
        }]
        
        # Run check
        check_data_releases(events, existing_events, self.notification_states, self.user_config)
        
        # Verify alert was sent
        mock_broadcast.assert_called_once()
        args = mock_broadcast.call_args[0]
        alerts = args[0]
        alert_type = args[2]
        
        self.assertEqual(len(alerts), 1)
        self.assertEqual(alerts[0]['event_name'], "GDP Growth")
        self.assertEqual(alerts[0]['actual'], "2.5%")
        self.assertAlmostEqual(alerts[0]['surprise'], 0.5) # 2.5 - 2.0
        self.assertEqual(alert_type, "calendar_release")
        print("✅ Data release alert triggered correctly")

if __name__ == '__main__':
    unittest.main()
