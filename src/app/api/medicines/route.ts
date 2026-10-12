import { NextResponse } from "next/server";
import { db } from "@/db";
import { medicines, medicineStocks, auditLogs } from "@/db/schema";
import { eq, desc, asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const list = await db
      .select()
      .from(medicines)
      .where(eq(medicines.isActive, true))
      .orderBy(asc(medicines.name));

    return NextResponse.json({ success: true, data: list });
  } catch (error: any) {
    console.error("Error fetching medicines:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, medicineId, quantity, batchNumber, expiryDate, notes, userId, newMedicine } = body;

    if (action === "restock" && medicineId && quantity) {
      const medList = await db.select().from(medicines).where(eq(medicines.id, Number(medicineId))).limit(1);
      if (medList.length === 0) return NextResponse.json({ success: false, message: "Obat tidak ditemukan." }, { status: 404 });

      const med = medList[0];
      const newStock = med.currentStock + Number(quantity);

      await db.update(medicines).set({ currentStock: newStock, updatedAt: new Date() }).where(eq(medicines.id, med.id));

      await db.insert(medicineStocks).values({
        medicineId: med.id,
        batchNumber: batchNumber || `BATCH-${Date.now()}`,
        expiryDate: expiryDate || "2028-12-31",
        movementType: "in",
        quantity: Number(quantity),
        balanceAfter: newStock,
        notes: notes || "Restock batch farmasi",
        createdBy: userId ? Number(userId) : null,
      });

      return NextResponse.json({ success: true, message: `Stok ${med.name} berhasil ditambah sebanyak ${quantity} unit.` });
    }

    if (action === "create" && newMedicine) {
      const created = await db.insert(medicines).values({
        sku: newMedicine.sku || `MED-${Date.now().toString().slice(-4)}`,
        name: newMedicine.name,
        genericName: newMedicine.genericName || newMedicine.name,
        form: newMedicine.form || "Tablet",
        strength: newMedicine.strength || "500mg",
        unit: newMedicine.unit || "Strip",
        price: String(newMedicine.price || "25000"),
        currentStock: Number(newMedicine.initialStock || 0),
        minStock: Number(newMedicine.minStock || 20),
        requiresPrescription: true,
      }).returning();

      return NextResponse.json({ success: true, message: "Obat baru berhasil didaftarkan!", data: created[0] });
    }

    return NextResponse.json({ success: false, message: "Aksi tidak valid." }, { status: 400 });
  } catch (error: any) {
    console.error("Error managing medicines:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
