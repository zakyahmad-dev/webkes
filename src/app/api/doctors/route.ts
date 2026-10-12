import { NextResponse } from "next/server";
import { db } from "@/db";
import { doctors, specializations, polyclinics, doctorSchedules } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const polyclinicId = searchParams.get("polyclinicId");
    const specializationId = searchParams.get("specializationId");
    const query = searchParams.get("q")?.toLowerCase();

    const allDoctors = await db
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
      .where(eq(doctors.isActive, true));

    // Fetch all active schedules
    const schedules = await db
      .select()
      .from(doctorSchedules)
      .where(eq(doctorSchedules.isActive, true));

    let filtered = allDoctors.map((doc) => {
      const docSchedules = schedules.filter((s) => s.doctorId === doc.id);
      return {
        ...doc,
        schedules: docSchedules,
      };
    });

    if (polyclinicId) {
      filtered = filtered.filter((d) => d.polyclinicId === Number(polyclinicId));
    }
    if (specializationId) {
      filtered = filtered.filter((d) => d.specializationId === Number(specializationId));
    }
    if (query) {
      filtered = filtered.filter(
        (d) =>
          d.name.toLowerCase().includes(query) ||
          d.specializationName?.toLowerCase().includes(query) ||
          d.polyclinicName?.toLowerCase().includes(query)
      );
    }

    return NextResponse.json({ success: true, data: filtered });
  } catch (error: any) {
    console.error("Error fetching doctors:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
