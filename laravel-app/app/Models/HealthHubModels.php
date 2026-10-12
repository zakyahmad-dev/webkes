<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

/**
 * HealthHub Grouped Eloquent Models.
 * Untuk produksi PSR-4 strict, pecah tiap kelas ke file-nya sendiri.
 */

// ================= USERS & RBAC =================
class User extends Authenticatable
{
    use HasApiTokens, Notifiable, SoftDeletes;

    protected $guarded = [];
    protected $hidden = ['password', 'remember_token'];
    protected $casts = [
        'is_active' => 'boolean',
        'email_verified_at' => 'datetime',
        'last_login_at' => 'datetime',
        'password' => 'hashed',
    ];

    public function patientRecord(): ?\Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Patient::class, 'user_id');
    }

    public function doctorProfile(): ?\Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Doctor::class, 'user_id');
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }
}

class Role extends Model
{
    protected $guarded = [];
    public function users() { return $this->belongsToMany(User::class, 'role_users'); }
    public function permissions() { return $this->belongsToMany(Permission::class, 'permission_roles'); }
}

class Permission extends Model
{
    protected $guarded = [];
}

// ================= PASIEN & MASTER =================
class Patient extends Model
{
    use SoftDeletes;
    protected $guarded = [];
    protected $casts = ['consent_at' => 'datetime'];

    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    public function appointments(): HasMany { return $this->hasMany(Appointment::class); }
    public function medicalRecords(): HasMany { return $this->hasMany(MedicalRecord::class); }
    public function vitalSigns(): HasMany { return $this->hasMany(VitalSign::class); }
    public function prescriptions(): HasMany { return $this->hasMany(Prescription::class); }
    public function labOrders(): HasMany { return $this->hasMany(LabOrder::class); }
    public function invoices(): HasMany { return $this->hasMany(Invoice::class); }

    public function getAgeAttribute(): int
    {
        return \Carbon\Carbon::parse($this->birth_date)->age;
    }
}

class Specialization extends Model
{
    use SoftDeletes;
    protected $guarded = [];
    protected $casts = ['is_active' => 'boolean'];
    public function doctors(): HasMany { return $this->hasMany(Doctor::class); }
}

class Polyclinic extends Model
{
    use SoftDeletes;
    protected $guarded = [];
    protected $casts = ['is_active' => 'boolean'];
    public function specialization(): BelongsTo { return $this->belongsTo(Specialization::class); }
    public function doctors(): HasMany { return $this->hasMany(Doctor::class); }
    public function queues(): HasMany { return $this->hasMany(Queue::class); }
}

class Doctor extends Model
{
    use SoftDeletes;
    protected $guarded = [];
    protected $casts = ['education' => 'array', 'is_active' => 'boolean'];
    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    public function specialization(): BelongsTo { return $this->belongsTo(Specialization::class); }
    public function polyclinic(): BelongsTo { return $this->belongsTo(Polyclinic::class); }
    public function schedules(): HasMany { return $this->hasMany(DoctorSchedule::class); }
    public function appointments(): HasMany { return $this->hasMany(Appointment::class); }
}

class DoctorSchedule extends Model
{
    protected $guarded = [];
    protected $casts = ['is_active' => 'boolean'];
    public function doctor(): BelongsTo { return $this->belongsTo(Doctor::class); }
}

class DoctorScheduleException extends Model
{
    protected $guarded = [];
}

class Service extends Model
{
    protected $table = 'services';
    protected $guarded = [];
    protected $casts = ['is_active' => 'boolean'];
}

// ================= APPOINTMENTS & QUEUES =================
class Appointment extends Model
{
    use SoftDeletes;
    protected $guarded = [];
    protected $casts = [
        'scheduled_at' => 'datetime', 'reminder_sent_at' => 'datetime', 'cancelled_at' => 'datetime',
    ];

    public function patient(): BelongsTo { return $this->belongsTo(Patient::class); }
    public function doctor(): BelongsTo { return $this->belongsTo(Doctor::class); }
    public function polyclinic(): BelongsTo { return $this->belongsTo(Polyclinic::class); }
    public function queue(): ?\Illuminate\Database\Eloquent\Relations\HasOne { return $this->hasOne(Queue::class); }
    public function reminders(): HasMany { return $this->hasMany(AppointmentReminder::class); }
}

class AppointmentReminder extends Model
{
    protected $guarded = [];
    protected $casts = ['scheduled_for' => 'datetime', 'sent_at' => 'datetime'];
    public function appointment(): BelongsTo { return $this->belongsTo(Appointment::class); }
}

class Queue extends Model
{
    protected $table = 'queues';
    protected $guarded = [];
    protected $casts = ['called_at' => 'datetime', 'serving_at' => 'datetime', 'completed_at' => 'datetime'];
    public function appointment(): BelongsTo { return $this->belongsTo(Appointment::class); }
    public function polyclinic(): BelongsTo { return $this->belongsTo(Polyclinic::class); }
    public function doctor(): BelongsTo { return $this->belongsTo(Doctor::class); }
}

// ================= KLINIS (EMR) =================
class MedicalRecord extends Model
{
    use SoftDeletes;
    protected $guarded = [];
    protected $casts = ['finalized_at' => 'datetime'];
    public function patient(): BelongsTo { return $this->belongsTo(Patient::class); }
    public function doctor(): BelongsTo { return $this->belongsTo(Doctor::class); }
    public function details(): HasMany { return $this->hasMany(MedicalRecordDetail::class); }
    public function diagnoses(): HasMany { return $this->details()->where('type', 'diagnosis'); }
    public function treatments(): HasMany { return $this->details()->where('type', 'treatment'); }
    public function prescription(): ?\Illuminate\Database\Eloquent\Relations\HasOne { return $this->hasOne(Prescription::class); }
    public function labOrder(): ?\Illuminate\Database\Eloquent\Relations\HasOne { return $this->hasOne(LabOrder::class); }
    public function vitalSigns(): HasMany { return $this->hasMany(VitalSign::class); }
}

class MedicalRecordDetail extends Model
{
    protected $guarded = [];
    public function medicalRecord(): BelongsTo { return $this->belongsTo(MedicalRecord::class); }
}

class VitalSign extends Model
{
    protected $table = 'vital_signs';
    protected $guarded = [];
    protected $casts = ['recorded_at' => 'datetime'];
    public function patient(): BelongsTo { return $this->belongsTo(Patient::class); }
    public function recorder(): BelongsTo { return $this->belongsTo(User::class, 'recorded_by'); }
}

class Medicine extends Model
{
    use SoftDeletes;
    protected $guarded = [];
    protected $casts = ['is_active' => 'boolean', 'requires_prescription' => 'boolean'];
    public function stockMovements(): HasMany { return $this->hasMany(MedicineStock::class); }
    public function getIsLowStockAttribute(): bool { return $this->current_stock <= $this->min_stock; }
}

class MedicineStock extends Model
{
    protected $guarded = [];
    public function medicine(): BelongsTo { return $this->belongsTo(Medicine::class); }
}

class Prescription extends Model
{
    use SoftDeletes;
    protected $guarded = [];
    protected $casts = ['ready_at' => 'datetime', 'completed_at' => 'datetime'];
    public function patient(): BelongsTo { return $this->belongsTo(Patient::class); }
    public function doctor(): BelongsTo { return $this->belongsTo(Doctor::class); }
    public function medicalRecord(): BelongsTo { return $this->belongsTo(MedicalRecord::class); }
    public function items(): HasMany { return $this->hasMany(PrescriptionItem::class); }
    public function processor(): BelongsTo { return $this->belongsTo(User::class, 'processed_by'); }
}

class PrescriptionItem extends Model
{
    protected $guarded = [];
    public function prescription(): BelongsTo { return $this->belongsTo(Prescription::class); }
    public function medicine(): BelongsTo { return $this->belongsTo(Medicine::class); }
}

class LabTestType extends Model
{
    protected $guarded = [];
    protected $casts = ['is_active' => 'boolean', 'ref_min' => 'float', 'ref_max' => 'float'];
}

class LabOrder extends Model
{
    use SoftDeletes;
    protected $guarded = [];
    protected $casts = ['completed_at' => 'datetime', 'released_to_patient_at' => 'datetime'];
    public function patient(): BelongsTo { return $this->belongsTo(Patient::class); }
    public function orderer(): BelongsTo { return $this->belongsTo(Doctor::class, 'ordered_by'); }
    public function results(): HasMany { return $this->hasMany(LabResult::class); }
}

class LabResult extends Model
{
    protected $guarded = [];
    protected $casts = ['verified_at' => 'datetime'];
    public function testType(): BelongsTo { return $this->belongsTo(LabTestType::class, 'lab_test_type_id'); }
    public function labOrder(): BelongsTo { return $this->belongsTo(LabOrder::class); }
    public function verifier(): BelongsTo { return $this->belongsTo(User::class, 'verified_by'); }
}

// ================= RAWAT INAP =================
class Room extends Model
{
    use SoftDeletes;
    protected $guarded = [];
    protected $casts = ['is_active' => 'boolean'];
    public function beds(): HasMany { return $this->hasMany(Bed::class); }
}

class Bed extends Model
{
    protected $guarded = [];
    public function room(): BelongsTo { return $this->belongsTo(Room::class); }
    public function activeStay(): ?\Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Inpatient::class)->where('status', 'admitted');
    }
}

class Inpatient extends Model
{
    use SoftDeletes;
    protected $guarded = [];
    protected $casts = ['admitted_at' => 'datetime', 'checked_out_at' => 'datetime'];
    public function patient(): BelongsTo { return $this->belongsTo(Patient::class); }
    public function doctor(): BelongsTo { return $this->belongsTo(Doctor::class); }
    public function bed(): BelongsTo { return $this->belongsTo(Bed::class); }
    public function transfers(): HasMany { return $this->hasMany(InpatientTransfer::class); }
}

class InpatientTransfer extends Model
{
    protected $guarded = [];
    protected $casts = ['transferred_at' => 'datetime'];
}

// ================= KEUANGAN =================
class Invoice extends Model
{
    use SoftDeletes;
    protected $guarded = [];
    protected $casts = ['issued_at' => 'datetime', 'due_at' => 'datetime', 'paid_at' => 'datetime'];
    public function patient(): BelongsTo { return $this->belongsTo(Patient::class); }
    public function items(): HasMany { return $this->hasMany(InvoiceItem::class); }
    public function payment(): ?\Illuminate\Database\Eloquent\Relations\HasOne { return $this->hasOne(Payment::class); }
}

class InvoiceItem extends Model
{
    protected $guarded = [];
    public function invoice(): BelongsTo { return $this->belongsTo(Invoice::class); }
}

class Payment extends Model
{
    protected $guarded = [];
    protected $casts = ['paid_at' => 'datetime', 'gateway_payload' => 'array'];
    public function invoice(): BelongsTo { return $this->belongsTo(Invoice::class); }
}

// ================= AI TRIAGE =================
class AiConsultation extends Model
{
    protected $guarded = [];
    protected $casts = ['emergency_flag' => 'boolean', 'started_at' => 'datetime', 'ended_at' => 'datetime'];
    public function messages(): HasMany { return $this->hasMany(AiMessage::class, 'ai_consultation_id'); }
    public function recommendations(): HasMany { return $this->hasMany(AiRecommendation::class, 'ai_consultation_id'); }
}

class AiMessage extends Model
{
    protected $guarded = [];
    protected $casts = ['extracted_symptoms' => 'array', 'safety_flags' => 'array'];
    public function consultation(): BelongsTo { return $this->belongsTo(AiConsultation::class, 'ai_consultation_id'); }
}

class AiRecommendation extends Model
{
    protected $guarded = [];
    protected $casts = ['disclaimer_shown_at' => 'datetime'];
    public function doctors(): HasMany { return $this->hasMany(AiRecommendationDoctor::class, 'ai_recommendation_id'); }
}

class AiRecommendationDoctor extends Model
{
    protected $guarded = [];
    public function doctor(): BelongsTo { return $this->belongsTo(Doctor::class); }
}

// ================= CMS & SISTEM =================
class Article extends Model
{
    use SoftDeletes;
    protected $guarded = [];
    protected $casts = ['published_at' => 'datetime'];
    public function author(): BelongsTo { return $this->belongsTo(User::class, 'author_id'); }
}

class Facility extends Model { protected $guarded = []; }
class Gallery extends Model { protected $guarded = []; }
class Banner extends Model { protected $guarded = []; }
class Announcement extends Model { protected $guarded = []; }

class Setting extends Model
{
    protected $guarded = [];
    protected $casts = ['value' => 'array'];

    public static function getValue(string $key, mixed $default = null): mixed
    {
        return static::where('key', $key)->value('value') ?? $default;
    }
}

class Notification extends Model
{
    protected $guarded = [];
    protected $casts = ['read_at' => 'datetime'];
    public function user(): BelongsTo { return $this->belongsTo(User::class); }
}

class AuditLog extends Model
{
    protected $guarded = [];
    protected $casts = ['old_values' => 'array', 'new_values' => 'array'];
    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    public function patient(): BelongsTo { return $this->belongsTo(Patient::class); }
}
