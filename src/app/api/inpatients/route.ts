import { NextResponse } from "next/server";
import { db } from "@/db";
import { inpatients, inpatientTransfers, beds, rooms, patients, doctors, auditLogs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const list = await db
      .select({
        id: inpatients.id,
        admissionCode: inpatients.admissionCode,
        patientId: inpatients.patientId,
        patientName: patients.fullName,
        patientRm: patients.medicalRecordNumber,
        bedId: inpatients.bedId,
        bedNumber: beds.bedNumber,
        roomCode: rooms.code,
        roomName: rooms.name,
        roomClass: rooms.roomClass,
        floor: rooms.floor,
        doctorId: inpatients.doctorId,
        doctorName: doctors.name,
        admissionSource: inpatients.admissionSource,
        initialDiagnosis: inpatients.initialDiagnosis,
        admittedAt: inpatients.admittedAt,
        checkedOutAt: inpatients.checkedOutAt,
        status: inpatients.status,
      })
      .from(inpatients)
      .innerJoin(patients, eq(inpatients.patientId, patients.id))
      .innerJoin(beds, eq(inpatients.bedId, beds.id))
      .innerJoin(rooms, eq(beds.roomId, rooms.id))
      .innerJoin(doctors, eq(inpatients.doctorId, doctors.id))
      .orderBy(desc(inpatients.admittedAt));

    return NextResponse.json({ success: true, data: list });
  } catch (error: any) {
    console.error("Error fetching inpatients:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action = "admit", patientId, bedId, doctorId, admissionSource = "poli", initialDiagnosis, inpatientId, toBedId, transferReason, userId } = body;

    const todayStr = new Date().toISOString().split("T")[0];

    if (action === "admit") {
      if (!patientId || !bedId || !doctorId || !initialDiagnosis) {
        return NextResponse.json({ success: false, message: "Data admisi tidak lengkap." }, { status: 400 });
      }

      const randNum = Math.floor(1000 + Math.random() * 9000);
      const admissionCode = `ADM-${todayStr.replace(/-/g, "")}-${randNum}`;

      const newAdm = await db
        .insert(inpatients)
        .values({
          admissionCode,
          patientId: Number(patientId),
          bedId: Number(bedId),
          doctorId: Number(doctorId),
          admissionSource,
          initialDiagnosis,
          admittedAt: new Date(),
          status: "admitted",
        })
        .returning();

      // Mark bed as occupied
      await db.update(beds).set({ status: "occupied", updatedAt: new Date() }).where(eq(beds.id, Number(bedId)));

      await db.insert(auditLogs).values({
        userId: userId ? Number(userId) : null,
        roleSnapshot: "admin",
        action: "INPATIENT_ADMITTED",
        auditableType: "Inpatient",
        auditableId: newAdm[0].id,
        patientId: Number(patientId),
        notes: `Admisi rawat inap ${admissionCode} untuk bed ID ${bedId}`,
      });

      return NextResponse.json({ success: true, message: "Pasien berhasil didaftarkan rawat inap!", data: newAdm[0] });
    }

    if (action === "transfer") {
      if (!inpatientId || !toBedId || !transferReason) {
        return NextResponse.json({ success: false, message: "Data pindah kamar tidak lengkap." }, { status: 400 });
      }

      const currentStay = await db.select().from(inpatients).where(eq(inpatients.id, Number(inpatientId))).limit(1);
      if (currentStay.length === 0) return NextResponse.json({ success: false, message: "Data rawat inap tidak ditemukan." }, { status: 404 });

      const fromBedId = currentStay[0].bedId;

      // Free old bed -> cleaning
      await db.update(beds).set({ status: "cleaning", updatedAt: new Date() }).where(eq(beds.id, fromBedId));
      // Occupy new bed
      await db.update(beds).set({ status: "occupied", updatedAt: new Date() }).where(eq(beds.id, Number(toBedId)));

      // Record transfer
      await db.insert(inpatientTransfers).values({
        inpatientId: Number(inpatientId),
        fromBedId,
        toBedId: Number(toBedId),
        reason: transferReason,
        transferredAt: new Date(),
        transferredBy: userId ? Number(userId) : null,
      });

      // Update inpatient record
      await db.update(inpatients).set({ bedId: Number(toBedId), updatedAt: new Date() }).where(eq(inpatients.id, Number(inpatientId)));

      return NextResponse.json({ success: true, message: "Pasien berhasil dipindahkan ke tempat tidur baru!" });
    }

    if (action === "discharge") {
      if (!inpatientId) return NextResponse.json({ success: false, message: "ID Rawat inap diperlukan." }, { status: 400 });

      const currentStay = await db.select().from(inpatients).where(eq(inpatients.id, Number(inpatientId))).limit(1);
      if (currentStay.length > 0) {
        await db.update(inpatients).set({ status: "discharged", checkedOutAt: new Date(), updatedAt: new Date() }).where(eq(inpatients.id, Number(inpatientId)));
        await db.update(beds).set({ status: "cleaning", updatedAt: new Date() }).where(eq(beds.id, currentStay[0].bedId));
      }

      return NextResponse.json({ success: true, message: "Pasien berhasil dipulangkan (Discharged)!" });
    }

    return NextResponse.json({ success: false, message: "Aksi tidak valid." }, { status: 400 });
  } catch (error: any) {
    console.error("Error managing inpatients:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
