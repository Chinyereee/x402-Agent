"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Classic pages are also shown inside the workspace (/ws/*). There, their links stay in the
// workspace instead of jumping out to /hifi.
const MAP: [RegExp, string][] = [
  [/^\/hifi$/, "/ws/home"],
  [/^\/hifi\/rules$/, "/ws/rules"],
  [/^\/hifi\/live$/, "/ws/pay"],
  [/^\/hifi\/split$/, "/ws/job"],
  [/^\/hifi\/receipts\//, "/ws/receipts/"],
];

export function wsHref(href: string) {
  for (const [re, to] of MAP) if (re.test(href)) return href.replace(re, to);
  return href;
}

export function WsLink({ href, ...rest }: React.ComponentProps<typeof Link> & { href: string }) {
  const path = usePathname();
  return <Link href={path.startsWith("/ws") ? wsHref(href) : href} {...rest} />;
}
