import { RulesEditor } from "@/components/RulesEditor.tsx";

export default function RulesPage() {
  return (
    <>
      <h1>Your rules</h1>
      <p className="lead">Write them the way you would tell a person. You see exactly what will be enforced before anything changes.</p>
      <RulesEditor />
    </>
  );
}
