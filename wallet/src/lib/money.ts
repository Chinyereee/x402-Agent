// USDC on Stellar has 7 decimals. All amounts are integers in atomic units.
export const UNITS = 10_000_000;

export function usd(units: number): string {
  return `$${(units / UNITS).toFixed(2)}`;
}

export function toUnits(dollars: number): number {
  return Math.round(dollars * UNITS);
}
