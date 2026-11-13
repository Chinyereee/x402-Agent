// What the agent can buy on testnet, shared by the workspace and its assistant.
import type { Seller } from "./live.ts";

export type Item = { path: string; what: string; price: string; seller: Seller };

export const CATALOG: Item[] = [
  { path: "/paid/sun-forecast", what: "Sun forecast", price: "$0.001", seller: "main" },
  { path: "/paid/installers", what: "Solar installers", price: "$0.002", seller: "main" },
  { path: "/paid/supplier-prices", what: "Inverter prices", price: "$0.01", seller: "main" },
  { path: "/paid/market-report", what: "Full market report", price: "$0.50", seller: "main" },
  { path: "/api/v1/migrate", what: "Codemod: ethers v5 → v6", price: "$0.05", seller: "engine" },
];

export const byPath = (p: string) => CATALOG.find((i) => i.path === p);
