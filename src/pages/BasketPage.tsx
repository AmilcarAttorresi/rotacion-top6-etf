import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "react-router";
import { findBasket, getBacktest, holdingOf } from "../data/backtest.ts";
import { formatDate, formatPlainPct } from "../lib/format.ts";
import { usePageTitle } from "../lib/hooks.ts";
import { basketReadout } from "../lib/readout.ts";
import { BiasWarning, MetricCards, Readout, Section } from "../components/Bits.tsx";
import { TotalBars, YearBars } from "../components/SeedCharts.tsx";
import { HoldingsTable, YearTable } from "../components/Tables.tsx";
import { Year2026Panel } from "../components/Year2026Chart.tsx";
import { NotFound } from "./NotFound.tsx";

export function BasketPage() {
  const params = useParams();
  const data = getBacktest();
  const basket = params.id ? findBasket(data, params.id) : undefined;
  const [year, setYear] = useState<number | null>(null);
  usePageTitle(basket ? `${basket.id} - Perdedor` : "No esta - Perdedor");
  if (!basket) return <NotFound />;
  const current = holdingOf(basket, basket.current);
  const start = holdingOf(basket, basket.start);
  return (
    <div>
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted"><ArrowLeft className="size-4" />Resumen</Link>
      <h1 className="mt-6 font-serif text-4xl sm:text-5xl">{basket.label}</h1>
      <p className="mt-2 text-sm text-muted">Fuente: {basket.source}. Tenencias al {formatDate(basket.holdingsAsOf)}.</p>
      <div className="mt-6 rounded-2xl border border-line bg-panel p-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">Hoy sostiene</p>
        <p className="mt-2 font-serif text-5xl">{basket.current}</p>
        <p className="text-muted">{current?.name}{current ? ` · ${formatPlainPct(current.weight, 2)} del ETF` : ""}</p>
        <p className="mt-3 text-sm text-muted">Arranque: {basket.start}{start ? ` (${start.name})` : ""}</p>
      </div>
      <Section eyebrow="Semilla" title="Como cerro la ventana">
        <MetricCards basket={basket} />
        <div className="mt-4"><Readout lines={basketReadout(basket)} /></div>
      </Section>
      <Section eyebrow="2026" title="Dia por dia, con las rotaciones">
        <Year2026Panel basket={basket} />
      </Section>
      <Section eyebrow="Anos" title="Rotacion contra el igual peso y el ETF">
        <YearBars basket={basket} selectedYear={year} onSelectYear={setYear} />
        <div className="mt-4"><YearTable basket={basket} selectedYear={year} onSelectYear={setYear} /></div>
      </Section>
      <Section eyebrow="Toda la ventana" title="Retorno total, en barras"><TotalBars basket={basket} /></Section>
      <Section eyebrow="Tenencias" title="El top 6"><HoldingsTable basket={basket} /></Section>
      <div className="mt-10"><BiasWarning data={data} /></div>
    </div>
  );
}
