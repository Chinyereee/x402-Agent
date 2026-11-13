import { Split } from "@/components/Split.tsx";
import { readRules } from "@/lib/rules-store.ts";
import "./split.css";

export const dynamic = "force-dynamic";

// Demo day: one codemod job seen from both sides at once. Left, Lina's wallet; right, the engine.
export default async function SplitPage() {
  const { rules } = await readRules();
  const repo = (process.env.ENGINE_TEST_REPO || "").replace(/^https:\/\/github\.com\//, "");
  return <Split repo={repo} rules={{ monthly: rules.monthlyBudget, cap: rules.capPerPayment, allow: rules.allow.map((s) => s.name) }} />;
}
