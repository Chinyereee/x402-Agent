import { RulesEditor } from "@/components/RulesEditor.tsx";
import { readRules, services } from "@/lib/rules-store.ts";

export const dynamic = "force-dynamic";

export default async function RulesPage() {
  const stored = await readRules();
  return (
    <>
      <h1>Your rules</h1>
      <p className="lead">Write them the way you would tell a person. You see exactly what will be enforced before anything changes.</p>
      <RulesEditor initialText={stored.text} services={services()} confirmedAt={stored.confirmedAt} />
    </>
  );
}
