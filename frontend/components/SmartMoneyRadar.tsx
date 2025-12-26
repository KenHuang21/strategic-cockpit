"use client";

import { PolymarketEvent } from "@/lib/types";
import { ExternalLink, TrendingUp, Repeat } from "lucide-react";

interface SmartMoneyRadarProps {
  events: PolymarketEvent[];
}

export default function SmartMoneyRadar({ events }: SmartMoneyRadarProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="mb-4 flex items-center space-x-2">
        <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Smart Money Radar v2
        </h3>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        Top markets by 24h volume with flip detection
      </p>

      {/* Events List */}
      <div className="space-y-4">
        {events && events.length > 0 ? (
          events.map((event, index) => (
            <div
              key={index}
              className={`pb-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0 last:pb-0 ${
                event.flipped ? 'border-l-4 border-l-purple-500 pl-3 -ml-1' : ''
              }`}
            >
              <div className="flex items-start justify-between space-x-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <a
                      href={event.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors inline-flex items-center group"
                    >
                      <span className="line-clamp-2">{event.title}</span>
                      <ExternalLink className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </a>
                    {event.flipped && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 flex-shrink-0">
                        <Repeat className="w-3 h-3" />
                        FLIP
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {event.outcome}:
                  </span>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    {(event.probability * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Vol: ${formatVolume(event.volume)}
                  </div>
                  {event.volume_24h !== undefined && event.volume_24h !== 0 && (
                    <div className={`text-xs ${event.volume_24h > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      24h: {event.volume_24h > 0 ? '+' : ''}${formatVolume(Math.abs(event.volume_24h))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No markets available
          </div>
        )}
      </div>
    </div>
  );
}

function formatVolume(volume: number): string {
  if (volume >= 1000000) {
    return `${(volume / 1000000).toFixed(1)}M`;
  }
  if (volume >= 1000) {
    return `${(volume / 1000).toFixed(0)}K`;
  }
  return volume.toFixed(0);
}
