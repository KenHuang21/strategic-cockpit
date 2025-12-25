"use client";

import { ArrowUp, ArrowDown, Bitcoin } from "lucide-react";

interface MetricCardProps {
  title: string;
  subtitle: string;
  value: number;
  delta: number;
  unit?: string;
  prefix?: string;
  format?: "currency" | "percentage" | "number";
  hero?: boolean;
  deltaLabel?: string;
}

export default function MetricCard({
  title,
  subtitle,
  value,
  delta,
  unit = "",
  prefix = "",
  format = "number",
  hero = false,
  deltaLabel = "7d change",
}: MetricCardProps) {
  const isPositive = delta >= 0;
  const formattedValue = formatValue(value, format);
  const formattedDelta = formatDelta(delta, format);

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 transition-all hover:shadow-lg ${
        hero
          ? "p-8 shadow-xl border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-950"
          : "p-6"
      }`}
    >
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center space-x-2 mb-1">
          {hero && title === "Bitcoin Price" && (
            <Bitcoin className="w-6 h-6 text-orange-500" />
          )}
          <h3 className={`font-medium text-gray-600 dark:text-gray-400 ${hero ? "text-base" : "text-sm"}`}>
            {title}
          </h3>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-500">{subtitle}</p>
      </div>

      {/* Value */}
      <div className={`${hero ? "mb-8" : "mb-4"}`}>
        <div className={`font-bold text-gray-900 dark:text-white ${hero ? "text-5xl" : "text-3xl"}`}>
          {prefix}
          {formattedValue}
          {unit && <span className={`ml-1 ${hero ? "text-2xl" : "text-lg"}`}>{unit}</span>}
        </div>
      </div>

      {/* Delta */}
      <div className="flex items-center space-x-2">
        <div
          className={`flex items-center space-x-1 px-2 py-1 rounded-md text-sm font-medium ${
            isPositive
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
          }`}
        >
          {isPositive ? (
            <ArrowUp className="w-4 h-4" />
          ) : (
            <ArrowDown className="w-4 h-4" />
          )}
          <span>{formattedDelta}</span>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">{deltaLabel}</span>
      </div>
    </div>
  );
}

function formatValue(value: number, format: string): string {
  switch (format) {
    case "currency":
      if (value >= 1000000000) {
        return (value / 1000000000).toFixed(2);
      }
      if (value >= 1000000) {
        return (value / 1000000).toFixed(2);
      }
      if (value >= 1000) {
        return (value / 1000).toFixed(2);
      }
      return value.toFixed(2);
    case "percentage":
      return value.toFixed(2);
    default:
      return value.toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });
  }
}

function formatDelta(delta: number, format: string): string {
  const absDelta = Math.abs(delta);

  if (format === "percentage") {
    return `${absDelta.toFixed(2)}%`;
  }

  if (format === "currency") {
    if (absDelta >= 1000000000) {
      return `$${(absDelta / 1000000000).toFixed(2)}B`;
    }
    if (absDelta >= 1000000) {
      return `$${(absDelta / 1000000).toFixed(2)}M`;
    }
    if (absDelta >= 1000) {
      return `$${(absDelta / 1000).toFixed(2)}K`;
    }
    return `$${absDelta.toFixed(2)}`;
  }

  return absDelta.toFixed(2);
}
