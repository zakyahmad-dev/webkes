import { NextResponse } from "next/server";
import { db } from "@/db";
import { patients, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const id = searchParams.get("id");

    const list = await db
      .select({
        id: patients.id,
        userId: patients.userId,
        medicalRecordNumber: patients.medicalRecordNumber,
        fullName: patients.fullName,
        nik: patients.nik,
        birthDate: patients.birthDate,
        gender: patients.gender,
        bloodType: patients.bloodType,
        phone: patients.phone,
        address: patients.address,
        city: patients.city,
        emergencyContactName: patients.emergencyContactName,
        emergencyContactPhone: patients.emergencyContactPhone,
        emergencyContactRelation: patients.emergencyContactRelation,
        allergiesSummary: patients.allergiesSummary,
        bpjsNumber: patients.bpjsNumber,
        consentAt: patients.consentAt,
        consentVersion: patients.consentVersion,
      })
      .from(patients)
      .orderBy(desc(patients.createdAt));

    let filtered = list;
    if (userId) {
      filtered = filtered.filter((p) => p.userId === Number(userId));
    }
    if (id) {
      filtered = filtered.filter((p) => p.id === Number(id));
    }

    return NextResponse.json({ success: true, data: filtered });
  } catch (error: any) {
    console.error("Error fetching patients:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
