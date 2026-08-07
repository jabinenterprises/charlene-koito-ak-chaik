import { PDFDocument } from "pdf-lib";
import { prisma } from "@/lib/prisma";
import { generateSingleInvitationDoc } from "@/lib/pdf-generator";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "";
    const limit = parseInt(searchParams.get("limit") || "100");

    const where = {};
    if (status && status !== "ALL") {
      if (status === "CHECKED_IN") {
        where.checkIn = { isNot: null };
      } else if (status === "INVITED") {
        where.checkIn = null;
      }
    }

    const guests = await prisma.guest.findMany({
      where,
      include: { qrCode: true },
      orderBy: { fullName: "asc" },
      take: limit > 0 ? limit : 100,
    });

    if (guests.length === 0) {
      return Response.json({ error: "No delegates found" }, { status: 404 });
    }

    const mainPdfDoc = await PDFDocument.create();

    for (const guest of guests) {
      const code = guest.qrCode?.code || "";
      const singleDoc = await generateSingleInvitationDoc(guest.fullName, code);
      const copiedPages = await mainPdfDoc.copyPages(singleDoc, singleDoc.getPageIndices());
      copiedPages.forEach((p) => mainPdfDoc.addPage(p));
    }

    const pdfBytes = await mainPdfDoc.save();

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="koito_all_invitation_cards.pdf"`,
      },
    });
  } catch (error) {
    console.error("Bulk PDF generation error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
