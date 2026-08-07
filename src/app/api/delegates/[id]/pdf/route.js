import { prisma } from "@/lib/prisma";
import { generateSingleInvitationDoc } from "@/lib/pdf-generator";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const delegateId = resolvedParams.id;

    if (!delegateId) {
      return Response.json({ error: "Invalid delegate ID" }, { status: 400 });
    }

    let guest = await prisma.guest.findUnique({
      where: { id: String(delegateId) },
      include: { qrCode: true },
    });

    if (!guest) {
      guest = await prisma.guest.findFirst({
        where: {
          OR: [
            { qrCode: { code: String(delegateId) } },
            { fullName: { equals: String(delegateId), mode: "insensitive" } },
          ],
        },
        include: { qrCode: true },
      });
    }

    if (!guest) {
      return Response.json({ error: "Delegate not found" }, { status: 404 });
    }

    const code = guest.qrCode?.code || "";
    const pdfDoc = await generateSingleInvitationDoc(guest.fullName, code);
    const pdfBytes = await pdfDoc.save();

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${guest.fullName.replace(/[^a-zA-Z0-9]/g, "_")}_koito_invitation.pdf"`,
      },
    });
  } catch (error) {
    console.error("Single PDF generation error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
