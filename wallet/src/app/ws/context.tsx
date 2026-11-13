"use client";

import { createContext, useContext, useEffect, useState } from "react";

// Conversations live in this browser for now (one shared demo user); swap for a store later.
export type Tab = { id: string; title: string; src: string };
export type Item =
  | { k: "user"; text: string }
  | { k: "ai"; text: string; via: "ai" | "rules" }
  | { k: "buy"; path: string; state?: "done" }
  | { k: "rules"; text: string; state?: "done" }
  | { k: "decide"; id: string; what: string; amount: string; state?: "allowed" | "declined" }
  | { k: "tool"; label: string; tone: "ok" | "warn" | "bad"; tab?: Tab }
  | { k: "error"; text: string };
export type Thread = { id: string; title: string; at: number; items: Item[] };

type Ctx = {
  threads: Thread[];
  setThreads: React.Dispatch<React.SetStateAction<Thread[]>>;
  current: string | null;
  setCurrent: (id: string | null) => void;
  appOpen: boolean;
  setAppOpen: (v: boolean) => void;
};
const WsContext = createContext<Ctx | null>(null);
const KEY = "ws-threads";

export function WsProvider({ children }: { children: React.ReactNode }) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [current, setCurrent] = useState<string | null>(null);
  const [appOpen, setAppOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      setThreads(JSON.parse(localStorage.getItem(KEY) || "[]"));
    } catch {
      /* private window: start empty */
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(threads.slice(0, 40)));
    } catch {
      /* ignore */
    }
  }, [threads, loaded]);
  return <WsContext.Provider value={{ threads, setThreads, current, setCurrent, appOpen, setAppOpen }}>{children}</WsContext.Provider>;
}

export function useWs() {
  const c = useContext(WsContext);
  if (!c) throw new Error("useWs outside WsProvider");
  return c;
}
