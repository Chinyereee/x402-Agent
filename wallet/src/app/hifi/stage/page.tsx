import { Stage } from "@/components/Stage.tsx";
import "./stage.css";

export default async function StagePage({ searchParams }: { searchParams: Promise<{ auto?: string; live?: string }> }) {
  const { auto, live } = await searchParams;
  return (
    <>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&display=swap" precedence="default" />
      <Stage auto={auto === "1"} live={live === "1"} />
    </>
  );
}
