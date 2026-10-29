import type React from "react";
import type { CapSpec } from "../components/Captions";
import type { Zoom } from "../scenes/FaceCam";

/** One block of the plan, starting at a SOURCE time; it lasts until the next block starts. */
export type Scene =
  | { kind: "fc"; from: number; caps: CapSpec[]; zooms?: Zoom[]; extra?: React.ReactNode; card?: { at: number; out: number }; capY?: number }
  | { kind: "md" | "tx"; from: number; node: React.ReactNode };
