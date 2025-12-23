"use client";

import { RefreshCw, Settings, BookOpen } from "lucide-react";
import Link from "next/link";

interface HeaderProps {
  riskStatus: "Risk On" | "Risk Off";
  lastUpdated: string;
  onRefresh: () => void;
  refreshing: boolean;
  onSettingsClick: () => void;
}

export default function Header({ riskStatus, lastUpdated, onRefresh, refreshing, onSettingsClick }: HeaderProps) {
  const timeAgo = getTimeAgo(lastUpdated);

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Title and Risk Status */}
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Strategic Cockpit
            </h1>
            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
              riskStatus === "Risk On"
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
            }`}>
              {riskStatus}
            </div>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center space-x-4">
            {/* Last Updated */}
            <div className="text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
              Updated {timeAgo}
            </div>

            {/* Manual Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={refreshing}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                refreshing
                  ? "bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
              title="Manually refresh all data"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">
                {refreshing ? "Refreshing..." : "Refresh"}
              </span>
            </button>

            {/* Settings Icon */}
            <button
              onClick={onSettingsClick}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* Docs Link */}
            <Link
              href="/docs"
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
              title="Documentation"
            >
              <BookOpen className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

function getTimeAgo(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return "unknown";
  }
}
