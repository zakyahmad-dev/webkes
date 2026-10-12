<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ============ 3. APPOINTMENTS, ANTREAN, REMINDER ============
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            $table->string('appointment_code')->unique();   // APT-YYYYMMDD-NNNNN
            $table->foreignId('patient_id')->constrained('patients');
            $table->foreignId('doctor_id')->constrained('doctors');
            $table->foreignId('polyclinic_id')->constrained('polyclinics');
            $table->foreignId('doctor_schedule_id')->nullable()->constrained('doctor_schedules')->nullOnDelete();
            $table->unsignedBigInteger('ai_consultation_id')->nullable();
            $table->timestampTz('scheduled_at');
            $table->unsignedSmallInteger('duration_minutes')->default(30);
            $table->string('slot_key')->unique();           // {doctorId}_{YYYY-MM-DD}_{HHmm} — anti double-booking
            $table->string('status')->default('confirmed'); // pending|confirmed|checked_in|in_progress|completed|cancelled|no_show
            $table->string('source')->default('web');       // web|ai|admin|walk_in
            $table->text('complaint');
            $table->string('queue_number');                 // snapshot mis. A-014
            $table->timestampTz('reminder_sent_at')->nullable();
            $table->timestampTz('cancelled_at')->nullable();
            $table->foreignId('cancelled_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('cancel_reason')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestampsTz();
            $table->softDeletesTz();
            $table->index(['patient_id', 'scheduled_at']);
            $table->index(['doctor_id', 'scheduled_at', 'status']);
        });

        Schema::create('appointment_reminders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appointment_id')->constrained('appointments')->cascadeOnDelete();
            $table->string('type'); // h_minus_1_day|h_minus_2_hours|h_minus_30_min|start
            $table->timestampTz('scheduled_for');
            $table->string('status')->default('pending'); // pending|sent|failed|skipped
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->timestampTz('sent_at')->nullable();
            $table->text('last_error')->nullable();
            $table->timestampsTz();
            $table->unique(['appointment_id', 'type']);
            $table->index(['scheduled_for', 'status']);
        });

        Schema::create('queues', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appointment_id')->constrained('appointments')->cascadeOnDelete();
            $table->foreignId('polyclinic_id')->constrained('polyclinics');
            $table->foreignId('doctor_id')->constrained('doctors');
            $table->date('queue_date');
            $table->unsignedInteger('queue_number');
            $table->string('queue_code'); // A-014
            $table->string('status')->default('waiting'); // waiting|called|serving|completed|cancelled|no_show
            $table->timestampTz('called_at')->nullable();
            $table->timestampTz('serving_at')->nullable();
            $table->timestampTz('completed_at')->nullable();
            $table->foreignId('handled_by')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedSmallInteger('estimated_wait_minutes')->default(15);
            $table->timestampsTz();
            $table->unique(['polyclinic_id', 'queue_date', 'queue_number']);
            $table->index(['queue_date', 'status']);
        });

        // ============ 4. KLINIS (EMR, VITAL SIGN, RESEP, LAB) ============
        Schema::create('medical_records', function (Blueprint $table) {
            $table->id();
            $table->string('record_number')->unique(); // EMR-YYYYMMDD-NNNN
            $table->foreignId('patient_id')->constrained('patients');
            $table->foreignId('appointment_id')->nullable()->constrained('appointments')->nullOnDelete();
            $table->foreignId('doctor_id')->constrained('doctors');
            $table->date('visit_date');
            $table->string('visit_type')->default('outpatient'); // outpatient|inpatient|emergency
            $table->text('complaint');
            $table->text('medical_history')->nullable();
            $table->text('allergy_notes')->nullable();
            $table->text('physical_exam_notes')->nullable();
            $table->text('doctor_notes')->nullable();
            $table->string('status')->default('final'); // draft|final|amended
            $table->timestampTz('finalized_at')->nullable();
            $table->foreignId('finalized_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestampsTz();
            $table->softDeletesTz();
            $table->index(['patient_id', 'doctor_id', 'visit_date']);
        });

        Schema::create('medical_record_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('medical_record_id')->constrained('medical_records')->cascadeOnDelete();
            $table->string('type'); // examination|diagnosis|treatment|doctor_note
            $table->string('code')->nullable(); // ICD-10 / ICD-9-CM
            $table->text('description');
            $table->boolean('is_primary')->default(false);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestampsTz();
            $table->index(['medical_record_id', 'type']);
        });

        Schema::create('vital_signs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained('patients');
            $table->foreignId('appointment_id')->nullable()->constrained('appointments')->nullOnDelete();
            $table->foreignId('medical_record_id')->nullable()->constrained('medical_records')->nullOnDelete();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->smallInteger('systolic')->nullable();
            $table->smallInteger('diastolic')->nullable();
            $table->smallInteger('heart_rate')->nullable();
            $table->smallInteger('respiratory_rate')->nullable();
            $table->decimal('temperature', 4, 1)->nullable();
            $table->smallInteger('spo2')->nullable();
            $table->decimal('weight_kg', 5, 2)->nullable();
            $table->decimal('height_cm', 5, 2)->nullable();
            $table->decimal('bmi', 4, 1)->nullable();
            $table->text('notes')->nullable();
            $table->timestampTz('recorded_at')->useCurrent();
            $table->timestampsTz();
            $table->index(['patient_id', 'recorded_at']);
        });

        Schema::create('medicines', function (Blueprint $table) {
            $table->id();
            $table->string('sku')->unique();
            $table->string('name');
            $table->string('generic_name');
            $table->string('form');   // Tablet|Kapsul|Sirup|Injeksi|Inhaler
            $table->string('strength')->nullable();
            $table->string('unit');   // Strip|Botol|Canister
            $table->decimal('price', 12, 2);
            $table->unsignedInteger('current_stock')->default(0);
            $table->unsignedInteger('min_stock')->default(10);
            $table->boolean('requires_prescription')->default(true);
            $table->boolean('is_active')->default(true);
            $table->timestampsTz();
            $table->softDeletesTz();
            $table->index(['name', 'generic_name']);
        });

        Schema::create('medicine_stocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('medicine_id')->constrained('medicines');
            $table->string('batch_number');
            $table->date('expiry_date');
            $table->string('movement_type'); // in|out|adjustment|dispense
            $table->integer('quantity');
            $table->unsignedInteger('balance_after');
            $table->string('reference_type')->nullable();
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestampsTz();
            $table->index(['medicine_id', 'expiry_date']);
        });

        Schema::create('prescriptions', function (Blueprint $table) {
            $table->id();
            $table->string('prescription_code')->unique(); // RX-YYYYMMDD-NNNN
            $table->foreignId('medical_record_id')->nullable()->constrained('medical_records')->nullOnDelete();
            $table->foreignId('patient_id')->constrained('patients');
            $table->foreignId('doctor_id')->constrained('doctors');
            $table->string('status')->default('pending'); // pending|processing|ready|completed|cancelled
            $table->text('notes')->nullable();
            $table->foreignId('processed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestampTz('ready_at')->nullable();
            $table->timestampTz('completed_at')->nullable();
            $table->timestampsTz();
            $table->softDeletesTz();
            $table->index(['patient_id', 'status']);
        });

        Schema::create('prescription_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('prescription_id')->constrained('prescriptions')->cascadeOnDelete();
            $table->foreignId('medicine_id')->constrained('medicines');
            $table->string('dose');
            $table->string('frequency');
            $table->unsignedSmallInteger('duration_days')->default(5);
            $table->unsignedInteger('quantity');
            $table->string('instructions');
            $table->unsignedInteger('dispensed_quantity')->default(0);
            $table->timestampsTz();
        });

        Schema::create('lab_test_types', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique(); // LAB-CBC
            $table->string('name');
            $table->string('category'); // Hematologi|Kimia Darah|Imunologi|Urinalisis
            $table->string('unit')->nullable();
            $table->decimal('ref_min', 8, 2)->nullable();
            $table->decimal('ref_max', 8, 2)->nullable();
            $table->string('ref_text')->nullable();
            $table->decimal('price', 12, 2)->default(150000);
            $table->boolean('is_active')->default(true);
            $table->timestampsTz();
        });

        Schema::create('lab_orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_code')->unique(); // LAB-YYYYMMDD-NNNN
            $table->foreignId('patient_id')->constrained('patients');
            $table->foreignId('medical_record_id')->nullable()->constrained('medical_records')->nullOnDelete();
            $table->foreignId('ordered_by')->constrained('doctors');
            $table->string('status')->default('requested'); // requested|processing|completed
            $table->string('priority')->default('routine'); // routine|urgent
            $table->text('notes')->nullable();
            $table->foreignId('processed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestampTz('completed_at')->nullable();
            $table->timestampTz('released_to_patient_at')->nullable();
            $table->timestampsTz();
            $table->softDeletesTz();
            $table->index(['patient_id', 'status']);
        });

        Schema::create('lab_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lab_order_id')->constrained('lab_orders')->cascadeOnDelete();
            $table->foreignId('lab_test_type_id')->constrained('lab_test_types');
            $table->string('value');
            $table->string('unit')->nullable();
            $table->string('reference_range')->nullable();
            $table->string('flag')->default('normal'); // normal|high|low|critical
            $table->text('notes')->nullable();
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestampTz('verified_at')->nullable();
            $table->timestampsTz();
        });
    }

    public function down(): void
    {
        foreach (['lab_results', 'lab_orders', 'lab_test_types', 'prescription_items', 'prescriptions',
            'medicine_stocks', 'medicines', 'vital_signs', 'medical_record_details', 'medical_records',
            'queues', 'appointment_reminders', 'appointments'] as $t) {
            Schema::dropIfExists($t);
        }
    }
};
