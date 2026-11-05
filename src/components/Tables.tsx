import type { Basket } from "../data/backtest.ts";
import { basketPath, weightSum } from "../data/backtest.ts";
import { formatPlainPct } from "../lib/format.ts";
import { Link } from "react-router";
import { Panel, SignedPp, SignedReturn } from "./Bits.tsx";

export function YearTable({ basket, selectedYear, onSelectYear }: { basket: Basket; selectedYear: number | null; onSelectYear: (year: number | null) => void }) {
  return (
    <Panel className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase text-faint">
              <th className="px-4 py-2">Ano</th><th className="px-3 py-2 text-right">Rotacion</th><th className="px-3 py-2 text-right">6 EW</th><th className="px-3 py-2 text-right">ETF</th><th className="px-3 py-2 text-right">vs EW</th><th className="px-4 py-2">Nota</th>
            </tr>
          </thead>
          <tbody>
            {basket.yearByYear.map((row) => (
              <tr key={row.year} className={selectedYear === row.year ? "bg-strategy/10" : undefined}>
                <th className="px-4 py-2 text-left"><button type="button" onClick={() => onSelectYear(selectedYear === row.year ? null : row.year)}>{row.note ? `${row.year}*` : row.year}</button></th>
                <td className="px-3 py-2 text-right"><SignedReturn value={row.strategy} /></td>
                <td className="px-3 py-2 text-right"><SignedReturn value={row.ewReb} /></td>
                <td className="px-3 py-2 text-right"><SignedReturn value={row.etf} /></td>
                <td className="px-3 py-2 text-right"><SignedPp value={row.strategy - row.ewReb} /></td>
                <td className="px-4 py-2 text-muted">{row.note ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

export function HoldingsTable({ basket }: { basket: Basket }) {
  return (
    <Panel className="overflow-hidden">
      <table className="w-full text-sm">
        <tbody>
          {basket.holdings.map((holding) => (
            <tr key={holding.ticker} className={holding.ticker === basket.current ? "bg-strategy/10" : undefined}>
              <th className="px-4 py-3 text-left font-mono">{holding.ticker}</th>
              <td className="px-3 py-3">{holding.name}</td>
              <td className="px-3 py-3 text-right font-mono">{formatPlainPct(holding.weight, 2)}</td>
              <td className="px-4 py-3">{holding.ticker === basket.current ? "Hoy sostiene" : holding.ticker === basket.start ? "Arranque" : ""}</td>
            </tr>
          ))}
        </tbody>
        <tfoot><tr><td className="px-4 py-3" colSpan={2}>Peso conjunto</td><td className="px-3 py-3 text-right font-mono">{formatPlainPct(weightSum(basket), 2)}</td><td /></tr></tfoot>
      </table>
    </Panel>
  );
}

export function SummaryTable({ baskets }: { baskets: readonly Basket[] }) {
  return (
    <Panel className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <tbody>
          {baskets.map((basket) => (
            <tr key={basket.id} className="border-b border-line">
              <th className="px-4 py-3 text-left"><Link to={basketPath(basket.id)}>{basket.id}</Link></th>
              <td className="px-3 py-3 font-mono">{basket.current}</td>
              <td className="px-3 py-3 text-right"><SignedReturn value={basket.strategy.total} /></td>
              <td className="px-3 py-3 text-right font-mono">{formatPlainPct(basket.strategy.cagr)}</td>
              <td className="px-4 py-3 text-right">{basket.bestBh.ticker} <SignedReturn value={basket.bestBh.total} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}
