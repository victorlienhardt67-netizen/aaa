"use client";

import { useState } from "react";
import { Download, GripVertical, PackageCheck, Save } from "lucide-react";
import { useProjectStore } from "@/store/projectStore";
import { useBrandStore } from "@/store/brandStore";
import { useStyleStore } from "@/store/styleStore";
import { useTemplateStore } from "@/store/templateStore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input, Label } from "@/components/ui/Input";
import { formatCost, formatDate } from "@/lib/utils";

function downloadUrl(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.target = "_blank";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function ExportPanel() {
  const currentProject = useProjectStore((s) => s.currentProject);
  const reorderScenes = useProjectStore((s) => s.reorderScenes);
  const saveCurrentProject = useProjectStore((s) => s.saveCurrentProject);
  const setStatus = useProjectStore((s) => s.setStatus);
  const clearCurrentProject = useProjectStore((s) => s.clearCurrentProject);
  const brand = useBrandStore((s) => s.brands.find((b) => b.id === currentProject?.brandId));
  const style = useStyleStore((s) => s.styles.find((st) => st.id === currentProject?.styleId));
  const addCustomTemplate = useTemplateStore((s) => s.addCustomTemplate);

  const [dragId, setDragId] = useState<string | null>(null);
  const [zipping, setZipping] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");

  const plan = currentProject?.plan;
  if (!currentProject || !plan) return null;

  const project = currentProject;
  const scenes = plan.scenes;

  function handleDrop(targetId: string) {
    if (!dragId || dragId === targetId) return;
    const ids = scenes.map((s) => s.id);
    const fromIdx = ids.indexOf(dragId);
    const toIdx = ids.indexOf(targetId);
    ids.splice(toIdx, 0, ids.splice(fromIdx, 1)[0]);
    reorderScenes(ids);
    setDragId(null);
  }

  async function handleDownloadAll() {
    setZipping(true);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      await Promise.all(
        scenes.map(async (scene, i) => {
          if (!scene.videoUrl) return;
          try {
            const res = await fetch(scene.videoUrl);
            const blob = await res.blob();
            zip.file(`scene-${String(i + 1).padStart(2, "0")}.mp4`, blob);
          } catch {
            // ignore fetch errors for individual files (CORS / réseau)
          }
        })
      );
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      downloadUrl(url, `${project.name || "golddust-export"}.zip`);
      URL.revokeObjectURL(url);
    } catch {
      alert("Le téléchargement en ZIP a échoué (probablement un blocage réseau) — téléchargez les vidéos individuellement.");
    } finally {
      setZipping(false);
    }
  }

  function handleFinish() {
    setStatus("completed");
    saveCurrentProject();
  }

  function handleSaveTemplate() {
    if (!templateName.trim()) return;
    addCustomTemplate({
      name: templateName,
      description: `Template dérivé du projet "${project.name}"`,
      structure: project.brief,
      recommendedScenes: scenes.length,
      recommendedDuration: project.targetDuration,
    });
    setTemplateModalOpen(false);
    setTemplateName("");
  }

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-ink mb-1">Export & récapitulatif</h1>
        <p className="text-sm text-ink-secondary">Réorganisez les scènes, exportez et sauvegardez votre pipeline.</p>
      </div>

      <Card className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <p className="text-[10px] font-mono uppercase text-ink-secondary mb-1">Marque</p>
          <p className="text-sm text-ink">{brand?.name ?? "—"}</p>
        </div>
        <div>
          <p className="text-[10px] font-mono uppercase text-ink-secondary mb-1">Style</p>
          <p className="text-sm text-ink">{style?.name ?? "—"}</p>
        </div>
        <div>
          <p className="text-[10px] font-mono uppercase text-ink-secondary mb-1">Langue</p>
          <p className="text-sm text-ink">{currentProject.lang.toUpperCase()}</p>
        </div>
        <div>
          <p className="text-[10px] font-mono uppercase text-ink-secondary mb-1">Scènes</p>
          <p className="text-sm text-ink">{scenes.length}</p>
        </div>
        <div>
          <p className="text-[10px] font-mono uppercase text-ink-secondary mb-1">Coût total estimé</p>
          <p className="text-sm text-gold-light font-mono">{formatCost(currentProject.totalCostEstimate)}</p>
        </div>
        <div>
          <p className="text-[10px] font-mono uppercase text-ink-secondary mb-1">Généré le</p>
          <p className="text-sm text-ink">{formatDate(currentProject.updatedAt)}</p>
        </div>
      </Card>

      <div className="space-y-2">
        {scenes.map((scene) => (
          <Card
            key={scene.id}
            draggable
            onDragStart={() => setDragId(scene.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(scene.id)}
            className="p-3 flex items-center gap-3 cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="w-4 h-4 text-ink-secondary shrink-0" />
            <div className="w-12 aspect-[9/16] bg-surface2 border border-border rounded overflow-hidden shrink-0">
              {scene.frameUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={scene.frameUrl} alt="frame" className="w-full h-full object-cover" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-mono text-xs text-gold-light">#{scene.index}</span>
                <Badge tone="success">Prêt</Badge>
              </div>
              <p className="text-xs text-ink-secondary truncate">{scene.description}</p>
            </div>
            {scene.videoUrl && (
              <video src={scene.videoUrl} className="w-24 h-14 rounded object-cover shrink-0" muted />
            )}
            <Button
              size="sm"
              variant="secondary"
              onClick={() => scene.videoUrl && downloadUrl(scene.videoUrl, `scene-${scene.index}.mp4`)}
            >
              <Download className="w-3.5 h-3.5" />
            </Button>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleDownloadAll} disabled={zipping}>
            <PackageCheck className="w-4 h-4" /> {zipping ? "Compression..." : "Télécharger tout en ZIP"}
          </Button>
          <Button variant="secondary" onClick={() => setTemplateModalOpen(true)}>
            <Save className="w-4 h-4" /> Sauvegarder comme template
          </Button>
        </div>
        <Button
          onClick={() => {
            handleFinish();
            clearCurrentProject();
          }}
        >
          Terminer le projet
        </Button>
      </div>

      <Modal open={templateModalOpen} onClose={() => setTemplateModalOpen(false)} title="Sauvegarder comme template">
        <div className="space-y-4">
          <div>
            <Label>Nom du template</Label>
            <Input value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="ex : Ad Lynae — Hook produit" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setTemplateModalOpen(false)}>Annuler</Button>
            <Button onClick={handleSaveTemplate}>Sauvegarder</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
