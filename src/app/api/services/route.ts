import { NextResponse } from "next/server";
import { db } from "@/db";
import { services } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const list = await db
      .select()
      .from(services)
      .where(eq(services.isActive, true))
      .orderBy(asc(services.sortOrder));

    return NextResponse.json({ success: true, data: list });
  } catch (error: any) {
    console.error("Error fetching services:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
