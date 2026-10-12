import { NextResponse } from "next/server";
import { db } from "@/db";
import { rooms, beds, inpatients, patients, doctors } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const allRooms = await db.select().from(rooms).where(eq(rooms.isActive, true)).orderBy(asc(rooms.floor));
    const allBeds = await db.select().from(beds);
    const activeInpatients = await db
      .select({
        id: inpatients.id,
        admissionCode: inpatients.admissionCode,
        patientId: inpatients.patientId,
        patientName: patients.fullName,
        patientRm: patients.medicalRecordNumber,
        bedId: inpatients.bedId,
        doctorName: doctors.name,
        initialDiagnosis: inpatients.initialDiagnosis,
        admittedAt: inpatients.admittedAt,
        status: inpatients.status,
      })
      .from(inpatients)
      .innerJoin(patients, eq(inpatients.patientId, patients.id))
      .innerJoin(doctors, eq(inpatients.doctorId, doctors.id))
      .where(eq(inpatients.status, "admitted"));

    const enrichedRooms = allRooms.map((room) => {
      const roomBeds = allBeds
        .filter((b) => b.roomId === room.id)
        .map((bed) => {
          const patientStay = activeInpatients.find((p) => p.bedId === bed.id);
          return {
            ...bed,
            inpatient: patientStay || null,
          };
        });

      return {
        ...room,
        beds: roomBeds,
        totalBeds: roomBeds.length,
        occupiedBeds: roomBeds.filter((b) => b.status === "occupied").length,
        availableBeds: roomBeds.filter((b) => b.status === "available").length,
      };
    });

    return NextResponse.json({ success: true, data: enrichedRooms });
  } catch (error: any) {
    console.error("Error fetching beds:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
