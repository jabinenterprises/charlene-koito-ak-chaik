import { rgb } from "pdf-lib";
import { generateInvitation } from "./pdf/template.js";

const DEFAULT_EVENT = {
  hostFamilyIntro: "We The Family Of",
  hostNames: "Dr. William Samoei Ruto",
  hostNames2: "Mrs. Rachel Chebet Ruto",
  eventTitle: "Koito ak Chaik",
  eventSubtitle: "(ENGAGEMENT AND FAREWELL)",
  honoreeName: "Charlene Chelagat Ruto",
  date: "8TH AUGUST 2026",
  time: "10.00 A.M",
  venueLines: [
    "INTONNA HERITAGE FARM ,",
    "KILGORIS TOWN, NASERIAN VILLAGE",
    "NAROK COUNTY, KENYA",
  ],
  scripture: {
    quote: "For He will command His angels concerning you",
    quoteLine2: "to guard you in all your ways",
    reference: "Psalms 91:11 (NIV)",
  },
  website: "www.charlene-ruto.com",
  dressCode: {
    title: "DRESS CODE:",
    description: "Warm, Natural, Sophisticated, Timeless",
    swatches: [
      { name: "MOCHA", color: rgb(0.52, 0.46, 0.40) },
      { name: "CHOCOLATE", color: rgb(0.35, 0.24, 0.11) },
      { name: "CARAMEL", color: rgb(0.78, 0.52, 0.21) },
      { name: "GOLD", color: rgb(0.77, 0.60, 0.32) },
    ],
  },
  rsvpContacts: [
    { name: "Deborah", phone: "+254 714 591 747" },
    { name: "Maureen", phone: "+254 719 701 335" },
  ],
};

export async function generateSingleInvitationDoc(guestName, pinCode, eventOverrides = {}) {
  const event = { ...DEFAULT_EVENT, ...eventOverrides };
  const guest = { name: guestName, pin: pinCode };
  return generateInvitation(event, guest);
}
