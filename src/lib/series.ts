export interface SeriesInfo {
  key: "strategy" | "ewReb" | "etf" | "ewBh" | "bestBh";
  name: string;
  short: string;
  hint: string;
  color: string;
}

export const palette = {
  strategy: "#e4b15a",
  bench: "#9eb6f0",
  fund: "#d2c4f8",
  hold: "#8fd0c6",
  best: "#f0b4bc",
  ink: "#f4f1ea",
  muted: "#b7b1a6",
  grid: "rgba(244,241,234,0.08)",
  zero: "rgba(244,241,234,0.45)",
  marker: "rgba(228,177,90,0.85)",
} as const;

export const HOLDING_COLORS = [
  "#7eb6ff",
  "#ff9ec4",
  "#8fd0c6",
  "#c9b6ff",
  "#ffb08a",
  "#b7e39a",
] as const;

export function seriesCatalog(count: number): SeriesInfo[] {
  const n = String(count);
  return [
    {
      key: "strategy",
      name: "Rotación",
      short: "Rotación",
      hint: "Se arranca en la tenencia más grande y cada trimestre se rota el 100% al papel que más cayó entre los de la canasta.",
      color: palette.strategy,
    },
    {
      key: "ewReb",
      name: `${n} en partes iguales, rebalanceado`,
      short: `${n} EW reb.`,
      hint: `Los mismos ${n}, con el mismo peso, rebalanceados al cierre de cada trimestre. Es el benchmark que cierra con la semilla.`,
      color: palette.bench,
    },
    {
      key: "etf",
      name: "ETF",
      short: "ETF",
      hint: "El fondo completo, comprado al inicio y sin tocar.",
      color: palette.fund,
    },
    {
      key: "ewBh",
      name: `${n} en partes iguales, buy & hold`,
      short: `${n} EW B&H`,
      hint: `Los mismos ${n}, con el mismo peso, sin rebalancear.`,
      color: palette.hold,
    },
    {
      key: "bestBh",
      name: "Mejor buy & hold",
      short: "Mejor B&H",
      hint: "El papel del grupo con mayor retorno comprándolo y no tocándolo. La semilla solo trae el total.",
      color: palette.best,
    },
  ];
}

export function seriesByKey(count: number, key: SeriesInfo["key"]): SeriesInfo {
  const found = seriesCatalog(count).find((series) => series.key === key);
  if (!found) throw new Error(key);
  return found;
}

export function holdingColor(index: number): string {
  return HOLDING_COLORS[index % HOLDING_COLORS.length] ?? HOLDING_COLORS[0];
}

export function basketAccent(index: number): string {
  const accents = [palette.strategy, palette.bench, palette.hold];
  return accents[index % accents.length] ?? palette.strategy;
}
