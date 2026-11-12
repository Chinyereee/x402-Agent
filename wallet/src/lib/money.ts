// USDC on Stellar has 7 decimals. All amounts are integers in atomic units.
export const UNITS = 10_000_000;

// Two decimals for whole cents, three for sub-cent prices (e.g. $0.002).
export function usd(units: number): string {
  const d = units % (UNITS / 100) === 0 ? 2 : 3;
  return `$${(units / UNITS).toFixed(d)}`;
}

export function toUnits(dollars: number): number {
  return Math.round(dollars * UNITS);
}
