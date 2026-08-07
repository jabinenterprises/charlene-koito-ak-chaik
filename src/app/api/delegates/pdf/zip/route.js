import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";
import { prisma } from "@/lib/prisma";
import { generateSingleInvitationDoc } from "@/lib/pdf-generator";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "";

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
    });

    if (guests.length === 0) {
      return Response.json({ error: "No delegates found" }, { status: 404 });
    }

    const desktopFolder = path.join(process.env.HOME || "/Users/victorbuzes", "Desktop", "Koito_Invitations");
    if (!fs.existsSync(desktopFolder)) {
      fs.mkdirSync(desktopFolder, { recursive: true });
    }

    const outputFolder = path.join(process.cwd(), "invitations");
    if (!fs.existsSync(outputFolder)) {
      fs.mkdirSync(outputFolder, { recursive: true });
    }

    const zip = new AdmZip();

    for (let i = 0; i < guests.length; i++) {
      const guest = guests[i];
      const code = guest.qrCode?.code || "";

      const singleDoc = await generateSingleInvitationDoc(guest.fullName, code);
      const pdfBytes = await singleDoc.save();

      const cleanName = guest.fullName.replace(/[^a-zA-Z0-9]/g, "_");
      const filename = `${String(i + 1).padStart(3, "0")}_${cleanName}_${code}.pdf`;

      const filePath = path.join(outputFolder, filename);
      const desktopFilePath = path.join(desktopFolder, filename);
      const pdfBuffer = Buffer.from(pdfBytes);

      fs.writeFileSync(filePath, pdfBuffer);
      fs.writeFileSync(desktopFilePath, pdfBuffer);

      zip.addFile(filename, Buffer.from(pdfBytes));
    }

    const zipBuffer = zip.toBuffer();

    return new Response(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="koito_individual_invitation_cards_${guests.length}_guests.zip"`,
      },
    });
  } catch (error) {
    console.error("Batch ZIP PDF generation error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
