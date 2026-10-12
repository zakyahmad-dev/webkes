import { NextResponse } from "next/server";
import { db } from "@/db";
import { labOrders, labResults, labTestTypes, patients, doctors, users, notifications, auditLogs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");
    const status = searchParams.get("status");

    const allOrders = await db
      .select({
        id: labOrders.id,
        orderCode: labOrders.orderCode,
        medicalRecordId: labOrders.medicalRecordId,
        patientId: labOrders.patientId,
        patientName: patients.fullName,
        patientRm: patients.medicalRecordNumber,
        patientGender: patients.gender,
        doctorId: labOrders.orderedBy,
        doctorName: doctors.name,
        status: labOrders.status,
        priority: labOrders.priority,
        notes: labOrders.notes,
        completedAt: labOrders.completedAt,
        releasedToPatientAt: labOrders.releasedToPatientAt,
        createdAt: labOrders.createdAt,
      })
      .from(labOrders)
      .innerJoin(patients, eq(labOrders.patientId, patients.id))
      .innerJoin(doctors, eq(labOrders.orderedBy, doctors.id))
      .orderBy(desc(labOrders.createdAt));

    const results = await db
      .select({
        id: labResults.id,
        labOrderId: labResults.labOrderId,
        labTestTypeId: labResults.labTestTypeId,
        testCode: labTestTypes.code,
        testName: labTestTypes.name,
        category: labTestTypes.category,
        value: labResults.value,
        unit: labResults.unit,
        referenceRange: labResults.referenceRange,
        flag: labResults.flag,
        notes: labResults.notes,
        verifiedByName: users.name,
        verifiedAt: labResults.verifiedAt,
      })
      .from(labResults)
      .innerJoin(labTestTypes, eq(labResults.labTestTypeId, labTestTypes.id))
      .leftJoin(users, eq(labResults.verifiedBy, users.id));

    let filtered = allOrders.map((ord) => ({
      ...ord,
      results: results.filter((r) => r.labOrderId === ord.id),
    }));

    if (patientId) {
      filtered = filtered.filter((o) => o.patientId === Number(patientId));
    }
    if (status) {
      filtered = filtered.filter((o) => o.status === status);
    }

    return NextResponse.json({ success: true, data: filtered });
  } catch (error: any) {
    console.error("Error fetching lab orders:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, results = [], analystUserId, releaseToPatient = false } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, message: "ID Order Lab diperlukan." }, { status: 400 });
    }

    const orderList = await db.select().from(labOrders).where(eq(labOrders.id, Number(orderId))).limit(1);
    if (orderList.length === 0) return NextResponse.json({ success: false, message: "Order lab tidak ditemukan." }, { status: 404 });
    const order = orderList[0];

    // Clear and re-insert results
    await db.delete(labResults).where(eq(labResults.labOrderId, order.id));

    for (const res of results) {
      if (res.labTestTypeId && res.value) {
        // Auto check flag
        let flag: "normal" | "high" | "low" | "critical" = res.flag || "normal";
        const valNum = parseFloat(res.value);

        if (!isNaN(valNum) && res.refMin && res.refMax) {
          if (valNum > parseFloat(res.refMax) * 1.5) flag = "critical";
          else if (valNum > parseFloat(res.refMax)) flag = "high";
          else if (valNum < parseFloat(res.refMin) * 0.7) flag = "critical";
          else if (valNum < parseFloat(res.refMin)) flag = "low";
        }

        await db.insert(labResults).values({
          labOrderId: order.id,
          labTestTypeId: Number(res.labTestTypeId),
          value: String(res.value),
          unit: res.unit || "",
          referenceRange: res.referenceRange || res.refText || "",
          flag,
          notes: res.notes || "Hasil validasi analis laboratorium",
          verifiedBy: analystUserId ? Number(analystUserId) : null,
          verifiedAt: new Date(),
        });
      }
    }

    // Update order status
    const updateData: any = {
      status: "completed",
      processedBy: analystUserId ? Number(analystUserId) : null,
      completedAt: new Date(),
      updatedAt: new Date(),
    };

    if (releaseToPatient) {
      updateData.releasedToPatientAt = new Date();
    }

    const updatedOrder = await db.update(labOrders).set(updateData).where(eq(labOrders.id, order.id)).returning();

    // Notify patient if released
    if (releaseToPatient) {
      const patient = await db.select().from(patients).where(eq(patients.id, order.patientId)).limit(1);
      if (patient[0]?.userId) {
        await db.insert(notifications).values({
          userId: patient[0].userId,
          category: "laboratory",
          title: "Hasil Laboratorium Telah Dirilis",
          message: `Hasil pemeriksaan laboratorium #${order.orderCode} telah selesai diverifikasi analis dan dapat dilihat pada portal pasien Anda.`,
          actionUrl: "/laboratory",
        });
      }
    }

    // Audit log
    await db.insert(auditLogs).values({
      userId: analystUserId ? Number(analystUserId) : null,
      roleSnapshot: "lab",
      action: releaseToPatient ? "LAB_RESULT_RELEASED" : "LAB_RESULT_SAVED",
      auditableType: "LabOrder",
      auditableId: order.id,
      patientId: order.patientId,
      notes: `Input hasil pemeriksaan lab ${order.orderCode}. Rilis ke pasien: ${releaseToPatient ? "Ya" : "Belum"}`,
    });

    return NextResponse.json({
      success: true,
      message: "Hasil laboratorium berhasil diverifikasi dan disimpan!",
      data: updatedOrder[0],
    });
  } catch (error: any) {
    console.error("Error saving lab results:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
