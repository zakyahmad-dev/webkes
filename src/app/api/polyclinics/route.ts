import { NextResponse } from "next/server";
import { db } from "@/db";
import { polyclinics, specializations, doctors } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const list = await db
      .select({
        id: polyclinics.id,
        name: polyclinics.name,
        slug: polyclinics.slug,
        description: polyclinics.description,
        locationNote: polyclinics.locationNote,
        queuePrefix: polyclinics.queuePrefix,
        icon: polyclinics.icon,
        specializationId: polyclinics.specializationId,
        specializationName: specializations.name,
      })
      .from(polyclinics)
      .leftJoin(specializations, eq(polyclinics.specializationId, specializations.id))
      .where(eq(polyclinics.isActive, true));

    const docs = await db.select().from(doctors).where(eq(doctors.isActive, true));

    const result = list.map((poly) => {
      const docCount = docs.filter((d) => d.polyclinicId === poly.id).length;
      return {
        ...poly,
        doctorsCount: docCount,
      };
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Error fetching polyclinics:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
