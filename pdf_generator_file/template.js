import { PDFDocument } from "pdf-lib";
import { loadFonts } from "./fonts.js";
import { renderPage1 } from "./page1.js";
import { renderPage2 } from "./page2.js";

/**
 * @typedef {Object} InvitationEvent
 * @property {string} hostFamilyIntro   e.g. "We The Family Of"
 * @property {string} hostNames         e.g. "{{hostNames}}"
 * @property {string} eventTitle        e.g. "{{eventTitle}}" (rendered in script font)
 * @property {string} [eventSubtitle]   e.g. "{{eventSubtitle}}"
 * @property {string} honoreeName       e.g. "{{honoreeName}}"
 * @property {string} date              e.g. "{{eventDate}}"
 * @property {string} time              e.g. "{{eventTime}}"
 * @property {string[]} venueLines      e.g. ["{{venueLine1}}", "{{venueLine2}}", "{{venueLine3}}"]
 * @property {{quote: string, reference: string}} [scripture]
 * @property {string} website           e.g. "{{websiteUrl}}"
 * @property {{title: string, description: string, swatches: {name: string, color: import("pdf-lib").Color}[]}} dressCode
 * @property {{name: string, phone: string}[]} rsvpContacts
 *
 * @typedef {Object} InvitationGuest
 * @property {string} name  e.g. "{{guestName}}"
 * @property {string} pin   e.g. "{{guestPin}}"
 */

/**
 * Generates the two-page invitation PDF as a PDFDocument.
 * @param {InvitationEvent} event
 * @param {InvitationGuest} guest
 * @returns {Promise<PDFDocument>}
 */
export async function generateInvitation(event, guest) {
  // Exactly one output PDFDocument for the whole invitation. Both pages
  // are rendered into this same instance below — renderPage1/renderPage2
  // never create or return a document of their own, they only call
  // pdfDoc.addPage(...) on the instance passed in. Any template file
  // loaded internally (see page1.js) is a temporary source used only to
  // copy a background page in, and is discarded, not returned.
  const pdfDoc = await PDFDocument.create();
  const fonts = await loadFonts(pdfDoc); // embedded once, shared by both pages

  await renderPage1(pdfDoc, fonts, event, guest);
  await renderPage2(pdfDoc, fonts, event, guest);

  // Invariant check: this must always be a single 2-page document.
  if (pdfDoc.getPageCount() !== 2) {
    throw new Error(
      `Expected a single 2-page invitation document, got ${pdfDoc.getPageCount()} pages.`
    );
  }

  return pdfDoc;
}

/** Convenience helper: generates and returns the raw PDF bytes (Uint8Array). */
export async function generateInvitationBytes(event, guest) {
  const doc = await generateInvitation(event, guest);
  return doc.save();
}
