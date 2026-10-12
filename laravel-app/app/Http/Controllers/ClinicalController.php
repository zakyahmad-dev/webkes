<?php

namespace App\Http\Controllers;

use App\Models\{
    Doctor, Invoice, InvoiceItem, LabOrder, LabTestType, MedicalRecord,
    Medicine, Prescription, VitalSign
};
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ClinicalController extends ApiController
{
    /** GET /api/medical-records?patientId|doctorId|recordId — pohon EMR lengkap. */
    public function index(Request $request): JsonResponse
    {
        $this->requireRole($request, ['patient', 'doctor', 'nurse', 'admin', 'super-admin']);

        $q = MedicalRecord::with([
            'patient:id,full_name,medical_record_number,gender,birth_date',
            'doctor:id,name,title_suffix',
            'diagnoses', 'treatments',
            'vitalSigns' => fn ($v) => $v->latest('recorded_at')->limit(1),
            'prescription.items.medicine',
            'labOrder.results.testType',
        ])->latest('visit_date');

        if ($pid = $request->integer('patientId')) $q->where('patient_id', $pid);
        if ($did = $request->integer('doctorId')) $q->where('doctor_id', $did);
        if ($rid = $request->integer('recordId')) $q->where('id', $rid);

        $records = $q->get();

        // Pasien hanya boleh melihat EMR miliknya sendiri (kecuali jalur break-glass)
        $user = $request->user();
        if ($user->role === 'patient') {
            $ownPatientId = $user->patientRecord?->id;
            $records = $records->where('patient_id', $ownPatientId)->values();
        }

        return $this->ok($records);
    }

    /**
     * POST /api/medical-records — finalisasi EMR terintegrasi:
     * SOAP + ICD-10 diagnosis/pharmacy + vital signs + e-resep + order lab +
     * auto-generate invoice tagihan — dalam SATU transaksi database.
     */
    public function store(Request $request): JsonResponse
    {
        $this->requireRole($request, ['doctor', 'admin', 'super-admin']);

        $v = $request->validate([
            'patientId' => 'required|integer|exists:patients,id',
            'doctorId' => 'required|integer|exists:doctors,id',
            'appointmentId' => 'nullable|integer|exists:appointments,id',
            'visitType' => 'nullable|in:outpatient,inpatient,emergency',
            'complaint' => 'required|string|min:5',
            'medicalHistory' => 'nullable|string',
            'allergyNotes' => 'nullable|string',
            'physicalExamNotes' => 'nullable|string',
            'doctorNotes' => 'nullable|string',
            'diagnoses' => 'array',
            'treatments' => 'array',
            'vitalSignData' => 'array',
            'prescriptionItems' => 'array',
            'labTestTypeIds' => 'array',
        ]);

        $result = DB::transaction(function () use ($request, $v) {
            $code = 'EMR-' . $this->dateCode() . '-' . random_int(1000, 9999);

            // 1) Rekam medis induk (status final)
            $record = MedicalRecord::create([
                'record_number' => $code,
                'patient_id' => $v['patientId'],
                'doctor_id' => $v['doctorId'],
                'appointment_id' => $v['appointmentId'] ?? null,
                'visit_date' => now()->toDateString(),
                'visit_type' => $v['visitType'] ?? 'outpatient',
                'complaint' => $v['complaint'],
                'medical_history' => $v['medicalHistory'] ?? null,
                'allergy_notes' => $v['allergyNotes'] ?? null,
                'physical_exam_notes' => $v['physicalExamNotes'] ?? null,
                'doctor_notes' => $v['doctorNotes'] ?? null,
                'status' => 'final',
                'finalized_at' => now(),
                'finalized_by' => $request->user()?->id,
            ]);

            // 2) Detail ICD-10 diagnosa & tindakan
            foreach (($v['diagnoses'] ?? []) as $d) {
                if (empty($d['description'])) continue;
                $record->details()->create([
                    'type' => 'diagnosis',
                    'code' => $d['code'] ?? 'R69',
                    'description' => $d['description'],
                    'is_primary' => (bool) ($d['isPrimary'] ?? false),
                    'created_by' => $request->user()?->id,
                ]);
            }
            foreach (($v['treatments'] ?? []) as $t) {
                if (empty($t['description'])) continue;
                $record->details()->create([
                    'type' => 'treatment',
                    'code' => $t['code'] ?? '89.03',
                    'description' => $t['description'],
                    'created_by' => $request->user()?->id,
                ]);
            }

            // 3) Tanda vital (BMI kalkulasi otomatis)
            $vsIn = $v['vitalSignData'] ?? [];
            if (array_filter($vsIn)) {
                $heightM = isset($vsIn['heightCm']) && $vsIn['heightCm'] ? ((float) $vsIn['heightCm']) / 100 : null;
                $bmi = $heightM && ! empty($vsIn['weightKg'])
                    ? round(((float) $vsIn['weightKg']) / ($heightM * $heightM), 1) : null;

                VitalSign::create([
                    'patient_id' => $v['patientId'],
                    'appointment_id' => $v['appointmentId'] ?? null,
                    'medical_record_id' => $record->id,
                    'recorded_by' => $request->user()?->id,
                    'systolic' => $vsIn['systolic'] ?? null,
                    'diastolic' => $vsIn['diastolic'] ?? null,
                    'heart_rate' => $vsIn['heartRate'] ?? null,
                    'respiratory_rate' => $vsIn['respiratoryRate'] ?? 18,
                    'temperature' => $vsIn['temperature'] ?? '36.5',
                    'spo2' => $vsIn['spo2'] ?? 98,
                    'weight_kg' => $vsIn['weightKg'] ?? null,
                    'height_cm' => $vsIn['heightCm'] ?? null,
                    'bmi' => $bmi,
                    'notes' => $vsIn['notes'] ?? 'Pengukuran saat konsultasi dokter',
                ]);
            }

            // 4) E-Resep + subtotal obat
            $medicineSubtotal = 0;
            $prescription = null;
            foreach (($v['prescriptionItems'] ?? []) as $item) {
                if (! isset($prescription)) {
                    $prescription = Prescription::create([
                        'prescription_code' => 'RX-' . $this->dateCode() . '-' . random_int(1000, 9999),
                        'medical_record_id' => $record->id,
                        'patient_id' => $v['patientId'],
                        'doctor_id' => $v['doctorId'],
                        'status' => 'pending',
                        'notes' => 'Resep elektronik otomatis dari EMR',
                    ]);
                }
                if (empty($item['medicineId']) || empty($item['quantity'])) continue;
                $med = Medicine::find($item['medicineId']);
                if (! $med) continue;

                $prescription->items()->create([
                    'medicine_id' => $med->id,
                    'dose' => $item['dose'] ?? '1 tablet',
                    'frequency' => $item['frequency'] ?? '2x sehari',
                    'duration_days' => $item['durationDays'] ?? 5,
                    'quantity' => (int) $item['quantity'],
                    'instructions' => $item['instructions'] ?? 'Sesudah makan',
                ]);
                $medicineSubtotal += (float) $med->price * (int) $item['quantity'];
            }

            // 5) Order lab + subtotal
            $labSubtotal = 0;
            $labOrder = null;
            if (! empty($v['labTestTypeIds'])) {
                $labOrder = LabOrder::create([
                    'order_code' => 'LAB-' . $this->dateCode() . '-' . random_int(1000, 9999),
                    'patient_id' => $v['patientId'],
                    'medical_record_id' => $record->id,
                    'ordered_by' => $v['doctorId'],
                    'status' => 'requested',
                    'priority' => 'routine',
                    'notes' => 'Permintaan pemeriksaan laboratorium EMR',
                ]);
                foreach ($v['labTestTypeIds'] as $testId) {
                    $test = LabTestType::find($testId);
                    if ($test) $labSubtotal += (float) $test->price;
                }
            }

            // 6) Auto-invoice tagihan kunjungan
            $consultFee = (float) (Doctor::find($v['doctorId'])?->consultation_fee ?? 250000);
            $total = $consultFee + $medicineSubtotal + $labSubtotal;

            $invoice = Invoice::create([
                'invoice_number' => 'INV-' . $this->dateCode() . '-' . random_int(1000, 9999),
                'patient_id' => $v['patientId'],
                'appointment_id' => $v['appointmentId'] ?? null,
                'subtotal' => $total, 'discount' => 0, 'tax' => 0, 'total' => $total,
                'status' => 'pending',
            ]);
            InvoiceItem::create(['invoice_id' => $invoice->id, 'item_type' => 'consultation',
                'description' => 'Jasa Konsultasi Spesialis', 'quantity' => 1, 'unit_price' => $consultFee, 'subtotal' => $consultFee]);
            if ($medicineSubtotal > 0) {
                InvoiceItem::create(['invoice_id' => $invoice->id, 'item_type' => 'medicine',
                    'description' => 'Obat & Farmasi E-Prescription', 'quantity' => 1, 'unit_price' => $medicineSubtotal, 'subtotal' => $medicineSubtotal]);
            }
            if ($labSubtotal > 0) {
                InvoiceItem::create(['invoice_id' => $invoice->id, 'item_type' => 'lab',
                    'description' => 'Pemeriksaan Laboratorium Patologi', 'quantity' => 1, 'unit_price' => $labSubtotal, 'subtotal' => $labSubtotal]);
            }

            return compact('record', 'prescription', 'labOrder', 'invoice');
        });

        $this->audit($request, 'EMR_FINALIZED', 'MedicalRecord', $result['record']->id, $v['patientId'],
            "EMR {$result['record']->record_number} final; tagihan {$result['invoice']->invoice_number}");

        return $this->ok([
            'record' => $result['record'],
            'prescriptionId' => $result['prescription']?->id,
            'labOrderId' => $result['labOrder']?->id,
            'invoiceNumber' => $result['invoice']->invoice_number,
        ], 'Rekam medis berhasil disimpan dan difinalisasi!', 201);
    }

    /** POST /api/medical-records/break-glass — akses darurat PHI teraudit (UU PDP). */
    public function breakGlass(Request $request): JsonResponse
    {
        $v = $request->validate([
            'patientId' => 'nullable|integer|exists:patients,id',
            'recordId' => 'nullable|integer|exists:medical_records,id',
            'reason' => 'required|string|min:5',
        ]);

        $log = \App\Models\AuditLog::create([
            'user_id' => $request->user()->id,
            'role_snapshot' => $request->user()->role . ' [BREAK-GLASS]',
            'action' => 'BREAK_GLASS_ACCESS',
            'auditable_type' => 'MedicalRecord',
            'auditable_id' => $v['recordId'] ?? null,
            'patient_id' => $v['patientId'] ?? null,
            'notes' => 'AKSES DARURAT (BREAK-GLASS) oleh ' . $request->user()->name . '. Alasan: ' . $v['reason'],
            'ip_address' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 500),
        ]);

        return $this->ok([
            'granted' => true,
            'grantedAt' => now()->toIso8601String(),
            'auditLogId' => $log->id,
        ], 'Akses darurat disetujui & dicatat permanen dalam Audit Log.');
    }

    public function vitalSigns(Request $request): JsonResponse
    {
        $q = VitalSign::with(['patient:id,full_name,medical_record_number', 'recorder:id,name'])->latest('recorded_at');
        if ($pid = $request->integer('patientId')) $q->where('patient_id', $pid);
        return $this->ok($q->get());
    }

    /** POST /api/vital-signs — input triase perawat. */
    public function storeVitalSigns(Request $request): JsonResponse
    {
        $this->requireRole($request, ['nurse', 'doctor', 'admin', 'super-admin']);

        $v = $request->validate([
            'patientId' => 'required|integer|exists:patients,id',
            'appointmentId' => 'nullable|integer|exists:appointments,id',
            'systolic' => 'nullable|integer',
            'diastolic' => 'nullable|integer',
            'heartRate' => 'nullable|integer',
            'temperature' => 'nullable|string',
            'spo2' => 'nullable|integer',
            'weightKg' => 'nullable|string',
            'heightCm' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $heightM = isset($v['heightCm']) && $v['heightCm'] ? ((float) $v['heightCm']) / 100 : null;
        $bmi = $heightM && ! empty($v['weightKg']) ? round(((float) $v['weightKg']) / ($heightM * $heightM), 1) : null;

        $vs = VitalSign::create([
            'patient_id' => $v['patientId'],
            'appointment_id' => $v['appointmentId'] ?? null,
            'recorded_by' => $request->user()?->id,
            'systolic' => $v['systolic'] ?? null,
            'diastolic' => $v['diastolic'] ?? null,
            'heart_rate' => $v['heartRate'] ?? null,
            'respiratory_rate' => $v['respiratoryRate'] ?? 18,
            'temperature' => $v['temperature'] ?? '36.5',
            'spo2' => $v['spo2'] ?? 98,
            'weight_kg' => $v['weightKg'] ?? null,
            'height_cm' => $v['heightCm'] ?? null,
            'bmi' => $bmi,
            'notes' => $v['notes'] ?? 'Pengukuran Triage Perawat',
        ]);

        $this->audit($request, 'VITAL_SIGNS_RECORDED', 'VitalSigns', $vs->id, $v['patientId'],
            "TD {$vs->systolic}/{$vs->diastolic} mmHg, HR {$vs->heart_rate} bpm");

        return $this->ok($vs, 'Tanda vital berhasil disimpan!', 201);
    }
}
