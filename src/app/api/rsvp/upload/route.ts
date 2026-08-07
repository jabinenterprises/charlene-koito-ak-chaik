import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { reconcilePendingRsvpFromPhones } from "@/services/rsvp.service";
import { normalizePhone } from "@/lib/utils";

export const runtime = "nodejs";

const clean = (s: any) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No Excel file provided." }, { status: 400 });
    }

    const bytes = await (file as File).arrayBuffer();
    const workbook = XLSX.read(Buffer.from(bytes), { type: "buffer" });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    if (!worksheet) {
      return NextResponse.json({ error: "The uploaded file did not contain any worksheet data." }, { status: 400 });
    }

    const rawMatrix: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
    const objectRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

    if (!rawMatrix || rawMatrix.length === 0) {
      return NextResponse.json({ error: "Uploaded file is empty" }, { status: 400 });
    }

    const phoneKeys = ["phone", "phonenumber", "mobile", "contact", "tel", "telephone", "msisdn", "cell", "number", "no", "guest"];
    const rsvpKeys = ["rsvp", "attend", "attendance", "status", "confirm", "confirmation", "response", "reply"];
    const negativePattern = /^(no|n|not|declined|cancelled|canceled|absent|false|0)$/i;

    let headerRowIndex = -1;
    let colMap = { phone: -1, rsvp: -1 };

    for (let r = 0; r < Math.min(10, rawMatrix.length); r++) {
      const row = rawMatrix[r];
      if (!Array.isArray(row)) continue;

      const tempColMap = { phone: -1, rsvp: -1 };
      let foundPhone = false;

      row.forEach((cell, idx) => {
        const cClean = clean(cell);
        if (!cClean) return;

        if (tempColMap.phone === -1 && phoneKeys.some((k) => cClean === k || (cClean.includes(k) && !cClean.includes("rsvp")))) {
          tempColMap.phone = idx;
          foundPhone = true;
        } else if (tempColMap.rsvp === -1 && rsvpKeys.some((k) => cClean === k || cClean.includes(k))) {
          tempColMap.rsvp = idx;
        }
      });

      if (foundPhone) {
        headerRowIndex = r;
        colMap = tempColMap;
        break;
      }
    }

    const phoneNumbers: string[] = [];

    if (headerRowIndex >= 0) {
      for (let r = headerRowIndex + 1; r < rawMatrix.length; r++) {
        const row = rawMatrix[r];
        if (!Array.isArray(row) || row.every((c) => String(c || "").trim() === "")) continue;

        const rawPhoneVal = colMap.phone !== -1 ? String(row[colMap.phone] ?? "") : "";
        const rawRsvpVal = colMap.rsvp !== -1 ? String(row[colMap.rsvp] ?? "").trim() : "";

        if (rawRsvpVal && negativePattern.test(rawRsvpVal)) {
          continue; // Skip explicit decline
        }

        const cleanCandidateStr = String(rawPhoneVal).replace(/[''""`’‘]/g, "").trim();
        let phoneCandidate = normalizePhone(cleanCandidateStr) || cleanCandidateStr.replace(/[^\d+]/g, "");

        if (phoneCandidate && phoneCandidate.length === 9 && /^[17]/.test(phoneCandidate)) {
          phoneCandidate = "0" + phoneCandidate;
        }

        if (phoneCandidate && phoneCandidate.length >= 7) {
          phoneNumbers.push(phoneCandidate);
        } else {
          // Fallback search across cells in row
          for (const cell of row) {
            const txt = String(cell ?? "").replace(/[''""`’‘]/g, "").trim();
            let norm = normalizePhone(txt);
            if (norm && norm.length === 9 && /^[17]/.test(norm)) norm = "0" + norm;
            if (norm && norm.length >= 7) {
              phoneNumbers.push(norm);
              break;
            }
          }
        }
      }
    } else {
      // Fallback matrix extraction if no explicit header row was detected
      for (const row of objectRows) {
        if (!row || typeof row !== "object") continue;
        for (const val of Object.values(row)) {
          const txt = String(val ?? "").replace(/[''""`’‘]/g, "").trim();
          let norm = normalizePhone(txt);
          if (norm && norm.length === 9 && /^[17]/.test(norm)) norm = "0" + norm;
          if (norm && norm.length >= 7) {
            phoneNumbers.push(norm);
            break;
          }
        }
      }
    }

    if (phoneNumbers.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No valid phone numbers with a positive RSVP value were found.",
        totalRows: rawMatrix.length,
      }, { status: 400 });
    }

    const result = await reconcilePendingRsvpFromPhones(phoneNumbers);
    console.log(
      `[RSVP UPLOAD] totalExtractedPhones=${phoneNumbers.length}, processedPhones=${result.processed}, updated=${result.updated}, skippedAlreadyAttending=${result.skippedAlreadyAttending}, notFound=${result.notFound}`,
    );

    return NextResponse.json({
      success: true,
      message: `Processed ${result.processed} phone number(s): ${result.updated} RSVP(s) updated, ${result.skippedAlreadyAttending} already had RSVP, ${result.notFound} not found.`,
      totalRows: rawMatrix.length,
      totalYesRows: phoneNumbers.length,
      ...result,
    });
  } catch (error: any) {
    console.error("[RSVP UPLOAD ERROR]", error);
    return NextResponse.json({ error: error?.message || "Failed to process RSVP upload." }, { status: 500 });
  }
}
