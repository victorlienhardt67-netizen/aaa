"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Check, MapPin, RefreshCw, Sparkles } from "lucide-react";
import { useProjectStore } from "@/store/projectStore";
import { useStyleStore } from "@/store/styleStore";
import { useSettingsStore } from "@/store/settingsStore";
import { LocationReference } from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { falGenerateImage } from "@/lib/fal";
import { buildLocationSheetPrompt } from "@/lib/prompts";
import { ImageDownloadButton } from "./ImageDownloadButton";

function LocationCard({ reference }: { reference: LocationReference }) {
  const updateLocationReference = useProjectStore((s) => s.updateLocationReference);
  const apiKeys = useSettingsStore((s) => s.apiKeys);
  const [editing, setEditing] = useState(false);
  const [promptDraft, setPromptDraft] = useState(reference.prompt);
  const [error, setError] = useState<string | undefined>();

  const isGenerating = reference.status === "generating";
  const isValidated = reference.status === "validated";

  async function runGeneration(prompt: string) {
    updateLocationReference(reference.id, { status: "generating" });
    setError(undefined);
    try {
      const result = await falGenerateImage(prompt, "nano_banana", apiKeys.falApiKey);
      updateLocationReference(reference.id, {
        sheetUrl: result.url,
        status: "generated",
        prompt,
      });
    } catch (e) {
      updateLocationReference(reference.id, { status: "pending" });
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    }
  }

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-gold-light flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" /> {reference.name}
        </span>
        <Badge tone={isValidated ? "success" : reference.status === "generated" ? "gold" : "neutral"}>
          {isValidated ? "Validé" : reference.status === "generated" ? "À valider" : isGenerating ? "Génération..." : "En attente"}
        </Badge>
      </div>

      <div className="aspect-video bg-surface2 border border-border rounded overflow-hidden flex items-center justify-center relative">
        {isGenerating && (
          <div className="flex flex-col items-center gap-2 text-ink-secondary">
            <RefreshCw className="w-5 h-5 animate-spin text-gold" />
            <span className="text-[10px] font-mono">génération...</span>
          </div>
        )}
        {!isGenerating && reference.sheetUrl && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={reference.sheetUrl} alt={reference.name} className="w-full h-full object-cover" />
            <ImageDownloadButton url={reference.sheetUrl} filename={`decor-${reference.name}.jpg`} />
          </>
        )}
        {!isGenerating && !reference.sheetUrl && (
          <span className="text-xs text-ink-secondary px-3 text-center">Aucune référence générée</span>
        )}
      </div>

      {!isGenerating && error && (
        <div className="flex items-start gap-1.5 bg-red-950/30 border border-red-900/50 rounded p-2 text-[11px] text-red-400">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {editing ? (
        <div className="space-y-2">
          <Textarea rows={3} value={promptDraft} onChange={(e) => setPromptDraft(e.target.value)} />
          <div className="flex gap-2">
            <Button size="sm" onClick={() => { setEditing(false); runGeneration(promptDraft); }}>
              Régénérer avec ce prompt
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setEditing(false)}>
              Annuler
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-ink-secondary line-clamp-2">{reference.prompt}</p>
      )}

      <div className="flex flex-wrap gap-1.5 pt-1">
        {!reference.sheetUrl && (
          <Button size="sm" onClick={() => runGeneration(reference.prompt)} disabled={isGenerating}>
            <Sparkles className="w-3.5 h-3.5" /> {error ? "Réessayer" : "Générer la référence"}
          </Button>
        )}
        {reference.sheetUrl && !isGenerating && (
          <>
            {isValidated ? (
              <Button size="sm" variant="secondary" disabled>
                <Check className="w-3.5 h-3.5" /> Validé
              </Button>
            ) : (
              <Button size="sm" onClick={() => updateLocationReference(reference.id, { status: "validated" })}>
                <Check className="w-3.5 h-3.5" /> Valider
              </Button>
            )}
            <Button size="sm" variant="secondary" onClick={() => runGeneration(reference.prompt)}>
              <RefreshCw className="w-3.5 h-3.5" /> Régénérer
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
              Modifier le prompt
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}

export function LocationReferences() {
  const currentProject = useProjectStore((s) => s.currentProject);
  const setStatus = useProjectStore((s) => s.setStatus);
  const initLocationReferences = useProjectStore((s) => s.initLocationReferences);
  const styles = useStyleStore((s) => s.styles);
  const style = styles.find((s) => s.id === currentProject?.styleId) ?? styles[0];

  const plan = currentProject?.plan;
  const distinctLocationIds = Array.from(
    new Set((plan?.scenes ?? []).map((s) => s.locationId).filter((id): id is string => !!id))
  );

  useEffect(() => {
    if (!currentProject || distinctLocationIds.length === 0) return;
    const missing = distinctLocationIds.filter((id) => !currentProject.locationReferences?.[id]);
    if (missing.length === 0) return;
    const refs = missing.map((id) => {
      const name = plan?.locationNames?.[id] || "Lieu";
      return {
        id,
        name,
        prompt: buildLocationSheetPrompt(name, style),
        status: "pending" as const,
      };
    });
    initLocationReferences(refs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProject?.id, distinctLocationIds.join(",")]);

  useEffect(() => {
    if (currentProject && distinctLocationIds.length === 0) {
      setStatus("frames");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProject?.id, distinctLocationIds.length]);

  if (!currentProject || !plan || distinctLocationIds.length === 0) return null;

  const references = distinctLocationIds
    .map((id) => ({ id, ref: currentProject.locationReferences?.[id] }))
    .filter((r): r is { id: string; ref: LocationReference } => !!r.ref);
  const allValidated = references.length > 0 && references.every((r) => r.ref.status === "validated");

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-ink mb-1">Références décors</h1>
        <p className="text-sm text-ink-secondary">
          Un lieu détecté dans le script = une référence visuelle validée, réutilisée dans toutes les frames
          situées au même endroit pour garder le décor cohérent.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {references.map(({ id, ref }) => (
          <LocationCard key={id} reference={ref} />
        ))}
      </div>

      <div className="flex justify-end pt-4 border-t border-border">
        <Button onClick={() => setStatus("frames")} disabled={!allValidated}>
          Continuer vers les frames
        </Button>
      </div>
    </div>
  );
}
