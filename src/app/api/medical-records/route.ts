import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  medicalRecords,
  medicalRecordDetails,
  vitalSigns,
  prescriptions,
  prescriptionItems,
  medicines,
  medicineStocks,
  labOrders,
  labResults,
  labTestTypes,
  patients,
  doctors,
  invoices,
  invoiceItems,
  auditLogs,
} from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");
    const doctorId = searchParams.get("doctorId");
    const recordId = searchParams.get("recordId");

    let recordsQuery = db
      .select({
        id: medicalRecords.id,
        recordNumber: medicalRecords.recordNumber,
        patientId: medicalRecords.patientId,
        patientName: patients.fullName,
        patientRm: patients.medicalRecordNumber,
        patientGender: patients.gender,
        patientBirthDate: patients.birthDate,
        doctorId: medicalRecords.doctorId,
        doctorName: doctors.name,
        doctorTitleSuffix: doctors.titleSuffix,
        visitDate: medicalRecords.visitDate,
        visitType: medicalRecords.visitType,
        complaint: medicalRecords.complaint,
        medicalHistory: medicalRecords.medicalHistory,
        allergyNotes: medicalRecords.allergyNotes,
        physicalExamNotes: medicalRecords.physicalExamNotes,
        doctorNotes: medicalRecords.doctorNotes,
        status: medicalRecords.status,
        finalizedAt: medicalRecords.finalizedAt,
        createdAt: medicalRecords.createdAt,
      })
      .from(medicalRecords)
      .innerJoin(patients, eq(medicalRecords.patientId, patients.id))
      .innerJoin(doctors, eq(medicalRecords.doctorId, doctors.id))
      .orderBy(desc(medicalRecords.visitDate));

    const records = await recordsQuery;

    let filtered = records;
    if (patientId) {
      filtered = filtered.filter((r) => r.patientId === Number(patientId));
    }
    if (doctorId) {
      filtered = filtered.filter((r) => r.doctorId === Number(doctorId));
    }
    if (recordId) {
      filtered = filtered.filter((r) => r.id === Number(recordId));
    }

    // Fetch details (diagnoses & treatments) for records
    const allDetails = await db.select().from(medicalRecordDetails);
    const allVitalSigns = await db.select().from(vitalSigns);
    const allPrescriptions = await db.select().from(prescriptions);
    const allPrescriptionItems = await db
      .select({
        id: prescriptionItems.id,
        prescriptionId: prescriptionItems.prescriptionId,
        medicineId: prescriptionItems.medicineId,
        medicineName: medicines.name,
        form: medicines.form,
        dose: prescriptionItems.dose,
        frequency: prescriptionItems.frequency,
        durationDays: prescriptionItems.durationDays,
        quantity: prescriptionItems.quantity,
        instructions: prescriptionItems.instructions,
        dispensedQuantity: prescriptionItems.dispensedQuantity,
      })
      .from(prescriptionItems)
      .innerJoin(medicines, eq(prescriptionItems.medicineId, medicines.id));

    const allLabOrders = await db.select().from(labOrders);
    const allLabResults = await db
      .select({
        id: labResults.id,
        labOrderId: labResults.labOrderId,
        testCode: labTestTypes.code,
        testName: labTestTypes.name,
        category: labTestTypes.category,
        value: labResults.value,
        unit: labResults.unit,
        referenceRange: labResults.referenceRange,
        flag: labResults.flag,
        notes: labResults.notes,
      })
      .from(labResults)
      .innerJoin(labTestTypes, eq(labResults.labTestTypeId, labTestTypes.id));

    const enriched = filtered.map((r) => {
      const details = allDetails.filter((d) => d.medicalRecordId === r.id);
      const vs = allVitalSigns.find((v) => v.medicalRecordId === r.id);
      const rx = allPrescriptions.find((p) => p.medicalRecordId === r.id);
      const rxItems = rx ? allPrescriptionItems.filter((i) => i.prescriptionId === rx.id) : [];
      const lab = allLabOrders.find((l) => l.medicalRecordId === r.id);
      const labRes = lab ? allLabResults.filter((res) => res.labOrderId === lab.id) : [];

      return {
        ...r,
        diagnoses: details.filter((d) => d.type === "diagnosis"),
        treatments: details.filter((d) => d.type === "treatment"),
        vitalSigns: vs || null,
        prescription: rx ? { ...rx, items: rxItems } : null,
        labOrder: lab ? { ...lab, results: labRes } : null,
      };
    });

    return NextResponse.json({ success: true, data: enriched });
  } catch (error: any) {
    console.error("Error fetching medical records:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      patientId,
      doctorId,
      appointmentId,
      visitType = "outpatient",
      complaint,
      medicalHistory,
      allergyNotes,
      physicalExamNotes,
      doctorNotes,
      diagnoses = [], // array of { code, description, isPrimary }
      treatments = [], // array of { code, description }
      vitalSignData, // { systolic, diastolic, heartRate, temperature, spo2, weightKg, heightCm }
      prescriptionItems: rxItemsInput = [], // array of { medicineId, dose, frequency, durationDays, quantity, instructions }
      labTestTypeIds = [], // array of lab test IDs to order
      doctorUserId,
    } = body;

    if (!patientId || !doctorId || !complaint) {
      return NextResponse.json({ success: false, message: "Data pemeriksaan tidak lengkap." }, { status: 400 });
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const recordNumber = `EMR-${todayStr.replace(/-/g, "")}-${randNum}`;

    // 1. Insert Medical Record
    const newRecord = await db
      .insert(medicalRecords)
      .values({
        recordNumber,
        patientId: Number(patientId),
        doctorId: Number(doctorId),
        appointmentId: appointmentId ? Number(appointmentId) : null,
        visitDate: todayStr,
        visitType,
        complaint,
        medicalHistory,
        allergyNotes,
        physicalExamNotes,
        doctorNotes,
        status: "final",
        finalizedAt: new Date(),
        finalizedBy: doctorUserId ? Number(doctorUserId) : null,
      })
      .returning();

    const createdRecord = newRecord[0];

    // 2. Insert Diagnoses and Treatments
    for (const diag of diagnoses) {
      if (diag.description) {
        await db.insert(medicalRecordDetails).values({
          medicalRecordId: createdRecord.id,
          type: "diagnosis",
          code: diag.code || "R69",
          description: diag.description,
          isPrimary: !!diag.isPrimary,
          createdBy: doctorUserId ? Number(doctorUserId) : null,
        });
      }
    }

    for (const tr of treatments) {
      if (tr.description) {
        await db.insert(medicalRecordDetails).values({
          medicalRecordId: createdRecord.id,
          type: "treatment",
          code: tr.code || "89.03",
          description: tr.description,
          isPrimary: false,
          createdBy: doctorUserId ? Number(doctorUserId) : null,
        });
      }
    }

    // 3. Insert Vital Signs if provided
    if (vitalSignData && (vitalSignData.systolic || vitalSignData.heartRate || vitalSignData.temperature)) {
      const heightM = vitalSignData.heightCm ? Number(vitalSignData.heightCm) / 100 : null;
      const bmiCalc = heightM && vitalSignData.weightKg ? (Number(vitalSignData.weightKg) / (heightM * heightM)).toFixed(1) : null;

      await db.insert(vitalSigns).values({
        patientId: Number(patientId),
        appointmentId: appointmentId ? Number(appointmentId) : null,
        medicalRecordId: createdRecord.id,
        recordedBy: doctorUserId ? Number(doctorUserId) : null,
        systolic: vitalSignData.systolic ? Number(vitalSignData.systolic) : null,
        diastolic: vitalSignData.diastolic ? Number(vitalSignData.diastolic) : null,
        heartRate: vitalSignData.heartRate ? Number(vitalSignData.heartRate) : null,
        respiratoryRate: vitalSignData.respiratoryRate ? Number(vitalSignData.respiratoryRate) : 18,
        temperature: vitalSignData.temperature ? String(vitalSignData.temperature) : "36.5",
        spo2: vitalSignData.spo2 ? Number(vitalSignData.spo2) : 98,
        weightKg: vitalSignData.weightKg ? String(vitalSignData.weightKg) : null,
        heightCm: vitalSignData.heightCm ? String(vitalSignData.heightCm) : null,
        bmi: bmiCalc,
        notes: vitalSignData.notes || "Pengukuran saat konsultasi dokter",
      });
    }

    // 4. Create Prescription if medicines specified
    let createdPrescriptionId = null;
    let medicineSubtotal = 0;
    if (rxItemsInput && rxItemsInput.length > 0) {
      const rxRand = Math.floor(1000 + Math.random() * 9000);
      const rxCode = `RX-${todayStr.replace(/-/g, "")}-${rxRand}`;
      const newRx = await db
        .insert(prescriptions)
        .values({
          prescriptionCode: rxCode,
          medicalRecordId: createdRecord.id,
          patientId: Number(patientId),
          doctorId: Number(doctorId),
          status: "pending",
          notes: "Resep Elektronik otomatis dari EMR",
        })
        .returning();

      createdPrescriptionId = newRx[0].id;

      for (const item of rxItemsInput) {
        if (item.medicineId && item.quantity) {
          await db.insert(prescriptionItems).values({
            prescriptionId: newRx[0].id,
            medicineId: Number(item.medicineId),
            dose: item.dose || "1 tablet",
            frequency: item.frequency || "2x sehari",
            durationDays: item.durationDays ? Number(item.durationDays) : 5,
            quantity: Number(item.quantity),
            instructions: item.instructions || "Sesudah makan",
          });

          // Price calculation
          const medRecord = await db.select().from(medicines).where(eq(medicines.id, Number(item.medicineId))).limit(1);
          if (medRecord.length > 0) {
            medicineSubtotal += Number(medRecord[0].price) * Number(item.quantity);
          }
        }
      }
    }

    // 5. Create Lab Order if test types specified
    let createdLabOrderId = null;
    let labSubtotal = 0;
    if (labTestTypeIds && labTestTypeIds.length > 0) {
      const labRand = Math.floor(1000 + Math.random() * 9000);
      const labCode = `LAB-${todayStr.replace(/-/g, "")}-${labRand}`;
      const newLab = await db
        .insert(labOrders)
        .values({
          orderCode: labCode,
          patientId: Number(patientId),
          medicalRecordId: createdRecord.id,
          orderedBy: Number(doctorId),
          status: "requested",
          priority: "routine",
          notes: "Permintaan pemeriksaan laboratorium EMR",
        })
        .returning();

      createdLabOrderId = newLab[0].id;

      for (const testId of labTestTypeIds) {
        const testType = await db.select().from(labTestTypes).where(eq(labTestTypes.id, Number(testId))).limit(1);
        if (testType.length > 0) {
          labSubtotal += Number(testType[0].price);
        }
      }
    }

    // 6. Generate Billing Invoice for the visit
    const docInfo = await db.select().from(doctors).where(eq(doctors.id, Number(doctorId))).limit(1);
    const consultFee = docInfo[0]?.consultationFee ? Number(docInfo[0].consultationFee) : 250000;
    const grandTotal = consultFee + medicineSubtotal + labSubtotal;

    const invRand = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `INV-${todayStr.replace(/-/g, "")}-${invRand}`;

    const newInvoice = await db
      .insert(invoices)
      .values({
        invoiceNumber,
        patientId: Number(patientId),
        appointmentId: appointmentId ? Number(appointmentId) : null,
        subtotal: String(grandTotal),
        discount: "0",
        tax: "0",
        total: String(grandTotal),
        status: "pending",
      })
      .returning();

    // Invoice items
    await db.insert(invoiceItems).values({
      invoiceId: newInvoice[0].id,
      itemType: "consultation",
      description: `Jasa Konsultasi Spesialis (${docInfo[0]?.name || "Dokter"})`,
      quantity: 1,
      unitPrice: String(consultFee),
      subtotal: String(consultFee),
    });

    if (medicineSubtotal > 0) {
      await db.insert(invoiceItems).values({
        invoiceId: newInvoice[0].id,
        itemType: "medicine",
        description: "Obat & Farmasi Resep E-Prescription",
        quantity: 1,
        unitPrice: String(medicineSubtotal),
        subtotal: String(medicineSubtotal),
      });
    }

    if (labSubtotal > 0) {
      await db.insert(invoiceItems).values({
        invoiceId: newInvoice[0].id,
        itemType: "lab",
        description: "Pemeriksaan Laboratorium Patologi",
        quantity: 1,
        unitPrice: String(labSubtotal),
        subtotal: String(labSubtotal),
      });
    }

    // 7. Audit Log
    await db.insert(auditLogs).values({
      userId: doctorUserId ? Number(doctorUserId) : null,
      roleSnapshot: "doctor",
      action: "EMR_FINALIZED",
      auditableType: "MedicalRecord",
      auditableId: createdRecord.id,
      patientId: Number(patientId),
      notes: `Pemeriksaan selesai & EMR ${recordNumber} difinalisasi. Resep #${createdPrescriptionId || "-"}, Tagihan #${invoiceNumber}`,
    });

    return NextResponse.json({
      success: true,
      message: "Rekam medis berhasil disimpan dan difinalisasi!",
      data: {
        record: createdRecord,
        invoiceNumber,
        prescriptionId: createdPrescriptionId,
        labOrderId: createdLabOrderId,
      },
    });
  } catch (error: any) {
    console.error("Error creating medical record:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
