import { StandardFonts } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import fs from "fs";
import path from "path";

/**
 * Loads standard PDF fonts and embeds the Edwardian Script font
 * from the public/fonts/ folder for calligraphic titles (e.g. "Koito ak Chaik").
 */
export async function loadFonts(pdfDoc) {
  pdfDoc.registerFontkit(fontkit);

  const serifRegular = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const serifBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const serifItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
  const sansRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const sansBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const fontCandidates = [
    "EdwardianScriptItcDOT-Regul.otf",
    "EdwardianScriptItcDOT-RegAl.otf",
    "EdwardianScrITC Bold.ttf",
    "EdwardianScrITC BoldAlte.ttf",
    "GreatVibes-Regular.ttf",
  ];

  let script = serifItalic;
  let scriptIsSubstitute = true;

  for (const filename of fontCandidates) {
    const candidatePath = path.join(process.cwd(), "public", "fonts", filename);
    if (fs.existsSync(candidatePath)) {
      try {
        const bytes = fs.readFileSync(candidatePath);
        script = await pdfDoc.embedFont(bytes);
        scriptIsSubstitute = false;
        break;
      } catch (e) {
        console.warn(`Could not embed script font (${filename}):`, e);
      }
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
