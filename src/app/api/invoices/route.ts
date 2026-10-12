import { NextResponse } from "next/server";
import { db } from "@/db";
import { invoices, invoiceItems, payments, patients, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");
    const status = searchParams.get("status");

    const allInvoices = await db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        patientId: invoices.patientId,
        patientName: patients.fullName,
        patientRm: patients.medicalRecordNumber,
        patientPhone: patients.phone,
        appointmentId: invoices.appointmentId,
        inpatientId: invoices.inpatientId,
        subtotal: invoices.subtotal,
        discount: invoices.discount,
        tax: invoices.tax,
        total: invoices.total,
        status: invoices.status,
        issuedAt: invoices.issuedAt,
        paidAt: invoices.paidAt,
        createdAt: invoices.createdAt,
      })
      .from(invoices)
      .innerJoin(patients, eq(invoices.patientId, patients.id))
      .orderBy(desc(invoices.issuedAt));

    const items = await db.select().from(invoiceItems);
    const allPayments = await db.select().from(payments);

    let filtered = allInvoices.map((inv) => {
      const invItems = items.filter((i) => i.invoiceId === inv.id);
      const invPay = allPayments.find((p) => p.invoiceId === inv.id);
      return {
        ...inv,
        items: invItems,
        payment: invPay ? { method: invPay.method, paymentCode: invPay.paymentCode, paidAt: invPay.paidAt } : null,
      };
    });

    if (patientId) {
      filtered = filtered.filter((i) => i.patientId === Number(patientId));
    }
    if (status) {
      filtered = filtered.filter((i) => i.status === status);
    }

    return NextResponse.json({ success: true, data: filtered });
  } catch (error: any) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
