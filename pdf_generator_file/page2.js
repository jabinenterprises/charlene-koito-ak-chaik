import { PAGE_WIDTH, PAGE_HEIGHT, colors } from "./styles.js";
import { drawCenteredText, drawPageFrame, drawOrnamentalDivider, embedQrCode } from "./helpers.js";

export async function renderPage2(pdfDoc, fonts, event, guest) {
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  await drawPageFrame(page, pdfDoc, 2);

  const { serifRegular, serifBold, sansRegular } = fonts;

  drawCenteredText(page, "We look forward to celebrating with you!", 760, serifRegular, 14);
  drawCenteredText(page, `Please visit ${event.website ?? "{{websiteUrl}}"}`, 738, serifBold, 13, colors.darkGold);
  drawCenteredText(page, "to RSVP and find details including the Venue directions.", 718, serifRegular, 12);
  drawCenteredText(page, "Please use the 4-digit Guest PIN below to access the site.", 692, serifRegular, 12);

  // Guest PIN box
  const boxX = 160, boxY = 625, boxW = 275, boxH = 44;
  page.drawRectangle({
    x: boxX, y: boxY, width: boxW, height: boxH,
    borderColor: colors.gold, borderWidth: 1.5, color: undefined,
  });
  page.drawText("GUEST PIN:", { x: boxX + 25, y: boxY + 14, size: 15, font: serifBold, color: colors.text });
  page.drawText(guest?.pin ?? "{{guestPin}}", { x: boxX + 175, y: boxY + 13, size: 19, font: serifBold, color: colors.text });

  drawOrnamentalDivider(page, 590);

  // Dress code
  drawCenteredText(page, event.dressCode?.title ?? "DRESS CODE:", 535, serifBold, 15);
  drawCenteredText(page, event.dressCode?.description ?? "{{dressCodeDescription}}", 512, fonts.serifItalic, 14);

  const swatches = event.dressCode?.swatches ?? [];
  const swW = 60, swH = 60, gap = 24;
  const totalWidth = swatches.length * swW + (swatches.length - 1) * gap;
  const startX = (PAGE_WIDTH - totalWidth) / 2;
  const swatchY = 430;
  swatches.forEach((s, idx) => {
    const sx = startX + idx * (swW + gap);
    page.drawRectangle({ x: sx, y: swatchY, width: swW, height: swH, color: s.color });
    const label = (s.name || "").toUpperCase();
    const txtW = sansRegular.widthOfTextAtSize(label, 9);
    page.drawText(label, { x: sx + (swW - txtW) / 2, y: swatchY - 18, size: 9, font: sansRegular, color: colors.text });
  });

  drawOrnamentalDivider(page, 380);

  // QR code + instructions
  const qrValue = guest?.pin ?? "{{guestPin}}";
  const qrImage = await embedQrCode(pdfDoc, qrValue);

  const instructionLines = ["Please present this", "QR code at the", "entrance for a quick", "scan and entry."];
  instructionLines.forEach((line, i) => {
    page.drawText(line, { x: 130, y: 310 - i * 18, size: 13, font: serifRegular, color: colors.text });
  });
  page.drawImage(qrImage, { x: 315, y: 200, width: 140, height: 140 });

  drawOrnamentalDivider(page, 175);

  // RSVP contacts
  drawCenteredText(page, "RSVP", 145, serifBold, 14, colors.darkGold);
  drawCenteredText(page, "Contacts", 128, fonts.serifItalic, 13);
  const contacts = event.rsvpContacts ?? [];
  contacts.forEach((c, i) => {
    drawCenteredText(page, `${c.name} - ${c.phone}`, 104 - i * 18, serifRegular, 13);
  });

  return page;
}
