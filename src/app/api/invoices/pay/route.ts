import { NextResponse } from "next/server";
import { db } from "@/db";
import { invoices, payments, patients, notifications, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { invoiceId, method = "qris", amount, cashierUserId, notes } = body;

    if (!invoiceId) {
      return NextResponse.json({ success: false, message: "ID Invoice diperlukan." }, { status: 400 });
    }

    const invList = await db.select().from(invoices).where(eq(invoices.id, Number(invoiceId))).limit(1);
    if (invList.length === 0) {
      return NextResponse.json({ success: false, message: "Invoice tidak ditemukan." }, { status: 404 });
    }

    const inv = invList[0];
    const todayStr = new Date().toISOString().split("T")[0];
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const payCode = `PAY-${todayStr.replace(/-/g, "")}-${randNum}`;

    // 1. Insert Payment Record
    const newPayment = await db
      .insert(payments)
      .values({
        invoiceId: inv.id,
        paymentCode: payCode,
        method,
        amount: amount ? String(amount) : inv.total,
        status: "success",
        gatewayReference: `MOCK_GW_${method.toUpperCase()}_${Date.now()}`,
        idempotencyKey: `idem_${inv.id}_${Date.now()}`,
        paidAt: new Date(),
        receivedBy: cashierUserId ? Number(cashierUserId) : null,
      })
      .returning();

    // 2. Update Invoice to Paid
    const updatedInvoice = await db
      .update(invoices)
      .set({
        status: "paid",
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, inv.id))
      .returning();

    // 3. Notify Patient
    const patientRecord = await db.select().from(patients).where(eq(patients.id, inv.patientId)).limit(1);
    if (patientRecord[0]?.userId) {
      await db.insert(notifications).values({
        userId: patientRecord[0].userId,
        category: "payment",
        title: "Pembayaran Berhasil Diterima",
        message: `Pembayaran untuk invoice #${inv.invoiceNumber} sebesar Rp ${Number(inv.total).toLocaleString("id-ID")} via ${method.toUpperCase()} telah berhasil terverifikasi.`,
        actionUrl: "/payments",
      });
    }

    // 4. Audit Log
    await db.insert(auditLogs).values({
      userId: cashierUserId ? Number(cashierUserId) : null,
      roleSnapshot: cashierUserId ? "cashier" : "patient",
      action: "PAYMENT_PROCESSED",
      auditableType: "Invoice",
      auditableId: inv.id,
      patientId: inv.patientId,
      notes: `Pembayaran ${payCode} untuk ${inv.invoiceNumber} sejumlah Rp ${Number(inv.total).toLocaleString("id-ID")} metode ${method}`,
    });

    return NextResponse.json({
      success: true,
      message: "Pembayaran berhasil diproses!",
      data: {
        invoice: updatedInvoice[0],
        payment: newPayment[0],
      },
    });
  } catch (error: any) {
    console.error("Error processing payment:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
