"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clapperboard, Building2, Palette, FolderClock, LayoutTemplate, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/studio", label: "Studio", icon: Clapperboard },
  { href: "/brands", label: "Marques", icon: Building2 },
  { href: "/styles", label: "Styles", icon: Palette },
  { href: "/projects", label: "Projets", icon: FolderClock },
  { href: "/templates", label: "Templates", icon: LayoutTemplate },
  { href: "/settings", label: "Paramètres", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[240px] shrink-0 h-full bg-surface border-r border-border flex flex-col">
      <div className="h-16 flex items-center gap-2.5 px-5 border-b border-border">
        <div className="w-7 h-7 rounded bg-gold flex items-center justify-center">
          <span className="font-display font-extrabold text-background text-sm">G</span>
        </div>
        <div className="leading-tight">
          <div className="font-display font-bold text-sm text-ink tracking-wide">GOLDDUST</div>
          <div className="text-[10px] font-mono text-ink-secondary tracking-widest">STUDIO</div>
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-colors",
                active
                  ? "bg-gold/10 text-gold-light border border-gold/30"
                  : "text-ink-secondary border border-transparent hover:text-ink hover:bg-surface2"
              )}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <p className="text-[11px] font-mono text-ink-secondary leading-relaxed">
          Usage interne · sans authentification
        </p>
      </div>
    </aside>
  );
}
