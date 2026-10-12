import { NextResponse } from "next/server";
import { db } from "@/db";
import { auditLogs, users, patients } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const patientId = searchParams.get("patientId");

    const list = await db
      .select({
        id: auditLogs.id,
        userId: auditLogs.userId,
        userName: users.name,
        userRole: auditLogs.roleSnapshot,
        action: auditLogs.action,
        auditableType: auditLogs.auditableType,
        auditableId: auditLogs.auditableId,
        patientId: auditLogs.patientId,
        patientName: patients.fullName,
        notes: auditLogs.notes,
        ipAddress: auditLogs.ipAddress,
        userAgent: auditLogs.userAgent,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .leftJoin(patients, eq(auditLogs.patientId, patients.id))
      .orderBy(desc(auditLogs.createdAt));

    let filtered = list;
    if (action) {
      filtered = filtered.filter((a) => a.action.toLowerCase().includes(action.toLowerCase()));
    }
    if (patientId) {
      filtered = filtered.filter((a) => a.patientId === Number(patientId));
    }

    return NextResponse.json({ success: true, data: filtered });
  } catch (error: any) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
