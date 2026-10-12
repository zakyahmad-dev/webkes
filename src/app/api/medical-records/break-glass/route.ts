import { NextResponse } from "next/server";
import { db } from "@/db";
import { auditLogs, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, patientId, recordId, reason } = body;

    if (!userId || !reason || reason.trim().length < 5) {
      return NextResponse.json(
        { success: false, message: "Alasan darurat break-glass wajib diisi dengan jelas (minimal 5 karakter)." },
        { status: 400 }
      );
    }

    const user = await db.select().from(users).where(eq(users.id, Number(userId))).limit(1);

    await db.insert(auditLogs).values({
      userId: Number(userId),
      roleSnapshot: user[0]?.role || "admin",
      action: "BREAK_GLASS_ACCESS",
      auditableType: "MedicalRecord",
      auditableId: recordId ? Number(recordId) : null,
      patientId: patientId ? Number(patientId) : null,
      notes: `AKSES DARURAT (BREAK-GLASS) oleh ${user[0]?.name || "Petugas"}. Alasan: ${reason}`,
    });

    return NextResponse.json({
      success: true,
      message: "Akses darurat disetujui dan dicatat permanen dalam Audit Log.",
      grantedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error in break-glass access:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
