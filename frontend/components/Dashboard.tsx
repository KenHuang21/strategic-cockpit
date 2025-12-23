"use client";

import { useEffect, useState } from "react";
import { DashboardData, CalendarData } from "@/lib/types";
import Header from "./Header";
import MetricCard from "./MetricCard";
import SmartMoneyRadar from "./SmartMoneyRadar";
import CatalystCalendar from "./CatalystCalendar";
import SettingsModal from "./SettingsModal";
import toast, { Toaster } from "react-hot-toast";

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load dashboard data from JSON file
      const dashRes = await fetch("/api/data/dashboard");
      const dashData = await dashRes.json();
      setDashboardData(dashData);

      // Load calendar data from JSON file
      const calRes = await fetch("/api/data/calendar");
      const calData = await calRes.json();
      setCalendarData(calData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Show loading toast
      const loadingToast = toast.loading("Triggering data refresh...");

      // Trigger GitHub Actions workflow via API
      const response = await fetch("/api/refresh", { method: "POST" });
      const result = await response.json();

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      if (response.ok) {
        // Show success toast
        toast.success("Update started! Data will refresh in ~60 seconds.", {
          duration: 4000,
          icon: "🚀",
        });

        // Wait a moment then reload data
        setTimeout(() => {
          loadData();
          setRefreshing(false);
        }, 2000);
      } else {
        // Show error toast
        toast.error(result.error || "Failed to trigger refresh", {
          duration: 4000,
        });
        setRefreshing(false);
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast.error("Network error: Could not connect to server", {
        duration: 4000,
      });
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">Error loading dashboard data</p>
        </div>
      </div>
    );
  }

  const riskStatus = calculateRiskStatus(
    dashboardData.metrics.us_10y_yield.value,
    dashboardData.metrics.fed_net_liquidity.value
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
          },
          success: {
            duration: 4000,
            iconTheme: {
              primary: "#10b981",
              secondary: "#fff",
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
          },
        }}
      />
      <Header
        riskStatus={riskStatus}
        lastUpdated={dashboardData.last_updated}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        onSettingsClick={() => setSettingsOpen(true)}
      />
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      {/* Bento Grid Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Macro */}
          <div className="space-y-6">
            <MetricCard
              title="US 10Y Treasury Yield"
              subtitle="The Gravity"
              value={dashboardData.metrics.us_10y_yield.value}
              delta={dashboardData.metrics.us_10y_yield.delta}
              unit="%"
              format="percentage"
            />
            <MetricCard
              title="Fed Net Liquidity"
              subtitle="The Fuel"
              value={dashboardData.metrics.fed_net_liquidity.value}
              delta={dashboardData.metrics.fed_net_liquidity.delta}
              unit="B"
              prefix="$"
              format="currency"
            />
            <SmartMoneyRadar events={dashboardData.polymarket_top5} />
          </div>

          {/* Column 2: Market */}
          <div className="space-y-6">
            <MetricCard
              title="Bitcoin Price"
              subtitle="The Market Proxy"
              value={dashboardData.metrics.btc_price.value}
              delta={dashboardData.metrics.btc_price.delta}
              prefix="$"
              format="currency"
              hero
            />
            <MetricCard
              title="Stablecoin Market Cap"
              subtitle="The Liquidity"
              value={dashboardData.metrics.stablecoin_mcap.value}
              delta={dashboardData.metrics.stablecoin_mcap.delta}
              unit="B"
              prefix="$"
              format="currency"
            />
            <MetricCard
              title="USDT Dominance"
              subtitle="The Fear Gauge"
              value={dashboardData.metrics.usdt_dominance.value}
              delta={dashboardData.metrics.usdt_dominance.delta}
              unit="%"
              format="percentage"
            />
          </div>

          {/* Column 3: Alpha */}
          <div className="space-y-6">
            <MetricCard
              title="RWA TVL"
              subtitle="The Alpha"
              value={dashboardData.metrics.rwa_tvl.value}
              delta={dashboardData.metrics.rwa_tvl.delta}
              unit="B"
              prefix="$"
              format="currency"
            />
            {calendarData && <CatalystCalendar events={calendarData.events} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function calculateRiskStatus(yieldValue: number, liquidityValue: number): "Risk On" | "Risk Off" {
  // Simple logic: Low yields + High liquidity = Risk On
  // High yields + Low liquidity = Risk Off
  // This is simplified - real implementation would be more sophisticated
  if (yieldValue < 4.0 && liquidityValue > 5000) {
    return "Risk On";
  }
  return "Risk Off";
}
