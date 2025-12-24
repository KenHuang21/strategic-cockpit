'use client';

import { useState } from 'react';

export default function TestSmartDiff() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const runTests = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/test-smart-diff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ testCase: 'all' })
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const runFetchMetrics = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/test-smart-diff', {
        method: 'GET'
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Smart Diff Testing</h1>
        <p className="text-gray-600 mb-8">Test the Smart Diff logic for detecting significant metric changes</p>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Options</h2>

          <div className="space-y-4">
            <button
              onClick={runTests}
              disabled={loading}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Running Tests...' : 'Run Unit Tests'}
            </button>

            <button
              onClick={runFetchMetrics}
              disabled={loading}
              className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Fetching Data...' : 'Run fetch_metrics.py (with Smart Diff)'}
            </button>
          </div>
        </div>

        {result && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              <div
                className={`w-3 h-3 rounded-full mr-3 ${
                  result.success ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <h2 className="text-xl font-semibold">
                {result.success ? 'Success' : 'Error'}
              </h2>
            </div>

            {result.message && (
              <p className="text-gray-700 mb-4">{result.message}</p>
            )}

            {result.error && (
              <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
                <h3 className="font-semibold text-red-800 mb-2">Error:</h3>
                <pre className="text-sm text-red-700 whitespace-pre-wrap">
                  {result.error}
                </pre>
              </div>
            )}

            {result.stdout && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Output:</h3>
                <pre className="bg-gray-50 border border-gray-200 rounded p-4 text-sm overflow-x-auto whitespace-pre-wrap">
                  {result.stdout}
                </pre>
              </div>
            )}

            {result.stderr && (
              <div>
                <h3 className="font-semibold mb-2">Errors/Warnings:</h3>
                <pre className="bg-yellow-50 border border-yellow-200 rounded p-4 text-sm overflow-x-auto whitespace-pre-wrap">
                  {result.stderr}
                </pre>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3">About Smart Diff</h3>
          <p className="text-blue-800 text-sm mb-2">
            Smart Diff compares old and new metric values to detect significant changes based on configured thresholds:
          </p>
          <ul className="text-blue-800 text-sm space-y-1 list-disc list-inside">
            <li>Bitcoin Price: 1% threshold</li>
            <li>Stablecoin Market Cap: 0.1% threshold</li>
            <li>US 10Y Treasury Yield: 5% threshold</li>
            <li>Fed Net Liquidity: 2% threshold</li>
            <li>USDT Dominance: 0.5% threshold</li>
            <li>RWA TVL: 3% threshold</li>
          </ul>
          <p className="text-blue-800 text-sm mt-3">
            When a metric changes beyond its threshold, an alert is generated and logged.
            Future sessions will implement actual notification delivery.
          </p>
        </div>
      </div>
    </div>
  );
}
