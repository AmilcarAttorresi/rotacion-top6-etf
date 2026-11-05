import { BrowserRouter, Route, Routes } from "react-router";
import { loaded } from "./data/backtest.ts";
import { DataError, ErrorBoundary } from "./components/Bits.tsx";
import { Shell } from "./components/Shell.tsx";
import { BasketPage } from "./pages/BasketPage.tsx";
import { NotFound } from "./pages/NotFound.tsx";
import { Overview } from "./pages/Overview.tsx";

export default function App() {
  if (!loaded.ok) return <DataError problems={loaded.problems} />;

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route element={<Shell />}>
            <Route index element={<Overview />} />
            <Route path="canasta/:id" element={<BasketPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
