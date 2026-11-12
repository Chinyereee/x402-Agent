"use client";

import Link from "next/link";
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
  if (!path.startsWith("/hifi") || path === "/hifi/stage") return null;
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
