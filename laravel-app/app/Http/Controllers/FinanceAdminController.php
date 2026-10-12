<?php

namespace App\Http\Controllers;

use App\Models\{
    AuditLog, Bed, Inpatient, Invoice, Notification, Payment, User
};
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

class FinanceAdminController extends ApiController
{
    // ================= BILLING =================

    public function invoices(Request $request): JsonResponse
    {
        $q = Invoice::with([
            'patient:id,full_name,medical_record_number,phone',
            'items', 'payment',
        ])->latest('issued_at');

        if ($pid = $request->integer('patientId')) $q->where('patient_id', $pid);
        if ($st = $request->get('status')) $q->where('status', $st);

        $invoices = $q->get();
        if ($request->user()->role === 'patient') {
            $invoices = $invoices->where('patient_id', $request->user()->patientRecord?->id)->values();
        }

        return $this->ok($invoices);
    }

    /**
     * POST /api/invoices/pay — pembayaran dengan idempotency guard:
     * permintaan ulang dengan idempotency_key yang sama mengembalikan
     * payment eksisting tanpa men-charge ulang.
     */
    public function pay(Request $request): JsonResponse
    {
        $v = $request->validate([
            'invoiceId' => 'required|integer|exists:invoices,id',
            'method' => 'required|in:cash,qris,transfer_va,debit_card,bpjs,mock',
            'amount' => 'nullable|numeric|min:0',
            'idempotencyKey' => 'nullable|string|max:100',
        ]);

        $invoice = Invoice::with('patient')->findOrFail($v['invoiceId']);

        $idemKey = $v['idempotencyKey'] ?? ('idem_inv_' . $invoice->id . '_' . $request->user()->id . '_' . $invoice->status);

        if ($existing = Payment::where('idempotency_key', $idemKey)->first()) {
            return $this->ok(['invoice' => $invoice->fresh('payment'), 'payment' => $existing, 'idempotent' => true],
                'Pembayaran sudah tercatat (idempotent).');
        }
        abort_if($invoice->status === 'paid', 422, 'Invoice sudah lunas.');

        // Kasir menerima; pasien membayar self-service mock gateway
        $this->requireRole($request, ['cashier', 'patient', 'admin', 'super-admin']);

        $payment = DB::transaction(function () use ($request, $invoice, $v, $idemKey) {
            $pay = Payment::create([
                'invoice_id' => $invoice->id,
                'payment_code' => 'PAY-' . $this->dateCode() . '-' . random_int(1000, 9999),
                'method' => $v['method'],
                'amount' => $v['amount'] ?? $invoice->total,
                'status' => 'success',
                'gateway_reference' => 'MOCK_GW_' . strtoupper($v['method']) . '_' . time(),
                'idempotency_key' => $idemKey,
                'paid_at' => now(),
                'received_by' => $request->user()->role === 'cashier' ? $request->user()->id : null,
                'gateway_payload' => ['channel' => $v['method'], 'simulation' => true],
            ]);

            $invoice->update(['status' => 'paid', 'paid_at' => now()]);
            return $pay;
        });

        if ($invoice->patient?->user_id) {
            Notification::create([
                'user_id' => $invoice->patient->user_id,
                'category' => 'payment',
                'title' => 'Pembayaran Berhasil Diterima',
                'message' => "Pembayaran {$invoice->invoice_number} Rp " . number_format((float) $invoice->total, 0, ',', '.')
                    . ' via ' . strtoupper($v['method']) . ' terverifikasi.',
                'action_url' => '/payments',
            ]);
        }

        $this->audit($request, 'PAYMENT_PROCESSED', 'Invoice', $invoice->id, $invoice->patient_id,
            "Pembayaran {$payment->payment_code} Rp " . number_format((float) $invoice->total, 0, ',', '.') . ' metode ' . $v['method']);

        return $this->ok(['invoice' => $invoice->fresh('payment'), 'payment' => $payment], 'Pembayaran berhasil diproses!', 201);
    }

    // ================= RAWAT INAP =================

    /** Bed board: kamar + tempat tidur + status hunian aktif. */
    public function beds(): JsonResponse
    {
        $this->requireRole(request(), ['nurse', 'doctor', 'admin', 'super-admin', 'cashier']);

        $rooms = \App\Models\Room::with(['beds.activeStay.patient:id,full_name,medical_record_number',
            'beds.activeStay.doctor:id,name'])
            ->where('is_active', true)->orderBy('floor')->get()
            ->map(fn ($room) => tap($room, function ($r) {
                $r->total_beds = $r->beds->count();
                $r->occupied_beds = $r->beds->where('status', 'occupied')->count();
                $r->available_beds = $r->beds->where('status', 'available')->count();
            }));

        return $this->ok($rooms);
    }

    public function inpatients(): JsonResponse
    {
        $this->requireRole(request(), ['nurse', 'doctor', 'admin', 'super-admin']);
        return $this->ok(Inpatient::with(['patient:id,full_name,medical_record_number',
            'doctor:id,name', 'bed.room:id,code,name,room_class,floor'])
            ->latest('admitted_at')->get());
    }

    /** Admisi / transfer bed / discharge dengan transisi status bed per-transaksi. */
    public function manageInpatient(Request $request): JsonResponse
    {
        $this->requireRole($request, ['nurse', 'admin', 'super-admin']);
        $v = $request->validate([
            'action' => 'required|in:admit,transfer,discharge',
            'patientId' => 'nullable|integer|exists:patients,id',
            'bedId' => 'nullable|integer|exists:beds,id',
            'doctorId' => 'nullable|integer|exists:doctors,id',
            'admissionSource' => 'nullable|in:igd,poli,direct',
            'initialDiagnosis' => 'nullable|string',
            'inpatientId' => 'nullable|integer|exists:inpatients,id',
            'toBedId' => 'nullable|integer|exists:beds,id',
            'transferReason' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($request, $v) {
            if ($v['action'] === 'admit') {
                $bed = Bed::lockForUpdate()->findOrFail($v['bedId']);
                abort_unless($bed->status === 'available', 422, 'Bed tidak tersedia.');

                $adm = Inpatient::create([
                    'admission_code' => 'ADM-' . $this->dateCode() . '-' . random_int(1000, 9999),
                    'patient_id' => $v['patientId'],
                    'bed_id' => $bed->id,
                    'doctor_id' => $v['doctorId'],
                    'admission_source' => $v['admissionSource'] ?? 'poli',
                    'initial_diagnosis' => $v['initialDiagnosis'],
                    'admitted_at' => now(),
                    'status' => 'admitted',
                ]);
                $bed->update(['status' => 'occupied']);

                $this->audit($request, 'INPATIENT_ADMITTED', 'Inpatient', $adm->id, $v['patientId'],
                    "Admisi {$adm->admission_code} bed #{$bed->id}");
                return $this->ok($adm, 'Pasien berhasil didaftarkan rawat inap!', 201);
            }

            $stay = Inpatient::findOrFail($v['inpatientId']);

            if ($v['action'] === 'transfer') {
                Bed::where('id', $stay->bed_id)->update(['status' => 'cleaning']);
                Bed::where('id', $v['toBedId'])->update(['status' => 'occupied']);
                $stay->transfers()->create([
                    'from_bed_id' => $stay->bed_id,
                    'to_bed_id' => $v['toBedId'],
                    'reason' => $v['transferReason'],
                    'transferred_at' => now(),
                    'transferred_by' => $request->user()->id,
                ]);
                $stay->update(['bed_id' => $v['toBedId']]);
                return $this->ok($stay->fresh(), 'Pasien berhasil dipindahkan ke bed baru!');
            }

            // discharge
            $stay->update(['status' => 'discharged', 'checked_out_at' => now()]);
            Bed::where('id', $stay->bed_id)->update(['status' => 'cleaning']);
            $this->audit($request, 'INPATIENT_DISCHARGED', 'Inpatient', $stay->id, $stay->patient_id,
                "Pasien dipulangkan dari {$stay->admission_code}");
            return $this->ok($stay->fresh(), 'Pasien berhasil dipulangkan (discharged)!');
        });
    }

    // ================= NOTIFIKASI & AUDIT =================

    public function notifications(Request $request): JsonResponse
    {
        $userId = $request->user()->role === 'patient' || $request->user()->role !== 'admin'
            ? $request->user()->id : ($request->integer('userId') ?: $request->user()->id);

        return $this->ok(Notification::where('user_id', $userId)->latest()->get());
    }

    public function readNotifications(Request $request): JsonResponse
    {
        if ($request->boolean('markAllRead')) {
            Notification::where('user_id', $request->user()->id)->whereNull('read_at')->update(['read_at' => now()]);
            return $this->ok(null, 'Semua notifikasi ditandai telah dibaca.');
        }
        $n = Notification::where('user_id', $request->user()->id)->findOrFail($request->integer('notificationId'));
        $n->update(['read_at' => now()]);
        return $this->ok($n, 'Notifikasi ditandai dibaca.');
    }

    public function auditLogs(Request $request): JsonResponse
    {
        $this->requireRole($request, ['admin', 'super-admin']);
        $q = AuditLog::with(['user:id,name', 'patient:id,full_name'])->latest();
        if ($a = $request->get('action')) $q->where('action', 'ilike', "%{$a}%");
        if ($pid = $request->integer('patientId')) $q->where('patient_id', $pid);
        return $this->ok($q->limit(200)->get());
    }

    // ================= SEED =================

    /** POST/GET /api/seed — bootstrap data demo (gomap dengan versi Next.js). */
    public function seed(Request $request): JsonResponse
    {
        if (User::count() > 0) {
            return $this->ok(null, 'Database sudah terisi; seed dilewati.');
        }
        Artisan::call('db:seed', ['--class' => 'Database\\Seeders\\DatabaseSeeder', '--force' => true]);
        return $this->ok(['output' => Artisan::output()], 'Database seeded successfully!');
    }
}
