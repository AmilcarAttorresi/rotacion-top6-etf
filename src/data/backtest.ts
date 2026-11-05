import raw from "./backtest.json";

export interface Holding {
  ticker: string;
  name: string;
  weight: number;
}

export interface SeriesMetrics {
  total: number;
  cagr: number;
  mdd: number;
}

export interface YearPoint {
  year: number;
  strategy: number;
  ewReb: number;
  etf: number;
  note?: string;
}

export interface Basket {
  id: string;
  index: number;
  label: string;
  holdingsAsOf: string;
  source: string;
  holdings: Holding[];
  start: string;
  current: string;
  strategy: SeriesMetrics;
  ewReb: SeriesMetrics;
  ewBh: SeriesMetrics;
  etf: SeriesMetrics;
  bestBh: { ticker: string; total: number };
  yearByYear: YearPoint[];
}

export interface WindowRange {
  start: string;
  end: string;
  years: number;
}

export interface Backtest {
  window: WindowRange;
  rules: string;
  baskets: Basket[];
}

const ids = ["DIA", "QQQ", "SPY"] as const;

const data: Backtest = {
  window: raw.window,
  rules: raw.rules,
  baskets: ids.map((id, index) => ({
    id,
    index,
    ...raw.baskets[id],
  })),
};

export const loaded = { ok: true as const, data };

export function getBacktest(): Backtest {
  return data;
}

export function findBasket(source: Backtest, id: string): Basket | undefined {
  const key = id.toUpperCase();
  return source.baskets.find((basket) => basket.id.toUpperCase() === key);
}

export function holdingOf(basket: Basket, ticker: string): Holding | undefined {
  return basket.holdings.find((holding) => holding.ticker === ticker);
}

export function weightSum(basket: Basket): number {
  return basket.holdings.reduce((sum, holding) => sum + holding.weight, 0);
}

export function basketPath(id: string): string {
  return `/canasta/${id.toLowerCase()}`;
}
