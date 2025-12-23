"use client";

import { CalendarEvent } from "@/lib/types";
import { Calendar, Clock } from "lucide-react";

interface CatalystCalendarProps {
  events: CalendarEvent[];
}

export default function CatalystCalendar({ events }: CatalystCalendarProps) {
  const completedEvents = events.filter((e) => e.status === "completed");
  const upcomingEvents = events.filter((e) => e.status === "upcoming");

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="mb-4 flex items-center space-x-2">
        <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Catalyst Calendar
        </h3>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        4-week US economic events (High/Medium impact)
      </p>

      <div className="space-y-6">
        {/* Completed Events */}
        {completedEvents.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Completed
            </h4>
            <div className="space-y-3">
              {completedEvents.slice(0, 3).map((event) => (
                <CompletedEventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Upcoming
            </h4>
            <div className="space-y-3">
              {upcomingEvents.slice(0, 5).map((event) => (
                <UpcomingEventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        )}

        {events.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No events scheduled
          </div>
        )}
      </div>
    </div>
  );
}

function CompletedEventCard({ event }: { event: CalendarEvent }) {
  const surprise = calculateSurprise(event.forecast, event.actual || "");
  const surpriseColor = getSurpriseColor(surprise);

  return (
    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h5 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
            {event.name}
          </h5>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatDate(event.date)}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded ${
                event.impact === "High"
                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
              }`}
            >
              {event.impact}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs mt-2">
        <div>
          <span className="text-gray-500 dark:text-gray-400">Forecast:</span>
          <span className="ml-1 font-medium text-gray-700 dark:text-gray-300">
            {event.forecast}
          </span>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Actual:</span>
          <span
            className={`ml-1 font-medium ${
              surpriseColor === "positive"
                ? "text-green-600 dark:text-green-400"
                : surpriseColor === "negative"
                ? "text-red-600 dark:text-red-400"
                : "text-gray-700 dark:text-gray-300"
            }`}
          >
            {event.actual}
          </span>
        </div>
      </div>
    </div>
  );
}

function UpcomingEventCard({ event }: { event: CalendarEvent }) {
  return (
    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h5 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
            {event.name}
          </h5>
          <div className="flex items-center space-x-2 mt-1">
            <Clock className="w-3 h-3 text-gray-500 dark:text-gray-400" />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {formatDate(event.date)} at {event.time}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded ${
                event.impact === "High"
                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
              }`}
            >
              {event.impact}
            </span>
          </div>
        </div>
      </div>

      {event.forecast && (
        <div className="text-xs mt-2">
          <span className="text-gray-500 dark:text-gray-400">Forecast:</span>
          <span className="ml-1 font-medium text-gray-700 dark:text-gray-300">
            {event.forecast}
          </span>
        </div>
      )}
    </div>
  );
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}

function calculateSurprise(forecast: string, actual: string): "positive" | "negative" | "neutral" {
  // Simple comparison - in reality, this would be more sophisticated
  const forecastNum = parseFloat(forecast.replace(/[^0-9.-]/g, ""));
  const actualNum = parseFloat(actual.replace(/[^0-9.-]/g, ""));

  if (isNaN(forecastNum) || isNaN(actualNum)) return "neutral";

  if (actualNum > forecastNum) return "positive";
  if (actualNum < forecastNum) return "negative";
  return "neutral";
}

function getSurpriseColor(surprise: "positive" | "negative" | "neutral"): string {
  return surprise;
}
