import { NextResponse } from "next/server";
import { db } from "@/db";
import { labTestTypes } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const list = await db.select().from(labTestTypes).where(eq(labTestTypes.isActive, true));
    return NextResponse.json({ success: true, data: list });
  } catch (error: any) {
    console.error("Error fetching lab test types:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
