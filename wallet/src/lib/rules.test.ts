import { test } from "node:test";
import assert from "node:assert/strict";
import { check, isComplete, parseRules, type Service } from "./rules.ts";

const codemod: Service = { name: "Codemod engine", payTo: "GENGINE", keywords: ["codemod", "upgrade"] };
const text = "$2 a month, at most $0.25 a payment, only the codemod service";

test("parses Lina's rules", () => {
  const p = parseRules(text, [codemod]);
  assert.equal(p.rules.monthlyBudget, 20_000_000);
  assert.equal(p.rules.capPerPayment, 2_500_000);
  assert.deepEqual(p.rules.allow, [codemod]);
  assert.deepEqual(p.unread, []);
  assert.ok(isComplete(p.rules));
});

test("keeps what it can't read", () => {
  const p = parseRules("$2 a month, never on weekends", [codemod]);
  assert.deepEqual(p.unread, ["never on weekends"]);
  assert.equal(isComplete(p.rules), false);
});

const rules = parseRules(text, [codemod]).rules;
if (!isComplete(rules)) throw new Error("fixture");
const ledger = { paidThisMonth: 500_000, pending: 0 };

test("pays inside the rules", () => {
  assert.equal(check(rules, { payTo: "GENGINE", amount: 500_000, what: "" }, ledger).outcome, "pay");
});

test("asks above the cap", () => {
  assert.equal(check(rules, { payTo: "GENGINE", amount: 4_000_000, what: "" }, ledger).outcome, "ask");
});

test("blocks a service off the list", () => {
  assert.equal(check(rules, { payTo: "GOTHER", amount: 100_000, what: "" }, ledger).outcome, "block");
});

test("pending counts against the budget", () => {
  const nearlySpent = { paidThisMonth: 19_000_000, pending: 600_000 };
  assert.equal(check(rules, { payTo: "GENGINE", amount: 500_000, what: "" }, nearlySpent).outcome, "ask");
});
