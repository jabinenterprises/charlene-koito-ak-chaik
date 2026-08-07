import { rgb } from "pdf-lib";
import { generateInvitation } from "./pdf/template.js";

/**
 * Event-level content that stays the same across every guest's invitation.
 * Replace these placeholder-style defaults with real values (env vars,
 * CMS fields, DB row, etc.) — see the integration guide for a full
 * data-mapping table.
 */
const DEFAULT_EVENT = {
  hostFamilyIntro: "We The Family Of",
  hostNames: "{{hostNames}}",
  eventTitle: "{{eventTitle}}",
  eventSubtitle: "{{eventSubtitle}}",
  honoreeName: "{{honoreeName}}",
  date: "{{eventDate}}",
  time: "{{eventTime}}",
  venueLines: ["{{venueLine1}}", "{{venueLine2}}", "{{venueLine3}}"],
  scripture: { quote: "{{scriptureQuote}}", reference: "{{scriptureReference}}" },
  website: "{{websiteUrl}}",
  dressCode: {
    title: "DRESS CODE:",
    description: "{{dressCodeDescription}}",
    swatches: [
      { name: "{{swatch1Name}}", color: rgb(0.52, 0.46, 0.40) },
      { name: "{{swatch2Name}}", color: rgb(0.35, 0.24, 0.11) },
      { name: "{{swatch3Name}}", color: rgb(0.78, 0.52, 0.21) },
      { name: "{{swatch4Name}}", color: rgb(0.77, 0.60, 0.32) },
    ],
  },
  rsvpContacts: [
    { name: "{{contact1Name}}", phone: "{{contact1Phone}}" },
    { name: "{{contact2Name}}", phone: "{{contact2Phone}}" },
  ],
};

/**
 * Drop-in replacement for the previous `generateSingleInvitationDoc`.
 * Kept so existing call sites (API routes, batch scripts) don't need to
 * change immediately; new code should call `generateInvitation` from
 * `./pdf/template.js` directly with a full event object.
 */
export async function generateSingleInvitationDoc(guestName, pinCode, eventOverrides = {}) {
  const event = { ...DEFAULT_EVENT, ...eventOverrides };
  const guest = { name: guestName, pin: pinCode };
  return generateInvitation(event, guest);
}
