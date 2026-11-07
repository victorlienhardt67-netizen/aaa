import React from "react";
import { TypeText } from "./TypeText";
import { fill, font, shadow } from "./type";

type Role = "sec" | "secInk" | "strong" | "strongLime" | "strongInk" | "strongItalic" | "strongItalicLime" | "caps" | "capsLime";

const roles: Record<Role, React.CSSProperties> = {
  sec: { ...font.secondary, ...fill.white },
  secInk: { ...font.secondary, ...fill.ink },
  strong: { ...font.strong, ...fill.whiteBright },
  strongLime: { ...font.strong, ...fill.lime },
  strongInk: { ...font.strong, ...fill.ink },
  strongItalic: { ...font.strongItalic, ...fill.grey },
  strongItalicLime: { ...font.strongItalic, ...fill.lime },
  caps: { ...font.caps, ...fill.white },
  capsLime: { ...font.caps, ...fill.lime },
};
/**
 * One positioned typographic element of the a8d5 language.
 * x/y = anchor point; align picks which side of the text sits on x.
 */
export const Txt: React.FC<{
  text: string;
  at: number;
  role: Role;
  size: number;
  x: number;
  y: number;
  align?: "left" | "center" | "right";
  out?: number;
  glow?: boolean;
  rate?: number;
}> = ({ text, at, role, size, x, y, align = "left", out, glow, rate }) => {
  const tx = align === "left" ? "0" : align === "center" ? "-50%" : "-100%";
  const dark = role.endsWith("Ink");
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        translate: `${tx} 0`,
        fontSize: size,
        lineHeight: 1,
        whiteSpace: "nowrap",
        filter: glow ? "drop-shadow(0 0 14px rgba(255,255,255,0.95)) drop-shadow(0 0 4px rgba(255,255,255,0.9))" : dark ? undefined : shadow,
      }}
    >
      <TypeText text={text} at={at} out={out} rate={rate} letterStyle={roles[role]} />
    </div>
  );
};
