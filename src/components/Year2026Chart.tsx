import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Basket } from "../data/backtest.ts";
import { holdingOf } from "../data/backtest.ts";
import {
  formatDate,
  formatDateNumeric,
  formatIndex,
  formatMonthTick,
  formatReturn,
  toneClass,
} from "../lib/format.ts";
import { usePrefersReducedMotion } from "../lib/hooks.ts";
import { buildRotation, quarterLabel, type BasketRotation, type RebalanceEvent } from "../lib/rotation2026.ts";
import { holdingColor, palette } from "../lib/series.ts";
import { cn } from "../lib/cn.ts";
import { Panel, SignedReturn } from "./Bits.tsx";

interface TipRow {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
}

function toggleKey(hidden: ReadonlySet<string>, key: string): Set<string> {
  const next = new Set(hidden);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  return next;
}

function monthTicks(dates: readonly string[]): string[] {
  const ticks: string[] = [];
  let last = "";
  for (const date of dates) {
    const month = date.slice(0, 7);
    if (month !== last) {
      ticks.push(date);
      last = month;
    }
  }
  return ticks;
}

function markerText(event: RebalanceEvent): string {
  return event.from === event.to ? event.to : event.from + " -> " + event.to;
}

function Tip({
  active,
  payload,
  label,
  order,
}: {
  active?: boolean;
  payload?: readonly TipRow[];
  label?: string | number;
  order: readonly string[];
}) {
  if (!active || !payload?.length) return null;
  const rows = [...payload].sort(
    (a, b) => order.indexOf(String(a.dataKey)) - order.indexOf(String(b.dataKey)),
  );
  const date = typeof label === "string" ? label : "";
  return (
    <div className="min-w-52 rounded-xl border border-line bg-panel-2 px-3 py-2 shadow-xl">
      <p className="font-mono text-xs text-faint">{date ? formatDateNumeric(date) : label}</p>
      <ul className="mt-2 space-y-1">
        {rows.map((item) => {
          const value = typeof item.value === "number" ? item.value : Number(item.value);
          return (
            <li key={String(item.dataKey)} className="flex items-center justify-between gap-4 text-sm">
              <span className="flex items-center gap-2">
                <span className="size-2 rounded-full" style={{ background: item.color }} />
                {item.name}
              </span>
              <span className="font-mono tabular-nums">
                {formatIndex(value)}
                <span className={cn("ml-2", toneClass(value / 100 - 1))}>{formatReturn(value / 100 - 1)}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function Year2026Panel({ basket }: { basket: Basket }) {
  const model = useMemo(() => {
    try {
      return { ok: true as const, data: buildRotation(basket) };
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo reconstruir 2026.";
      return { ok: false as const, message };
    }
  }, [basket]);

  if (!model.ok) {
    return (
      <Panel className="p-5">
        <p className="font-medium">No hay curva de 2026 para {basket.id}.</p>
        <p className="mt-2 text-sm text-muted">{model.message}</p>
      </Panel>
    );
  }

  return <Year2026Chart basket={basket} rotation={model.data} />;
}

function Year2026Chart({ basket, rotation }: { basket: Basket; rotation: BasketRotation }) {
  const reduced = usePrefersReducedMotion();
  const [hidden, setHidden] = useState<ReadonlySet<string>>(() => new Set());
  const [logScale, setLogScale] = useState(false);
  const entry = rotation.rebalances[0];
  const seedYear = basket.yearByYear.find((row) => row.year === 2026);
  const largestName = holdingOf(basket, rotation.largest)?.name;
  const entryName = entry ? holdingOf(basket, entry.to)?.name : undefined;
  const heldName = holdingOf(basket, rotation.heldNow)?.name;

  const series = [
    { key: "strategy", name: "Rotacion", color: palette.strategy, width: 2.6, dash: undefined as string | undefined },
    { key: "etf", name: basket.id, color: palette.ink, width: 2, dash: "5 4" },
    ...basket.holdings.map((holding, index) => ({
      key: holding.ticker,
      name: holding.ticker,
      color: holdingColor(index),
      width: 1.5,
      dash: undefined as string | undefined,
    })),
  ];
  const order = series.map((item) => item.key);
  const rows = rotation.points.map((point) => ({
    date: point.date,
    strategy: point.strategy,
    etf: point.etf,
    ...point.holdings,
  }));
  const ticks = monthTicks(rows.map((row) => row.date));
  const visible = series.filter((item) => !hidden.has(item.key));
  const colorOf = new Map(series.map((item) => [item.key, item.color]));

  return (
    <div className="space-y-4" data-testid={`chart-2026-${basket.id}`}>
      <Panel className="p-4 sm:p-5">
        {entry ? (
          <div className="max-w-3xl text-sm leading-6">
            <p>
              2026 arranca en <strong className="font-mono">{entry.to}</strong>
              {entryName ? ` (${entryName})` : ""}, no en la tenencia mas pesada{" "}
              <span className="font-mono">{rotation.largest}</span>
              {largestName ? ` (${largestName})` : ""}. El {formatDate(entry.date)} la regla pasa de{" "}
              <span className="font-mono">{entry.from}</span> a <span className="font-mono">{entry.to}</span>.
            </p>
            <p className="mt-2">
              Hoy la curva sostiene <strong className="font-mono">{rotation.heldNow}</strong>
              {heldName ? ` (${heldName})` : ""}
              {rotation.heldNow === basket.current
                ? ". Coincide con la semilla."
                : `. La semilla dice ${basket.current}.`}
            </p>
          </div>
        ) : null}
        <div className="mt-4 flex h-10 overflow-hidden rounded-full border border-line" aria-hidden>
          {rotation.segments.map((segment) => (
            <div
              key={`${segment.ticker}-${segment.from}`}
              className="flex min-w-8 items-center justify-center px-2 font-mono text-[11px] text-canvas"
              style={{
                flexGrow: Math.max(segment.sessions, 1),
                background: colorOf.get(segment.ticker) ?? palette.strategy,
              }}
            >
              {segment.ticker}
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {series.map((item) => {
            const off = hidden.has(item.key);
            return (
              <button
                key={item.key}
                type="button"
                aria-pressed={!off}
                onClick={() => setHidden((current) => toggleKey(current, item.key))}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm",
                  off ? "border-line text-faint" : "border-line bg-panel-2 text-ink",
                )}
              >
                <span className="size-2 rounded-full" style={{ background: item.color, opacity: off ? 0.3 : 1 }} />
                {item.name}
              </button>
            );
          })}
          <button type="button" aria-pressed={logScale} onClick={() => setLogScale((value) => !value)} className="rounded-full border border-line px-3 py-1 text-sm">
            Escala log
          </button>
        </div>
        <div className="mt-4 h-96 w-full min-w-0">
          {visible.length === 0 ? (
            <p className="grid h-full place-items-center text-sm text-muted">Activa al menos una serie.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart data={rows} margin={{ top: 28, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={palette.grid} vertical={false} />
                <XAxis dataKey="date" ticks={ticks} tickFormatter={formatMonthTick} tick={{ fill: palette.muted, fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis scale={logScale ? "log" : "auto"} domain={["auto", "auto"]} tick={{ fill: palette.muted, fontSize: 12 }} axisLine={false} tickLine={false} width={48} tickFormatter={(value: number) => formatIndex(value)} />
                <Tooltip content={(props) => <Tip active={props.active} label={props.label} payload={props.payload as readonly TipRow[] | undefined} order={order} />} />
                <ReferenceLine y={100} stroke={palette.zero} />
                {rotation.rebalances.map((event) => (
                  <ReferenceLine key={event.date} x={event.date} stroke={palette.marker} strokeDasharray="3 3" label={{ value: markerText(event), fill: palette.strategy, fontSize: 11, position: "insideTop" }} />
                ))}
                {series.map((item) => (
                  <Line key={item.key} type="monotone" dataKey={item.key} name={item.name} stroke={item.color} strokeWidth={item.width} strokeDasharray={item.dash} dot={false} hide={hidden.has(item.key)} isAnimationActive={!reduced} connectNulls />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-panel-2 px-3 py-3">
            <dt className="text-xs text-faint">Esta curva</dt>
            <dd className="mt-1 text-2xl"><SignedReturn value={rotation.strategyReturn} /></dd>
          </div>
          <div className="rounded-xl bg-panel-2 px-3 py-3">
            <dt className="text-xs text-faint">YTD 2026 en la semilla</dt>
            <dd className="mt-1 text-2xl">{seedYear ? <SignedReturn value={seedYear.strategy} /> : "-"}</dd>
          </div>
        </dl>
      </Panel>
      <Panel className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <caption className="px-4 py-3 text-left text-xs text-muted">Rotaciones al cierre de cada trimestre. El trimestre en curso no dispara rotacion.</caption>
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-faint">
                <th className="px-4 py-2">Trimestre</th>
                <th className="px-3 py-2">Rotacion</th>
                {basket.holdings.map((holding) => (
                  <th key={holding.ticker} className="px-3 py-2 text-right">{holding.ticker}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rotation.rebalances.map((event) => {
                const byTicker = new Map(event.scores.map((score) => [score.ticker, score.totalReturn]));
                const worst = event.scores[0]?.ticker;
                return (
                  <tr key={event.date} className="border-b border-line/70">
                    <th className="px-4 py-3 text-left font-normal">{quarterLabel(event.decidedBy)}<span className="block font-mono text-xs text-faint">{formatDateNumeric(event.date)}</span></th>
                    <td className="px-3 py-3 font-mono">{event.from} -&gt; {event.to}</td>
                    {basket.holdings.map((holding) => {
                      const value = byTicker.get(holding.ticker);
                      return (
                        <td key={holding.ticker} className={cn("px-3 py-3 text-right", holding.ticker === worst && "bg-strategy/15 font-semibold")}>
                          {value === undefined ? "-" : <SignedReturn value={value} />}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
