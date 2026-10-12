import { NextResponse } from "next/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    const list = await db
      .select()
      .from(notifications)
      .orderBy(desc(notifications.createdAt));

    let filtered = list;
    if (userId) {
      filtered = filtered.filter((n) => n.userId === Number(userId));
    }

    return NextResponse.json({ success: true, data: filtered });
  } catch (error: any) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { notificationId, markAllRead, userId } = body;

    if (markAllRead && userId) {
      await db
        .update(notifications)
        .set({ readAt: new Date() })
        .where(eq(notifications.userId, Number(userId)));
      return NextResponse.json({ success: true, message: "Semua notifikasi ditandai telah dibaca." });
    }

    if (notificationId) {
      await db
        .update(notifications)
        .set({ readAt: new Date() })
        .where(eq(notifications.id, Number(notificationId)));
      return NextResponse.json({ success: true, message: "Notifikasi ditandai telah dibaca." });
    }

    return NextResponse.json({ success: false, message: "Parameter tidak lengkap." }, { status: 400 });
  } catch (error: any) {
    console.error("Error updating notifications:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
