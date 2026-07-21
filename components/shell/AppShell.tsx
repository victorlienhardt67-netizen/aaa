"use client";
import { Sidebar } from "./Sidebar";
import { TabBar } from "./TabBar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: "relative", zIndex: 1, display: "grid", gridTemplateColumns: "var(--sidebar-w) 1fr", height: "100vh" }}>
      <Sidebar />
      <main style={{ display: "flex", flexDirection: "column", minWidth: 0, height: "100vh" }}>
        <TabBar />
        <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>{children}</div>
      </main>
    </div>
  );
}
