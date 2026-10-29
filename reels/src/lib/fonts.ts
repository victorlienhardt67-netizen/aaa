import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";
import { HELV, POP, SF } from "./tokens";

const faces: [string, string, string, string][] = [
  [HELV, "fonts/NimbusSans-Regular.otf", "400", "normal"],
  [HELV, "fonts/NimbusSans-Italic.otf", "400", "italic"],
  [HELV, "fonts/NimbusSans-Bold.otf", "700", "normal"],
  [HELV, "fonts/NimbusSans-BoldItalic.otf", "700", "italic"],
  [SF, "fonts/Inter-Regular.otf", "400", "normal"],
  [SF, "fonts/Inter-Italic.otf", "400", "italic"],
  [SF, "fonts/Inter-Medium.otf", "500", "normal"],
  [SF, "fonts/Inter-MediumItalic.otf", "500", "italic"],
  [SF, "fonts/Inter-SemiBold.otf", "600", "normal"],
  [POP, "fonts/Poppins-600.ttf", "600", "normal"],
  [POP, "fonts/Poppins-600i.ttf", "600", "italic"],
];

export const fontsReady = Promise.all(
  faces.map(([family, file, weight, style]) => loadFont({ family, url: staticFile(file), weight, style })),
);
