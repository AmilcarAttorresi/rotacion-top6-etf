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
  return event.from === event.to ? event.to : `${event.from}→${event.to}`;
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
      <Panel className="p-5" >
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
    { key: "strategy", name: "Rotación", color: palette.strategy, width: 2.6, dash: undefined },
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
              {entryName ? ` (${entryName})` : ""}, no en la tenencia más pesada{" "}
              <span className="font-mono">{rotation.largest}</span>
              {largestName ? ` (${largestName})` : ""}. El {formatDate(entry.date)} la regla pasa de{" "}
              <span className="font-mono">{entry.from}</span> a <span className="font-mono">{entry.to}</span>: fue el peor del{" "}
              {quarterLabel(entry.decidedBy)}.
            </p>
            <p className="mt-2">
              Hoy la curva sostiene <strong className="font-mono">{rotation.heldNow}</strong>
              {heldName ? ` (${heldName})` : ""}
              {rotation.heldNow === basket.current
                ? ", el mismo papel que «hoy sostiene» en la semilla."
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
              title={`${segment.ticker} del ${formatDateNumeric(segment.from)} al ${formatDateNumeric(segment.to)}`}
            >
              {segment.ticker}
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-faint">
          Tramos en los que la rotación estuvo en cada papel. Si el trimestre elige al mismo, el tramo no se corta: la tabla de abajo igual anota la fecha.
        </p>

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
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-strategy",
                  off ? "border-line text-faint" : "border-line bg-panel-2 text-ink",
                )}
              >
                <span className="size-2 rounded-full" style={{ background: item.color, opacity: off ? 0.3 : 1 }} />
                {item.name}
              </button>
            );
          })}
          <button
            type="button"
            aria-pressed={logScale}
            onClick={() => setLogScale((value) => !value)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-strategy",
              logScale ? "border-strategy text-ink" : "border-line text-muted",
            )}
          >
            Escala log
          </button>
        </div>

        <div className="mt-4 h-96 w-full min-w-0">
          {visible.length === 0 ? (
            <p className="grid h-full place-items-center text-sm text-muted">Activá al menos una serie.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart data={rows} margin={{ top: 28, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={palette.grid} vertical={false} />
                <XAxis
                  dataKey="date"
                  ticks={ticks}
                  tickFormatter={formatMonthTick}
                  tick={{ fill: palette.muted, fontSize: 12, fontFamily: "IBM Plex Mono, ui-monospace, monospace" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  scale={logScale ? "log" : "auto"}
                  domain={logScale ? ["auto", "auto"] : ["auto", "auto"]}
                  tick={{ fill: palette.muted, fontSize: 12, fontFamily: "IBM Plex Mono, ui-monospace, monospace" }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                  tickFormatter={(value: number) => formatIndex(value)}
                />
                <Tooltip
                  content={(props) => (
                    <Tip
                      active={props.active}
                      label={props.label}
                      payload={props.payload as readonly TipRow[] | undefined}
                      order={order}
                    />
                  )}
                />
                <ReferenceLine y={100} stroke={palette.zero} />
                {rotation.rebalances.map((event) => (
                  <ReferenceLine
                    key={event.date}
                    x={event.date}
                    stroke={palette.marker}
                    strokeDasharray="3 3"
                    label={{
                      value: markerText(event),
                      fill: palette.strategy,
                      fontSize: 11,
                      position: "insideTop",
                      fontFamily: "IBM Plex Mono, ui-monospace, monospace",
                    }}
                  />
                ))}
                {series.map((item) => (
                  <Line
                    key={item.key}
                    type="monotone"
                    dataKey={item.key}
                    name={item.name}
                    stroke={item.color}
                    strokeWidth={item.width}
                    strokeDasharray={item.dash}
                    dot={false}
                    hide={hidden.has(item.key)}
                    isAnimationActive={!reduced}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        <p className="mt-3 text-xs text-muted">
          Base 100 en el cierre del {formatDate(rotation.baseDate)}. La línea vertical es el cierre del trimestre: ese día todavía rinde el papel anterior y el nuevo arranca al día hábil siguiente.
          Precios: {rotation.source}. Último cierre de la curva: {formatDate(rotation.lastDate)}.
        </p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-panel-2 px-3 py-3">
            <dt className="text-xs text-faint">Esta curva, rotación al {formatDateNumeric(rotation.lastDate)}</dt>
            <dd className="mt-1 text-2xl"><SignedReturn value={rotation.strategyReturn} /></dd>
          </div>
          <div className="rounded-xl bg-panel-2 px-3 py-3">
            <dt className="text-xs text-faint">YTD 2026 en la semilla</dt>
            <dd className="mt-1 text-2xl">
              {seedYear ? <SignedReturn value={seedYear.strategy} /> : "—"}
            </dd>
            {seedYear?.note ? <p className="text-xs text-muted">{seedYear.note}</p> : null}
          </div>
        </dl>
        <p className="mt-3 text-xs text-muted">
          La tabla anual de la semilla no se toca. Esta curva aplica la misma regla con los cierres ajustados diarios. Si el décimo no coincide, manda la semilla para el YTD publicado y la curva para ver el camino.
        </p>
      </Panel>

      <Panel className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <caption className="px-4 py-3 text-left text-xs text-muted">
              Cada fila es un trimestre cerrado. Se rota al peor retorno de esos seis, medido entre cierres ajustados. El trimestre en curso no dispara rotación.
            </caption>
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-faint">
                <th scope="col" className="px-4 py-2 font-medium">Trimestre</th>
                <th scope="col" className="px-3 py-2 font-medium">Rotación</th>
                {basket.holdings.map((holding) => (
                  <th key={holding.ticker} scope="col" className="px-3 py-2 text-right font-medium">{holding.ticker}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rotation.rebalances.map((event) => {
                const byTicker = new Map(event.scores.map((score) => [score.ticker, score.totalReturn]));
                const worst = event.scores[0]?.ticker;
                return (
                  <tr key={event.date} className="border-b border-line/70">
                    <th scope="row" className="px-4 py-3 text-left font-normal">
                      <span className="block font-medium">{quarterLabel(event.decidedBy)}</span>
                      <span className="font-mono text-xs text-faint">{formatDateNumeric(event.date)}</span>
                    </th>
                    <td className="px-3 py-3 font-mono">
                      {event.from} → {event.to}
                      {event.date === rotation.baseDate ? (
                        <span className="mt-1 block font-sans text-xs text-muted">Arranque de 2026</span>
                      ) : null}
                      {event.from === event.to ? (
                        <span className="mt-1 block font-sans text-xs text-muted">Sigue en el mismo papel</span>
                      ) : null}
                    </td>
                    {basket.holdings.map((holding) => {
                      const value = byTicker.get(holding.ticker);
                      const marked = holding.ticker === worst;
                      return (
                        <td key={holding.ticker} className={cn("px-3 py-3 text-right", marked && "bg-strategy/15 font-semibold")}>
                          {value === undefined ? "—" : <SignedReturn value={value} />}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              {rotation.partial ? (
                <tr>
                  <th scope="row" className="px-4 py-3 text-left font-normal">
                    <span className="block font-medium">{quarterLabel(rotation.partial.id)} en curso</span>
                    <span className="font-mono text-xs text-faint">
                      {formatDateNumeric(rotation.partial.from)} → {formatDateNumeric(rotation.partial.to)}
                    </span>
                  </th>
                  <td className="px-3 py-3 text-muted">Sin rotación todavía</td>
                  {basket.holdings.map((holding) => {
                    const value = rotation.partial?.scores.find((score) => score.ticker === holding.ticker)?.totalReturn;
                    const marked = holding.ticker === rotation.partial?.scores[0]?.ticker;
                    return (
                      <td key={holding.ticker} className={cn("px-3 py-3 text-right", marked && "bg-strategy/10")}>
                        {value === undefined ? "—" : <SignedReturn value={value} />}
                      </td>
                    );
                  })}
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
