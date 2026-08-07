# Invitation PDF Template — Integration Guide

## 1. Document structure (what I saw in the uploaded PDF)

**Page 1 — the invitation face**
- Photographic background: cream card, gold double-rule border, and a green
  silk curtain with a metal clasp running down the right ~35% of the page.
  This is a raster/photographic asset, not a vector one.
- Centered serif text stacked down the left text column: host intro line,
  host names, "warmly invite", guest name, "to the", a **script-font** event
  title, a small caps subtitle, "of their daughter", honoree name.
- A left-aligned date/venue/time block with three small gold outline icons
  (calendar, pin, clock).
- An italic scripture quote + reference at the bottom.

**Page 2 — RSVP / logistics** (fully vector — the most reproducible page)
- Same gold double-border + four corner brackets as page 1.
- Header paragraph + website line + guest-PIN instructions.
- A bordered "GUEST PIN" box with a dynamic 4-digit code.
- An ornamental flourish divider (rule + small diamond/scroll ornament).
- "DRESS CODE" title, description line, and 4 color swatches with labels.
- Divider, "present this QR code" text + a QR image encoding the guest PIN.
- Divider, "RSVP / Contacts" heading, and 2 contact lines (name + phone).

## 2. Dynamic fields identified

| Placeholder | Meaning |
|---|---|
| `{{hostNames}}` | Names of the hosting parents/family |
| `{{eventTitle}}` | Script-font event name |
| `{{eventSubtitle}}` | Parenthetical subtitle under the event title |
| `{{honoreeName}}` | Name of the person/couple being honored |
| `{{eventDate}}`, `{{eventTime}}` | Event date/time |
| `{{venueLine1..3}}` | Venue address lines |
| `{{scriptureQuote}}`, `{{scriptureReference}}` | Bottom quote |
| `{{websiteUrl}}` | RSVP site |
| `{{dressCodeDescription}}` | Dress-code descriptor line |
| `{{swatch1..4Name}}` | Color-swatch labels |
| `{{contact1..2Name}}`, `{{contact1..2Phone}}` | RSVP contacts |
| `{{guestName}}` | Per-invitation, changes for every guest |
| `{{guestPin}}` | Per-invitation, changes for every guest, also encoded in the QR |

Everything above `{{guestName}}`/`{{guestPin}}` in the table is **event-level**
(same for every guest at this event) rather than per-guest — I split it that
way in the data model below so you don't have to repeat it for every invite.

## 3. Typography

- Body/serif text: Times Roman / Times Bold / Times Italic — these are
  standard PDF fonts, no asset needed, and match the source closely.
- Small caps labels (swatch names): Helvetica — matches the source's sans
  labels.
- **Script event title**: the source uses a flourished calligraphic script.
  None of the 14 standard PDF fonts include a script face, so this **requires
  a custom font asset**. I recommend the free Google Font **"Great Vibes"**
  as the closest visual match. Download `GreatVibes-Regular.ttf` and place it
  at `public/fonts/GreatVibes-Regular.ttf`. If the file is absent, the code
  falls back to Times-Italic automatically rather than crashing — but that's
  a visible fidelity drop, so add the real font before going live.

## 4. Images / graphics

- **Curtain artwork (page 1 background)**: photographic, can't be
  vector-recreated. Two options:
  1. (Recommended, matches your existing approach) Export the original
     design's page 1 as a flat PDF page (no guest name burned in) and save it
     as `public/ticket-template.pdf`. The new `page1.js` copies that page in
     and draws the guest name on top, same strategy your current code uses.
  2. Alternatively export it as a PNG and `pdfDoc.embedPng()` it as a
     full-bleed background — ask if you'd like this variant instead.
- **Calendar / pin / clock icons**: recreated as simple vector line-drawings
  in `helpers.js` (`drawCalendarIcon`, `drawPinIcon`, `drawClockIcon`) —
  close approximations, not pixel-identical to the original icon set. Swap
  for real SVG/PNG icon assets under `public/icons/` if you want an exact
  match.
- **Ornamental flourish dividers**: approximated with a rule + small diamond
  ornament (`drawOrnamentalDivider`). For an exact match, supply the
  flourish as a small PNG/SVG asset and swap the function body for
  `page.drawImage()`.
- **QR code**: generated dynamically from the guest PIN via the `qrcode`
  package — fully reproducible, no asset needed.

## 5. Files to create

```
src/lib/pdf/fonts.js       — font embedding (incl. custom script font)
src/lib/pdf/styles.js      — shared colors, page size, border geometry
src/lib/pdf/helpers.js     — text/divider/icon/QR drawing utilities
src/lib/pdf/page1.js       — page 1 renderer
src/lib/pdf/page2.js       — page 2 renderer
src/lib/pdf/template.js    — generateInvitation(event, guest) orchestrator
```

## 6. Files to modify

- `src/lib/pdf-generator.js` — replaced with a thin compatibility wrapper
  (`generateSingleInvitationDoc(guestName, pinCode, eventOverrides)`) that
  calls the new template with default event-level placeholders. Existing
  call sites keep working unchanged; new code should import
  `generateInvitation` from `src/lib/pdf/template.js` directly and pass a
  full event object instead of relying on the wrapper's defaults.

## 7. Dependencies

```bash
npm install pdf-lib qrcode @pdf-lib/fontkit
```

- `pdf-lib` — PDF construction (already in use).
- `qrcode` — QR generation (already in use).
- `@pdf-lib/fontkit` — required to embed the custom script TTF; pdf-lib
  can't embed non-standard fonts without it.

## 8. Assets

```
public/
  fonts/
    GreatVibes-Regular.ttf     ← script font for the event title
  ticket-template.pdf          ← page-1 curtain artwork (no text burned in)
  icons/                       ← optional, if you swap in exact icon assets
```

## 9. Data mapping

| Placeholder | Application field (suggested) |
|---|---|
| `hostNames` | `event.hostNames` |
| `eventTitle` | `event.title` |
| `eventSubtitle` | `event.subtitle` |
| `honoreeName` | `event.honoreeName` |
| `date` / `time` | `event.date`, `event.time` |
| `venueLines` | `event.venue.lines` (array) |
| `scripture.quote` / `scripture.reference` | `event.scripture.quote/reference` |
| `website` | `event.rsvpUrl` |
| `dressCode.description` | `event.dressCode.description` |
| `dressCode.swatches` | `event.dressCode.swatches` (array of `{name, color}`) |
| `rsvpContacts` | `event.rsvpContacts` (array of `{name, phone}`) |
| `guest.name` | `guest.name` |
| `guest.pin` | `guest.pin` |

## 10. Usage example

```js
import { rgb } from "pdf-lib";
import { generateInvitation } from "@/lib/pdf/template.js";

const event = {
  hostFamilyIntro: "We The Family Of",
  hostNames: "The Doe Family",
  eventTitle: "Sample Celebration",
  eventSubtitle: "(ENGAGEMENT AND FAREWELL)",
  honoreeName: "Jordan Doe",
  date: "1ST JANUARY 2027",
  time: "10.00 A.M",
  venueLines: ["SAMPLE VENUE", "SAMPLE TOWN", "SAMPLE COUNTY"],
  scripture: { quote: "Sample scripture line here", reference: "Ref 1:1" },
  website: "www.example.com",
  dressCode: {
    title: "DRESS CODE:",
    description: "Sample dress-code description",
    swatches: [
      { name: "Mocha", color: rgb(0.52, 0.46, 0.40) },
      { name: "Chocolate", color: rgb(0.35, 0.24, 0.11) },
    ],
  },
  rsvpContacts: [{ name: "Contact One", phone: "+000 000 000" }],
};

const guest = { name: "Jane Guest", pin: "1234" };

const pdfDoc = await generateInvitation(event, guest);
const bytes = await pdfDoc.save();
// write `bytes` to disk, or return as a response body with
// Content-Type: application/pdf
```

## 11. Integration steps

1. `npm install pdf-lib qrcode @pdf-lib/fontkit`.
2. Add `public/fonts/GreatVibes-Regular.ttf` and `public/ticket-template.pdf`.
3. Copy the six files under `src/lib/pdf/` and the updated
   `src/lib/pdf-generator.js` into your project.
4. In any API route (e.g. `app/api/invitations/route.js`), import
   `generateInvitation` (or the compatibility wrapper) and return the saved
   bytes with `Content-Type: application/pdf`.
5. `generateInvitation` is async and uses `fs`/`process.cwd()` (for the font
   and background assets), so it must run in a Node.js runtime — in the
   Next.js App Router, set `export const runtime = "nodejs";` in the route
   file; it will not work in the Edge runtime.
6. For batch generation (many guests), loop over your guest list and call
   `generateInvitation(event, guest)` once per guest, reusing the same
   `event` object.

## 12. Testing

- **Layout match**: render a sample PDF with placeholder data and compare
  page-by-page against the source PDF at 100% zoom; check text baselines
  against the y-coordinates in `page1.js`/`page2.js` if anything drifts.
- **Placeholders**: generate once with the literal `{{placeholder}}` strings
  left in `DEFAULT_EVENT` to confirm nothing crashes on missing data, then
  again with real values to confirm substitution.
- **Multi-page**: confirm the output PDF always has exactly 2 pages via
  `pdfDoc.getPageCount()`.
- **Long text wrapping**: pass an unusually long `honoreeName` or
  `venueLines` entry and confirm it doesn't overflow the text column;
  `drawWrappedCenteredText` in `helpers.js` is available for any field you
  want to make wrap-safe (currently only single-line fields are wired up —
  swap in the wrapped variant for fields you expect to vary in length).
- **Dynamic swatches/contacts**: test with 2, 4, and 6 entries in
  `dressCode.swatches` / `rsvpContacts` to confirm the centering math in
  `page2.js` still centers correctly (it computes total width from
  `swatches.length`, so it scales automatically).

## 13. Known approximations (not pixel-perfect)

1. **Script font** — substituted with "Great Vibes"; exact only if that's
   the actual source font (identify the original by inspecting the PDF's
   embedded font name if you have the source file, and swap accordingly).
2. **Icons** (calendar/pin/clock) — simple vector approximations, not the
   original icon set.
3. **Ornamental dividers** — approximated with a rule + diamond; the
   source's flourish is more elaborate.
4. **Curtain background** — requires you to supply the actual artwork as
   `public/ticket-template.pdf`; nothing in this code can regenerate that
   photographic image from scratch.
5. Note: the reference `pdf-generator.js` you supplied had the dress-code
   line as "Warm, Natural, Timeless", but the uploaded PDF shows "Warm,
   Natural, Sophisticated, Timeless" — I made it a plain data field
   (`dressCode.description`) so you control the exact wording going forward.
