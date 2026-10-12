import { NextResponse } from "next/server";
import { db } from "@/db";
import { queues, appointments, patients, polyclinics, doctors, auditLogs, users } from "@/db/schema";
import { eq, and, desc, asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const polyclinicId = searchParams.get("polyclinicId");
    const doctorId = searchParams.get("doctorId");
    const status = searchParams.get("status");
    const todayStr = new Date().toISOString().split("T")[0];

    const allQueues = await db
      .select({
        id: queues.id,
        appointmentId: queues.appointmentId,
        polyclinicId: queues.polyclinicId,
        polyclinicName: polyclinics.name,
        polyclinicLocation: polyclinics.locationNote,
        doctorId: queues.doctorId,
        doctorName: doctors.name,
        patientName: patients.fullName,
        patientRm: patients.medicalRecordNumber,
        patientPhone: patients.phone,
        queueDate: queues.queueDate,
        queueNumber: queues.queueNumber,
        queueCode: queues.queueCode,
        status: queues.status,
        calledAt: queues.calledAt,
        servingAt: queues.servingAt,
        completedAt: queues.completedAt,
        estimatedWaitMinutes: queues.estimatedWaitMinutes,
        complaint: appointments.complaint,
      })
      .from(queues)
      .innerJoin(appointments, eq(queues.appointmentId, appointments.id))
      .innerJoin(patients, eq(appointments.patientId, patients.id))
      .innerJoin(polyclinics, eq(queues.polyclinicId, polyclinics.id))
      .innerJoin(doctors, eq(queues.doctorId, doctors.id))
      .orderBy(asc(queues.queueNumber));

    let filtered = allQueues;
    if (polyclinicId) {
      filtered = filtered.filter((q) => q.polyclinicId === Number(polyclinicId));
    }
    if (doctorId) {
      filtered = filtered.filter((q) => q.doctorId === Number(doctorId));
    }
    if (status) {
      filtered = filtered.filter((q) => q.status === status);
    }

    return NextResponse.json({ success: true, data: filtered });
  } catch (error: any) {
    console.error("Error fetching queues:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { queueId, action, handledByUserId } = body;
    // action: "call" | "serve" | "complete" | "no_show"

    if (!queueId || !action) {
      return NextResponse.json({ success: false, message: "Parameter tidak lengkap." }, { status: 400 });
    }

    const queueRecord = await db
      .select({
        queue: queues,
        poly: polyclinics,
        doc: doctors,
        apt: appointments,
        pat: patients,
      })
      .from(queues)
      .innerJoin(polyclinics, eq(queues.polyclinicId, polyclinics.id))
      .innerJoin(doctors, eq(queues.doctorId, doctors.id))
      .innerJoin(appointments, eq(queues.appointmentId, appointments.id))
      .innerJoin(patients, eq(appointments.patientId, patients.id))
      .where(eq(queues.id, Number(queueId)))
      .limit(1);

    if (queueRecord.length === 0) {
      return NextResponse.json({ success: false, message: "Antrean tidak ditemukan." }, { status: 404 });
    }

    const item = queueRecord[0];
    const updateData: any = { updatedAt: new Date() };

    if (handledByUserId) {
      updateData.handledBy = Number(handledByUserId);
    }

    let speechText = "";

    if (action === "call") {
      updateData.status = "called";
      updateData.calledAt = new Date();
      speechText = `Nomor antrean ${item.queue.queueCode}, atas nama ${item.pat.fullName}, silakan menuju ${item.poly.name}`;
      // Update appointment status as well
      await db.update(appointments).set({ status: "checked_in", updatedAt: new Date() }).where(eq(appointments.id, item.queue.appointmentId));
    } else if (action === "serve") {
      updateData.status = "serving";
      updateData.servingAt = new Date();
      speechText = `Nomor antrean ${item.queue.queueCode} sedang diperiksa di ${item.poly.name}`;
      await db.update(appointments).set({ status: "in_progress", updatedAt: new Date() }).where(eq(appointments.id, item.queue.appointmentId));
    } else if (action === "complete") {
      updateData.status = "completed";
      updateData.completedAt = new Date();
      await db.update(appointments).set({ status: "completed", updatedAt: new Date() }).where(eq(appointments.id, item.queue.appointmentId));
    } else if (action === "no_show") {
      updateData.status = "no_show";
      await db.update(appointments).set({ status: "no_show", updatedAt: new Date() }).where(eq(appointments.id, item.queue.appointmentId));
    }

    const updated = await db.update(queues).set(updateData).where(eq(queues.id, Number(queueId))).returning();

    // Audit log
    await db.insert(auditLogs).values({
      userId: handledByUserId ? Number(handledByUserId) : null,
      roleSnapshot: "nurse",
      action: `QUEUE_${action.toUpperCase()}`,
      auditableType: "Queue",
      auditableId: item.queue.id,
      patientId: item.pat.id,
      notes: `Perubahan status antrean ${item.queue.queueCode} menjadi ${updateData.status}`,
    });

    return NextResponse.json({
      success: true,
      message: `Status antrean berhasil diperbarui ke '${updateData.status}'`,
      data: updated[0],
      speechText,
    });
  } catch (error: any) {
    console.error("Error updating queue:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
