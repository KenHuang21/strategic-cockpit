"use client";

import { useState, useEffect } from "react";
import { X, UserPlus, Trash2, Mail, MessageCircle, Lightbulb } from "lucide-react";
import toast from "react-hot-toast";

interface Subscriber {
  type: "telegram" | "email";
  id?: string;
  address?: string;
  name: string;
}

interface Thresholds {
  btc_pct: number;
  stable_pct: number;
  yield_pct: number;
  liquidity_pct: number;
  usdt_dom_pct: number;
  rwa_pct: number;
}

interface UserConfig {
  thresholds: Thresholds;
  subscribers: Subscriber[];
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [config, setConfig] = useState<UserConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states for adding subscribers
  const [subscriberType, setSubscriberType] = useState<"telegram" | "email">("telegram");
  const [subscriberName, setSubscriberName] = useState("");
  const [telegramId, setTelegramId] = useState("");
  const [emailAddress, setEmailAddress] = useState("");

  // Threshold states
  const [thresholds, setThresholds] = useState<Thresholds>({
    btc_pct: 0.005,
    stable_pct: 0.001,
    yield_pct: 0.05,
    liquidity_pct: 0.02,
    usdt_dom_pct: 0.005,
    rwa_pct: 0.03,
  });

  // Suggest Metric form states
  const [metricName, setMetricName] = useState("");
  const [metricDescription, setMetricDescription] = useState("");
  const [submittingSuggestion, setSubmittingSuggestion] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen]);

  const loadConfig = async () => {
    try {
      const response = await fetch("/api/config");
      const data = await response.json();
      setConfig(data);
      setThresholds(data.thresholds);
    } catch (error) {
      console.error("Error loading config:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubscriber = async () => {
    // Validation
    if (!subscriberName.trim()) {
      toast.error("Please enter a subscriber name");
      return;
    }

    if (subscriberType === "telegram" && !telegramId.trim()) {
      toast.error("Please enter a Telegram Chat ID");
      return;
    }

    if (subscriberType === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailAddress)) {
        toast.error("Please enter a valid email address");
        return;
      }
    }

    const newSubscriber: Subscriber = {
      type: subscriberType,
      name: subscriberName,
      ...(subscriberType === "telegram" ? { id: telegramId } : { address: emailAddress }),
    };

    try {
      const updatedConfig = {
        ...config!,
        subscribers: [...(config?.subscribers || []), newSubscriber],
      };

      const response = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedConfig),
      });

      if (response.ok) {
        setConfig(updatedConfig);
        toast.success("Subscriber added successfully!");

        // Clear form
        setSubscriberName("");
        setTelegramId("");
        setEmailAddress("");
      } else {
        toast.error("Failed to add subscriber");
      }
    } catch (error) {
      console.error("Error adding subscriber:", error);
      toast.error("Network error: Could not add subscriber");
    }
  };

  const handleRemoveSubscriber = async (index: number) => {
    if (!confirm("Are you sure you want to remove this subscriber?")) {
      return;
    }

    try {
      const updatedConfig = {
        ...config!,
        subscribers: config!.subscribers.filter((_, i) => i !== index),
      };

      const response = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedConfig),
      });

      if (response.ok) {
        setConfig(updatedConfig);
        toast.success("Subscriber removed successfully!");
      } else {
        toast.error("Failed to remove subscriber");
      }
    } catch (error) {
      console.error("Error removing subscriber:", error);
      toast.error("Network error: Could not remove subscriber");
    }
  };

  const handleSaveThresholds = async () => {
    setSaving(true);
    try {
      const updatedConfig = {
        ...config!,
        thresholds,
      };

      const response = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedConfig),
      });

      if (response.ok) {
        setConfig(updatedConfig);
        toast.success("Thresholds saved successfully!");
      } else {
        toast.error("Failed to save thresholds");
      }
    } catch (error) {
      console.error("Error saving thresholds:", error);
      toast.error("Network error: Could not save thresholds");
    } finally {
      setSaving(false);
    }
  };

  const handleSuggestMetric = async () => {
    // Validation
    if (!metricName.trim()) {
      toast.error("Please enter a metric name");
      return;
    }

    if (!metricDescription.trim()) {
      toast.error("Please enter a description");
      return;
    }

    setSubmittingSuggestion(true);
    try {
      const response = await fetch("/api/suggest-metric", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metricName: metricName.trim(),
          description: metricDescription.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          <div>
            <p>Suggestion submitted successfully!</p>
            {data.issueUrl && (
              <a
                href={data.issueUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-300 hover:underline text-sm"
              >
                View Issue →
              </a>
            )}
          </div>
        );

        // Clear form
        setMetricName("");
        setMetricDescription("");
      } else {
        toast.error(data.error || "Failed to submit suggestion");
      }
    } catch (error) {
      console.error("Error submitting suggestion:", error);
      toast.error("Network error: Could not submit suggestion");
    } finally {
      setSubmittingSuggestion(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Settings
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Loading settings...</p>
            </div>
          ) : (
            <div className="p-6 space-y-8">
              {/* Subscriber Management Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Subscriber Management
                </h3>

                {/* Add Subscriber Form */}
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg mb-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <UserPlus className="w-5 h-5 text-gray-500" />
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Add New Subscriber
                    </h4>
                  </div>

                  {/* Type Selection */}
                  <div className="flex space-x-4 mb-3">
                    <button
                      onClick={() => setSubscriberType("telegram")}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                        subscriberType === "telegram"
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Telegram</span>
                    </button>
                    <button
                      onClick={() => setSubscriberType("email")}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                        subscriberType === "email"
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      <Mail className="w-4 h-4" />
                      <span>Email</span>
                    </button>
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Subscriber name"
                      value={subscriberName}
                      onChange={(e) => setSubscriberName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />

                    {subscriberType === "telegram" ? (
                      <input
                        type="text"
                        placeholder="Telegram Chat ID (e.g., 12345678)"
                        value={telegramId}
                        onChange={(e) => setTelegramId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <input
                        type="email"
                        placeholder="Email address"
                        value={emailAddress}
                        onChange={(e) => setEmailAddress(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    )}

                    <button
                      onClick={handleAddSubscriber}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Add Subscriber
                    </button>
                  </div>
                </div>

                {/* Subscriber List */}
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    Current Subscribers ({config?.subscribers.length || 0})
                  </h4>
                  {config?.subscribers && config.subscribers.length > 0 ? (
                    <div className="space-y-2">
                      {config.subscribers.map((subscriber, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            {subscriber.type === "telegram" ? (
                              <MessageCircle className="w-4 h-4 text-blue-500" />
                            ) : (
                              <Mail className="w-4 h-4 text-green-500" />
                            )}
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {subscriber.name}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {subscriber.type === "telegram"
                                  ? `ID: ${subscriber.id}`
                                  : subscriber.address}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveSubscriber(index)}
                            className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400 transition-colors"
                            title="Remove subscriber"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                      No subscribers yet. Add one above to receive alerts.
                    </p>
                  )}
                </div>
              </div>

              {/* Alert Thresholds Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Alert Thresholds
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Adjust the sensitivity of alerts. You'll be notified when metrics change by more than these percentages.
                </p>

                <div className="space-y-4">
                  {/* Bitcoin */}
                  <div>
                    <label className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Bitcoin Price
                      </span>
                      <span className="text-sm text-gray-500">
                        {(thresholds.btc_pct * 100).toFixed(1)}%
                      </span>
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="5.0"
                      step="0.1"
                      value={thresholds.btc_pct * 100}
                      onChange={(e) =>
                        setThresholds({ ...thresholds, btc_pct: parseFloat(e.target.value) / 100 })
                      }
                      className="w-full"
                    />
                  </div>

                  {/* Stablecoin */}
                  <div>
                    <label className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Stablecoin Market Cap
                      </span>
                      <span className="text-sm text-gray-500">
                        {(thresholds.stable_pct * 100).toFixed(1)}%
                      </span>
                    </label>
                    <input
                      type="range"
                      min="0.05"
                      max="2.0"
                      step="0.05"
                      value={thresholds.stable_pct * 100}
                      onChange={(e) =>
                        setThresholds({ ...thresholds, stable_pct: parseFloat(e.target.value) / 100 })
                      }
                      className="w-full"
                    />
                  </div>

                  {/* Yield */}
                  <div>
                    <label className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        US 10Y Yield
                      </span>
                      <span className="text-sm text-gray-500">
                        {(thresholds.yield_pct * 100).toFixed(1)}%
                      </span>
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="10.0"
                      step="0.5"
                      value={thresholds.yield_pct * 100}
                      onChange={(e) =>
                        setThresholds({ ...thresholds, yield_pct: parseFloat(e.target.value) / 100 })
                      }
                      className="w-full"
                    />
                  </div>

                  {/* Liquidity */}
                  <div>
                    <label className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Fed Net Liquidity
                      </span>
                      <span className="text-sm text-gray-500">
                        {(thresholds.liquidity_pct * 100).toFixed(1)}%
                      </span>
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="10.0"
                      step="0.5"
                      value={thresholds.liquidity_pct * 100}
                      onChange={(e) =>
                        setThresholds({ ...thresholds, liquidity_pct: parseFloat(e.target.value) / 100 })
                      }
                      className="w-full"
                    />
                  </div>

                  {/* USDT Dominance */}
                  <div>
                    <label className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        USDT Dominance
                      </span>
                      <span className="text-sm text-gray-500">
                        {(thresholds.usdt_dom_pct * 100).toFixed(1)}%
                      </span>
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="5.0"
                      step="0.1"
                      value={thresholds.usdt_dom_pct * 100}
                      onChange={(e) =>
                        setThresholds({ ...thresholds, usdt_dom_pct: parseFloat(e.target.value) / 100 })
                      }
                      className="w-full"
                    />
                  </div>

                  {/* RWA TVL */}
                  <div>
                    <label className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        RWA TVL
                      </span>
                      <span className="text-sm text-gray-500">
                        {(thresholds.rwa_pct * 100).toFixed(1)}%
                      </span>
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="10.0"
                      step="0.5"
                      value={thresholds.rwa_pct * 100}
                      onChange={(e) =>
                        setThresholds({ ...thresholds, rwa_pct: parseFloat(e.target.value) / 100 })
                      }
                      className="w-full"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSaveThresholds}
                  disabled={saving}
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  {saving ? "Saving..." : "Save Thresholds"}
                </button>
              </div>

              {/* Suggest Metric Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Suggest New Metric
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Have an idea for a new metric to track? Submit your suggestion and we'll review it.
                </p>

                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-3">
                    <Lightbulb className="w-5 h-5 text-yellow-500" />
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Submit Suggestion
                    </h4>
                  </div>

                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Metric name (e.g., Gold/BTC Ratio)"
                      value={metricName}
                      onChange={(e) => setMetricName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />

                    <textarea
                      placeholder="Description and rationale for this metric..."
                      value={metricDescription}
                      onChange={(e) => setMetricDescription(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />

                    <button
                      onClick={handleSuggestMetric}
                      disabled={submittingSuggestion}
                      className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      {submittingSuggestion ? "Submitting..." : "Submit Suggestion"}
                    </button>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Your suggestion will be submitted as a GitHub issue for review.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
