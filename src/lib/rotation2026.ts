import type { Basket } from "../data/backtest.ts";
import part0 from "../data/prices/part-0.json";
import part1 from "../data/prices/part-1.json";
import part2 from "../data/prices/part-2.json";
import part3 from "../data/prices/part-3.json";

export interface QuarterScore {
  ticker: string;
  totalReturn: number;
}

export interface RebalanceEvent {
  date: string;
  decidedBy: string;
  from: string;
  to: string;
  scores: QuarterScore[];
}

export interface HoldingSegment {
  ticker: string;
  from: string;
  to: string;
  sessions: number;
}

export interface RotationPoint {
  date: string;
  strategy: number;
  etf: number;
  holdings: Record<string, number>;
}

export interface OpenQuarter {
  id: string;
  from: string;
  to: string;
  scores: QuarterScore[];
}

export interface BasketRotation {
  baseDate: string;
  lastDate: string;
  largest: string;
  heldNow: string;
  strategyReturn: number;
  rebalances: RebalanceEvent[];
  segments: HoldingSegment[];
  partial: OpenQuarter | null;
  points: RotationPoint[];
  source: string;
}

interface PriceFile {
  source: string;
  symbols: Record<string, { date: string; adj: number }[]>;
}

const prices: PriceFile = {
  source: part0.source,
  symbols: {
    ...part0.symbols,
    ...part1.symbols,
    ...part2.symbols,
    ...part3.symbols,
  },
};

interface QuarterMark {
  id: string;
  limit: string;
  date: string;
}

function quarterMarks(lastDate: string, calendar: readonly string[]): QuarterMark[] {
  const marks: QuarterMark[] = [];
  const startYear = 2025;
  const endYear = Number(lastDate.slice(0, 4));
  for (let year = startYear; year <= endYear; year += 1) {
    const ends: [string, string][] = [
      ["Q1", `${year}-03-31`],
      ["Q2", `${year}-06-30`],
      ["Q3", `${year}-09-30`],
      ["Q4", `${year}-12-31`],
    ];
    for (const [quarter, limit] of ends) {
      if (limit < "2025-06-30") continue;
      if (limit > lastDate) continue;
      const date = lastOnOrBefore(calendar, limit);
      if (!date) continue;
      marks.push({ id: `${year}${quarter}`, limit, date });
    }
  }
  return marks;
}

function lastOnOrBefore(dates: readonly string[], limit: string): string | null {
  let found: string | null = null;
  for (const date of dates) {
    if (date <= limit) found = date;
  }
  return found;
}

function nextTradingDay(dates: readonly string[], date: string): string {
  for (const item of dates) {
    if (item > date) return item;
  }
  return date;
}

function rankQuarter(
  tickers: readonly string[],
  from: string,
  to: string,
  priceOn: (ticker: string, date: string) => number,
): QuarterScore[] {
  return tickers
    .map((ticker) => ({
      ticker,
      totalReturn: priceOn(ticker, to) / priceOn(ticker, from) - 1,
    }))
    .sort((a, b) => a.totalReturn - b.totalReturn || a.ticker.localeCompare(b.ticker));
}

export function buildRotation(basket: Basket): BasketRotation {
  const tickers = basket.holdings.map((holding) => holding.ticker);
  const needed = [...tickers, basket.id];
  const books = new Map<string, Map<string, number>>();
  for (const ticker of needed) {
    const rows = prices.symbols[ticker];
    if (!rows || rows.length === 0) {
      throw new Error(`No hay precios de ${ticker} en src/data/prices/.`);
    }
    books.set(ticker, new Map(rows.map((row) => [row.date, row.adj])));
  }

  const calendar = [...(books.get(basket.id)?.keys() ?? [])].filter((date) =>
    needed.every((ticker) => books.get(ticker)?.has(date)),
  );
  if (calendar.length < 2) {
    throw new Error(`Las series de ${basket.id} no comparten fechas.`);
  }

  const lastDate = calendar[calendar.length - 1] ?? "";
  const marks = quarterMarks(lastDate, calendar);
  const base = marks.find((mark) => mark.id === "2025Q4");
  const anchor = marks.find((mark) => mark.id === "2025Q2");
  if (!base || !anchor) {
    throw new Error("Faltan cierres de trimestre de 2025 para armar el arranque de 2026.");
  }

  const priceOn = (ticker: string, date: string): number => {
    const value = books.get(ticker)?.get(date);
    if (value === undefined || !Number.isFinite(value) || value <= 0) {
      throw new Error(`Precio inv\u00e1lido de ${ticker} el ${date}.`);
    }
    return value;
  };

  const completed = marks.filter((mark) => mark.date > anchor.date);
  const rebalances: RebalanceEvent[] = [];
  let heldDuring = rankQuarter(tickers, anchor.date, completed[0]?.date ?? anchor.date, priceOn)[0]?.ticker ?? tickers[0] ?? "";

  for (let index = 0; index < completed.length; index += 1) {
    const mark = completed[index];
    const previous = index === 0 ? anchor.date : completed[index - 1]?.date ?? anchor.date;
    if (!mark || mark.date < base.date) {
      const scores = rankQuarter(tickers, previous, mark?.date ?? previous, priceOn);
      heldDuring = scores[0]?.ticker ?? heldDuring;
      continue;
    }
    const scores = rankQuarter(tickers, previous, mark.date, priceOn);
    const next = scores[0]?.ticker ?? heldDuring;
    rebalances.push({
      date: mark.date,
      decidedBy: mark.id,
      from: heldDuring,
      to: next,
      scores,
    });
    heldDuring = next;
  }

  const entry = rebalances[0];
  if (!entry) throw new Error(`No hay rotaci\u00f3n de arranque para ${basket.id}.`);

  const chartDates = calendar.filter((date) => date >= base.date);
  const points: RotationPoint[] = [];
  let level = 100;
  let holding = entry.to;
  let previousDate = base.date;
  const switchOn = new Map(rebalances.slice(1).map((event) => [event.date, event.to]));

  for (const date of chartDates) {
    if (date !== base.date) {
      level *= priceOn(holding, date) / priceOn(holding, previousDate);
      previousDate = date;
    }
    const holdings: Record<string, number> = {};
    for (const ticker of tickers) {
      holdings[ticker] = (100 * priceOn(ticker, date)) / priceOn(ticker, base.date);
    }
    points.push({
      date,
      strategy: level,
      etf: (100 * priceOn(basket.id, date)) / priceOn(basket.id, base.date),
      holdings,
    });
    const switched = switchOn.get(date);
    if (switched) holding = switched;
  }

  const segments: HoldingSegment[] = [];
  let segmentTicker = entry.to;
  let segmentFrom = entry.date;
  for (const event of rebalances.slice(1)) {
    if (event.to === segmentTicker) continue;
    const through = points.filter((point) => point.date >= segmentFrom && point.date <= event.date);
    segments.push({
      ticker: segmentTicker,
      from: segmentFrom,
      to: event.date,
      sessions: through.length,
    });
    segmentTicker = event.to;
    segmentFrom = nextTradingDay(chartDates, event.date);
  }
  const tail = points.filter((point) => point.date >= segmentFrom);
  segments.push({
    ticker: segmentTicker,
    from: segmentFrom,
    to: lastDate,
    sessions: tail.length,
  });

  const lastMark = marks[marks.length - 1];
  let partial: OpenQuarter | null = null;
  if (lastMark && lastDate > lastMark.date) {
    const partialId = openQuarterId(lastDate);
    const scores = rankQuarter(tickers, lastMark.date, lastDate, priceOn);
    partial = {
      id: partialId,
      from: lastMark.date,
      to: lastDate,
      scores,
    };
  }

  const largest = basket.holdings.reduce((best, holdingRow) =>
    holdingRow.weight > best.weight ? holdingRow : best,
  ).ticker;
  const lastPoint = points[points.length - 1];

  return {
    baseDate: base.date,
    lastDate,
    largest,
    heldNow: segmentTicker,
    strategyReturn: (lastPoint?.strategy ?? 100) / 100 - 1,
    rebalances,
    segments,
    partial,
    points,
    source: prices.source,
  };
}

function openQuarterId(date: string): string {
  const year = date.slice(0, 4);
  const month = Number(date.slice(5, 7));
  const quarter = month <= 3 ? 1 : month <= 6 ? 2 : month <= 9 ? 3 : 4;
  return `${year}Q${quarter}`;
}

export function quarterLabel(id: string): string {
  const match = /^(\d{4})Q([1-4])$/.exec(id);
  if (!match) return id;
  return `${match[2]}T ${match[1]}`;
}
