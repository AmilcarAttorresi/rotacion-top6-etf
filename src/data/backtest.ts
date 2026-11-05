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

export type LoadResult =
  | { ok: true; data: Backtest }
  | { ok: false; problems: string[] };

const BASKET_IDS = ["DIA", "QQQ", "SPY"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function num(value: unknown, path: string, problems: string[]): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    problems.push(`${path} tiene que ser un número.`);
    return null;
  }
  return value;
}

function text(value: unknown, path: string, problems: string[]): string | null {
  if (typeof value !== "string" || value.trim() === "") {
    problems.push(`${path} tiene que ser un texto.`);
    return null;
  }
  return value;
}

function isoDate(value: unknown, path: string, problems: string[]): string | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    problems.push(`${path} tiene que ser una fecha YYYY-MM-DD.`);
    return null;
  }
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== (month ?? 1) - 1 ||
    date.getUTCDate() !== day
  ) {
    problems.push(`${path} no es una fecha real.`);
    return null;
  }
  return value;
}

function metrics(value: unknown, path: string, problems: string[]): SeriesMetrics | null {
  if (!isRecord(value)) {
    problems.push(`${path} tiene que traer total, cagr y mdd.`);
    return null;
  }
  const total = num(value.total, `${path}.total`, problems);
  const cagr = num(value.cagr, `${path}.cagr`, problems);
  const mdd = num(value.mdd, `${path}.mdd`, problems);
  if (total === null || cagr === null || mdd === null) return null;
  return { total, cagr, mdd };
}

function holdings(value: unknown, path: string, problems: string[]): Holding[] {
  if (!Array.isArray(value)) {
    problems.push(`${path} tiene que ser una lista.`);
    return [];
  }
  if (value.length !== 6) {
    problems.push(`${path} tiene que tener 6 papeles y tiene ${value.length}.`);
  }
  const list: Holding[] = [];
  const seen = new Set<string>();
  value.forEach((item, index) => {
    const itemPath = `${path}[${index}]`;
    if (!isRecord(item)) {
      problems.push(`${itemPath} tiene que ser un objeto.`);
      return;
    }
    const ticker = text(item.ticker, `${itemPath}.ticker`, problems);
    const name = text(item.name, `${itemPath}.name`, problems);
    const weight = num(item.weight, `${itemPath}.weight`, problems);
    if (!ticker || !name || weight === null) return;
    if (!/^[A-Z][A-Z0-9.]{0,9}$/.test(ticker)) {
      problems.push(`${itemPath}.ticker no parece un símbolo: ${ticker}.`);
    }
    if (seen.has(ticker)) problems.push(`${path} repite ${ticker}.`);
    seen.add(ticker);
    if (weight < 0 || weight > 1) {
      problems.push(`${itemPath}.weight va de 0 a 1 (0,10 = 10%), no en porcentaje.`);
    }
    list.push({ ticker, name, weight });
  });
  return list;
}

function years(value: unknown, path: string, problems: string[]): YearPoint[] {
  if (!Array.isArray(value) || value.length === 0) {
    problems.push(`${path} tiene que traer al menos un año.`);
    return [];
  }
  const list: YearPoint[] = [];
  let previous = 0;
  value.forEach((item, index) => {
    const itemPath = `${path}[${index}]`;
    if (!isRecord(item)) {
      problems.push(`${itemPath} tiene que ser un objeto.`);
      return;
    }
    const year = num(item.year, `${itemPath}.year`, problems);
    const strategy = num(item.strategy, `${itemPath}.strategy`, problems);
    const ewReb = num(item.ewReb, `${itemPath}.ewReb`, problems);
    const etf = num(item.etf, `${itemPath}.etf`, problems);
    if (year === null || strategy === null || ewReb === null || etf === null) return;
    if (!Number.isInteger(year)) problems.push(`${itemPath}.year tiene que ser un entero.`);
    if (previous && year <= previous) {
      problems.push(`${path} tiene que ir en orden cronológico.`);
    }
    previous = year;
    const point: YearPoint = { year, strategy, ewReb, etf };
    if (item.note !== undefined) {
      const note = text(item.note, `${itemPath}.note`, problems);
      if (note) point.note = note;
    }
    list.push(point);
  });
  return list;
}

export function loadBacktest(input: unknown): LoadResult {
  const problems: string[] = [];
  if (!isRecord(input)) {
    return { ok: false, problems: ["La semilla tiene que ser un objeto JSON."] };
  }

  const windowValue = isRecord(input.window) ? input.window : null;
  if (!windowValue) problems.push("Falta window.");
  const start = windowValue ? isoDate(windowValue.start, "window.start", problems) : null;
  const end = windowValue ? isoDate(windowValue.end, "window.end", problems) : null;
  const span = windowValue ? num(windowValue.years, "window.years", problems) : null;
  if (span !== null && span <= 0) problems.push("window.years tiene que ser positivo.");

  const rules = typeof input.rules === "string" ? input.rules : "";
  if (typeof input.rules !== "string") problems.push("rules tiene que ser texto.");

  const basketMap = isRecord(input.baskets) ? input.baskets : null;
  if (!basketMap) problems.push("Falta baskets.");

  const baskets: Basket[] = [];
  BASKET_IDS.forEach((id, index) => {
    const value = basketMap?.[id];
    if (!isRecord(value)) {
      problems.push(`Falta la canasta ${id}.`);
      return;
    }
    const label = text(value.label, `${id}.label`, problems);
    const holdingsAsOf = isoDate(value.holdingsAsOf, `${id}.holdingsAsOf`, problems);
    const source = text(value.source, `${id}.source`, problems);
    const holdingList = holdings(value.holdings, `${id}.holdings`, problems);
    const startTicker = text(value.start, `${id}.start`, problems);
    const current = text(value.current, `${id}.current`, problems);
    const strategy = metrics(value.strategy, `${id}.strategy`, problems);
    const ewReb = metrics(value.ewReb, `${id}.ewReb`, problems);
    const ewBh = metrics(value.ewBh, `${id}.ewBh`, problems);
    const etf = metrics(value.etf, `${id}.etf`, problems);
    const bestRaw = isRecord(value.bestBh) ? value.bestBh : null;
    if (!bestRaw) problems.push(`${id}.bestBh tiene que ser un objeto.`);
    const bestTicker = bestRaw ? text(bestRaw.ticker, `${id}.bestBh.ticker`, problems) : null;
    const bestTotal = bestRaw ? num(bestRaw.total, `${id}.bestBh.total`, problems) : null;
    const yearByYear = years(value.yearByYear, `${id}.yearByYear`, problems);

    if (holdingList.length > 0 && startTicker) {
      const maxWeight = Math.max(...holdingList.map((holding) => holding.weight));
      const leaders = holdingList.filter((holding) => holding.weight === maxWeight).map((holding) => holding.ticker);
      if (!leaders.includes(startTicker)) {
        problems.push(`${id}.start (${startTicker}) no es la tenencia más pesada (${leaders.join(", ")}).`);
      }
    }
    if (current && holdingList.length > 0 && !holdingList.some((holding) => holding.ticker === current)) {
      problems.push(`${id}.current (${current}) no está entre las tenencias.`);
    }
    if (bestTicker && holdingList.length > 0 && !holdingList.some((holding) => holding.ticker === bestTicker)) {
      problems.push(`${id}.bestBh.ticker (${bestTicker}) no está entre las tenencias.`);
    }

    if (
      !label ||
      !holdingsAsOf ||
      !source ||
      !startTicker ||
      !current ||
      !strategy ||
      !ewReb ||
      !ewBh ||
      !etf ||
      !bestTicker ||
      bestTotal === null
    ) {
      return;
    }

    baskets.push({
      id,
      index,
      label,
      holdingsAsOf,
      source,
      holdings: holdingList,
      start: startTicker,
      current,
      strategy,
      ewReb,
      ewBh,
      etf,
      bestBh: { ticker: bestTicker, total: bestTotal },
      yearByYear,
    });
  });

  if (!start || !end || span === null || problems.length > 0 || baskets.length !== BASKET_IDS.length) {
    return { ok: false, problems: problems.length > 0 ? problems : ["No se pudo leer la semilla."] };
  }

  return { ok: true, data: { window: { start, end, years: span }, rules, baskets } };
}

export const loaded = loadBacktest(raw);

export function getBacktest(): Backtest {
  if (!loaded.ok) throw new Error(loaded.problems.join("\n"));
  return loaded.data;
}

export function findBasket(data: Backtest, id: string): Basket | undefined {
  const key = id.toUpperCase();
  return data.baskets.find((basket) => basket.id.toUpperCase() === key);
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
