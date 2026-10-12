import { NextResponse } from "next/server";
import { db } from "@/db";
import { specializations } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const list = await db
      .select()
      .from(specializations)
      .where(eq(specializations.isActive, true));

    return NextResponse.json({ success: true, data: list });
  } catch (error: any) {
    console.error("Error fetching specializations:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
