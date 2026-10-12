<?php

namespace App\Http\Controllers;

use App\Models\{LabOrder, LabResult, LabTestType, Medicine, Notification, Prescription};
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PharmacyLabController extends ApiController
{
    // ================= FARMASI =================

    public function prescriptions(Request $request): JsonResponse
    {
        $q = Prescription::with([
            'patient:id,full_name,medical_record_number',
            'doctor:id,name,title_suffix',
            'items.medicine:id,name,form,price,current_stock',
        ])->latest();

        if ($pid = $request->integer('patientId')) {
            $user = $request->user();
            if ($user->role === 'patient') abort_unless($user->patientRecord?->id === $pid, 403);
            $q->where('patient_id', $pid);
        }
        if ($st = $request->get('status')) $q->where('status', $st);

        return $this->ok($q->get());
    }

    public function updatePrescriptionStatus(Request $request): JsonResponse
    {
        $this->requireRole($request, ['pharmacist', 'admin', 'super-admin']);
        $v = $request->validate([
            'prescriptionId' => 'required|integer|exists:prescriptions,id',
            'status' => 'required|in:pending,processing,ready,completed,cancelled',
        ]);

        $rx = Prescription::findOrFail($v['prescriptionId']);
        $rx->update([
            'status' => $v['status'],
            'processed_by' => $request->user()->id,
            'ready_at' => $v['status'] === 'ready' ? now() : $rx->ready_at,
            'completed_at' => $v['status'] === 'completed' ? now() : $rx->completed_at,
        ]);

        return $this->ok($rx->fresh()->load('items.medicine'));
    }

    /**
     * POST /api/prescriptions/dispense — transaksi dispensing:
     * pemotongan stok (guard stok habis), ledger medicine_stocks signed,
     * status completed, notifikasi pasien, audit PRESCRIPTION_DISPENSED.
     */
    public function dispense(Request $request): JsonResponse
    {
        $this->requireRole($request, ['pharmacist', 'admin', 'super-admin']);
        $v = $request->validate([
            'prescriptionId' => 'required|integer|exists:prescriptions,id',
            'notes' => 'nullable|string',
        ]);

        $rx = Prescription::with(['items.medicine', 'patient'])->findOrFail($v['prescriptionId']);
        abort_unless(in_array($rx->status, ['pending', 'processing', 'ready'], true), 422, 'Resep sudah selesai/dibatalkan.');

        try {
            DB::transaction(function () use ($request, $rx, $v) {
                foreach ($rx->items as $item) {
                    $med = Medicine::lockForUpdate()->find($item->medicine_id);
                    abort_unless($med, 422, "Obat #{$item->medicine_id} tidak ditemukan.");
                    abort_if($med->current_stock < $item->quantity, 422,
                        "Stok {$med->name} tidak mencukupi (sisa {$med->current_stock}).");

                    $newBalance = $med->current_stock - $item->quantity;
                    $med->update(['current_stock' => $newBalance]);

                    $med->stockMovements()->create([
                        'batch_number' => 'BATCH-DISP-' . $rx->id,
                        'expiry_date' => '2027-12-31',
                        'movement_type' => 'dispense',
                        'quantity' => -$item->quantity,
                        'balance_after' => $newBalance,
                        'reference_type' => 'prescription_item',
                        'reference_id' => $item->id,
                        'notes' => "Dispensing resep {$rx->prescription_code}",
                        'created_by' => $request->user()->id,
                    ]);

                    $item->update(['dispensed_quantity' => $item->quantity]);
                }

                $rx->update([
                    'status' => 'completed',
                    'processed_by' => $request->user()->id,
                    'ready_at' => $rx->ready_at ?? now(),
                    'completed_at' => now(),
                    'notes' => $v['notes'] ?? $rx->notes,
                ]);
            });
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            return $this->fail($e->getMessage(), $e->getStatusCode());
        }

        if ($rx->patient?->user_id) {
            Notification::create([
                'user_id' => $rx->patient->user_id,
                'category' => 'prescription',
                'title' => 'Obat Resep Telah Siap',
                'message' => "Resep {$rx->prescription_code} selesai disiapkan Instalasi Farmasi dan dapat diambil.",
                'action_url' => '/prescriptions',
            ]);
        }

        $this->audit($request, 'PRESCRIPTION_DISPENSED', 'Prescription', $rx->id, $rx->patient_id,
            "Resep {$rx->prescription_code} diserahkan; stok otomatis terpotong.");

        return $this->ok($rx->fresh()->load('items.medicine'), 'Resep berhasil didispensing!');
    }

    public function medicines(): JsonResponse
    {
        return $this->ok(Medicine::where('is_active', true)->orderBy('name')->get());
    }

    /** POST /api/medicines — restock batch / pendafataran obat baru. */
    public function manageMedicine(Request $request): JsonResponse
    {
        $this->requireRole($request, ['pharmacist', 'admin', 'super-admin']);
        $v = $request->validate([
            'action' => 'required|in:restock,create',
            'medicineId' => 'nullable|integer|exists:medicines,id',
            'quantity' => 'nullable|integer|min:1',
            'batchNumber' => 'nullable|string',
            'expiryDate' => 'nullable|date',
            'notes' => 'nullable|string',
            'newMedicine' => 'nullable|array',
        ]);

        if ($v['action'] === 'restock') {
            $med = Medicine::lockForUpdate()->findOrFail($v['medicineId']);
            $newStock = $med->current_stock + (int) $v['quantity'];
            $med->update(['current_stock' => $newStock]);
            $med->stockMovements()->create([
                'batch_number' => $v['batchNumber'] ?? ('BATCH-' . time()),
                'expiry_date' => $v['expiryDate'] ?? '2028-12-31',
                'movement_type' => 'in',
                'quantity' => (int) $v['quantity'],
                'balance_after' => $newStock,
                'notes' => $v['notes'] ?? 'Restock batch farmasi',
                'created_by' => $request->user()->id,
            ]);
            return $this->ok($med->fresh(), "Stok {$med->name} ditambah {$v['quantity']} unit.");
        }

        $m = $v['newMedicine'];
        $created = Medicine::create([
            'sku' => $m['sku'] ?? ('MED-' . random_int(1000, 9999)),
            'name' => $m['name'],
            'generic_name' => $m['genericName'] ?? $m['name'],
            'form' => $m['form'] ?? 'Tablet',
            'strength' => $m['strength'] ?? '500mg',
            'unit' => $m['unit'] ?? 'Strip',
            'price' => $m['price'] ?? 25000,
            'current_stock' => $m['initialStock'] ?? 0,
            'min_stock' => $m['minStock'] ?? 20,
        ]);
        return $this->ok($created, 'Obat baru berhasil didaftarkan!', 201);
    }

    // ================= LABORATORIUM =================

    public function labOrders(Request $request): JsonResponse
    {
        $q = LabOrder::with([
            'patient:id,full_name,medical_record_number,gender',
            'orderer:id,name,title_suffix',
            'results.testType:id,code,name,category,unit,ref_text',
            'results.verifier:id,name',
        ])->latest();

        if ($pid = $request->integer('patientId')) $q->where('patient_id', $pid);
        if ($st = $request->get('status')) $q->where('status', $st);

        $orders = $q->get();

        // Pasien hanya melihat hasil yang telah dirilis
        if ($request->user()->role === 'patient') {
            $orders = $orders->where('patient_id', $request->user()->patientRecord?->id)
                ->whereNotNull('released_to_patient_at')->values();
        }

        return $this->ok($orders);
    }

    public function labTestTypes(): JsonResponse
    {
        return $this->ok(LabTestType::where('is_active', true)->orderBy('name')->get());
    }

    /**
     * POST /api/lab-orders — input/verifikasi hasil lab:
     * auto-flag normal/high/low/critical berdasar ref_min/ref_max,
     * opsi rilis ke pasien + notifikasi + audit.
     */
    public function saveLabResults(Request $request): JsonResponse
    {
        $this->requireRole($request, ['lab', 'admin', 'super-admin']);
        $v = $request->validate([
            'orderId' => 'required|integer|exists:lab_orders,id',
            'results' => 'array',
            'releaseToPatient' => 'boolean',
        ]);

        $order = LabOrder::with('patient')->findOrFail($v['orderId']);
        $release = (bool) ($v['releaseToPatient'] ?? false);

        DB::transaction(function () use ($request, $order, $v, $release) {
            $order->results()->delete();

            foreach (($v['results'] ?? []) as $r) {
                if (empty($r['labTestTypeId']) || ! isset($r['value'])) continue;
                $type = LabTestType::find($r['labTestTypeId']);
                if (! $type) continue;

                $numeric = is_numeric($r['value']) ? (float) $r['value'] : null;
                $flag = 'normal';
                if ($numeric !== null && $type->ref_min !== null && $type->ref_max !== null) {
                    $flag = match (true) {
                        $numeric > $type->ref_max * 1.5 => 'critical',
                        $numeric > $type->ref_max => 'high',
                        $numeric < $type->ref_min * 0.7 => 'critical',
                        $numeric < $type->ref_min => 'low',
                        default => 'normal',
                    };
                }

                LabResult::create([
                    'lab_order_id' => $order->id,
                    'lab_test_type_id' => $type->id,
                    'value' => (string) $r['value'],
                    'unit' => $r['unit'] ?? $type->unit,
                    'reference_range' => $r['referenceRange'] ?? $type->ref_text,
                    'flag' => $flag,
                    'notes' => $r['notes'] ?? 'Hasil validasi analis laboratorium',
                    'verified_by' => $request->user()->id,
                    'verified_at' => now(),
                ]);
            }

            $order->update([
                'status' => 'completed',
                'processed_by' => $request->user()->id,
                'completed_at' => now(),
                'released_to_patient_at' => $release ? now() : $order->released_to_patient_at,
            ]);
        });

        if ($release && $order->patient?->user_id) {
            Notification::create([
                'user_id' => $order->patient->user_id,
                'category' => 'laboratory',
                'title' => 'Hasil Laboratorium Telah Dirilis',
                'message' => "Hasil lab {$order->order_code} terverifikasi dan dapat dilihat di portal pasien.",
                'action_url' => '/laboratory',
            ]);
        }

        $this->audit($request, $release ? 'LAB_RESULT_RELEASED' : 'LAB_RESULT_SAVED',
            'LabOrder', $order->id, $order->patient_id, "Input hasil {$order->order_code}; rilis: " . ($release ? 'Ya' : 'Belum'));

        return $this->ok($order->fresh()->load('results.testType'), 'Hasil laboratorium berhasil diverifikasi!');
    }
}
