import type { Basket } from "../data/backtest.ts";
import { formatDate, formatPlainPct, formatPpAbs, formatReturn, joinList } from "./format.ts";

function side(delta: number): "ahead" | "behind" | "tie" {
  if (Math.round(Math.abs(delta) * 1000) / 10 === 0) return "tie";
  return delta > 0 ? "ahead" : "behind";
}

function clause(delta: number, noun: string): string {
  const pp = formatPpAbs(delta);
  const outcome = side(delta);
  if (outcome === "ahead") return `le saca ${pp} al ${noun}`;
  if (outcome === "behind") return `queda ${pp} atrás del ${noun}`;
  return `empata con el ${noun}`;
}

export function gapSentence(basket: Basket, withId = true): string {
  const vsEtf = basket.strategy.total - basket.etf.total;
  const vsEw = basket.strategy.total - basket.ewReb.total;
  const lead = withId ? `En ${basket.id}, la rotación` : "La rotación";
  const etfSide = side(vsEtf);
  const ewSide = side(vsEw);
  if (etfSide === "ahead" && ewSide === "ahead") {
    return `${lead} le saca ${formatPpAbs(vsEtf)} al ETF y ${formatPpAbs(vsEw)} al 6 EW rebalanceado, en retorno total.`;
  }
  if (etfSide === "behind" && ewSide === "behind") {
    return `${lead} queda ${formatPpAbs(vsEtf)} atrás del ETF y ${formatPpAbs(vsEw)} atrás del 6 EW rebalanceado, en retorno total.`;
  }
  if (etfSide === "tie" && ewSide === "tie") {
    return `${lead} empata al ETF y al 6 EW rebalanceado en retorno total.`;
  }
  return `${lead} ${clause(vsEtf, "ETF")} y ${clause(vsEw, "6 EW rebalanceado")}, en retorno total.`;
}

function mddSentence(basket: Basket): string {
  const rotation = formatReturn(basket.strategy.mdd);
  const etf = formatReturn(basket.etf.mdd);
  const equalWeight = formatReturn(basket.ewReb.mdd);
  if (basket.strategy.mdd < basket.etf.mdd && basket.strategy.mdd < basket.ewReb.mdd) {
    return `La caída máxima de la rotación (${rotation}) es más profunda que la del ETF (${etf}) y que la del 6 EW rebalanceado (${equalWeight}).`;
  }
  if (basket.strategy.mdd < basket.etf.mdd) {
    return `La caída máxima de la rotación (${rotation}) es más profunda que la del ETF (${etf}). La del 6 EW rebalanceado es ${equalWeight}.`;
  }
  if (basket.strategy.mdd > basket.etf.mdd) {
    return `La caída máxima de la rotación (${rotation}) es menos profunda que la del ETF (${etf}).`;
  }
  return `La caída máxima de la rotación (${rotation}) empata con la del ETF.`;
}

function bestSentence(basket: Basket): string {
  const name = basket.holdings.find((holding) => holding.ticker === basket.bestBh.ticker)?.name;
  const who = name ? `${basket.bestBh.ticker} (${name})` : basket.bestBh.ticker;
  const total = formatReturn(basket.bestBh.total);
  if (side(basket.bestBh.total - basket.strategy.total) === "ahead") {
    return `El mejor buy & hold del top es ${who}, con ${total}. Le saca ${formatPpAbs(basket.bestBh.total - basket.strategy.total)} a la rotación, pero ese nombre se elige con el diario del lunes.`;
  }
  if (side(basket.bestBh.total - basket.strategy.total) === "behind") {
    return `El mejor buy & hold del top es ${who}, con ${total}, por debajo de la rotación.`;
  }
  return `El mejor buy & hold del top es ${who}, con ${total}, igual que la rotación.`;
}

export function basketReadout(basket: Basket): string[] {
  return [
    gapSentence(basket, false),
    mddSentence(basket),
    bestSentence(basket),
    "La semilla no trae el papel de cada trimestre histórico: para 2020–2025 solo están el arranque y lo que hoy sostiene. El camino de 2026 se reconstruye abajo con los precios.",
  ];
}

export function globalReadout(baskets: readonly Basket[]): string[] {
  if (baskets.length === 0) return [];
  const lines: string[] = [];
  const leader = baskets.reduce((best, basket) =>
    basket.strategy.cagr > best.strategy.cagr ? basket : best,
  );
  lines.push(`La CAGR más alta de la rotación está en ${leader.id}: ${formatPlainPct(leader.strategy.cagr)}.`);

  const scope = baskets.length === 3 ? "En las tres canastas" : "En todas las canastas";
  const deeper = baskets.filter((basket) => basket.strategy.mdd < basket.etf.mdd);
  if (deeper.length === baskets.length) {
    lines.push(`${scope}, la caída máxima de la rotación es más profunda que la del ETF.`);
  } else if (deeper.length === 0) {
    lines.push("En ninguna canasta la caída máxima de la rotación es más profunda que la del ETF.");
  } else {
    lines.push(`La rotación cae más que el ETF en ${joinList(deeper.map((basket) => basket.id))}.`);
  }

  const hindsight = baskets.filter(
    (basket) => side(basket.bestBh.total - basket.strategy.total) === "ahead",
  );
  if (hindsight.length === baskets.length) {
    lines.push(
      `${scope}, el mejor buy & hold de un solo papel le gana a la rotación. Ese nombre se elige al final: no es una regla que se pudiera seguir.`,
    );
  }
  return lines;
}

export function cutoffSentence(baskets: readonly Basket[]): string {
  const groups = new Map<string, string[]>();
  for (const basket of baskets) {
    const ids = groups.get(basket.holdingsAsOf) ?? [];
    ids.push(basket.id);
    groups.set(basket.holdingsAsOf, ids);
  }
  const parts = [...groups.entries()].map(
    ([date, ids]) => `${joinList(ids)} al ${formatDate(date)}`,
  );
  if (parts.length === 0) return "";
  return `Corte de tenencias: ${parts.join("; ")}.`;
}

export function bestBhFootnote(baskets: readonly Basket[]): string {
  const parts = baskets.map(
    (basket) => `${basket.bestBh.ticker} en ${basket.id} (${formatReturn(basket.bestBh.total)})`,
  );
  return `Mejor buy & hold, fuera de este gráfico para no aplastar la escala: ${joinList(parts)}.`;
}
