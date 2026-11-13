"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/hifi", label: "Home" },
  { href: "/hifi/rules", label: "Rules" },
  { href: "/hifi/console", label: "Demo console" },
  { href: "/hifi/live", label: "Live" },
  { href: "/", label: "Lo-fi" },
];

// The prototype's nav lives under /hifi only; the lo-fi board at / stands on its own.
export function Nav() {
  const path = usePathname();
  // Opened inside the workspace's app area (an iframe): the workspace has its own navigation.
  const [embedded, setEmbedded] = useState(false);
  useEffect(() => setEmbedded(window.self !== window.top), []);
  if (embedded || !path.startsWith("/hifi") || path === "/hifi/stage" || path === "/hifi/split") return null;
  return (
    <header className="top">
      <Link href="/hifi" className="brand">
        <span className="mark">R</span> Receipts
      </Link>
      <nav className="nav">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className={path === l.href ? "on" : ""}>
            {l.label}
          </Link>
        ))}
      </nav>
      <span className="proto">{["/hifi", "/hifi/live", "/hifi/rules"].includes(path) || path.startsWith("/hifi/receipts") ? "Stellar testnet · real x402 payments with test money" : "Prototype · sample data, no real payments"}</span>
    </header>
  );
}
