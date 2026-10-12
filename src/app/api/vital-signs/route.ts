import { NextResponse } from "next/server";
import { db } from "@/db";
import { vitalSigns, patients, users, auditLogs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");

    const list = await db
      .select({
        id: vitalSigns.id,
        patientId: vitalSigns.patientId,
        patientName: patients.fullName,
        patientRm: patients.medicalRecordNumber,
        recordedByName: users.name,
        appointmentId: vitalSigns.appointmentId,
        medicalRecordId: vitalSigns.medicalRecordId,
        systolic: vitalSigns.systolic,
        diastolic: vitalSigns.diastolic,
        heartRate: vitalSigns.heartRate,
        respiratoryRate: vitalSigns.respiratoryRate,
        temperature: vitalSigns.temperature,
        spo2: vitalSigns.spo2,
        weightKg: vitalSigns.weightKg,
        heightCm: vitalSigns.heightCm,
        bmi: vitalSigns.bmi,
        notes: vitalSigns.notes,
        recordedAt: vitalSigns.recordedAt,
      })
      .from(vitalSigns)
      .innerJoin(patients, eq(vitalSigns.patientId, patients.id))
      .leftJoin(users, eq(vitalSigns.recordedBy, users.id))
      .orderBy(desc(vitalSigns.recordedAt));

    let filtered = list;
    if (patientId) {
      filtered = filtered.filter((v) => v.patientId === Number(patientId));
    }

    return NextResponse.json({ success: true, data: filtered });
  } catch (error: any) {
    console.error("Error fetching vital signs:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      patientId,
      appointmentId,
      recordedByUserId,
      systolic,
      diastolic,
      heartRate,
      respiratoryRate = 18,
      temperature,
      spo2,
      weightKg,
      heightCm,
      notes,
    } = body;

    if (!patientId) {
      return NextResponse.json({ success: false, message: "ID Pasien diperlukan." }, { status: 400 });
    }

    const heightM = heightCm ? Number(heightCm) / 100 : null;
    const bmiCalc = heightM && weightKg ? (Number(weightKg) / (heightM * heightM)).toFixed(1) : null;

    const newVs = await db
      .insert(vitalSigns)
      .values({
        patientId: Number(patientId),
        appointmentId: appointmentId ? Number(appointmentId) : null,
        recordedBy: recordedByUserId ? Number(recordedByUserId) : null,
        systolic: systolic ? Number(systolic) : null,
        diastolic: diastolic ? Number(diastolic) : null,
        heartRate: heartRate ? Number(heartRate) : null,
        respiratoryRate: respiratoryRate ? Number(respiratoryRate) : 18,
        temperature: temperature ? String(temperature) : "36.5",
        spo2: spo2 ? Number(spo2) : 98,
        weightKg: weightKg ? String(weightKg) : null,
        heightCm: heightCm ? String(heightCm) : null,
        bmi: bmiCalc,
        notes: notes || "Pengukuran Triage Perawat",
      })
      .returning();

    // Audit Log
    await db.insert(auditLogs).values({
      userId: recordedByUserId ? Number(recordedByUserId) : null,
      roleSnapshot: "nurse",
      action: "VITAL_SIGNS_RECORDED",
      auditableType: "VitalSigns",
      auditableId: newVs[0].id,
      patientId: Number(patientId),
      notes: `Pencatatan tanda vital: TD ${systolic || "-"}/${diastolic || "-"} mmHg, HR ${heartRate || "-"} bpm, SpO2 ${spo2 || "-"}%`,
    });

    return NextResponse.json({
      success: true,
      message: "Tanda vital berhasil disimpan!",
      data: newVs[0],
    });
  } catch (error: any) {
    console.error("Error saving vital signs:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
