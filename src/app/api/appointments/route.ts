import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  appointments,
  queues,
  patients,
  doctors,
  polyclinics,
  appointmentReminders,
  auditLogs,
  notifications,
} from "@/db/schema";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");
    const doctorId = searchParams.get("doctorId");
    const status = searchParams.get("status");

    let query = db
      .select({
        id: appointments.id,
        appointmentCode: appointments.appointmentCode,
        patientId: appointments.patientId,
        patientName: patients.fullName,
        patientRm: patients.medicalRecordNumber,
        patientPhone: patients.phone,
        doctorId: appointments.doctorId,
        doctorName: doctors.name,
        doctorTitleSuffix: doctors.titleSuffix,
        doctorPhoto: doctors.photoPath,
        polyclinicId: appointments.polyclinicId,
        polyclinicName: polyclinics.name,
        scheduledAt: appointments.scheduledAt,
        durationMinutes: appointments.durationMinutes,
        slotKey: appointments.slotKey,
        status: appointments.status,
        source: appointments.source,
        complaint: appointments.complaint,
        queueNumber: appointments.queueNumber,
        reminderSentAt: appointments.reminderSentAt,
        cancelledAt: appointments.cancelledAt,
        cancelReason: appointments.cancelReason,
        createdAt: appointments.createdAt,
      })
      .from(appointments)
      .innerJoin(patients, eq(appointments.patientId, patients.id))
      .innerJoin(doctors, eq(appointments.doctorId, doctors.id))
      .innerJoin(polyclinics, eq(appointments.polyclinicId, polyclinics.id))
      .orderBy(desc(appointments.scheduledAt));

    const results = await query;

    let filtered = results;
    if (patientId) {
      filtered = filtered.filter((a) => a.patientId === Number(patientId));
    }
    if (doctorId) {
      filtered = filtered.filter((a) => a.doctorId === Number(doctorId));
    }
    if (status) {
      filtered = filtered.filter((a) => a.status === status);
    }

    return NextResponse.json({ success: true, data: filtered });
  } catch (error: any) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      patientId,
      doctorId,
      polyclinicId,
      doctorScheduleId,
      scheduledAt, // ISO string e.g. "2026-10-08T09:00:00Z"
      slotTime, // e.g. "09:00"
      complaint,
      source = "web",
      userId,
    } = body;

    if (!patientId || !doctorId || !polyclinicId || !scheduledAt || !complaint) {
      return NextResponse.json(
        { success: false, message: "Mohon lengkapi seluruh data janji temu." },
        { status: 400 }
      );
    }

    const scheduleDate = new Date(scheduledAt);
    const dateStr = scheduleDate.toISOString().split("T")[0];
    const timeFormatted = slotTime ? slotTime.replace(":", "") : "0900";
    const slotKey = `${doctorId}_${dateStr}_${timeFormatted}`;

    // 1. Conflict check: Check if doctor slot is already booked for confirmed/in_progress
    const existingSlot = await db
      .select()
      .from(appointments)
      .where(and(eq(appointments.slotKey, slotKey), eq(appointments.status, "confirmed")))
      .limit(1);

    if (existingSlot.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Slot waktu ini baru saja terisi oleh pasien lain. Silakan pilih slot waktu alternatif.",
        },
        { status: 409 }
      );
    }

    // 2. Fetch Polyclinic for queue prefix
    const polyList = await db.select().from(polyclinics).where(eq(polyclinics.id, Number(polyclinicId))).limit(1);
    const prefix = polyList[0]?.queuePrefix || "A";

    // 3. Count existing queues for this polyclinic today to assign next sequential number
    const existingQueues = await db
      .select()
      .from(queues)
      .where(and(eq(queues.polyclinicId, Number(polyclinicId)), eq(queues.queueDate, dateStr)));

    const nextQueueNum = existingQueues.length + 1;
    const queueCode = `${prefix}-${String(nextQueueNum).padStart(3, "0")}`;

    // 4. Generate unique appointment code
    const randDigits = Math.floor(10000 + Math.random() * 90000);
    const aptCode = `APT-${dateStr.replace(/-/g, "")}-${randDigits}`;

    // 5. Insert Appointment
    const newApt = await db
      .insert(appointments)
      .values({
        appointmentCode: aptCode,
        patientId: Number(patientId),
        doctorId: Number(doctorId),
        polyclinicId: Number(polyclinicId),
        doctorScheduleId: doctorScheduleId ? Number(doctorScheduleId) : null,
        scheduledAt: scheduleDate,
        durationMinutes: 30,
        slotKey,
        status: "confirmed",
        source,
        complaint,
        queueNumber: queueCode,
        createdBy: userId ? Number(userId) : null,
      })
      .returning();

    const createdApt = newApt[0];

    // 6. Insert Queue entry
    await db.insert(queues).values({
      appointmentId: createdApt.id,
      polyclinicId: Number(polyclinicId),
      doctorId: Number(doctorId),
      queueDate: dateStr,
      queueNumber: nextQueueNum,
      queueCode,
      status: "waiting",
      estimatedWaitMinutes: nextQueueNum * 15,
    });

    // 7. Schedule automated reminder (< 2 hours & H-1)
    const reminderTime = new Date(scheduleDate.getTime() - 2 * 60 * 60 * 1000);
    await db.insert(appointmentReminders).values({
      appointmentId: createdApt.id,
      type: "h_minus_2_hours",
      scheduledFor: reminderTime > new Date() ? reminderTime : new Date(),
      status: "pending",
    });

    // 8. Create In-App Notification
    const patientRecord = await db.select().from(patients).where(eq(patients.id, Number(patientId))).limit(1);
    if (patientRecord[0]?.userId) {
      await db.insert(notifications).values({
        userId: patientRecord[0].userId,
        category: "appointment",
        title: "Janji Temu Berhasil Dibuat",
        message: `Janji temu #${aptCode} berhasil dikonfirmasi. Nomor antrean Anda: ${queueCode}. Pengingat otomatis akan dikirim sebelum jadwal.`,
        actionUrl: "/queue",
      });
    }

    // 9. Audit Log
    await db.insert(auditLogs).values({
      userId: userId ? Number(userId) : null,
      roleSnapshot: "patient",
      action: "APPOINTMENT_BOOKED",
      auditableType: "Appointment",
      auditableId: createdApt.id,
      patientId: Number(patientId),
      notes: `Booking janji temu baru ${aptCode} pada poli ${polyList[0]?.name || ""} dengan antrean ${queueCode}`,
    });

    return NextResponse.json({
      success: true,
      message: "Janji temu berhasil dikonfirmasi!",
      data: {
        ...createdApt,
        queueCode,
      },
    });
  } catch (error: any) {
    console.error("Error creating appointment:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { appointmentId, status, cancelReason, cancelledBy } = body;

    if (!appointmentId) {
      return NextResponse.json({ success: false, message: "ID appointment diperlukan" }, { status: 400 });
    }

    const updateData: any = { updatedAt: new Date() };
    if (status) updateData.status = status;
    if (status === "cancelled") {
      updateData.cancelledAt = new Date();
      updateData.cancelReason = cancelReason || "Dibatalkan oleh pengguna";
      updateData.cancelledBy = cancelledBy ? Number(cancelledBy) : null;
    }

    const updated = await db
      .update(appointments)
      .set(updateData)
      .where(eq(appointments.id, Number(appointmentId)))
      .returning();

    // If cancelled, also cancel queue
    if (status === "cancelled") {
      await db
        .update(queues)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(eq(queues.appointmentId, Number(appointmentId)));
    }

    return NextResponse.json({ success: true, data: updated[0] });
  } catch (error: any) {
    console.error("Error updating appointment:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
