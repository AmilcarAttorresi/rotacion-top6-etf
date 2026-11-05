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
  usePageTitle("Perdedor — rotación trimestral del top 6");
  const [activeId, setActiveId] = useState(data.baskets[0]?.id ?? "DIA");
  const active = data.baskets.find((basket) => basket.id === activeId) ?? data.baskets[0];

  return (
    <div>
      <div className="grid items-end gap-8 lg:grid-cols-[1.4fr_0.8fr]">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-strategy">Top 6 · trimestre a trimestre</p>
          <h1 className="mt-3 max-w-xl font-serif text-4xl leading-[1.05] text-balance sm:text-6xl">
            El mayor perdedor se lleva el trimestre que sigue.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted text-pretty">
            El capital entero rota, cada trimestre, al papel que más cayó entre los seis más pesados de hoy.
            Esto es lo que hubiera rendido esa regla desde {formatDate(data.window.start)}, con la canasta clavada.
          </p>
        </div>
        <Panel className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 lg:grid-cols-2">
          <div>
            <p className="text-xs text-faint">Desde</p>
            <p className="mt-1 font-medium">{formatDate(data.window.start)}</p>
          </div>
          <div>
            <p className="text-xs text-faint">Hasta</p>
            <p className="mt-1 font-medium">{formatDate(data.window.end)}</p>
          </div>
          <div className="col-span-2 sm:col-span-1 lg:col-span-2">
            <p className="text-xs text-faint">Ventana</p>
            <p className="mt-1 font-mono text-lg">{formatYears(data.window.years)} años</p>
          </div>
        </Panel>
      </div>

      <div className="mt-8">
        <BiasWarning data={data} />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {data.baskets.map((basket) => (
          <BasketCard key={basket.id} basket={basket} />
        ))}
      </div>

      <Section eyebrow="Lectura" title="Qué se ve en los totales" id="lectura">
        <Readout lines={[...data.baskets.map((basket) => gapSentence(basket)), ...globalReadout(data.baskets)]} />
        <p className="mt-3 text-xs text-faint">pp: puntos porcentuales del retorno de toda la ventana, no de la CAGR.</p>
      </Section>

      <Section
        eyebrow="Comparación"
        title="Retorno total de las tres canastas"
        description="Rotación, igual peso rebalanceado cada trimestre y el ETF. Números de la semilla, sin redibujarlos."
      >
        <CompareBars baskets={data.baskets} />
        <div className="mt-4">
          <SummaryTable baskets={data.baskets} />
        </div>
      </Section>

      <Section
        eyebrow="2026"
        title="El año en curso, día por día"
        description="Seis papeles, el ETF y la rotación, en base 100 al cierre de 2025. Las marcas verticales dicen a qué papel se entró en cada trimestre."
      >
        {active ? (
          <>
            <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Canasta del gráfico de 2026">
              {data.baskets.map((basket) => (
                <button
                  key={basket.id}
                  type="button"
                  role="tab"
                  aria-selected={basket.id === active.id}
                  onClick={() => setActiveId(basket.id)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-strategy ${
                    basket.id === active.id ? "bg-ink text-canvas" : "text-muted hover:text-ink"
                  }`}
                >
                  {basket.id}
                </button>
              ))}
            </div>
            <Year2026Panel key={active.id} basket={active} />
          </>
        ) : (
          <p className="text-sm text-muted">No hay canastas en la semilla.</p>
        )}
      </Section>

      <Section
        eyebrow="Año por año"
        title="El camino publicado, no solo el final"
        description="Barras de la semilla. 2026 está marcado cuando el JSON lo trae como año parcial."
      >
        {active ? (
          <>
            <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Canasta del gráfico anual">
              {data.baskets.map((basket) => (
                <button
                  key={basket.id}
                  type="button"
                  role="tab"
                  aria-selected={basket.id === active.id}
                  onClick={() => setActiveId(basket.id)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-strategy ${
                    basket.id === active.id ? "bg-ink text-canvas" : "text-muted hover:text-ink"
                  }`}
                >
                  {basket.id}
                </button>
              ))}
            </div>
            <YearBars key={`years-${active.id}`} basket={active} />
          </>
        ) : null}
      </Section>

      <Section eyebrow="Método" title="La regla, en cuatro líneas">
        <RulesPanel seedRules={data.rules} count={data.baskets[0]?.holdings.length ?? 6} />
      </Section>
    </div>
  );
}

function BasketCard({ basket }: { basket: Basket }) {
  const current = holdingOf(basket, basket.current);
  return (
    <Link
      to={basketPath(basket.id)}
      className="group flex h-full flex-col rounded-2xl border border-line bg-panel p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition hover:-translate-y-0.5 hover:border-strategy/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-strategy"
    >
      <span className="mb-4 block h-1 rounded-full" style={{ background: basketAccent(basket.index) }} />
      <span className="flex items-baseline justify-between gap-3">
        <span className="font-mono text-sm text-faint">{basket.id}</span>
        <span className="text-right text-xs text-muted">{basket.label}</span>
      </span>
      <span className="mt-4 block text-xs uppercase tracking-[0.14em] text-faint">Hoy sostiene</span>
      <span className="mt-1 block font-serif text-4xl">{basket.current}</span>
      <span className="text-sm text-muted">{current?.name}</span>
      <span className="mt-4 block font-mono text-3xl tabular-nums">
        <SignedReturn value={basket.strategy.total} />
      </span>
      <span className="text-xs text-faint">retorno total de la rotación</span>
      <span className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <span>CAGR <span className="font-mono">{formatPlainPct(basket.strategy.cagr)}</span></span>
        <span>Caída <SignedReturn value={basket.strategy.mdd} /></span>
        <span className="text-muted">ETF <SignedReturn value={basket.etf.total} /></span>
        <span className="text-muted">6 EW <SignedReturn value={basket.ewReb.total} /></span>
      </span>
      <span className="mt-4 block">
        <MiniPath years={basket.yearByYear} />
        <span className="text-[11px] text-faint">Años de la rotación</span>
      </span>
      <span className="mt-4 inline-flex items-center gap-1 text-sm text-strategy">
        Ver el detalle
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
