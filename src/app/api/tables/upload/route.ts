import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { getDefaultEvent } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const event = await getDefaultEvent();
    if (!event) {
      return NextResponse.json({ error: "Database is not available yet" }, { status: 503 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const workbook = XLSX.read(buffer, { type: "buffer" });
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

    const clean = (s: any) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

    // Column keyword lists for table uploads
    const tableKeys = ["tablename", "tablenumber", "tablenum", "tableno", "table", "number", "no"];
    const chairsKeys = [
      "numberofchairs",
      "noofchairs",
      "numofchairs",
      "numberofchair",
      "noofchair",
      "chairs",
      "chair",
      "chaircount",
      "chairscount",
      "numberofseats",
      "noofseats",
      "seats",
      "seatcount",
      "capacity",
      "maxseats",
      "maxcapacity",
      "size",
      "totalseats",
    ];
    const zoneKeys = [
      "zone",
      "zones",
      "tablezone",
      "zonename",
      "zone_name",
      "section",
      "area",
      "location",
      "seatingzone",
      "venuezone",
    ];
    const typeKeys = ["tabletype", "type", "shape", "tableshape", "category"];
    const descKeys = ["description", "notes", "details", "comments"];

    // 1. Detect if any of the top 10 rows is a Header Row in rawMatrix
    let headerRowIndex = -1;
    let colMap = { table: -1, chairs: -1, zone: -1, type: -1, desc: -1 };

    for (let r = 0; r < Math.min(10, rawMatrix.length); r++) {
      const row = rawMatrix[r];
      if (!Array.isArray(row)) continue;

      const tempColMap = { table: -1, chairs: -1, zone: -1, type: -1, desc: -1 };
      let matchCount = 0;

      row.forEach((cell, idx) => {
        const cClean = clean(cell);
        if (!cClean) return;

        if (
          tempColMap.table === -1 &&
          tableKeys.some((k) => cClean === k || (cClean.includes(k) && !cClean.includes("chair") && !cClean.includes("seat")))
        ) {
          tempColMap.table = idx;
          matchCount++;
        } else if (tempColMap.chairs === -1 && chairsKeys.some((k) => cClean === k || cClean.includes(k))) {
          tempColMap.chairs = idx;
          matchCount++;
        } else if (tempColMap.zone === -1 && zoneKeys.some((k) => cClean === k || cClean.includes(k))) {
          tempColMap.zone = idx;
          matchCount++;
        } else if (tempColMap.type === -1 && typeKeys.some((k) => cClean === k || cClean.includes(k))) {
          tempColMap.type = idx;
          matchCount++;
        } else if (tempColMap.desc === -1 && descKeys.some((k) => cClean === k || cClean.includes(k))) {
          tempColMap.desc = idx;
          matchCount++;
        }
      });

      if (
        matchCount >= 2 ||
        (matchCount >= 1 && (tempColMap.table !== -1 || tempColMap.chairs !== -1 || tempColMap.zone !== -1))
      ) {
        headerRowIndex = r;
        colMap = tempColMap;
        break;
      }
    }

    // Prepare extracted rows
    const parsedRows: Array<{
      rawTableName: string;
      rawCapacity: string;
      rawZone: string;
      tableType: string;
      descriptionVal: string;
    }> = [];

    if (headerRowIndex >= 0) {
      // Matrix-based extraction
      for (let r = headerRowIndex + 1; r < rawMatrix.length; r++) {
        const row = rawMatrix[r];
        if (!Array.isArray(row) || row.every((c) => String(c || "").trim() === "")) continue;

        const rawTableName = colMap.table !== -1 ? String(row[colMap.table] || "").trim() : "";
        const rawCapacity = colMap.chairs !== -1 ? String(row[colMap.chairs] || "").trim() : "";
        const rawZone = colMap.zone !== -1 ? String(row[colMap.zone] || "").trim() : "";
        const tableType = colMap.type !== -1 ? String(row[colMap.type] || "").trim() : "";
        const descriptionVal = colMap.desc !== -1 ? String(row[colMap.desc] || "").trim() : "";

        parsedRows.push({ rawTableName, rawCapacity, rawZone, tableType, descriptionVal });
      }
    } else {
      // Fallback: object-based extraction from sheet_to_json
      for (const row of objectRows) {
        if (!row || typeof row !== "object") continue;

        const getVal = (keys: string[]) => {
          for (const k of keys) {
            const targetClean = clean(k);
            const match = Object.keys(row).find((rk) => clean(rk) === targetClean);
            if (match && row[match] !== undefined && row[match] !== null && String(row[match]).trim() !== "") {
              return String(row[match]).trim();
            }
          }
          for (const k of keys) {
            const targetClean = clean(k);
            const match = Object.keys(row).find((rk) => clean(rk).includes(targetClean));
            if (match && row[match] !== undefined && row[match] !== null && String(row[match]).trim() !== "") {
              return String(row[match]).trim();
            }
          }
          return "";
        };

        const rawTableName = getVal([
          "table num",
          "tablenum",
          "table number",
          "tablenumber",
          "table no",
          "tableno",
          "table #",
          "table name",
          "table_name",
          "table",
          "number",
          "tablename",
          "table_no",
          "no",
        ]);
        const rawCapacity = getVal([
          "number of chairs",
          "no of chairs",
          "no. of chairs",
          "num of chairs",
          "chairs",
          "chair",
          "number of seats",
          "no of seats",
          "seats",
          "capacity",
          "max seats",
          "size",
          "chair count",
          "chairs count",
          "total seats",
        ]);
        const rawZone = getVal([
          "zone",
          "zones",
          "table zone",
          "zone name",
          "zone_name",
          "section",
          "area",
          "location",
          "seating zone",
          "venue zone",
        ]);
        const tableType = getVal(["table type", "type", "shape", "category"]);
        const descriptionVal = getVal(["description", "notes", "details", "comments"]);

        parsedRows.push({ rawTableName, rawCapacity, rawZone, tableType, descriptionVal });
      }
    }

    if (parsedRows.length === 0) {
      return NextResponse.json({ error: "No table data rows found in uploaded file" }, { status: 400 });
    }

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const item of parsedRows) {
      const { rawTableName, rawCapacity, rawZone, tableType, descriptionVal } = item;

      if (!rawTableName) {
        skippedCount++;
        continue;
      }

      const tableName = !isNaN(Number(rawTableName)) ? `Table ${rawTableName}` : rawTableName;
      const parsedCapacity = parseInt(String(rawCapacity).replace(/[^0-9]/g, ""));
      const capacity = !isNaN(parsedCapacity) && parsedCapacity > 0 ? parsedCapacity : 10;
      const zone = rawZone ? String(rawZone).trim() : null;
      const description = descriptionVal || (tableType ? `Type: ${tableType}` : null);

      const existingTable = await prisma.diningTable.findFirst({
        where: {
          eventId: event.id,
          OR: [
            { name: tableName },
            { name: rawTableName },
            { name: { equals: tableName, mode: "insensitive" } },
            { name: { equals: rawTableName, mode: "insensitive" } },
          ],
        },
        include: { seats: true },
      });

      if (existingTable) {
        await prisma.diningTable.update({
          where: { id: existingTable.id },
          data: {
            name: tableName,
            zone: zone || existingTable.zone || null,
            ...(description ? { description } : {}),
          },
        });

        const currentSeatCount = existingTable.seats.length;
        if (capacity > currentSeatCount) {
          const newSeatsData = Array.from({ length: capacity - currentSeatCount }, (_, i) => ({
            diningTableId: existingTable.id,
            seatNumber: currentSeatCount + i + 1,
          }));
          await prisma.seat.createMany({ data: newSeatsData });
        } else if (capacity < currentSeatCount) {
          const seatsToDelete = await prisma.seat.findMany({
            where: {
              diningTableId: existingTable.id,
              seatingAssignment: null,
            },
            orderBy: { seatNumber: "desc" },
            take: currentSeatCount - capacity,
            select: { id: true },
          });
          if (seatsToDelete.length > 0) {
            await prisma.seat.deleteMany({
              where: { id: { in: seatsToDelete.map((s) => s.id) } },
            });
          }
        }
        updatedCount++;
      } else {
        await prisma.$transaction(async (tx) => {
          const created = await tx.diningTable.create({
            data: {
              eventId: event.id,
              name: tableName,
              zone: zone || null,
              description: description || null,
            },
          });
          const seatsData = Array.from({ length: capacity }, (_, i) => ({
            diningTableId: created.id,
            seatNumber: i + 1,
          }));
          await tx.seat.createMany({ data: seatsData });
        });
        createdCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Tables import complete: ${createdCount} created, ${updatedCount} updated, ${skippedCount} skipped.`,
      createdCount,
      updatedCount,
      skippedCount,
      totalProcessed: parsedRows.length,
    });
  } catch (error: any) {
    console.error("🔴 [TABLES UPLOAD ERROR]", error);
    return NextResponse.json({ error: error?.message || "Failed to process tables upload." }, { status: 500 });
  }
}
