"use client";

import { useRouter } from "next/navigation";
import { Trash2, Wand2 } from "lucide-react";
import { useTemplateStore } from "@/store/templateStore";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDuration } from "@/lib/utils";

export default function TemplatesPage() {
  const router = useRouter();
  const templates = useTemplateStore((s) => s.templates);
  const setPendingTemplate = useTemplateStore((s) => s.setPendingTemplate);
  const deleteTemplate = useTemplateStore((s) => s.deleteTemplate);

  function handleUse(templateId: string) {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;
    setPendingTemplate(template);
    router.push("/studio");
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl text-ink mb-1">Templates de campagne</h1>
        <p className="text-sm text-ink-secondary">
          Structures narratives prédéfinies — pré-remplissent le brief et le nombre de plans recommandé.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {templates.map((template) => (
          <Card key={template.id} className="p-5 flex flex-col">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-display font-bold text-sm text-ink pr-2">{template.name}</h3>
              {template.isCustom && <Badge tone="neutral">Custom</Badge>}
            </div>
            <p className="text-xs text-ink-secondary mb-4 flex-1">{template.description}</p>
            <div className="bg-surface2 border border-border rounded p-3 mb-4">
              <p className="text-[11px] font-mono text-ink-secondary leading-relaxed line-clamp-4">
                {template.structure}
              </p>
            </div>
            <div className="flex items-center justify-between text-xs font-mono text-ink-secondary mb-4">
              <span>{template.recommendedScenes} scènes</span>
              <span>{formatDuration(template.recommendedDuration)}</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => handleUse(template.id)} className="flex-1">
                <Wand2 className="w-3.5 h-3.5" /> Utiliser ce template
              </Button>
              {template.isCustom && (
                <Button size="sm" variant="danger" onClick={() => deleteTemplate(template.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
