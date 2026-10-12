import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  prescriptions,
  prescriptionItems,
  medicines,
  medicineStocks,
  patients,
  notifications,
  auditLogs,
} from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prescriptionId, pharmacistUserId, notes } = body;

    if (!prescriptionId) {
      return NextResponse.json({ success: false, message: "ID resep diperlukan." }, { status: 400 });
    }

    const rxList = await db
      .select()
      .from(prescriptions)
      .where(eq(prescriptions.id, Number(prescriptionId)))
      .limit(1);

    if (rxList.length === 0) {
      return NextResponse.json({ success: false, message: "Resep tidak ditemukan." }, { status: 404 });
    }

    const rx = rxList[0];

    // Get all items in this prescription
    const items = await db
      .select()
      .from(prescriptionItems)
      .where(eq(prescriptionItems.prescriptionId, rx.id));

    // Deduct stock for each medicine item
    for (const item of items) {
      const medList = await db
        .select()
        .from(medicines)
        .where(eq(medicines.id, item.medicineId))
        .limit(1);

      if (medList.length > 0) {
        const med = medList[0];
        const newBalance = Math.max(0, med.currentStock - item.quantity);

        // Update medicine stock
        await db
          .update(medicines)
          .set({ currentStock: newBalance, updatedAt: new Date() })
          .where(eq(medicines.id, med.id));

        // Insert stock movement ledger
        await db.insert(medicineStocks).values({
          medicineId: med.id,
          batchNumber: `BATCH-DISP-${rx.id}`,
          expiryDate: "2027-12-31",
          movementType: "dispense",
          quantity: -item.quantity,
          balanceAfter: newBalance,
          referenceType: "prescription_item",
          referenceId: item.id,
          notes: `Dispensing resep #${rx.prescriptionCode}`,
          createdBy: pharmacistUserId ? Number(pharmacistUserId) : null,
        });

        // Update item dispensed quantity
        await db
          .update(prescriptionItems)
          .set({ dispensedQuantity: item.quantity })
          .where(eq(prescriptionItems.id, item.id));
      }
    }

    // Update prescription status to completed
    const updatedRx = await db
      .update(prescriptions)
      .set({
        status: "completed",
        processedBy: pharmacistUserId ? Number(pharmacistUserId) : null,
        completedAt: new Date(),
        readyAt: rx.readyAt || new Date(),
        notes: notes || rx.notes,
        updatedAt: new Date(),
      })
      .where(eq(prescriptions.id, rx.id))
      .returning();

    // Notify patient
    const patientRecord = await db.select().from(patients).where(eq(patients.id, rx.patientId)).limit(1);
    if (patientRecord[0]?.userId) {
      await db.insert(notifications).values({
        userId: patientRecord[0].userId,
        category: "prescription",
        title: "Obat Resep Telah Siap",
        message: `Resep ${rx.prescriptionCode} telah selesai disiapkan oleh Instalasi Farmasi dan dapat diambil atau dikirim.`,
        actionUrl: "/prescriptions",
      });
    }

    // Audit log
    await db.insert(auditLogs).values({
      userId: pharmacistUserId ? Number(pharmacistUserId) : null,
      roleSnapshot: "pharmacist",
      action: "PRESCRIPTION_DISPENSED",
      auditableType: "Prescription",
      auditableId: rx.id,
      patientId: rx.patientId,
      notes: `Resep ${rx.prescriptionCode} telah diserahkan (dispensed). Pemotongan stok otomatis selesai.`,
    });

    return NextResponse.json({
      success: true,
      message: "Resep berhasil didispensing dan stok obat telah terpotong!",
      data: updatedRx[0],
    });
  } catch (error: any) {
    console.error("Error dispensing prescription:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
