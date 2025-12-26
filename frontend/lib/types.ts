export interface MetricData {
  value: number;
  delta: number;
  deltaPercent?: number;
}

export interface PolymarketEvent {
  title: string;
  outcome: string;
  probability: number;
  volume: number;
  volume_24h?: number;
  flipped?: boolean; // True if outcome flipped in last 24h
  url: string;
}

export interface CalendarEvent {
  id: string;
  name: string;
  date: string;
  time: string;
  forecast: string;
  actual?: string;
  impact: "High" | "Medium" | "Low";
  status: "completed" | "upcoming";
}

export interface ETFFlowData {
  date: string;
  flow: number; // in millions USD
}

export interface DashboardData {
  metrics: {
    us_10y_yield: MetricData;
    fed_net_liquidity: MetricData;
    btc_price: MetricData;
    stablecoin_mcap: MetricData;
    usdt_dominance: MetricData;
    rwa_tvl: MetricData;
  };
  btc_funding_rate?: {
    value: number;
    source: string;
  };
  btc_etf_flows?: {
    flows: ETFFlowData[];
    net_5day: number; // in billions USD
  };
  correlation_radar?: {
    btc_nasdaq: number;
    btc_gold: number;
    interpretation: string;
    period_days: number;
  };
  polymarket_top5: PolymarketEvent[];
  last_updated: string;
}

export interface CalendarData {
  events: CalendarEvent[];
  notification_states: Record<string, {
    sent_12h: boolean;
    sent_release: boolean;
  }>;
}

export interface UserConfig {
  thresholds: {
    btc_pct: number;
    stable_pct: number;
    yield_pct: number;
    liquidity_pct: number;
    usdt_dom_pct: number;
    rwa_pct: number;
  };
  subscribers: Array<{
    type: "telegram" | "email";
    id?: string;
    address?: string;
    name: string;
  }>;
}
