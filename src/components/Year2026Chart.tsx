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
  return event.from === event.to ? event.to : `${event.from}\u2192${event.to}`;
}

export function Year2026Panel({ basket }: { basket: Basket }) {
  return null;
}
