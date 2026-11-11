import type { Metadata } from "next";
import { Nav } from "@/components/Nav.tsx";
import "./globals.css";

export const metadata: Metadata = {
  title: "Receipts",
  description: "Give your agent an allowance, not your wallet.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  );
}
