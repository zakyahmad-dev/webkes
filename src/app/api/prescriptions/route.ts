import { NextResponse } from "next/server";
import { db } from "@/db";
import { prescriptions, prescriptionItems, medicines, patients, doctors, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");
    const status = searchParams.get("status");

    const allPrescriptions = await db
      .select({
        id: prescriptions.id,
        prescriptionCode: prescriptions.prescriptionCode,
        medicalRecordId: prescriptions.medicalRecordId,
        patientId: prescriptions.patientId,
        patientName: patients.fullName,
        patientRm: patients.medicalRecordNumber,
        doctorId: prescriptions.doctorId,
        doctorName: doctors.name,
        status: prescriptions.status,
        notes: prescriptions.notes,
        readyAt: prescriptions.readyAt,
        completedAt: prescriptions.completedAt,
        createdAt: prescriptions.createdAt,
      })
      .from(prescriptions)
      .innerJoin(patients, eq(prescriptions.patientId, patients.id))
      .innerJoin(doctors, eq(prescriptions.doctorId, doctors.id))
      .orderBy(desc(prescriptions.createdAt));

    const items = await db
      .select({
        id: prescriptionItems.id,
        prescriptionId: prescriptionItems.prescriptionId,
        medicineId: prescriptionItems.medicineId,
        medicineName: medicines.name,
        form: medicines.form,
        dose: prescriptionItems.dose,
        frequency: prescriptionItems.frequency,
        durationDays: prescriptionItems.durationDays,
        quantity: prescriptionItems.quantity,
        instructions: prescriptionItems.instructions,
        dispensedQuantity: prescriptionItems.dispensedQuantity,
        availableStock: medicines.currentStock,
        price: medicines.price,
      })
      .from(prescriptionItems)
      .innerJoin(medicines, eq(prescriptionItems.medicineId, medicines.id));

    let filtered = allPrescriptions.map((rx) => ({
      ...rx,
      items: items.filter((i) => i.prescriptionId === rx.id),
    }));

    if (patientId) {
      filtered = filtered.filter((r) => r.patientId === Number(patientId));
    }
    if (status) {
      filtered = filtered.filter((r) => r.status === status);
    }

    return NextResponse.json({ success: true, data: filtered });
  } catch (error: any) {
    console.error("Error fetching prescriptions:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { prescriptionId, status, userId } = body;

    if (!prescriptionId || !status) {
      return NextResponse.json({ success: false, message: "ID dan status diperlukan." }, { status: 400 });
    }

    const updateData: any = { status, updatedAt: new Date() };
    if (userId) updateData.processedBy = Number(userId);
    if (status === "ready") updateData.readyAt = new Date();
    if (status === "completed") updateData.completedAt = new Date();

    const updated = await db
      .update(prescriptions)
      .set(updateData)
      .where(eq(prescriptions.id, Number(prescriptionId)))
      .returning();

    return NextResponse.json({ success: true, data: updated[0] });
  } catch (error: any) {
    console.error("Error updating prescription:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
