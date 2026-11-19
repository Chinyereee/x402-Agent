"use client";

import { useEffect, useRef } from "react";

// Gold dust drifting down behind a new conversation: a few dozen fine flecks, swaying and
// twinkling. Still flecks only when the visitor prefers reduced motion; paused in a hidden tab.
export function GoldDust({ count = 42 }: { count?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0, raf = 0;
    const size = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    const flecks = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 0.6 + Math.random() * 1.6,
      vy: 0.12 + Math.random() * 0.35,
      sway: 0.3 + Math.random() * 0.9,
      phase: Math.random() * Math.PI * 2,
      tw: 0.6 + Math.random() * 1.4,
    }));
    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      for (const f of flecks) {
        if (!still) {
          f.y += f.vy;
          f.x += Math.sin(t / 1800 + f.phase) * f.sway * 0.15;
          if (f.y > h + 4) { f.y = -4; f.x = Math.random() * w; }
        }
        const glow = 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(t / 700 * f.tw + f.phase));
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(201, 162, 82, ${glow})`;
        ctx.shadowColor = "rgba(236, 205, 128, 0.8)";
        ctx.shadowBlur = f.r * 3;
        ctx.fill();
      }
      if (!still) raf = requestAnimationFrame(draw);
    };
    const onVis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    window.addEventListener("resize", size);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", size);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [count]);
  return <canvas ref={ref} className="gold-dust" aria-hidden="true" />;
}
