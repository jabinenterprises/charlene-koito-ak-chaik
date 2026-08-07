import { rgb } from "pdf-lib";

// A4 portrait, matching the source PDF exactly (595.28 x 841.89 pt).
export const PAGE_WIDTH = 595.28;
export const PAGE_HEIGHT = 841.89;

export const colors = {
  gold: rgb(0.70, 0.55, 0.22),
  darkGold: rgb(0.60, 0.46, 0.15),
  text: rgb(0.12, 0.10, 0.08),
  cream: rgb(0.98, 0.96, 0.93),
  swatchDefault: {
    mocha: rgb(0.52, 0.46, 0.40),
    chocolate: rgb(0.35, 0.24, 0.11),
    caramel: rgb(0.78, 0.52, 0.21),
    gold: rgb(0.77, 0.60, 0.32),
  },
};

// Outer/inner double-border frame used on both pages.
export const frame = {
  outer: { x: 20, y: 20, width: PAGE_WIDTH - 40, height: PAGE_HEIGHT - 40, borderWidth: 2.5 },
  inner: { x: 28, y: 28, width: PAGE_WIDTH - 56, height: PAGE_HEIGHT - 56, borderWidth: 1.2 },
  cornerSize: 24,
  cornerBorderWidth: 1.5,
};
