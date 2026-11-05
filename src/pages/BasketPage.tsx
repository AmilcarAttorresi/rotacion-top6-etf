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
  usePageTitle(basket ? `${basket.id} — Perdedor` : "No está — Perdedor");

  if (!basket) return <NotFound />;

  const current = holdingOf(basket, basket.current);
  const start = holdingOf(basket, basket.start);

  return (
    <div>
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" />
        Resumen
      </Link>
      <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.18em] text-strategy">{basket.id}</p>
      <h1 className="mt-2 font-serif text-4xl sm:text-5xl">{basket.label}</h1>
      <p className="mt-2 text-sm text-muted">
        Fuente: {basket.source}. Tenencias al {formatDate(basket.holdingsAsOf)}.
      </p>

      <div className="mt-6 grid gap-3 rounded-2xl border border-line bg-panel p-5 sm:grid-cols-[1.3fr_0.7fr]">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">Hoy sostiene</p>
          <p className="mt-2 font-serif text-5xl">{basket.current}</p>
          <p className="text-muted">{current?.name}</p>
          {current ? (
            <p className="mt-2 text-sm text-faint">{formatPlainPct(current.weight, 2)} del ETF</p>
          ) : null}
        </div>
        <div className="sm:text-right">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">Arranque de la prueba</p>
          <p className="mt-2 font-serif text-3xl">{basket.start}</p>
          <p className="text-muted">{start?.name}</p>
          <p className="mt-3 text-sm text-muted">
            {start && current && start.ticker === current.ticker
              ? `Arrancó en ${start.ticker} y hoy sigue ahí.`
              : `Arrancó en ${basket.start}${start ? ` (${start.name})` : ""}. Hoy sostiene ${basket.current}${current ? ` (${current.name})` : ""}.`}
          </p>
        </div>
      </div>

      <Section eyebrow="Semilla" title="Cómo cerró la ventana" description="Retorno total, CAGR y caída máxima. El mejor buy & hold no trae CAGR ni caída.">
        <MetricCards basket={basket} />
        <div className="mt-4">
          <Readout lines={basketReadout(basket)} />
        </div>
      </Section>

      <Section
        eyebrow="2026"
        title="Día por día, con las rotaciones"
        description="Los seis normalizados a 100, el ETF y el índice de la rotación. Cada trimestre se entra al que más cayó."
      >
        <Year2026Panel basket={basket} />
      </Section>

      <Section
        eyebrow="Años"
        title="Rotación contra el igual peso y el ETF"
        description="Barras y tabla de la semilla. El año en negrita es el mayor de las tres series."
      >
        <YearBars basket={basket} selectedYear={year} onSelectYear={setYear} />
        <div className="mt-4">
          <YearTable basket={basket} selectedYear={year} onSelectYear={setYear} />
        </div>
      </Section>

      <Section eyebrow="Toda la ventana" title="Retorno total, en barras">
        <TotalBars basket={basket} />
      </Section>

      <Section eyebrow="Tenencias" title="El top 6 que se usó para atrás">
        <HoldingsTable basket={basket} />
        <p className="mt-3 text-xs text-muted">Fuente: {basket.source}.</p>
      </Section>

      <div className="mt-10">
        <BiasWarning data={data} />
      </div>

      <details className="mt-8">
        <summary className="cursor-pointer text-sm text-muted">Decimales crudos de esta canasta</summary>
        <p className="mt-2 text-xs text-faint">
          JSON de la semilla, sin reformatear. Un 0.21 es el mismo número que 0.210: el motor no escribe los ceros de la derecha.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-xl bg-canvas p-4 font-mono text-xs leading-relaxed text-muted">
          {JSON.stringify(
            {
              strategy: basket.strategy,
              ewReb: basket.ewReb,
              ewBh: basket.ewBh,
              etf: basket.etf,
              bestBh: basket.bestBh,
              start: basket.start,
              current: basket.current,
              yearByYear: basket.yearByYear,
            },
            null,
            2,
          )}
        </pre>
      </details>
    </div>
  );
}
