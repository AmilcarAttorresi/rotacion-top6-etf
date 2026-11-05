import type { Basket } from "../data/backtest.ts";
import { formatDate, formatPlainPct, formatPpAbs, formatReturn, joinList } from "./format.ts";

function side(delta: number): "ahead" | "behind" | "tie" {
  if (Math.round(Math.abs(delta) * 1000) / 10 === 0) return "tie";
  return delta > 0 ? "ahead" : "behind";
}

export function gapSentence(basket: Basket, withId = true): string {
  const vsEtf = basket.strategy.total - basket.etf.total;
  const vsEw = basket.strategy.total - basket.ewReb.total;
  const lead = withId ? `En ${basket.id}, la rotacion` : "La rotacion";
  const etf = side(vsEtf);
  const ew = side(vsEw);
  if (etf === "ahead" && ew === "ahead") return `${lead} le saca ${formatPpAbs(vsEtf)} al ETF y ${formatPpAbs(vsEw)} al 6 EW rebalanceado.`;
  if (etf === "ahead" && ew === "behind") return `${lead} le saca ${formatPpAbs(vsEtf)} al ETF y queda ${formatPpAbs(vsEw)} atras del 6 EW rebalanceado.`;
  if (etf === "behind" && ew === "behind") return `${lead} queda ${formatPpAbs(vsEtf)} atras del ETF y ${formatPpAbs(vsEw)} atras del 6 EW rebalanceado.`;
  return `${lead} se compara con el ETF (${formatReturn(basket.etf.total)}) y el 6 EW (${formatReturn(basket.ewReb.total)}).`;
}

export function basketReadout(basket: Basket): string[] {
  return [
    gapSentence(basket, false),
    `Caida maxima de la rotacion: ${formatReturn(basket.strategy.mdd)}. ETF: ${formatReturn(basket.etf.mdd)}.`,
    `Mejor buy and hold: ${basket.bestBh.ticker} ${formatReturn(basket.bestBh.total)}.`,
  ];
}

export function globalReadout(baskets: readonly Basket[]): string[] {
  if (baskets.length === 0) return [];
  const leader = baskets.reduce((best, basket) => (basket.strategy.cagr > best.strategy.cagr ? basket : best));
  return [`La CAGR mas alta de la rotacion esta en ${leader.id}: ${formatPlainPct(leader.strategy.cagr)}.`];
}

export function cutoffSentence(baskets: readonly Basket[]): string {
  const groups = new Map<string, string[]>();
  for (const basket of baskets) {
    const ids = groups.get(basket.holdingsAsOf) ?? [];
    ids.push(basket.id);
    groups.set(basket.holdingsAsOf, ids);
  }
  return `Corte de tenencias: ${[...groups.entries()].map(([date, ids]) => `${joinList(ids)} al ${formatDate(date)}`).join("; ")}.`;
}

export function bestBhFootnote(baskets: readonly Basket[]): string {
  return `Mejor buy and hold: ${baskets.map((basket) => `${basket.bestBh.ticker} en ${basket.id} (${formatReturn(basket.bestBh.total)})`).join(", ")}.`;
}
