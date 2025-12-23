"use client";

import { useState } from "react";

export default function TestAPIPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testFetch = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/test-fetch", {
        method: "POST",
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Data Fetch API</h1>

      <button
        onClick={testFetch}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        {loading ? "Fetching..." : "Test Fetch Metrics"}
      </button>

      {result && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Result:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
