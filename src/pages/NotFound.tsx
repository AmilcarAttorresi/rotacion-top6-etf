import { Link } from "react-router";
import { usePageTitle } from "../lib/hooks.ts";

export function NotFound() {
  usePageTitle("No está — Perdedor");
  return (
    <div className="py-10">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-faint">404</p>
      <h1 className="mt-2 font-serif text-4xl">Esa canasta no está.</h1>
      <p className="mt-3 max-w-md text-muted">El tablero tiene DIA, QQQ y SPY. Volvé al resumen y elegí una.</p>
      <Link
        to="/"
        className="mt-6 inline-flex rounded-full bg-strategy px-4 py-2 text-sm font-semibold text-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-strategy"
      >
        Volvé al resumen
      </Link>
    </div>
  );
}
