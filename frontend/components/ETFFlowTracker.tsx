"use client";

import { ETFFlowData } from "@/lib/types";
import { TrendingUp, TrendingDown } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface ETFFlowTrackerProps {
  flows: ETFFlowData[];
  net5day: number;
}

export default function ETFFlowTracker({ flows, net5day }: ETFFlowTrackerProps) {
  // Format data for Recharts
  const chartData = flows.map((flow) => ({
    date: formatDate(flow.date),
    flow: flow.flow,
    fullDate: flow.date,
  }));

  // Custom tooltip to show exact values
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const flow = payload[0].value;
      const isPositive = flow >= 0;

      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            {payload[0].payload.fullDate}
          </p>
          <p className={`text-sm font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? '+' : ''}{flow.toFixed(0)}M
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {isPositive ? 'Inflow' : 'Outflow'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {net5day >= 0 ? (
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
          ) : (
            <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
          )}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Wall St. Flows
          </h3>
        </div>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        US Spot BTC ETF 5-Day Net Flows
      </p>

      {/* Bar Chart */}
      <div className="h-48 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#6B7280' }}
              axisLine={{ stroke: '#E5E7EB' }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#6B7280' }}
              axisLine={{ stroke: '#E5E7EB' }}
              tickFormatter={(value) => `${value}M`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} />
            <Bar dataKey="flow" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.flow >= 0 ? '#10b981' : '#ef4444'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            5-Day Net Flow:
          </span>
          <span className={`text-lg font-bold ${net5day >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {net5day >= 0 ? '+' : ''}{net5day.toFixed(1)}B
          </span>
        </div>
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  // Convert "2025-12-26" to "12/26"
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}/${day}`;
}
