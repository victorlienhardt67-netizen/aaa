"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, FolderOpen, Trash2 } from "lucide-react";
import { useProjectStore } from "@/store/projectStore";
import { useBrandStore } from "@/store/brandStore";
import { useStyleStore } from "@/store/styleStore";
import { ProjectStatus } from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { formatCost, formatDate } from "@/lib/utils";

const STATUS_LABELS: Record<ProjectStatus, string> = {
  brief: "Brief",
  brief_chat: "Co-construction",
  analyzing: "Analyse",
  plan_ready: "Plan prêt",
  characters: "Personnages",
  locations: "Décors",
  frames: "Frames",
  videos: "Vidéos",
  export: "Export",
  completed: "Terminé",
};

export default function ProjectsPage() {
  const router = useRouter();
  const projects = useProjectStore((s) => s.projects);
  const loadProject = useProjectStore((s) => s.loadProject);
  const duplicateProject = useProjectStore((s) => s.duplicateProject);
  const deleteProject = useProjectStore((s) => s.deleteProject);
  const brands = useBrandStore((s) => s.brands);
  const styles = useStyleStore((s) => s.styles);

  const [brandFilter, setBrandFilter] = useState("all");
  const [styleFilter, setStyleFilter] = useState("all");
  const [langFilter, setLangFilter] = useState("all");

  const filtered = useMemo(
    () =>
      projects.filter(
        (p) =>
          (brandFilter === "all" || p.brandId === brandFilter) &&
          (styleFilter === "all" || p.styleId === styleFilter) &&
          (langFilter === "all" || p.lang === langFilter)
      ),
    [projects, brandFilter, styleFilter, langFilter]
  );

  function handleOpen(id: string) {
    loadProject(id);
    router.push("/studio");
  }

  function handleDuplicate(id: string) {
    duplicateProject(id);
  }

  function handleDelete(id: string, name: string) {
    if (confirm(`Supprimer le projet "${name}" ?`)) deleteProject(id);
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl text-ink mb-1">Historique des projets</h1>
        <p className="text-sm text-ink-secondary">Retrouvez, dupliquez ou supprimez vos productions passées.</p>
      </div>

      <div className="flex gap-3 mb-6">
        <Select
          value={brandFilter}
          onChange={(e) => setBrandFilter(e.target.value)}
          options={[{ value: "all", label: "Toutes les marques" }, ...brands.map((b) => ({ value: b.id, label: b.name }))]}
          className="max-w-[220px]"
        />
        <Select
          value={styleFilter}
          onChange={(e) => setStyleFilter(e.target.value)}
          options={[{ value: "all", label: "Tous les styles" }, ...styles.map((s) => ({ value: s.id, label: s.name }))]}
          className="max-w-[220px]"
        />
        <Select
          value={langFilter}
          onChange={(e) => setLangFilter(e.target.value)}
          options={[
            { value: "all", label: "Toutes les langues" },
            { value: "fr", label: "Français" },
            { value: "en", label: "English" },
          ]}
          className="max-w-[180px]"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg py-20 text-center text-sm text-ink-secondary">
          Aucun projet trouvé.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((project) => {
            const brand = brands.find((b) => b.id === project.brandId);
            const style = styles.find((s) => s.id === project.styleId);
            return (
              <Card key={project.id} className="p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-display font-bold text-sm text-ink truncate">{project.name}</h3>
                    <Badge tone="gold">{STATUS_LABELS[project.status]}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-ink-secondary font-mono">
                    <span>{brand?.name ?? "Marque supprimée"}</span>
                    <span>·</span>
                    <span>{style?.name ?? "Style supprimé"}</span>
                    <span>·</span>
                    <span>{project.lang.toUpperCase()}</span>
                    <span>·</span>
                    <span>{project.plan?.scenes.length ?? 0} scènes</span>
                    <span>·</span>
                    <span>{formatCost(project.totalCostEstimate)}</span>
                    <span>·</span>
                    <span>{formatDate(project.updatedAt)}</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="secondary" onClick={() => handleOpen(project.id)}>
                    <FolderOpen className="w-3.5 h-3.5" /> Rouvrir
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDuplicate(project.id)}>
                    <Copy className="w-3.5 h-3.5" /> Dupliquer
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(project.id, project.name)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
