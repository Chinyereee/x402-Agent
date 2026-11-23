"use client";

import { useEffect, useRef } from "react";

// Gold dust falling over the starry night theme: small glints that drift down, sway and catch the light,
// like the engine's shop front. Only in the dark theme, never for people who ask for reduced motion,
// and it never takes a click (pointer-events: none).
export function FallingGold() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0, raf = 0;
    type P = { x: number; y: number; r: number; vy: number; sway: number; ph: number; tw: number; hue: number };
    let ps: P[] = [];
    const make = (top: boolean): P => ({
      x: Math.random() * W, y: top ? -10 : Math.random() * H, r: 0.5 + Math.random() * 1.5, vy: 0.2 + Math.random() * 0.55,
      sway: 0.4 + Math.random() * 1.1, ph: Math.random() * 6.28, tw: 0.02 + Math.random() * 0.045, hue: Math.random() < 0.8 ? 44 : 32,
    });
    const size = () => {
      W = innerWidth; H = innerHeight;
      c.width = W * dpr; c.height = H * dpr; c.style.width = `${W}px`; c.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(90, (W * H) / 14000));
      ps = Array.from({ length: n }, () => make(false));
    };
    const frame = () => {
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < ps.length; i++) {
        let p = ps[i];
        p.ph += p.tw; p.y += p.vy; p.x += Math.sin(p.ph) * p.sway * 0.35;
        if (p.y > H + 10) ps[i] = p = make(true);
        const glint = 0.4 + 0.6 * Math.max(0, Math.sin(p.ph * 1.7));
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
        g.addColorStop(0, `hsla(${p.hue}, 95%, 80%, ${0.9 * glint})`);
        g.addColorStop(0.35, `hsla(${p.hue}, 85%, 60%, ${0.4 * glint})`);
        g.addColorStop(1, `hsla(${p.hue}, 80%, 50%, 0)`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, 6.283); ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    };
    const sync = () => {
      const on = document.documentElement.dataset.theme === "dark" && !reduce.matches;
      c.style.display = on ? "block" : "none";
      cancelAnimationFrame(raf);
      if (on) { size(); raf = requestAnimationFrame(frame); } else ctx.clearRect(0, 0, W, H);
    };
    const mo = new MutationObserver(sync);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    reduce.addEventListener("change", sync);
    addEventListener("resize", sync);
    sync();
    return () => { mo.disconnect(); reduce.removeEventListener("change", sync); removeEventListener("resize", sync); cancelAnimationFrame(raf); };
  }, []);

  return <canvas ref={ref} aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: 60, pointerEvents: "none", display: "none", mixBlendMode: "screen" }} />;
}
