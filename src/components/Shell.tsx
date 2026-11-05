import { useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router";
import { getBacktest } from "../data/backtest.ts";
import { formatDateNumeric, formatYears } from "../lib/format.ts";
import { cn } from "../lib/cn.ts";
import { Logo } from "./Bits.tsx";

const links = [
  { to: "/", label: "Resumen", end: true },
  { to: "/canasta/dia", label: "DIA", end: false },
  { to: "/canasta/qqq", label: "QQQ", end: false },
  { to: "/canasta/spy", label: "SPY", end: false },
];

export function Shell() {
  const data = getBacktest();
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <a className="skip-link" href="#contenido">Saltar al contenido</a>
      <header className="sticky top-0 z-20 border-b border-line/80 bg-canvas/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <NavLink to="/" className="rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-strategy" end>
            <Logo />
          </NavLink>
          <p className="font-mono text-xs text-faint">
            {formatDateNumeric(data.window.start)} – {formatDateNumeric(data.window.end)} · {formatYears(data.window.years)} años
          </p>
        </div>
        <nav className="mx-auto flex w-full max-w-6xl gap-1 overflow-x-auto px-4 pb-3 sm:px-6" aria-label="Canastas">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-strategy",
                  isActive ? "bg-ink text-canvas" : "text-muted hover:text-ink",
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main id="contenido" className="mx-auto w-full min-w-0 max-w-6xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
      <footer className="mx-auto w-full max-w-6xl border-t border-line px-4 py-8 text-sm text-muted sm:px-6">
        <p>No es una recomendación de inversión. Hay sesgo de supervivencia: el top 6 vigente se aplicó a toda la historia.</p>
        <p className="mt-2">Precios de la semilla y de la curva 2026: cierres ajustados de Yahoo Finance. SPY es el proxy del SPX. Alphabet entra solo como GOOGL.</p>
      </footer>
    </>
  );
}
