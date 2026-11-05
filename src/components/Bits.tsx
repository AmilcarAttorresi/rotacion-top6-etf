import { Component, type ReactNode } from "react";
import { CircleExclamationPoint } from "lucide-react";
import type { Backtest, Basket } from "../data/backtest.ts";
import { RULES } from "../content/rules.ts";
import { formatGrewTo, formatPlainPct, formatReturn, toneClass } from "../lib/format.ts";
import { cutoffSentence } from "../lib/readout.ts";
import { seriesByKey, seriesCatalog, type SeriesInfo } from "../lib/series.ts";
import { cn } from "../lib/cn.ts";

export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error): { error: Error } {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className="mx-auto max-w-xl px-4 py-16">
        <p className="font-serif text-3xl">Esta pantalla no se pudo armar.</p>
        <p className="mt-3 text-muted">Recarga la pagina.</p>
        <button type="button" className="mt-5 rounded-full bg-strategy px-4 py-2 text-sm font-semibold text-canvas" onClick={() => window.location.reload()}>Recargar</button>
        <pre className="mt-4 overflow-x-auto text-xs text-faint">{this.state.error.message}</pre>
      </div>
    );
  }
}

export function DataError({ problems }: { problems: string[] }) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="font-serif text-4xl">El JSON no se puede leer.</h1>
      <ul className="mt-6 space-y-2 text-sm">{problems.map((problem) => <li key={problem}>{problem}</li>)}</ul>
    </main>
  );
}

export function Logo() {
  return (
    <span className="flex items-center gap-3">
      <span className="grid size-9 place-items-center rounded-xl bg-strategy text-canvas" aria-hidden>
        <svg viewBox="0 0 16 16" className="size-4"><path d="M3 5h10L8 12z" fill="currentColor" /></svg>
      </span>
      <span>
        <span className="block font-serif text-xl leading-none">Perdedor</span>
        <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.16em] text-faint">Rotacion trimestral</span>
      </span>
    </span>
  );
}

export function Section({ id, eyebrow, title, description, children }: { id?: string; eyebrow: string; title: string; description?: string; children: ReactNode }) {
  return (
    <section id={id} className="mt-14">
      <div className="max-w-2xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-faint">{eyebrow}</p>
        <h2 className="mt-2 font-serif text-3xl sm:text-4xl">{title}</h2>
        {description ? <p className="mt-2 text-muted">{description}</p> : null}
      </div>
      <div className="mt-5 min-w-0">{children}</div>
    </section>
  );
}

export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-2xl border border-line bg-panel", className)}>{children}</div>;
}

export function SignedReturn({ value }: { value: number }) {
  return <span className={cn("font-mono tabular-nums", toneClass(value))}>{formatReturn(value)}</span>;
}

export function SignedPp({ value }: { value: number }) {
  return <span className={cn("font-mono tabular-nums", toneClass(value))}>{formatReturn(value).replace("%", " pp")}</span>;
}

export function BiasWarning({ data }: { data: Backtest }) {
  return (
    <aside className="rounded-2xl border border-strategy/40 bg-strategy/10 px-4 py-4 sm:px-5">
      <p className="font-medium">Sesgo de supervivencia</p>
      <p className="mt-1 text-sm text-muted">El top 6 es el de ahora, aplicado para atras. No es lo que se podia operar en tiempo real.</p>
      <p className="mt-2 text-sm">{cutoffSentence(data.baskets)}</p>
    </aside>
  );
}

export function RulesPanel({ seedRules, count }: { seedRules: string; count: number }) {
  const catalog = seriesCatalog(count);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel className="p-5">
        <ol className="space-y-4">
          {RULES.map((rule, index) => (
            <li key={rule.title}><span className="font-medium">{index + 1}. {rule.title}</span><span className="mt-1 block text-sm text-muted">{rule.body}</span></li>
          ))}
        </ol>
      </Panel>
      <Panel className="p-5">
        <ul className="space-y-3">
          {catalog.map((series) => (
            <li key={series.key} className="text-sm"><span className="font-medium">{series.short}</span><span className="mt-1 block text-muted">{series.hint}</span></li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-faint">{seedRules}</p>
      </Panel>
    </div>
  );
}

export function Readout({ lines }: { lines: string[] }) {
  if (lines.length === 0) return <p className="text-sm text-muted">No hay canastas para leer.</p>;
  return <ul className="space-y-3">{lines.map((line) => <li key={line} className="text-sm">{line}</li>)}</ul>;
}

export function MetricCards({ basket }: { basket: Basket }) {
  const count = basket.holdings.length;
  const cards = [
    { key: "strategy", total: basket.strategy.total, cagr: basket.strategy.cagr as number | null, mdd: basket.strategy.mdd as number | null },
    { key: "ewReb", total: basket.ewReb.total, cagr: basket.ewReb.cagr as number | null, mdd: basket.ewReb.mdd as number | null },
    { key: "etf", total: basket.etf.total, cagr: basket.etf.cagr as number | null, mdd: basket.etf.mdd as number | null },
    { key: "bestBh", total: basket.bestBh.total, cagr: null, mdd: null },
  ] as const;
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const series = seriesByKey(count, card.key);
        return (
          <Panel key={card.key} className="p-4">
            <h3 className="text-sm">{series.short}{card.key === "bestBh" ? ` ${basket.bestBh.ticker}` : ""}</h3>
            <p className="mt-4 font-mono text-3xl"><SignedReturn value={card.total} /></p>
            <p className="text-xs text-faint">US$ 1 pasan a {formatGrewTo(card.total)}</p>
            <p className="mt-3 text-sm">CAGR {card.cagr === null ? "-" : formatPlainPct(card.cagr)}</p>
            <p className="text-sm">Caida {card.mdd === null ? "-" : formatReturn(card.mdd)}</p>
          </Panel>
        );
      })}
    </div>
  );
}

export function MiniPath({ years }: { years: Basket["yearByYear"] }) {
  const values = years.map((row) => row.strategy);
  const max = Math.max(...values.map((value) => Math.abs(value)), 0.05);
  return (
    <svg viewBox="0 0 140 48" className="h-12 w-full" role="img" aria-label="Retorno anual de la rotacion">
      {values.map((value, index) => {
        const bar = (Math.abs(value) / max) * 22;
        const x = index * (140 / values.length) + 4;
        const y = value >= 0 ? 24 - bar : 24;
        return <rect key={years[index]?.year ?? index} x={x} y={y} width={8} height={Math.max(bar, 1)} fill={value >= 0 ? "var(--color-strategy)" : "var(--color-down)"} />;
      })}
    </svg>
  );
}
