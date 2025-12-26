"use client";

import { TrendingUp } from "lucide-react";

interface CorrelationRadarProps {
  btcNasdaq: number;
  btcGold: number;
  interpretation: string;
  periodDays: number;
}

export default function CorrelationRadar({
  btcNasdaq,
  btcGold,
  interpretation,
  periodDays,
}: CorrelationRadarProps) {
  // Function to get color based on correlation value
  const getCorrelationColor = (value: number): string => {
    const absValue = Math.abs(value);
    if (absValue > 0.7) return "text-red-600 dark:text-red-400";
    if (absValue > 0.4) return "text-yellow-600 dark:text-yellow-400";
    return "text-green-600 dark:text-green-400";
  };

  // Function to format correlation value with sign
  const formatCorrelation = (value: number): string => {
    if (value > 0) return `+${value.toFixed(2)}`;
    return value.toFixed(2);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-purple-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Correlation Radar
          </h3>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {periodDays}d window
        </span>
      </div>

      {/* Subtitle */}
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        BTC correlation with traditional assets
      </p>

      {/* Correlation Values */}
      <div className="space-y-3 mb-4">
        {/* BTC - Nasdaq */}
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              BTC-NDX
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              (Nasdaq)
            </span>
          </div>
          <span
            className={`text-lg font-bold ${getCorrelationColor(btcNasdaq)}`}
          >
            {formatCorrelation(btcNasdaq)}
          </span>
        </div>

        {/* BTC - Gold */}
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              BTC-GOLD
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              (Gold)
            </span>
          </div>
          <span
            className={`text-lg font-bold ${getCorrelationColor(btcGold)}`}
          >
            {formatCorrelation(btcGold)}
          </span>
        </div>
      </div>

      {/* Interpretation */}
      <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Interpretation:
          </span>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {interpretation}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
        <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <span className="text-green-600 dark:text-green-400 font-bold">
              &lt;0.3
            </span>
            <div>Uncorrelated</div>
          </div>
          <div className="text-center">
            <span className="text-yellow-600 dark:text-yellow-400 font-bold">
              0.3-0.7
            </span>
            <div>Moderate</div>
          </div>
          <div className="text-center">
            <span className="text-red-600 dark:text-red-400 font-bold">
              &gt;0.7
            </span>
            <div>High</div>
          </div>
        </div>
      </div>
    </div>
  );
}
