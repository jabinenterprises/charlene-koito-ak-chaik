import { StandardFonts } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import fs from "fs";
import path from "path";

/**
 * The original design uses a flowing calligraphic script for the event
 * title ("Koito ak Chaik"). None of the 14 standard PDF fonts include a
 * script/cursive face, so pdf-lib's built-in StandardFonts cannot
 * reproduce it — a custom TTF must be embedded via @pdf-lib/fontkit.
 *
 * Recommended free substitute: "Great Vibes" (Google Fonts), which is a
 * close visual match to the flourished copperplate-style script in the
 * source PDF. Download it and place the file at:
 *   public/fonts/GreatVibes-Regular.ttf
 *
 * If that file is missing, we fall back to Times-Italic so the document
 * still renders (just without the calligraphic flourish) rather than
 * throwing.
 */
export async function loadFonts(pdfDoc) {
  pdfDoc.registerFontkit(fontkit);

  const serifRegular = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const serifBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const serifItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
  const sansRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const sansBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let script = serifItalic;
  let scriptIsSubstitute = true;
  const scriptPath = path.join(process.cwd(), "public", "fonts", "GreatVibes-Regular.ttf");
  if (fs.existsSync(scriptPath)) {
    try {
      const bytes = fs.readFileSync(scriptPath);
      script = await pdfDoc.embedFont(bytes);
      scriptIsSubstitute = false;
    } catch (e) {
      console.warn("Could not embed script font, falling back to Times-Italic:", e);
    }
  }

  return {
    serifRegular,
    serifBold,
    serifItalic,
    sansRegular,
    sansBold,
    script,
    scriptIsSubstitute,
  };
}
