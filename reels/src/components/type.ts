import React from "react";
import { C, HELV, POP, SF } from "../lib/tokens";

const grad = (top: string, bottom: string): React.CSSProperties => ({
  backgroundImage: `linear-gradient(180deg, ${top} 18%, ${bottom} 92%)`,
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
});

/** Letter fills: the reference gives every word a soft vertical metallic gradient. */
export const fill = {
  white: grad("#FFFFFF", "#ADADAD"),
  whiteBright: grad("#FFFFFF", "#D9D9D9"),
  lime: grad(C.limeTop, C.limeBottom),
  grey: grad("#F2F2F2", "#7A7A7A"),
  ink: grad("#2A2A2A", "#000000"),
};

/** Roles → families. Strong words: Helvetica Bold. Secondary: SF Pro. Type sequences: Poppins SemiBold. */
export const font = {
  secondary: { fontFamily: SF, fontWeight: 400, fontStyle: "italic", letterSpacing: "-0.02em" },
  secondaryUp: { fontFamily: SF, fontWeight: 500, letterSpacing: "-0.02em" },
  strong: { fontFamily: HELV, fontWeight: 700, letterSpacing: "-0.025em" },
  strongItalic: { fontFamily: HELV, fontWeight: 700, fontStyle: "italic", letterSpacing: "-0.025em" },
  caps: { fontFamily: HELV, fontWeight: 400, textTransform: "uppercase", letterSpacing: "-0.01em" },
  pop: { fontFamily: POP, fontWeight: 600, letterSpacing: "-0.045em" },
} satisfies Record<string, React.CSSProperties>;

export const shadow = "drop-shadow(0 6px 10px rgba(0,0,0,0.55))";
