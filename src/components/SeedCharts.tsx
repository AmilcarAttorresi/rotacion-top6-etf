import { useState } from "react";
import { useNavigate } from "react-router";
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Basket } from "../data/backtest.ts";
import { basketPath } from "../data/backtest.ts";
import { formatAxisPercent, formatPercentUnits, formatReturn } from "../lib/format.ts";
import { usePrefersReducedMotion } from "../lib/hooks.ts";
import { bestBhFootnote } from "../lib/readout.ts";
import { palette, seriesByKey } from "../lib/series.ts";
import { cn } from "../lib/cn.ts";
import { Panel } from "./Bits.tsx";

const axisTick = { fill: palette.muted, fontSize: 12 };

export function YearBars({ basket, selectedYear, onSelectYear }: { basket: Basket; selectedYear?: number | null; onSelectYear?: (year: number | null) => void }) {
  const reduced = usePrefersReducedMotion();
  const [localYear, setLocalYear] = useState<number | null>(null);
  const year = onSelectYear ? (selectedYear ?? null) : localYear;
  const count = basket.holdings.length;
  const items = [seriesByKey(count, "strategy"), seriesByKey(count, "ewReb"), seriesByKey(count, "etf")];
  const rows = basket.yearByYear.map((row) => ({
    year: row.year,
    label: row.note ? `${row.year}*` : String(row.year),
    strategy: row.strategy * 100,
    ewReb: row.ewReb * 100,
    etf: row.etf * 100,
    note: row.note ?? null,
  }));
  function select(next: number | null) {
    if (onSelectYear) onSelectYear(next);
    else setLocalYear(next);
  }
  return (
    <Panel className="p-4 sm:p-5">
      <div className="h-80 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart data={rows}>
            <CartesianGrid vertical={false} stroke={palette.grid} />
            <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} interval={0} />
            <YAxis tick={axisTick} axisLine={false} tickLine={false} tickFormatter={formatAxisPercent} width={56} />
            <ReferenceLine y={0} stroke={palette.zero} />
            <Tooltip formatter={(value) => formatPercentUnits(Number(value))} />
            {items.map((item) => (
              <Bar key={item.key} dataKey={item.key} name={item.short} fill={item.color} maxBarSize={22} isAnimationActive={!reduced} onClick={(bar) => {
                const clicked = (bar.payload as { year?: number } | undefined)?.year;
                if (clicked !== undefined) select(clicked === year ? null : clicked);
              }}>
                {rows.map((row) => <Cell key={row.year} fill={item.color} fillOpacity={year === null || year === row.year ? 1 : 0.35} />)}
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      {basket.yearByYear.filter((row) => row.note).map((row) => <p key={row.year} className="mt-2 text-xs text-muted">{row.year}: {row.note}</p>)}
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
  if (includeBest) rows.push({ key: "best", name: `${basket.bestBh.ticker} B&H`, value: basket.bestBh.total * 100, fill: palette.best });
  return (
    <Panel className="p-4 sm:p-5">
      <button type="button" className={cn("mb-3 rounded-full border px-3 py-1 text-sm", includeBest ? "border-strategy" : "border-line")} onClick={() => setIncludeBest((value) => !value)}>
        {includeBest ? "Ocultar" : "Ver"} {basket.bestBh.ticker} ({formatReturn(basket.bestBh.total)})
      </button>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ right: 24 }}>
            <XAxis type="number" tick={axisTick} tickFormatter={formatAxisPercent} />
            <YAxis type="category" dataKey="name" tick={axisTick} width={92} />
            <Tooltip formatter={(value) => formatPercentUnits(Number(value))} />
            <Bar dataKey="value" isAnimationActive={!reduced}>{rows.map((row) => <Cell key={row.key} fill={row.fill} />)}</Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

export function CompareBars({ baskets }: { baskets: readonly Basket[] }) {
  const navigate = useNavigate();
  const reduced = usePrefersReducedMotion();
  const count = baskets[0]?.holdings.length ?? 6;
  const items = [seriesByKey(count, "strategy"), seriesByKey(count, "ewReb"), seriesByKey(count, "etf")];
  const rows = baskets.map((basket) => ({ id: basket.id, strategy: basket.strategy.total * 100, ewReb: basket.ewReb.total * 100, etf: basket.etf.total * 100 }));
  return (
    <Panel className="p-4 sm:p-5">
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows}>
            <CartesianGrid vertical={false} stroke={palette.grid} />
            <XAxis dataKey="id" tick={axisTick} />
            <YAxis tick={axisTick} tickFormatter={formatAxisPercent} width={64} />
            <Tooltip formatter={(value) => formatPercentUnits(Number(value))} />
            {items.map((item) => (
              <Bar key={item.key} dataKey={item.key} name={item.short} fill={item.color} isAnimationActive={!reduced} onClick={(bar) => {
                const id = (bar.payload as { id?: string } | undefined)?.id;
                if (id) navigate(basketPath(id));
              }} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-3 text-xs text-muted">{bestBhFootnote(baskets)}</p>
    </Panel>
  );
}
