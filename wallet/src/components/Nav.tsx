"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/rules", label: "Rules" },
  { href: "/console", label: "Demo console" },
  { href: "/lofi", label: "Lo-fi" },
];

export function Nav() {
  const path = usePathname();
  return (
    <header className="top">
      <Link href="/" className="brand">
        <span className="mark">R</span> Receipts
      </Link>
      <nav className="nav">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className={path === l.href ? "on" : ""}>
            {l.label}
          </Link>
        ))}
      </nav>
      <span className="proto">Prototype · sample data, no real payments</span>
    </header>
  );
}
