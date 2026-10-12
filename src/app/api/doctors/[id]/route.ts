import { NextResponse } from "next/server";
import { db } from "@/db";
import { doctors, specializations, polyclinics, doctorSchedules, appointments } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const docId = Number(id);

    const docList = await db
      .select({
        id: doctors.id,
        userId: doctors.userId,
        name: doctors.name,
        slug: doctors.slug,
        titlePrefix: doctors.titlePrefix,
        titleSuffix: doctors.titleSuffix,
        strNumber: doctors.strNumber,
        sipNumber: doctors.sipNumber,
        photoPath: doctors.photoPath,
        bio: doctors.bio,
        education: doctors.education,
        experienceYears: doctors.experienceYears,
        consultationFee: doctors.consultationFee,
        rating: doctors.rating,
        reviewsCount: doctors.reviewsCount,
        isActive: doctors.isActive,
        specializationId: doctors.specializationId,
        specializationName: specializations.name,
        specializationSlug: specializations.slug,
        polyclinicId: doctors.polyclinicId,
        polyclinicName: polyclinics.name,
        polyclinicSlug: polyclinics.slug,
        polyclinicLocation: polyclinics.locationNote,
        queuePrefix: polyclinics.queuePrefix,
      })
      .from(doctors)
      .leftJoin(specializations, eq(doctors.specializationId, specializations.id))
      .leftJoin(polyclinics, eq(doctors.polyclinicId, polyclinics.id))
      .where(eq(doctors.id, docId));

    if (docList.length === 0) {
      return NextResponse.json({ success: false, message: "Doctor not found" }, { status: 404 });
    }

    const doctor = docList[0];

    const schedules = await db
      .select()
      .from(doctorSchedules)
      .where(eq(doctorSchedules.doctorId, docId));

    return NextResponse.json({
      success: true,
      data: {
        ...doctor,
        schedules,
      },
    });
  } catch (error: any) {
    console.error("Error fetching doctor:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
