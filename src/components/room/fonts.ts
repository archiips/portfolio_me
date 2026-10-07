import localFont from "next/font/local";

// Same rounded face as the 3D menu, for the 2D overlays.
export const sniglet = localFont({
  src: "../../../public/fonts/Sniglet-Regular.ttf",
  display: "swap",
  variable: "--font-sniglet",
});
