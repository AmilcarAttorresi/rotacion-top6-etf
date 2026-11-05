const signed = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  signDisplay: "exceptZero",
});

const plain = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function formatReturn(decimal: number): string {
  return `${signed.format(decimal * 100)}%`;
}

export function formatPlainPct(decimal: number, digits = 1): string {
  return `${new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(decimal * 100)}%`;
}

export function formatPercentUnits(value: number): string {
  return `${signed.format(value)}%`;
}

export function formatAxisPercent(value: number): string {
  return `${new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 0,
  }).format(value)}%`;
}

export function formatIndex(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

export function ppNumber(deltaDecimal: number): number {
  return Math.round(Math.abs(deltaDecimal) * 1000) / 10;
}

export function formatPp(deltaDecimal: number): string {
  const magnitude = ppNumber(deltaDecimal);
  const value = deltaDecimal < 0 ? -magnitude : magnitude;
  return `${signed.format(value)} pp`;
}

export function formatPpAbs(deltaDecimal: number): string {
  return `${plain.format(ppNumber(deltaDecimal))} pp`;
}

export function formatYears(years: number): string {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(years);
}

export function formatGrewTo(totalReturn: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  }).format(1 + totalReturn);
}

function dateFromIso(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1));
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(dateFromIso(iso));
}

export function formatDateNumeric(iso: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(dateFromIso(iso));
}

export function formatMonthTick(iso: string): string {
  const month = Number(iso.slice(5, 7));
  const names = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return names[month - 1] ?? iso;
}

export function toneClass(value: number): string {
  if (value > 0) return "text-up";
  if (value < 0) return "text-down";
  return "text-muted";
}

export function joinList(items: readonly string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0] ?? "";
  const head = items.slice(0, -1).join(", ");
  const tail = items[items.length - 1] ?? "";
  return `${head} y ${tail}`;
}
