import type { Metadata } from "next";
import { Nav } from "@/components/Nav.tsx";
import { THEME_SCRIPT } from "@/components/ThemeToggle.tsx";
import "./globals.css";
import "./night.css";

export const metadata: Metadata = {
  title: "Receipts",
  description: "Give your agent an allowance, not your wallet.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&display=swap"
        />
      </head>
      <body>
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  );
}
