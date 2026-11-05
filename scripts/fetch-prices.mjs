import { writeFileSync } from "node:fs";

const symbols = [
  "AAPL",
  "AMD",
  "AMGN",
  "AMZN",
  "AVGO",
  "CAT",
  "DIA",
  "GOOGL",
  "GS",
  "MSFT",
  "MU",
  "NVDA",
  "QQQ",
  "SPY",
  "UNH",
  "V",
];

const start = Math.floor(Date.UTC(2025, 5, 1) / 1000);
const end = Math.floor(Date.now() / 1000) + 86_400;
const out = {
  source: "Yahoo Finance v8 chart, adjusted close",
  currency: "USD",
  note: "Cierres ajustados de Yahoo Finance. Sirven para reconstruir 2026 y las señales desde el 2T 2025.",
  symbols: {},
};

function utcDate(ts) {
  return new Date(ts * 1000).toISOString().slice(0, 10);
}

for (const symbol of symbols) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${start}&period2=${end}&interval=1d&includeAdjustedClose=true&events=div%7Csplit`;
  const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!response.ok) throw new Error(`${symbol} respondió ${response.status}`);
  const json = await response.json();
  const result = json.chart?.result?.[0];
  const timestamps = result?.timestamp;
  const adjusted = result?.indicators?.adjclose?.[0]?.adjclose;
  if (!timestamps || !adjusted) {
    throw new Error(`${symbol} no trajo cierres ajustados.`);
  }
  const rows = [];
  for (let index = 0; index < timestamps.length; index += 1) {
    const price = adjusted[index];
    if (price == null || !Number.isFinite(price)) continue;
    rows.push({ date: utcDate(timestamps[index]), adj: Math.round(price * 1e6) / 1e6 });
  }
  out.symbols[symbol] = rows;
  console.log(`${symbol} ${rows.length} ${rows[0]?.date} → ${rows.at(-1)?.date}`);
}

const symbolsBySize = Object.entries(out.symbols).sort((a, b) => JSON.stringify(b[1]).length - JSON.stringify(a[1]).length);
const bins = [];
for (const [symbol, rows] of symbolsBySize) {
  const size = JSON.stringify(rows).length;
  const bin = bins.find((item) => item.size + size < 70000);
  if (bin) {
    bin.symbols[symbol] = rows;
    bin.size += size;
  } else {
    bins.push({ symbols: { [symbol]: rows }, size });
  }
}
const dir = new URL("../src/data/prices/", import.meta.url);
for (let index = 0; index < bins.length; index += 1) {
  writeFileSync(
    new URL(`part-${index}.json`, dir),
    JSON.stringify({
      source: out.source,
      currency: out.currency,
      note: out.note,
      symbols: bins[index].symbols,
    }),
  );
}
console.log(`Listo: ${bins.length} archivos en src/data/prices/`);
