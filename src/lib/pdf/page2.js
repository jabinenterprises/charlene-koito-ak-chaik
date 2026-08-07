import fs from "fs";
import path from "path";
import { PAGE_WIDTH, PAGE_HEIGHT, colors } from "./styles.js";
import {
  drawCenteredText,
  drawPageFrame,
  drawOrnamentalDivider,
  drawDressCodeIcon,
  embedQrCode,
} from "./helpers.js";

export async function renderPage2(pdfDoc, fonts, event, guest) {
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  await drawPageFrame(page, pdfDoc, 2);

  // Load Flourish Image if available
  let flourishImage = null;
  const flourishCandidates = [
    path.join(process.cwd(), "public", "elements", "flourish.png"),
    path.join(process.cwd(), "public", "elements", "ornament.png"),
    path.join(process.cwd(), "public", "flourish.png"),
  ];
  for (const p of flourishCandidates) {
    if (fs.existsSync(p)) {
      try {
        const bytes = fs.readFileSync(p);
        flourishImage = await pdfDoc.embedPng(bytes);
        break;
      } catch (err) {
        console.warn(`Could not embed flourish image from ${p}:`, err);
      }
    }
  }

  const { serifRegular, serifBold, serifItalic, sansRegular } = fonts;

  // Top Invitation Info Text
  drawCenteredText(page, "We look forward to celebrating with you!", 765, serifRegular, 13.5);
  drawCenteredText(page, `Please visit ${event.website ?? "www.charlene-ruto.com"}`, 743, serifBold, 13, colors.darkGold);
  drawCenteredText(page, "to RSVP and find details including the Venue directions.", 723, serifRegular, 12);
  drawCenteredText(page, "Use the 4-digit Guest PIN below to access the site.", 690, serifRegular, 11.5);

  // Guest PIN Box with decorative side diamonds
  const boxW = 270;
  const boxH = 44;
  const boxX = (PAGE_WIDTH - boxW) / 2;
  const boxY = 620;

  page.drawRectangle({
    x: boxX,
    y: boxY,
    width: boxW,
    height: boxH,
    borderColor: colors.gold,
    borderWidth: 1.2,
    color: undefined,
  });

  // Decorative side diamonds on box
  const d = 5;
  const midY = boxY + boxH / 2;
  // Left side diamond
  const leftX = boxX - 10;
  page.drawLine({ start: { x: leftX - d, y: midY }, end: { x: leftX, y: midY + d }, thickness: 1, color: colors.gold });
  page.drawLine({ start: { x: leftX, y: midY + d }, end: { x: leftX + d, y: midY }, thickness: 1, color: colors.gold });
  page.drawLine({ start: { x: leftX + d, y: midY }, end: { x: leftX, y: midY - d }, thickness: 1, color: colors.gold });
  page.drawLine({ start: { x: leftX, y: midY - d }, end: { x: leftX - d, y: midY }, thickness: 1, color: colors.gold });

  // Right side diamond
  const rightX = boxX + boxW + 10;
  page.drawLine({ start: { x: rightX - d, y: midY }, end: { x: rightX, y: midY + d }, thickness: 1, color: colors.gold });
  page.drawLine({ start: { x: rightX, y: midY + d }, end: { x: rightX + d, y: midY }, thickness: 1, color: colors.gold });
  page.drawLine({ start: { x: rightX + d, y: midY }, end: { x: rightX, y: midY - d }, thickness: 1, color: colors.gold });
  page.drawLine({ start: { x: rightX, y: midY - d }, end: { x: rightX - d, y: midY }, thickness: 1, color: colors.gold });

  page.drawText("GUEST PIN:", {
    x: boxX + 26,
    y: boxY + 14,
    size: 15,
    font: serifBold,
    color: colors.text,
  });
  page.drawText(guest?.pin ?? "4050", {
    x: boxX + 170,
    y: boxY + 13,
    size: 19,
    font: serifBold,
    color: colors.text,
  });

  // Ornamental Flourish 1
  drawOrnamentalDivider(page, 580, { left: 165, right: 430, flourishImage });

  // Dress Code Section
  drawDressCodeIcon(page, (PAGE_WIDTH - 20) / 2, 532, 20);
  drawCenteredText(page, event.dressCode?.title ?? "DRESS CODE:", 510, serifBold, 15);
  drawCenteredText(
    page,
    event.dressCode?.description ?? "Warm, Natural, Sophisticated, Timeless",
    486,
    serifItalic,
    13.5
  );

  // Swatches
  const swatches = event.dressCode?.swatches ?? [
    { name: "MOCHA", color: colors.swatchDefault.mocha },
    { name: "CHOCOLATE", color: colors.swatchDefault.chocolate },
    { name: "CARAMEL", color: colors.swatchDefault.caramel },
    { name: "GOLD", color: colors.swatchDefault.gold },
  ];

  const swW = 58;
  const swH = 58;
  const gap = 22;
  const totalWidth = swatches.length * swW + (swatches.length - 1) * gap;
  const startX = (PAGE_WIDTH - totalWidth) / 2;
  const swatchY = 405;

  swatches.forEach((s, idx) => {
    const sx = startX + idx * (swW + gap);
    page.drawRectangle({ x: sx, y: swatchY, width: swW, height: swH, color: s.color });
    const label = (s.name || "").toUpperCase();
    const txtW = sansRegular.widthOfTextAtSize(label, 8.5);
    page.drawText(label, {
      x: sx + (swW - txtW) / 2,
      y: swatchY - 16,
      size: 8.5,
      font: sansRegular,
      color: colors.text,
    });
  });

  // Ornamental Flourish 2
  drawOrnamentalDivider(page, 355, { left: 165, right: 430, flourishImage });

  // QR Code & Entrance Scan Instructions
  const qrValue = guest?.pin ?? "4050";
  const qrImage = await embedQrCode(pdfDoc, qrValue);

  const textLeft = 115;
  page.drawText("Present this QR code", { x: textLeft, y: 282, size: 13, font: serifRegular, color: colors.text });
  page.drawText("at the entrance for a", { x: textLeft, y: 264, size: 13, font: serifRegular, color: colors.text });
  page.drawText("quick scan and entry.", { x: textLeft, y: 246, size: 13, font: serifRegular, color: colors.text });

  page.drawImage(qrImage, { x: 310, y: 188, width: 135, height: 135 });

  // Ornamental Flourish 3
  drawOrnamentalDivider(page, 162, { left: 165, right: 430, flourishImage });

  // RSVP Contacts Section
  drawCenteredText(page, "RSVP", 136, serifBold, 14.5, colors.darkGold);
  drawCenteredText(page, "Contacts", 118, serifItalic, 13);

  const contacts = event.rsvpContacts ?? [
    { name: "Deborah", phone: "+254 714 591 747" },
    { name: "Maureen", phone: "+254 719 701 335" },
  ];

  contacts.forEach((c, i) => {
    drawCenteredText(page, `${c.name} - ${c.phone}`, 96 - i * 18, serifRegular, 12.5);
  });

  // Footer
  drawCenteredText(
    page,
    "Copyright @KittyEvents   |   Powered by GOODSAM Technologies",
    36,
    sansRegular,
    8.5,
    colors.darkGold
  );

  return page;
}
