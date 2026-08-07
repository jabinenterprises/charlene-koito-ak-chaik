import fs from "fs";
import path from "path";
import { PDFDocument } from "pdf-lib";
import { PAGE_WIDTH, PAGE_HEIGHT, colors } from "./styles.js";
import {
  drawPageFrame,
  drawOrnamentalDivider,
  drawCalendarIcon,
  drawPinIcon,
  drawClockIcon,
  drawCurtainPlaceholder,
} from "./helpers.js";

export async function renderPage1(pdfDoc, fonts, event, guest) {
  const templatePath = path.join(process.cwd(), "public", "ticket-template.pdf");
  let page = null;

  if (fs.existsSync(templatePath)) {
    try {
      const templateBytes = fs.readFileSync(templatePath);
      const templateDoc = await PDFDocument.load(templateBytes);
      if (templateDoc.getPageCount() >= 1) {
        const [copied] = await pdfDoc.copyPages(templateDoc, [0]);
        pdfDoc.addPage(copied);
        page = pdfDoc.getPages()[pdfDoc.getPageCount() - 1];
      }
    } catch (e) {
      console.warn("Could not load public/ticket-template.pdf, using vector fallback:", e);
    }
  }

  if (!page) {
    page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    await drawPageFrame(page, pdfDoc, 1);
  }

  // Draw Curtain Image (or vector curtain placeholder) over the border design on the right side
  const curtainCandidates = [
    path.join(process.cwd(), "public", "elements", "curtain.png"),
    path.join(process.cwd(), "public", "elements", "curtain-full.png"),
    path.join(process.cwd(), "public", "curtain.png"),
    path.join(process.cwd(), "public", "elements", "curtain.jpg"),
  ];
  let curtainEmbedded = false;
  if (pdfDoc) {
    for (const p of curtainCandidates) {
      if (fs.existsSync(p)) {
        try {
          const bytes = fs.readFileSync(p);
          const curtainImg = p.endsWith(".jpg") || p.endsWith(".jpeg")
            ? await pdfDoc.embedJpg(bytes)
            : await pdfDoc.embedPng(bytes);

          const curtainWidth = 235;
          const curtainX = PAGE_WIDTH - curtainWidth; // x = 360.28
          page.drawImage(curtainImg, {
            x: curtainX,
            y: 0,
            width: curtainWidth,
            height: PAGE_HEIGHT,
          });
          curtainEmbedded = true;
          break;
        } catch (err) {
          console.warn(`Could not embed curtain image from ${p}:`, err);
        }
      }
    }
  }
  if (!curtainEmbedded) {
    drawCurtainPlaceholder(page);
  }

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

  const { serifRegular, serifBold, serifItalic, script } = fonts;

  // Center axis of printable text column (x = 35 to x = 360)
  const columnLeft = 220;
  const columnRight = 360;
  const centerX = (columnLeft + columnRight) / 2; // = 197.5 pt

  const drawInColumn = (text, y, font, size, color = colors.text) => {
    const w = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: centerX - w / 2, y, size, font, color });
  };

  // Top Ornamental Flourish
  drawOrnamentalDivider(page, 770, { left: centerX - 65, right: centerX + 65, flourishImage });

  // Host Intro & Host Names
  drawInColumn(event.hostFamilyIntro ?? "We The Family Of", 732, serifRegular, 18);
  drawInColumn(event.hostNames ?? "Dr. William Samoei Ruto", 695, serifBold, 32);
  drawInColumn("&", 660, serifRegular, 32);
  drawInColumn(event.hostNames2 ?? "Mrs. Rachel Chebet Ruto", 625, serifBold, 32);

  // Ornamental Flourish
  drawOrnamentalDivider(page, 590, { left: centerX - 65, right: centerX + 65, flourishImage });

  // Warmly Invite & Guest Name
  drawInColumn("warmly invite", 555, serifItalic, 14);

  const rawGuestName = (guest?.name || guest?.fullName || "Jane Doe").trim();
  const guestTitle = (guest?.title || guest?.honorific || "").trim();
  const guestName = guestTitle && !rawGuestName.toLowerCase().startsWith(guestTitle.toLowerCase())
    ? `${guestTitle} ${rawGuestName}`
    : rawGuestName;
  drawInColumn(guestName, 520, serifBold, 23);

  // Centered Horizontal Rule under guest name
  page.drawLine({
    start: { x: centerX - 125, y: 505 },
    end: { x: centerX + 125, y: 505 },
    thickness: 0.8,
    color: colors.gold,
  });

  // Event Title Stack
  drawInColumn("to the", 470, serifRegular, 13);
  drawInColumn(event.eventTitle ?? "Koito ak Chaik", 435, script, 44, colors.text);

  const subtitle = event.eventSubtitle || "(ENGAGEMENT AND FAREWELL)";
  drawInColumn(subtitle, 415, serifBold, 10, colors.darkGold);

  drawInColumn("of their daughter", 375, serifRegular, 13);
  drawInColumn(event.honoreeName ?? "Charlene Chelagat Ruto", 355, serifBold, 18.5);

  // Ornamental Flourish
  drawOrnamentalDivider(page, 335, { left: centerX - 65, right: centerX + 65, flourishImage });

  // Date / Venue / Time Block — Centered at centerX (197.5 pt)
  const iconTextOffset = 23;
  const dateText = event.date ?? "8TH AUGUST 2026";
  const venueLines = event.venueLines ?? [
    "INTONNA HERITAGE FARM ",
    "KILGORIS TOWN, NASERIAN VILLAGE",
    "NAROK COUNTY, KENYA",
  ];
  const timeText = event.time ?? "10.00 A.M";

  const dateWidth = iconTextOffset + serifBold.widthOfTextAtSize(dateText, 10.5);
  const maxVenueWidth = Math.max(...venueLines.map((l) => iconTextOffset + serifBold.widthOfTextAtSize(l, 9)));
  const timeWidth = iconTextOffset + serifBold.widthOfTextAtSize(timeText, 10.5);
  const maxBlockWidth = Math.max(dateWidth, maxVenueWidth, timeWidth);

  // Exact left coordinate so the entire date/venue/time block is centered at centerX
  const blockLeft = centerX - maxBlockWidth / 2;

  let iconY = 300;
  drawCalendarIcon(page, blockLeft, iconY - 3, 14);
  page.drawText(dateText, {
    x: blockLeft + iconTextOffset,
    y: iconY,
    size: 10.5,
    font: serifBold,
    color: colors.text,
  });

  iconY -= 32;
  drawPinIcon(page, blockLeft, iconY - 3, 14);
  venueLines.forEach((line, i) => {
    page.drawText(line, {
      x: blockLeft + iconTextOffset,
      y: iconY - i * 13,
      size: 9,
      font: serifBold,
      color: colors.text,
    });
  });

  iconY -= 13 * venueLines.length + 12;
  drawClockIcon(page, blockLeft, iconY - 3, 14);
  page.drawText(timeText, {
    x: blockLeft + iconTextOffset,
    y: iconY,
    size: 10.5,
    font: serifBold,
    color: colors.text,
  });

  // Scripture Quote at Bottom (Centered at centerX)
  if (event.scripture) {
    drawInColumn(
      event.scripture.quote ?? "For He will command His angels concerning you",
      100,
      serifItalic,
      12
    );
    if (event.scripture.quoteLine2) {
      drawInColumn(event.scripture.quoteLine2, 85, serifItalic, 12);
    }
    drawInColumn(
      event.scripture.reference ?? "Psalms 91:11 (NIV)",
      70,
      serifBold,
      13
    );
  }

  return page;
}
