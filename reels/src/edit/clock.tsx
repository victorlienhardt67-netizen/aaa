import React, { createContext, useContext } from "react";

/** Inside a scene: source-seconds → frame local to that scene's <Sequence>. */
type Clock = (src: number) => number;
const Ctx = createContext<Clock>((s) => s * 30);
export const ClockProvider: React.FC<{ clock: Clock; children: React.ReactNode }> = ({ clock, children }) => (
  <Ctx.Provider value={clock}>{children}</Ctx.Provider>
);
export const useAt = () => useContext(Ctx);
