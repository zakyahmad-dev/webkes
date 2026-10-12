import { NextResponse } from "next/server";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const list = await db.select().from(settings);
    const settingsMap: Record<string, any> = {};
    for (const s of list) {
      settingsMap[s.key] = s.value;
    }
    return NextResponse.json({ success: true, data: settingsMap });
  } catch (error: any) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
