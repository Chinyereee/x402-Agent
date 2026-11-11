"use client";

import { useEffect, useRef, useState } from "react";

// Fits a fixed-size board into the available width, so the board keeps its layout on any screen.
export function Scale({ width, height, children }: { width: number; height: number; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(1);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setK(Math.min(1, e.contentRect.width / width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);
  return (
    <div ref={ref} className="lf-scale" style={{ height: height * k }}>
      <div className="lf-board" style={{ width, height, transform: `scale(${k})` }}>{children}</div>
    </div>
  );
}
