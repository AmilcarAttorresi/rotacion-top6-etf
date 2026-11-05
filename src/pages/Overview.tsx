import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { getBacktest, basketPath, holdingOf, type Basket } from "../data/backtest.ts";
import { formatDate, formatPlainPct, formatYears } from "../lib/format.ts";
import { usePageTitle } from "../lib/hooks.ts";
import { gapSentence, globalReadout } from "../lib/readout.ts";
import { basketAccent } from "../lib/series.ts";
import { BiasWarning, MiniPath, Panel, Readout, RulesPanel, Section, SignedReturn } from "../components/Bits.tsx";
import { CompareBars, YearBars } from "../components/SeedCharts.tsx";
import { SummaryTable } from "../components/Tables.tsx";
import { Year2026Panel } from "../components/Year2026Chart.tsx";

export function Overview() {
  const data = getBacktest();
  usePageTitle("Perdedor - rotacion trimestral del top 6");
  const [activeId, setActiveId] = useState(data.baskets[0]?.id ?? "DIA");
  const active = data.baskets.find((basket) => basket.id === activeId) ?? data.baskets[0];
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-strategy">Top 6</p>
      <h1 className="mt-3 max-w-xl font-serif text-4xl sm:text-6xl">El mayor perdedor se lleva el trimestre que sigue.</h1>
      <p className="mt-4 max-w-xl text-lg text-muted">Ventana {formatDate(data.window.start)} a {formatDate(data.window.end)} ({formatYears(data.window.years)} anos).</p>
      <div className="mt-8"><BiasWarning data={data} /></div>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {data.baskets.map((basket) => <BasketCard key={basket.id} basket={basket} />)}
      </div>
      <Section eyebrow="Lectura" title="Que se ve en los totales">
        <Readout lines={[...data.baskets.map((basket) => gapSentence(basket)), ...globalReadout(data.baskets)]} />
      </Section>
      <Section eyebrow="Comparacion" title="Retorno total de las tres canastas">
        <CompareBars baskets={data.baskets} />
        <div className="mt-4"><SummaryTable baskets={data.baskets} /></div>
      </Section>
      <Section eyebrow="2026" title="El ano en curso, dia por dia">
        {active ? (
          <>
            <div className="mb-4 flex gap-2" role="tablist">
              {data.baskets.map((basket) => (
                <button key={basket.id} type="button" role="tab" aria-selected={basket.id === active.id} onClick={() => setActiveId(basket.id)} className={basket.id === active.id ? "rounded-full bg-ink px-3 py-1.5 text-sm text-canvas" : "rounded-full px-3 py-1.5 text-sm text-muted"}>{basket.id}</button>
              ))}
            </div>
            <Year2026Panel key={active.id} basket={active} />
          </>
        ) : null}
      </Section>
      <Section eyebrow="Ano por ano" title="El camino publicado">
        {active ? <YearBars key={active.id} basket={active} /> : null}
      </Section>
      <Section eyebrow="Metodo" title="La regla">
        <RulesPanel seedRules={data.rules} count={data.baskets[0]?.holdings.length ?? 6} />
      </Section>
    </div>
  );
}

function BasketCard({ basket }: { basket: Basket }) {
  const current = holdingOf(basket, basket.current);
  return (
    <Link to={basketPath(basket.id)} className="flex h-full flex-col rounded-2xl border border-line bg-panel p-4">
      <span className="mb-4 block h-1 rounded-full" style={{ background: basketAccent(basket.index) }} />
      <span className="font-mono text-sm text-faint">{basket.id}</span>
      <span className="mt-4 block text-xs uppercase text-faint">Hoy sostiene</span>
      <span className="font-serif text-4xl">{basket.current}</span>
      <span className="text-sm text-muted">{current?.name}</span>
      <span className="mt-4 block font-mono text-3xl"><SignedReturn value={basket.strategy.total} /></span>
      <span className="text-sm">CAGR {formatPlainPct(basket.strategy.cagr)}</span>
      <MiniPath years={basket.yearByYear} />
      <span className="mt-4 inline-flex items-center gap-1 text-sm text-strategy">Ver el detalle <ArrowRight className="size-4" /></span>
    </Link>
  );
}
