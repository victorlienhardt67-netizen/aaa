"use client";

import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";
import { fileToBase64 } from "@/lib/storage";

interface DropzoneProps {
  onFiles: (base64Files: string[]) => void;
  multiple?: boolean;
  label?: string;
  hint?: string;
}

export function Dropzone({ onFiles, multiple = true, label = "Glisser-déposer des images", hint }: DropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    const base64s = await Promise.all(files.map(fileToBase64));
    onFiles(base64s);
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "flex flex-col items-center justify-center gap-2 border border-dashed rounded-lg py-8 px-4 cursor-pointer transition-colors",
        dragging ? "border-gold bg-gold/5" : "border-border hover:border-gold/40"
      )}
    >
      <UploadCloud className={cn("w-6 h-6", dragging ? "text-gold" : "text-ink-secondary")} />
      <p className="text-sm text-ink">{label}</p>
      {hint && <p className="text-xs text-ink-secondary">{hint}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
