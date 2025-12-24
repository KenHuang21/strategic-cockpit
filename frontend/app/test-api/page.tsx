"use client";

import { useState } from "react";

export default function TestAPIPage() {
  const [metricsResult, setMetricsResult] = useState<any>(null);
  const [calendarResult, setCalendarResult] = useState<any>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(false);

  const testFetchMetrics = async () => {
    setMetricsLoading(true);
    try {
      const response = await fetch("/api/test-fetch", {
        method: "POST",
      });
      const data = await response.json();
      setMetricsResult(data);
    } catch (error) {
      setMetricsResult({ error: String(error) });
    } finally {
      setMetricsLoading(false);
    }
  };

  const testFetchCalendar = async () => {
    setCalendarLoading(true);
    try {
      const response = await fetch("/api/test-calendar", {
        method: "POST",
      });
      const data = await response.json();
      setCalendarResult(data);
    } catch (error) {
      setCalendarResult({ error: String(error) });
    } finally {
      setCalendarLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Test Data Fetch APIs</h1>

      <div className="space-y-8">
        {/* Metrics Test */}
        <div>
          <h2 className="text-xl font-semibold mb-3">Metrics API Test</h2>
          <button
            onClick={testFetchMetrics}
            disabled={metricsLoading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {metricsLoading ? "Fetching..." : "Test Fetch Metrics"}
          </button>

          {metricsResult && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Result:</h3>
              <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96 text-sm">
                {JSON.stringify(metricsResult, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Calendar Test */}
        <div>
          <h2 className="text-xl font-semibold mb-3">Calendar API Test</h2>
          <button
            onClick={testFetchCalendar}
            disabled={calendarLoading}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
          >
            {calendarLoading ? "Fetching..." : "Test Fetch Calendar"}
          </button>

          {calendarResult && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Result:</h3>
              <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96 text-sm">
                {JSON.stringify(calendarResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
