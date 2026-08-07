import fs from "fs";
import path from "path";
import QRCode from "qrcode";
import { PAGE_WIDTH, colors, frame } from "./styles.js";

export function drawCenteredText(page, text, y, font, size, color = colors.text) {
  const width = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: (PAGE_WIDTH - width) / 2, y, size, font, color });
  return width;
}

/** Wraps text to fit maxWidth, centering each resulting line. Returns the y after the last line. */
export function drawWrappedCenteredText(page, text, startY, font, size, color, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  let y = startY;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
      drawCenteredText(page, line, y, font, size, color);
      y -= lineHeight;
      line = word;
    } else {
      line = test;
    }
  }
  if (line) {
    drawCenteredText(page, line, y, font, size, color);
    y -= lineHeight;
  }
  return y;
}

/**
 * Draws the page background and border design.
 * Checks for a border design image asset (e.g. public/elements/border-design.png).
 * If found, embeds and renders it at full page size.
 * Otherwise, draws the vector double-rule border and corner brackets placeholder.
 */
export async function drawPageFrame(page, pdfDoc = null, pageNumber = 1) {
  // Fill background with cream tone
  page.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: page.getHeight(), color: colors.cream });

  let borderEmbedded = false;

  if (pdfDoc) {
    const candidates = [
      path.join(process.cwd(), "public", "elements", "border-design.png"),
      path.join(process.cwd(), "public", "elements", `border-design-page${pageNumber}.png`),
      path.join(process.cwd(), "public", "elements", "border.png"),
      path.join(process.cwd(), "public", "border-design.png"),
      path.join(process.cwd(), "public", "border.png"),
    ];

    for (const p of candidates) {
      if (fs.existsSync(p)) {
        try {
          const bytes = fs.readFileSync(p);
          const borderImage = p.endsWith(".jpg") || p.endsWith(".jpeg")
            ? await pdfDoc.embedJpg(bytes)
            : await pdfDoc.embedPng(bytes);

          // Border design size reduced by 20% (scaled to 80% width and height, centered)
          const targetW = PAGE_WIDTH * 0.8;
          const targetH = page.getHeight() * 0.8;
          const targetX = (PAGE_WIDTH - targetW) / 2;
          const targetY = (page.getHeight() - targetH) / 2;

          page.drawImage(borderImage, {
            x: targetX,
            y: targetY,
            width: targetW,
            height: targetH,
          });
          borderEmbedded = true;
          break;
        } catch (err) {
          console.warn(`Could not embed border design image from ${p}:`, err);
        }
      }
    }
  }

  // Vector placeholder fallback for border design if no image file is found (reduced by 20%)
  if (!borderEmbedded) {
    const scale = 0.8;
    const outerW = (PAGE_WIDTH - 40) * scale;
    const outerH = (page.getHeight() - 40) * scale;
    const outerX = (PAGE_WIDTH - outerW) / 2;
    const outerY = (page.getHeight() - outerH) / 2;

    page.drawRectangle({
      x: outerX,
      y: outerY,
      width: outerW,
      height: outerH,
      borderColor: colors.gold,
      borderWidth: frame.outer.borderWidth,
    });

    const innerW = (PAGE_WIDTH - 56) * scale;
    const innerH = (page.getHeight() - 56) * scale;
    const innerX = (PAGE_WIDTH - innerW) / 2;
    const innerY = (page.getHeight() - innerH) / 2;

    page.drawRectangle({
      x: innerX,
      y: innerY,
      width: innerW,
      height: innerH,
      borderColor: colors.gold,
      borderWidth: frame.inner.borderWidth,
    });

    const s = frame.cornerSize * scale;
    const corners = [
      { x: outerX, y: outerY + outerH - s },
      { x: outerX + outerW - s, y: outerY + outerH - s },
      { x: outerX, y: outerY },
      { x: outerX + outerW - s, y: outerY },
    ];
    corners.forEach((c) => {
      page.drawRectangle({
        x: c.x,
        y: c.y,
        width: s,
        height: s,
        borderColor: colors.gold,
        borderWidth: frame.cornerBorderWidth,
      });
    });
  }
}

/**
 * The source PDF uses an ornate flourished glyph divider (a small
 * scroll/diamond ornament flanked by two horizontal rules). Reproducing
 * that exact flourish as vector paths is impractical by hand; this
 * draws a close approximation — a rule, a diamond, and end-dots — which
 * reads the same at a glance. For a pixel-exact match, supply the
 * flourish as a small SVG/PNG asset and swap this for drawImage().
 */
export function drawOrnamentalDivider(page, y, { left = 180, right = 415 } = {}) {
  const midX = (left + right) / 2;
  page.drawLine({ start: { x: left, y }, end: { x: midX - 10, y }, thickness: 1, color: colors.gold });
  page.drawLine({ start: { x: midX + 10, y }, end: { x: right, y }, thickness: 1, color: colors.gold });
  page.drawEllipse({ x: left, y, xScale: 2, yScale: 2, color: colors.gold });
  page.drawEllipse({ x: right, y, xScale: 2, yScale: 2, color: colors.gold });
  // small diamond ornament in the middle
  const d = 6;
  page.drawLine({ start: { x: midX - d, y }, end: { x: midX, y: y + d }, thickness: 1, color: colors.gold });
  page.drawLine({ start: { x: midX, y: y + d }, end: { x: midX + d, y }, thickness: 1, color: colors.gold });
  page.drawLine({ start: { x: midX + d, y }, end: { x: midX, y: y - d }, thickness: 1, color: colors.gold });
  page.drawLine({ start: { x: midX, y: y - d }, end: { x: midX - d, y }, thickness: 1, color: colors.gold });
}

/** Simple outline calendar glyph, approximating the icon in the source design. */
export function drawCalendarIcon(page, x, y, size = 16) {
  page.drawRectangle({ x, y, width: size, height: size * 0.85, borderColor: colors.gold, borderWidth: 1 });
  page.drawLine({ start: { x, y: y + size * 0.6 }, end: { x: x + size, y: y + size * 0.6 }, thickness: 1, color: colors.gold });
  page.drawLine({ start: { x: x + size * 0.25, y: y + size * 0.85 }, end: { x: x + size * 0.25, y: y + size * 1.05 }, thickness: 1, color: colors.gold });
  page.drawLine({ start: { x: x + size * 0.75, y: y + size * 0.85 }, end: { x: x + size * 0.75, y: y + size * 1.05 }, thickness: 1, color: colors.gold });
}

/** Simple outline map-pin glyph. */
export function drawPinIcon(page, x, y, size = 16) {
  const cx = x + size / 2;
  page.drawEllipse({ x: cx, y: y + size * 0.65, xScale: size * 0.35, yScale: size * 0.35, borderColor: colors.gold, borderWidth: 1, color: undefined });
  page.drawLine({ start: { x: cx - size * 0.3, y: y + size * 0.55 }, end: { x: cx, y: y - size * 0.1 }, thickness: 1, color: colors.gold });
  page.drawLine({ start: { x: cx + size * 0.3, y: y + size * 0.55 }, end: { x: cx, y: y - size * 0.1 }, thickness: 1, color: colors.gold });
}

/** Simple outline clock glyph. */
export function drawClockIcon(page, x, y, size = 16) {
  const cx = x + size / 2;
  const cy = y + size / 2;
  const r = size / 2;
  page.drawEllipse({ x: cx, y: cy, xScale: r, yScale: r, borderColor: colors.gold, borderWidth: 1, color: undefined });
  page.drawLine({ start: { x: cx, y: cy }, end: { x: cx, y: cy + r * 0.55 }, thickness: 1, color: colors.gold });
  page.drawLine({ start: { x: cx, y: cy }, end: { x: cx + r * 0.4, y: cy }, thickness: 1, color: colors.gold });
}

/** Generates a QR PNG for the given value and embeds it, returning the pdf-lib image. */
export async function embedQrCode(pdfDoc, value) {
  const dataUrl = await QRCode.toDataURL(value, {
    margin: 1,
    width: 400,
    color: { dark: "#2C2416", light: "#FFFFFF" },
  });
  const bytes = Buffer.from(dataUrl.split(",")[1], "base64");
  return pdfDoc.embedPng(bytes);
}
