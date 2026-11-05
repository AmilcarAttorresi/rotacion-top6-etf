import type { Basket } from "../data/backtest.ts";
import { basketPath, weightSum } from "../data/backtest.ts";
import { formatPlainPct, formatPp } from "../lib/format.ts";
import { Link } from "react-router";
import { Panel, SignedPp, SignedReturn } from "./Bits.tsx";

export function YearTable({
  basket,
  selectedYear,
  onSelectYear,
}: {
  basket: Basket;
  selectedYear: number | null;
  onSelectYear: (year: number | null) => void;
}) {
  return (
    <Panel className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <caption className="px-4 py-3 text-left text-xs text-muted">
            Mismos años que la semilla, pasados a porcentaje. «vs EW» y «vs ETF» son la resta en puntos porcentuales: no vienen como columnas del JSON.
          </caption>
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-faint">
              <th scope="col" className="sticky left-0 bg-panel px-4 py-2 font-medium">Año</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Rotación</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">6 EW reb.</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">ETF</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">vs EW</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">vs ETF</th>
              <th scope="col" className="px-4 py-2 font-medium">Nota</th>
            </tr>
          </thead>
          <tbody>
            {basket.yearByYear.map((row) => {
              const best = Math.max(row.strategy, row.ewReb, row.etf);
              const selected = selectedYear === row.year;
              return (
                <tr key={row.year} id={`fila-${basket.id}-${row.year}`} className={selected ? "bg-strategy/10" : undefined}>
                  <th scope="row" className={`sticky left-0 px-4 py-2 text-left font-mono ${selected ? "bg-panel-2" : "bg-panel"}`}>
                    <button
                      type="button"
                      aria-pressed={selected}
                      className="underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-strategy"
                      onClick={() => onSelectYear(selected ? null : row.year)}
                    >
                      {row.note ? `${row.year}*` : row.year}
                    </button>
                  </th>
                  <td className={`px-3 py-2 text-right ${row.strategy === best ? "font-semibold" : ""}`}>
                    <SignedReturn value={row.strategy} />
                  </td>
                  <td className={`px-3 py-2 text-right ${row.ewReb === best ? "font-semibold" : ""}`}>
                    <SignedReturn value={row.ewReb} />
                  </td>
                  <td className={`px-3 py-2 text-right ${row.etf === best ? "font-semibold" : ""}`}>
                    <SignedReturn value={row.etf} />
                  </td>
                  <td className="px-3 py-2 text-right"><SignedPp value={row.strategy - row.ewReb} /></td>
                  <td className="px-3 py-2 text-right"><SignedPp value={row.strategy - row.etf} /></td>
                  <td className="px-4 py-2 text-muted">{row.note ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

export function HoldingsTable({ basket }: { basket: Basket }) {
  const max = Math.max(...basket.holdings.map((holding) => holding.weight), 0.0001);
  return (
    <Panel className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <caption className="px-4 py-3 text-left text-xs text-muted">
            El porcentaje es el peso dentro del ETF. La barra está escalada a la tenencia más pesada de este top.
            La rotación no usa estos pesos: va 100% a un solo papel.
          </caption>
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-faint">
              <th scope="col" className="px-4 py-2 font-medium">Papel</th>
              <th scope="col" className="px-3 py-2 font-medium">Nombre</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Peso en el ETF</th>
              <th scope="col" className="px-4 py-2 font-medium">Rol</th>
            </tr>
          </thead>
          <tbody>
            {basket.holdings.map((holding) => {
              const current = holding.ticker === basket.current;
              const start = holding.ticker === basket.start;
              return (
                <tr key={holding.ticker} className={current ? "bg-strategy/10" : undefined}>
                  <th scope="row" className="px-4 py-3 text-left font-mono text-base">{holding.ticker}</th>
                  <td className="px-3 py-3">
                    <div>{holding.name}</div>
                    <div className="mt-2 h-1.5 w-full max-w-40 rounded-full bg-panel-2" aria-hidden>
                      <div className="h-full rounded-full bg-strategy" style={{ width: `${(holding.weight / max) * 100}%` }} />
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right font-mono tabular-nums">{formatPlainPct(holding.weight, 2)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {current ? (
                        <span className="rounded-full bg-strategy px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-canvas">
                          Hoy sostiene
                        </span>
                      ) : null}
                      {start ? (
                        <span className="rounded-full border border-line px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted">
                          Arranque
                        </span>
                      ) : null}
                      {!current && !start ? <span className="text-faint">—</span> : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-line">
              <th scope="row" className="px-4 py-3 text-left font-medium" colSpan={2}>Peso conjunto del top</th>
              <td className="px-3 py-3 text-right font-mono tabular-nums">{formatPlainPct(weightSum(basket), 2)}</td>
              <td className="px-4 py-3 text-xs text-muted">No suma 100: es solo el top, no el ETF entero.</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Panel>
  );
}

export function SummaryTable({ baskets }: { baskets: readonly Basket[] }) {
  return (
    <Panel className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] border-collapse text-sm">
          <caption className="px-4 py-3 text-left text-xs text-muted">Los mismos totales de la semilla, en números.</caption>
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-faint">
              <th scope="col" className="sticky left-0 bg-panel px-4 py-2 font-medium">Canasta</th>
              <th scope="col" className="px-3 py-2 font-medium">Hoy sostiene</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Rotación</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">CAGR</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Caída máx.</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">6 EW reb.</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">ETF</th>
              <th scope="col" className="px-4 py-2 text-right font-medium">Mejor B&H</th>
            </tr>
          </thead>
          <tbody>
            {baskets.map((basket) => (
              <tr key={basket.id} className="border-b border-line/70">
                <th scope="row" className="sticky left-0 bg-panel px-4 py-3 text-left">
                  <Link to={basketPath(basket.id)} className="font-medium underline-offset-4 hover:underline">
                    {basket.id}
                  </Link>
                </th>
                <td className="px-3 py-3 font-mono">{basket.current}</td>
                <td className="px-3 py-3 text-right"><SignedReturn value={basket.strategy.total} /></td>
                <td className="px-3 py-3 text-right font-mono tabular-nums">{formatPlainPct(basket.strategy.cagr)}</td>
                <td className="px-3 py-3 text-right"><SignedReturn value={basket.strategy.mdd} /></td>
                <td className="px-3 py-3 text-right"><SignedReturn value={basket.ewReb.total} /></td>
                <td className="px-3 py-3 text-right"><SignedReturn value={basket.etf.total} /></td>
                <td className="px-4 py-3 text-right font-mono">
                  {basket.bestBh.ticker} <SignedReturn value={basket.bestBh.total} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="sr-only">Diferencias en puntos porcentuales, por ejemplo {formatPp(0)}.</p>
    </Panel>
  );
}
