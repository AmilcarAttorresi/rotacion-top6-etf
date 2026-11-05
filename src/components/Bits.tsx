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
        <p className="mt-3 text-muted">Recargá la página. Si acabás de tocar la semilla, el detalle técnico dice qué falló.</p>
        <button
          type="button"
          className="mt-5 rounded-full bg-strategy px-4 py-2 text-sm font-semibold text-canvas"
          onClick={() => window.location.reload()}
        >
          Recargar
        </button>
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-muted">Detalle técnico</summary>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs text-faint">{this.state.error.message}</pre>
        </details>
      </div>
    );
  }
}

export function DataError({ problems }: { problems: string[] }) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-faint">Semilla</p>
      <h1 className="mt-2 font-serif text-4xl">El JSON no se puede leer.</h1>
      <p className="mt-3 text-muted">
        Revisá <code className="text-ink">src/data/backtest.json</code>. La interfaz no inventa números si la forma no cierra.
      </p>
      <ul className="mt-6 space-y-2 text-sm">
        {problems.map((problem) => (
          <li key={problem} className="rounded-xl border border-down/40 bg-panel px-3 py-2 text-down">
            {problem}
          </li>
        ))}
      </ul>
    </main>
  );
}

export function Logo() {
  return (
    <span className="flex items-center gap-3">
      <span className="grid size-9 place-items-center rounded-xl bg-strategy text-canvas" aria-hidden>
        <svg viewBox="0 0 16 16" className="size-4">
          <path d="M3 5h10L8 12z" fill="currentColor" />
        </svg>
      </span>
      <span>
        <span className="block font-serif text-xl leading-none">Perdedor</span>
        <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.16em] text-faint">Rotación trimestral</span>
      </span>
    </span>
  );
}

export function Section({
  id,
  eyebrow,
  title,
  description,
  children,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="mt-14">
      <div className="max-w-2xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-faint">{eyebrow}</p>
        <h2 className="mt-2 font-serif text-3xl text-balance sm:text-4xl">{title}</h2>
        {description ? <p className="mt-2 text-muted text-pretty">{description}</p> : null}
      </div>
      <div className="mt-5 min-w-0">{children}</div>
    </section>
  );
}

export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-line bg-panel shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]", className)}>
      {children}
    </div>
  );
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
      <div className="flex gap-3">
        <CircleExclamationPoint className="mt-0.5 size-5 shrink-0 text-strategy" aria-hidden />
        <div>
          <p className="font-medium">Sesgo de supervivencia</p>
          <p className="mt-1 text-sm leading-6 text-muted">
            El top 6 es el de ahora, aplicado para atrás a toda la ventana. No es el top 6 que había en cada fecha.
            El que se fue del índice, adelgazó o dejó de existir no entra. Estos números no son lo que se podía operar en tiempo real.
          </p>
          <p className="mt-2 text-sm">{cutoffSentence(data.baskets)}</p>
        </div>
      </div>
    </aside>
  );
}

export function RulesPanel({ seedRules, count }: { seedRules: string; count: number }) {
  const catalog = seriesCatalog(count);
  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <Panel className="p-5">
        <ol className="space-y-4">
          {RULES.map((rule, index) => (
            <li key={rule.title} className="grid grid-cols-[auto_1fr] gap-3">
              <span className="font-mono text-sm text-strategy">{index + 1}</span>
              <span>
                <span className="block font-medium">{rule.title}</span>
                <span className="mt-1 block text-sm leading-6 text-muted">{rule.body}</span>
              </span>
            </li>
          ))}
        </ol>
      </Panel>
      <Panel className="p-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">Qué es cada serie</p>
        <ul className="mt-4 space-y-3">
          {catalog.map((series) => (
            <li key={series.key} className="text-sm">
              <span className="flex items-center gap-2 font-medium">
                <span className="size-2.5 rounded-full" style={{ background: series.color }} />
                {series.short}
              </span>
              <span className="mt-1 block pl-4 text-muted">{series.hint}</span>
            </li>
          ))}
        </ul>
        <details className="mt-5 border-t border-line pt-3">
          <summary className="cursor-pointer text-sm text-muted">Texto original de la semilla, en inglés</summary>
          <p className="mt-2 text-sm leading-6 text-faint">{seedRules}</p>
        </details>
      </Panel>
    </div>
  );
}

export function Readout({ lines }: { lines: string[] }) {
  if (lines.length === 0) {
    return <p className="text-sm text-muted">No hay canastas para leer.</p>;
  }
  return (
    <ul className="space-y-3">
      {lines.map((line, index) => (
        <li key={index} className="flex gap-3 text-sm leading-6">
          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-strategy" />
          <span>{line}</span>
        </li>
      ))}
    </ul>
  );
}

export function MetricCards({ basket }: { basket: Basket }) {
  const count = basket.holdings.length;
  const cards: {
    key: string;
    series: SeriesInfo;
    total: number;
    cagr: number | null;
    mdd: number | null;
    detail?: string;
  }[] = [
    { key: "strategy", series: seriesByKey(count, "strategy"), total: basket.strategy.total, cagr: basket.strategy.cagr, mdd: basket.strategy.mdd },
    { key: "ewReb", series: seriesByKey(count, "ewReb"), total: basket.ewReb.total, cagr: basket.ewReb.cagr, mdd: basket.ewReb.mdd },
    { key: "etf", series: seriesByKey(count, "etf"), total: basket.etf.total, cagr: basket.etf.cagr, mdd: basket.etf.mdd },
    {
      key: "bestBh",
      series: seriesByKey(count, "bestBh"),
      total: basket.bestBh.total,
      cagr: null,
      mdd: null,
      detail: basket.holdings.find((holding) => holding.ticker === basket.bestBh.ticker)?.name,
    },
  ];

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Panel key={card.key} className={cn("p-4", card.key === "strategy" && "ring-1 ring-strategy/50")}>
            <h3 className="flex items-center gap-2 text-sm">
              <span className="size-2.5 rounded-full" style={{ background: card.series.color }} />
              {card.series.short}
              {card.key === "bestBh" ? <span className="text-muted">{basket.bestBh.ticker}</span> : null}
            </h3>
            {card.detail ? <p className="mt-1 text-xs text-faint">{card.detail}</p> : null}
            <p className={cn("mt-4 font-mono text-3xl tabular-nums", toneClass(card.total))}>{formatReturn(card.total)}</p>
            <p className="text-xs text-faint">retorno total · US$ 1 pasan a {formatGrewTo(card.total)}</p>
            <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-xs text-faint">CAGR</dt>
                <dd className="font-mono tabular-nums">
                  {card.cagr === null ? <span title="No está en la semilla">—</span> : formatPlainPct(card.cagr)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-faint">Caída máx.</dt>
                <dd>
                  {card.mdd === null ? (
                    <span className="font-mono text-muted" title="No está en la semilla">—</span>
                  ) : (
                    <SignedReturn value={card.mdd} />
                  )}
                </dd>
              </div>
            </dl>
          </Panel>
        ))}
      </div>
      <Panel className="mt-3 flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm">{seriesByKey(count, "ewBh").name}</p>
          <p className="text-xs text-muted">También está en la semilla. No tiene desglose anual, así que no entra en el gráfico de años.</p>
        </div>
        <dl className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <dt className="text-xs text-faint">Total</dt>
            <dd><SignedReturn value={basket.ewBh.total} /></dd>
          </div>
          <div>
            <dt className="text-xs text-faint">CAGR</dt>
            <dd className="font-mono tabular-nums">{formatPlainPct(basket.ewBh.cagr)}</dd>
          </div>
          <div>
            <dt className="text-xs text-faint">Caída</dt>
            <dd><SignedReturn value={basket.ewBh.mdd} /></dd>
          </div>
        </dl>
      </Panel>
    </div>
  );
}

export function MiniPath({ years }: { years: Basket["yearByYear"] }) {
  const values = years.map((row) => row.strategy);
  const max = Math.max(...values.map((value) => Math.abs(value)), 0.05);
  const width = 140;
  const height = 48;
  const barWidth = width / values.length;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-12 w-full" role="img" aria-label="Retorno anual de la rotación">
      <line x1="0" x2={width} y1={height / 2} y2={height / 2} stroke="rgba(244,241,234,0.2)" />
      {values.map((value, index) => {
        const bar = (Math.abs(value) / max) * (height / 2 - 2);
        const x = index * barWidth + barWidth * 0.22;
        const y = value >= 0 ? height / 2 - bar : height / 2;
        return (
          <rect
            key={years[index]?.year ?? index}
            x={x}
            y={y}
            width={barWidth * 0.56}
            height={Math.max(bar, 1)}
            rx="1"
            fill={value >= 0 ? "var(--color-strategy)" : "var(--color-down)"}
          >
            <title>{`${years[index]?.year ?? ""}: ${formatReturn(value)}`}</title>
          </rect>
        );
      })}
    </svg>
  );
}
