<?php

namespace App\Http\Controllers;

use App\Models\{Appointment, AppointmentReminder, Notification, Polyclinic, Queue};
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AppointmentController extends ApiController
{
    /** GET /api/appointments?patientId|doctorId|status */
    public function index(Request $request): JsonResponse
    {
        $q = Appointment::with([
            'patient:id,full_name,medical_record_number,phone,user_id',
            'doctor:id,name,title_suffix,photo_path',
            'polyclinic:id,name,queue_prefix,location_note',
            'queue:id,status,estimated_wait_minutes',
        ])->latest('scheduled_at');

        if ($pid = $request->integer('patientId')) $q->where('patient_id', $pid);
        if ($did = $request->integer('doctorId')) $q->where('doctor_id', $did);
        if ($st = $request->get('status')) $q->where('status', $st);

        return $this->ok($q->get());
    }

    /**
     * POST /api/appointments — booking dengan penguncian slot (slot_key unik),
     * race-condition guard via lockForUpdate + transaksi, auto-issue antrean,
     * reminder ≤2 jam, notifikasi & audit.
     */
    public function store(Request $request): JsonResponse
    {
        $v = $request->validate([
            'patientId' => 'required|integer|exists:patients,id',
            'doctorId' => 'required|integer|exists:doctors,id',
            'polyclinicId' => 'required|integer|exists:polyclinics,id',
            'doctorScheduleId' => 'nullable|integer|exists:doctor_schedules,id',
            'scheduledAt' => 'required|date',
            'slotTime' => 'required|string', // "09:00"
            'complaint' => 'required|string|min:5',
            'source' => 'nullable|in:web,ai,admin,walk_in',
            'aiConsultationId' => 'nullable|integer',
        ]);

        try {
            $created = DB::transaction(function () use ($request, $v) {
                $scheduledAt = Carbon::parse($v['scheduledAt'])->setTimezone('Asia/Jakarta');
                $dateStr = $scheduledAt->toDateString();
                $slotKey = $v['doctorId'] . '_' . $dateStr . '_' . str_replace(':', '', $v['slotTime']);

                // 1) Konflik: slot telah terisi aktif (double-booking guard)
                $conflict = Appointment::where('slot_key', $slotKey)
                    ->whereIn('status', ['confirmed', 'checked_in', 'in_progress'])
                    ->lockForUpdate()->exists();
                abort_if($conflict, 409, 'Slot waktu baru saja terisi. Silakan pilih slot alternatif.');

                // 2) Nomor antrean sekuensial per poli per hari (terkunci dalam transaksi)
                $poly = Polyclinic::findOrFail($v['polyclinicId']);
                $nextNumber = Queue::where('polyclinic_id', $poly->id)->where('queue_date', $dateStr)
                    ->lockForUpdate()->count() + 1;
                $queueCode = $poly->queue_prefix . '-' . str_pad((string) $nextNumber, 3, '0', STR_PAD_LEFT);

                // 3) Buat appointment
                $apt = Appointment::create([
                    'appointment_code' => 'APT-' . str_replace('-', '', $dateStr) . '-' . random_int(10000, 99999),
                    'patient_id' => $v['patientId'],
                    'doctor_id' => $v['doctorId'],
                    'polyclinic_id' => $poly->id,
                    'doctor_schedule_id' => $v['doctorScheduleId'] ?? null,
                    'ai_consultation_id' => $v['aiConsultationId'] ?? null,
                    'scheduled_at' => $scheduledAt,
                    'duration_minutes' => 30,
                    'slot_key' => $slotKey,
                    'status' => 'confirmed',
                    'source' => $v['source'] ?? 'web',
                    'complaint' => $v['complaint'],
                    'queue_number' => $queueCode,
                    'created_by' => $request->user()?->id,
                ]);

                // 4) Issue antrean
                Queue::create([
                    'appointment_id' => $apt->id,
                    'polyclinic_id' => $poly->id,
                    'doctor_id' => $apt->doctor_id,
                    'queue_date' => $dateStr,
                    'queue_number' => $nextNumber,
                    'queue_code' => $queueCode,
                    'status' => 'waiting',
                    'estimated_wait_minutes' => $nextNumber * 15,
                ]);

                // 5) Smart Reminder ≤2 jam & H-1 hari
                $reminderAt = $scheduledAt->copy()->subHours(2);
                AppointmentReminder::create([
                    'appointment_id' => $apt->id,
                    'type' => 'h_minus_2_hours',
                    'scheduled_for' => $reminderAt->isFuture() ? $reminderAt : now(),
                ]);
                AppointmentReminder::firstOrCreate(
                    ['appointment_id' => $apt->id, 'type' => 'h_minus_1_day'],
                    ['scheduled_for' => $scheduledAt->copy()->subDay()]
                );

                return $apt->load(['patient', 'doctor', 'polyclinic']);
            });
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            return $this->fail($e->getMessage(), $e->getStatusCode());
        } catch (\Illuminate\Database\UniqueConstraintViolationException) {
            return $this->fail('Slot waktu baru saja terisi (unique constraint).', 409);
        }

        // 6) Notifikasi ke akun pasien
        if ($created->patient?->user_id) {
            Notification::create([
                'user_id' => $created->patient->user_id,
                'category' => 'appointment',
                'title' => 'Janji Temu Berhasil Dibuat',
                'message' => "Janji temu {$created->appointment_code} dikonfirmasi. Antrean Anda: {$created->queue_number}. Pengingat otomatis dikirim ≤2 jam sebelum jadwal.",
                'action_url' => '/queue',
            ]);
        }

        $this->audit($request, 'APPOINTMENT_BOOKED', 'Appointment', $created->id, $created->patient_id,
            "Booking {$created->appointment_code} antrean {$created->queue_number}");

        return $this->ok($created, 'Janji temu berhasil dikonfirmasi!', 201);
    }

    /** PATCH /api/appointments — pembatalan mengikuti kebijakan transaksi. */
    public function update(Request $request): JsonResponse
    {
        $v = $request->validate([
            'appointmentId' => 'required|integer|exists:appointments,id',
            'status' => 'required|string|in:confirmed,checked_in,in_progress,completed,cancelled,no_show',
            'cancelReason' => 'nullable|string',
        ]);

        $apt = Appointment::findOrFail($v['appointmentId']);

        if ($v['status'] === 'cancelled') {
            abort_if($apt->status === 'cancelled', 422, 'Janji temu sudah dibatalkan sebelumnya.');
            $apt->update([
                'status' => 'cancelled',
                'cancelled_at' => now(),
                'cancel_reason' => $v['cancelReason'] ?? 'Dibatalkan oleh pengguna',
                'cancelled_by' => $request->user()?->id,
            ]);
            Queue::where('appointment_id', $apt->id)->update(['status' => 'cancelled']);
            AppointmentReminder::where('appointment_id', $apt->id)->where('status', 'pending')->update(['status' => 'skipped']);
            $this->audit($request, 'APPOINTMENT_CANCELLED', 'Appointment', $apt->id, $apt->patient_id,
                'Pembatalan: ' . ($v['cancelReason'] ?? '-'));
        } else {
            $apt->update(['status' => $v['status']]);
        }

        return $this->ok($apt->fresh(), 'Status janji temu diperbarui.');
    }

    /** GET /api/queues — live board dengan join pasien & complaints. */
    public function queues(Request $request): JsonResponse
    {
        $q = Queue::with([
            'appointment.patient:id,full_name,medical_record_number,phone',
            'appointment:id,complaint,scheduled_at',
            'doctor:id,name,polyclinic_id',
            'polyclinic:id,name,location_note,queue_prefix',
        ])->where('queue_date', $request->get('date') ?? now()->toDateString());

        if ($pid = $request->integer('polyclinicId')) $q->where('polyclinic_id', $pid);
        if ($did = $request->integer('doctorId')) $q->where('doctor_id', $did);
        if ($st = $request->get('status')) $q->where('status', $st);

        return $this->ok($q->orderBy('queue_number')->get());
    }

    /** POST /api/queues — transisi call/serve/complete/no_show + teks broadcast suara. */
    public function transitionQueue(Request $request): JsonResponse
    {
        $this->requireRole($request, ['nurse', 'doctor', 'admin', 'super-admin']);

        $v = $request->validate([
            'queueId' => 'required|integer|exists:queues,id',
            'action' => 'required|in:call,serve,complete,no_show',
        ]);

        $queue = Queue::with(['appointment.patient', 'polyclinic'])->findOrFail($v['queueId']);
        $apt = $queue->appointment;
        $speechText = null;

        match ($v['action']) {
            'call' => tap($queue, function ($q) use ($apt, &$speechText, $request) {
                $q->update(['status' => 'called', 'called_at' => now(), 'handled_by' => $request->user()?->id]);
                $apt->update(['status' => 'checked_in']);
                $speechText = "Nomor antrean {$q->queue_code}, atas nama " . ($q->appointment->patient->full_name ?? '') . ", silakan menuju {$q->polyclinic->name}";
            }),
            'serve' => tap($queue, function ($q) use ($apt, $request) {
                $q->update(['status' => 'serving', 'serving_at' => now(), 'handled_by' => $request->user()?->id]);
                $apt->update(['status' => 'in_progress']);
            }),
            'complete' => tap($queue, function ($q) use ($apt) {
                $q->update(['status' => 'completed', 'completed_at' => now()]);
                $apt->update(['status' => 'completed']);
            }),
            'no_show' => tap($queue, function ($q) use ($apt) {
                $q->update(['status' => 'no_show']);
                $apt->update(['status' => 'no_show']);
            }),
        };

        $this->audit($request, 'QUEUE_' . strtoupper($v['action']), 'Queue', $queue->id, $queue->appointment->patient_id,
            "Antrean {$queue->queue_code} → {$queue->status}");

        return response()->json([
            'success' => true,
            'message' => "Antrean diperbarui ke '{$queue->status}'.",
            'data' => $queue->fresh(),
            'speechText' => $speechText,
        ]);
    }

    /** Dipanggil scheduler tiap menit — proses reminder jatuh tempo (≤2 jam / H-1). */
    public function processDueReminders(): void
    {
        AppointmentReminder::with('appointment.patient')
            ->where('status', 'pending')->where('scheduled_for', '<=', now())
            ->limit(50)->get()
            ->each(function (AppointmentReminder $reminder) {
                $apt = $reminder->appointment;
                if (! $apt || $apt->status !== 'confirmed') {
                    $reminder->update(['status' => 'skipped']);
                    return;
                }

                if ($apt->patient?->user_id) {
                    Notification::create([
                        'user_id' => $apt->patient->user_id,
                        'category' => 'appointment',
                        'title' => 'Pengingat Janji Temu (≤ 2 Jam)',
                        'message' => "Konsultasi poli Anda dijadwalkan {$apt->scheduled_at->timezone('Asia/Jakarta')->format('d M H:i')} WIB. Antrean: {$apt->queue_number}.",
                        'action_url' => '/queue',
                    ]);
                }

                $reminder->update(['status' => 'sent', 'sent_at' => now(), 'attempts' => $reminder->attempts + 1]);
                $apt->update(['reminder_sent_at' => now()]);
            });
    }
}
