import { NextResponse } from "next/server";
import { db } from "@/db";
import { doctorSchedules, doctors, polyclinics, specializations } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const list = await db
      .select({
        id: doctorSchedules.id,
        doctorId: doctorSchedules.doctorId,
        doctorName: doctors.name,
        doctorTitleSuffix: doctors.titleSuffix,
        doctorPhoto: doctors.photoPath,
        polyclinicId: doctorSchedules.polyclinicId,
        polyclinicName: polyclinics.name,
        queuePrefix: polyclinics.queuePrefix,
        specializationName: specializations.name,
        dayOfWeek: doctorSchedules.dayOfWeek,
        startTime: doctorSchedules.startTime,
        endTime: doctorSchedules.endTime,
        slotDurationMinutes: doctorSchedules.slotDurationMinutes,
        isActive: doctorSchedules.isActive,
      })
      .from(doctorSchedules)
      .innerJoin(doctors, eq(doctorSchedules.doctorId, doctors.id))
      .innerJoin(polyclinics, eq(doctorSchedules.polyclinicId, polyclinics.id))
      .leftJoin(specializations, eq(doctors.specializationId, specializations.id))
      .where(and(eq(doctorSchedules.isActive, true), eq(doctors.isActive, true)))
      .orderBy(asc(doctorSchedules.dayOfWeek), asc(doctorSchedules.startTime));

    return NextResponse.json({ success: true, data: list });
  } catch (error: any) {
    console.error("Error fetching schedules:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
