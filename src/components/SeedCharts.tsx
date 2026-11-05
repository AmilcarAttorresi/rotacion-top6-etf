import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Basket } from "../data/backtest.ts";
import { basketPath } from "../data/backtest.ts";
import { formatAxisPercent, formatPercentUnits, formatReturn } from "../lib/format.ts";
import { usePrefersReducedMotion } from "../lib/hooks.ts";
import { bestBhFootnote } from "../lib/readout.ts";
import { palette, seriesByKey } from "../lib/series.ts";
import { cn } from "../lib/cn.ts";
import { Panel } from "./Bits.tsx";

interface TipRow {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
  payload?: { note?: string | null };
}

function ChartTip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: readonly TipRow[];
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  const note = payload.find((row) => row.payload?.note)?.payload?.note;
  return (
    <div className="min-w-44 rounded-xl border border-line bg-panel-2 px-3 py-2 shadow-xl">
      <p className="font-mono text-xs text-faint">{label}</p>
      <ul className="mt-2 space-y-1">
        {payload.map((item) => {
          const value = typeof item.value === "number" ? item.value : Number(item.value);
          return (
            <li key={String(item.dataKey)} className="flex items-center justify-between gap-4 text-sm">
              <span className="flex items-center gap-2">
                <span className="size-2 rounded-full" style={{ background: item.color }} />
                {item.name}
              </span>
              <span className="font-mono tabular-nums">{formatPercentUnits(value)}</span>
            </li>
          );
        })}
      </ul>
      {note ? <p className="mt-2 max-w-52 text-xs text-muted">{note}</p> : null}
    </div>
  );
}

function SeriesToggles({
  items,
  hidden,
  onToggle,
}: {
  items: { key: string; label: string; color: string }[];
  hidden: ReadonlySet<string>;
  onToggle: (key: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Series del gráfico">
      {items.map((item) => {
        const off = hidden.has(item.key);
        return (
          <button
            key={item.key}
            type="button"
            aria-pressed={!off}
            onClick={() => onToggle(item.key)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-strategy",
              off ? "border-line text-faint" : "border-line bg-panel-2 text-ink",
            )}
          >
            <span className="size-2 rounded-full" style={{ background: item.color, opacity: off ? 0.35 : 1 }} />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

function toggleKey(hidden: ReadonlySet<string>, key: string): Set<string> {
  const next = new Set(hidden);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  return next;
}

const axisTick = {
  fill: palette.muted,
  fontSize: 12,
  fontFamily: "IBM Plex Mono, ui-monospace, monospace",
};

export function YearBars({
  basket,
  selectedYear,
  onSelectYear,
}: {
  basket: Basket;
  selectedYear?: number | null;
  onSelectYear?: (year: number | null) => void;
}) {
  const reduced = usePrefersReducedMotion();
  const [localYear, setLocalYear] = useState<number | null>(null);
  const [hidden, setHidden] = useState<ReadonlySet<string>>(() => new Set());
  const year = onSelectYear ? (selectedYear ?? null) : localYear;
  const count = basket.holdings.length;
  const items = [
    seriesByKey(count, "strategy"),
    seriesByKey(count, "ewReb"),
    seriesByKey(count, "etf"),
  ];

  function select(next: number | null) {
    if (onSelectYear) onSelectYear(next);
    else setLocalYear(next);
  }

  const rows = basket.yearByYear.map((row) => ({
    year: row.year,
    label: row.note ? `${row.year}*` : String(row.year),
    strategy: row.strategy * 100,
    ewReb: row.ewReb * 100,
    etf: row.etf * 100,
    note: row.note ?? null,
  }));
  const selected = basket.yearByYear.find((row) => row.year === year);
  const allHidden = items.every((item) => hidden.has(item.key));

  return (
    <Panel className="p-4 sm:p-5">
      <SeriesToggles
        items={items.map((item) => ({ key: item.key, label: item.short, color: item.color }))}
        hidden={hidden}
        onToggle={(key) => setHidden((current) => toggleKey(current, key))}
      />
      <p className="mt-3 text-xs text-faint">Elegí una barra para fijar el año. 2026 lleva asterisco cuando la semilla lo marca como parcial.</p>
      <div className="mt-4 h-80 w-full min-w-0">
        {allHidden ? (
          <p className="grid h-full place-items-center text-sm text-muted">Activá al menos una serie.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={palette.grid} />
              <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} interval={0} />
              <YAxis tick={axisTick} axisLine={false} tickLine={false} tickFormatter={formatAxisPercent} width={56} />
              <ReferenceLine y={0} stroke={palette.zero} />
              <Tooltip
                cursor={{ fill: "rgba(244,241,234,0.04)" }}
                content={(props) => (
                  <ChartTip
                    active={props.active}
                    label={props.label}
                    payload={props.payload as readonly TipRow[] | undefined}
                  />
                )}
              />
              {items.map((item) => (
                <Bar
                  key={item.key}
                  dataKey={item.key}
                  name={item.short}
                  fill={item.color}
                  maxBarSize={22}
                  radius={3}
                  hide={hidden.has(item.key)}
                  isAnimationActive={!reduced}
                  onClick={(bar) => {
                    const clicked = (bar.payload as { year?: number } | undefined)?.year;
                    if (clicked === undefined) return;
                    select(clicked === year ? null : clicked);
                  }}
                >
                  {rows.map((row) => (
                    <Cell
                      key={row.year}
                      fill={item.color}
                      fillOpacity={year === null || year === row.year ? 1 : 0.35}
                      cursor="pointer"
                    />
                  ))}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
      {selected ? (
        <div className="mt-4 grid gap-3 rounded-xl bg-panel-2 p-3 sm:grid-cols-3">
          <p className="text-sm sm:col-span-3">
            {selected.year}
            {selected.note ? <span className="text-muted"> · {selected.note}</span> : null}
          </p>
          <p className="text-sm">Rotación <span className="ml-2"><strong className="font-mono">{formatReturn(selected.strategy)}</strong></span></p>
          <p className="text-sm">6 EW reb. <span className="ml-2 font-mono">{formatReturn(selected.ewReb)}</span></p>
          <p className="text-sm">ETF <span className="ml-2 font-mono">{formatReturn(selected.etf)}</span></p>
          <button type="button" className="text-left text-xs text-strategy sm:col-span-3" onClick={() => select(null)}>
            Ver todos los años
          </button>
        </div>
      ) : null}
      <ul className="mt-3 space-y-1 text-xs text-muted">
        {basket.yearByYear.filter((row) => row.note).map((row) => (
          <li key={row.year}>{row.year}: {row.note}</li>
        ))}
      </ul>
    </Panel>
  );
}

export function TotalBars({ basket }: { basket: Basket }) {
  const reduced = usePrefersReducedMotion();
  const [includeBest, setIncludeBest] = useState(false);
  const count = basket.holdings.length;
  const rows: { key: string; name: string; value: number; fill: string }[] = [
    { key: "strategy", name: seriesByKey(count, "strategy").short, value: basket.strategy.total * 100, fill: palette.strategy },
    { key: "ewReb", name: seriesByKey(count, "ewReb").short, value: basket.ewReb.total * 100, fill: palette.bench },
    { key: "ewBh", name: seriesByKey(count, "ewBh").short, value: basket.ewBh.total * 100, fill: palette.hold },
    { key: "etf", name: "ETF", value: basket.etf.total * 100, fill: palette.fund },
  ];
  if (includeBest) {
    rows.push({
      key: "best",
      name: `${basket.bestBh.ticker} B&H`,
      value: basket.bestBh.total * 100,
      fill: palette.best,
    });
  }

  return (
    <Panel className="p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">Totales de la semilla en toda la ventana. El 6 EW buy & hold no tiene años.</p>
        <button
          type="button"
          aria-pressed={includeBest}
          onClick={() => setIncludeBest((value) => !value)}
          className={cn(
            "rounded-full border px-3 py-1 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-strategy",
            includeBest ? "border-strategy text-ink" : "border-line text-muted",
          )}
        >
          {includeBest ? "Ocultar" : "Ver"} {basket.bestBh.ticker} ({formatReturn(basket.bestBh.total)})
        </button>
      </div>
      <div className="mt-4 h-72 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart data={rows} layout="vertical" margin={{ top: 8, right: 72, left: 8, bottom: 8 }}>
            <CartesianGrid horizontal={false} stroke={palette.grid} />
            <XAxis type="number" tick={axisTick} axisLine={false} tickLine={false} tickFormatter={formatAxisPercent} />
            <YAxis type="category" dataKey="name" tick={axisTick} axisLine={false} tickLine={false} width={92} />
            <Tooltip
              cursor={{ fill: "rgba(244,241,234,0.04)" }}
              content={(props) => (
                <ChartTip active={props.active} label={props.label} payload={props.payload as readonly TipRow[] | undefined} />
              )}
            />
            <Bar dataKey="value" name="Retorno total" radius={4} isAnimationActive={!reduced} barSize={18}>
              {rows.map((row) => (
                <Cell key={row.key} fill={row.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {!includeBest ? (
        <p className="mt-2 text-xs text-muted">
          {basket.bestBh.ticker} queda afuera de la escala: {formatReturn(basket.bestBh.total)}. El botón lo mete en el mismo eje.
        </p>
      ) : null}
    </Panel>
  );
}

export function CompareBars({ baskets }: { baskets: readonly Basket[] }) {
  const reduced = usePrefersReducedMotion();
  const navigate = useNavigate();
  const [hidden, setHidden] = useState<ReadonlySet<string>>(() => new Set());
  const count = baskets[0]?.holdings.length ?? 6;
  const items = [seriesByKey(count, "strategy"), seriesByKey(count, "ewReb"), seriesByKey(count, "etf")];
  const rows = baskets.map((basket) => ({
    id: basket.id,
    strategy: basket.strategy.total * 100,
    ewReb: basket.ewReb.total * 100,
    etf: basket.etf.total * 100,
  }));
  const allHidden = items.every((item) => hidden.has(item.key));

  return (
    <Panel className="chart-link p-4 sm:p-5">
      <SeriesToggles
        items={items.map((item) => ({ key: item.key, label: item.short, color: item.color }))}
        hidden={hidden}
        onToggle={(key) => setHidden((current) => toggleKey(current, key))}
      />
      <p className="mt-3 text-xs text-faint">Hacé clic en una barra para abrir la canasta.</p>
      <div className="mt-4 h-80 w-full min-w-0">
        {allHidden ? (
          <p className="grid h-full place-items-center text-sm text-muted">Activá al menos una serie.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={palette.grid} />
              <XAxis dataKey="id" tick={axisTick} axisLine={false} tickLine={false} />
              <YAxis tick={axisTick} axisLine={false} tickLine={false} tickFormatter={formatAxisPercent} width={64} />
              <ReferenceLine y={0} stroke={palette.zero} />
              <Tooltip
                cursor={{ fill: "rgba(244,241,234,0.04)" }}
                content={(props) => (
                  <ChartTip active={props.active} label={props.label} payload={props.payload as readonly TipRow[] | undefined} />
                )}
              />
              {items.map((item) => (
                <Bar
                  key={item.key}
                  dataKey={item.key}
                  name={item.short}
                  fill={item.color}
                  maxBarSize={36}
                  radius={3}
                  hide={hidden.has(item.key)}
                  isAnimationActive={!reduced}
                  onClick={(bar) => {
                    const id = (bar.payload as { id?: string } | undefined)?.id;
                    if (id) navigate(basketPath(id));
                  }}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
      <p className="mt-3 text-xs text-muted">{bestBhFootnote(baskets)}</p>
    </Panel>
  );
}
