<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ============ 5. RAWAT INAP ============
        Schema::create('rooms', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique(); // VIP-301
            $table->string('name');
            $table->string('room_class'); // vvip|vip|class_1|class_2|class_3|icu
            $table->unsignedTinyInteger('floor')->default(3);
            $table->decimal('daily_rate', 12, 2);
            $table->boolean('is_active')->default(true);
            $table->timestampsTz();
            $table->softDeletesTz();
        });

        Schema::create('beds', function (Blueprint $table) {
            $table->id();
            $table->foreignId('room_id')->constrained('rooms')->cascadeOnDelete();
            $table->string('bed_number');
            $table->string('status')->default('available'); // available|occupied|cleaning|maintenance
            $table->timestampsTz();
            $table->unique(['room_id', 'bed_number']);
            $table->index('status');
        });

        Schema::create('inpatients', function (Blueprint $table) {
            $table->id();
            $table->string('admission_code')->unique(); // ADM-YYYYMMDD-NNNN
            $table->foreignId('patient_id')->constrained('patients');
            $table->foreignId('bed_id')->constrained('beds');
            $table->foreignId('doctor_id')->constrained('doctors');
            $table->string('admission_source')->default('poli'); // igd|poli|direct
            $table->text('initial_diagnosis');
            $table->timestampTz('admitted_at')->useCurrent();
            $table->timestampTz('checked_out_at')->nullable();
            $table->string('status')->default('admitted'); // admitted|discharged|transferred
            $table->timestampsTz();
            $table->softDeletesTz();
            $table->index(['patient_id', 'bed_id', 'status']);
        });

        Schema::create('inpatient_transfers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inpatient_id')->constrained('inpatients')->cascadeOnDelete();
            $table->foreignId('from_bed_id')->constrained('beds');
            $table->foreignId('to_bed_id')->constrained('beds');
            $table->string('reason');
            $table->timestampTz('transferred_at')->useCurrent();
            $table->foreignId('transferred_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestampsTz();
        });

        // ============ 6. KEUANGAN & PEMBAYARAN ============
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number')->unique(); // INV-YYYYMMDD-NNNN
            $table->foreignId('patient_id')->constrained('patients');
            $table->foreignId('appointment_id')->nullable()->constrained('appointments')->nullOnDelete();
            $table->foreignId('inpatient_id')->nullable()->constrained('inpatients')->nullOnDelete();
            $table->decimal('subtotal', 14, 2);
            $table->decimal('discount', 14, 2)->default(0);
            $table->decimal('tax', 14, 2)->default(0);
            $table->decimal('total', 14, 2);
            $table->string('status')->default('pending'); // pending|paid|cancelled
            $table->timestampTz('issued_at')->useCurrent();
            $table->timestampTz('due_at')->nullable();
            $table->timestampTz('paid_at')->nullable();
            $table->string('cancelled_reason')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestampsTz();
            $table->softDeletesTz();
            $table->index(['patient_id', 'status']);
        });

        Schema::create('invoice_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained('invoices')->cascadeOnDelete();
            $table->string('item_type'); // consultation|medicine|lab|room|procedure|other
            $table->string('itemable_type')->nullable();
            $table->unsignedBigInteger('itemable_id')->nullable();
            $table->string('description');
            $table->unsignedInteger('quantity')->default(1);
            $table->decimal('unit_price', 12, 2);
            $table->decimal('subtotal', 12, 2);
            $table->timestampsTz();
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained('invoices');
            $table->string('payment_code')->unique(); // PAY-YYYYMMDD-NNNN
            $table->string('method'); // cash|qris|transfer_va|debit_card|bpjs|mock
            $table->decimal('amount', 14, 2);
            $table->string('status')->default('success'); // pending|success|failed|refunded
            $table->string('gateway_reference')->nullable()->unique();
            $table->string('idempotency_key')->nullable()->unique();
            $table->timestampTz('paid_at')->useCurrent();
            $table->foreignId('received_by')->nullable()->constrained('users')->nullOnDelete();
            $table->json('gateway_payload')->nullable();
            $table->timestampsTz();
            $table->index('invoice_id');
        });

        // ============ 7. AI HEALTH ASSISTANT & TRIAGE ============
        Schema::create('ai_consultations', function (Blueprint $table) {
            $table->id();
            $table->string('consultation_code')->unique();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('patient_id')->nullable()->constrained('patients')->nullOnDelete();
            $table->string('session_token_hash')->nullable();
            $table->string('status')->default('active'); // active|completed|emergency|abandoned
            $table->boolean('emergency_flag')->default(false);
            $table->text('emergency_reason')->nullable();
            $table->text('summary')->nullable();
            $table->string('provider')->default('HealthHub-Clinical-AI-v1');
            $table->string('model_version')->default('triage-gpt-4o-med');
            $table->timestampTz('started_at')->useCurrent();
            $table->timestampTz('ended_at')->nullable();
            $table->string('ip_hash')->nullable();
            $table->timestampsTz();
            $table->index(['user_id', 'emergency_flag']);
        });

        Schema::create('ai_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ai_consultation_id')->constrained('ai_consultations')->cascadeOnDelete();
            $table->string('role'); // user|assistant|system
            $table->text('content');
            $table->json('extracted_symptoms')->nullable();
            $table->json('safety_flags')->nullable();
            $table->unsignedInteger('tokens_used')->default(120);
            $table->timestampsTz();
        });

        Schema::create('ai_recommendations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ai_consultation_id')->constrained('ai_consultations')->cascadeOnDelete();
            $table->foreignId('specialization_id')->nullable()->constrained('specializations')->nullOnDelete();
            $table->foreignId('polyclinic_id')->nullable()->constrained('polyclinics')->nullOnDelete();
            $table->string('urgency_level')->default('routine'); // emergency|urgent|routine
            $table->text('reasoning_summary');
            $table->timestampTz('disclaimer_shown_at')->useCurrent();
            $table->timestampsTz();
        });

        Schema::create('ai_recommendation_doctors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ai_recommendation_id')->constrained('ai_recommendations')->cascadeOnDelete();
            $table->foreignId('doctor_id')->constrained('doctors');
            $table->unsignedTinyInteger('rank')->default(1);
            $table->unsignedTinyInteger('matched_slot_count')->default(3);
            $table->timestampsTz();
        });

        // ============ 8. CMS & KONTEN PUBLIK ============
        Schema::create('articles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('author_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('excerpt');
            $table->longText('content');
            $table->string('cover_path')->nullable();
            $table->string('category');
            $table->string('status')->default('published'); // draft|published
            $table->unsignedTinyInteger('read_time_minutes')->default(4);
            $table->timestampTz('published_at')->nullable();
            $table->string('meta_title')->nullable();
            $table->string('meta_description')->nullable();
            $table->timestampsTz();
            $table->softDeletesTz();
            $table->index(['category', 'published_at']);
        });

        Schema::create('facilities', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description');
            $table->string('icon')->nullable();
            $table->string('image_path')->nullable();
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestampsTz();
        });

        Schema::create('galleries', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('image_path');
            $table->string('alt_text');
            $table->string('category');
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestampsTz();
        });

        Schema::create('banners', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('subtitle')->nullable();
            $table->string('image_path')->nullable();
            $table->string('cta_label')->nullable();
            $table->string('cta_url')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestampTz('starts_at')->nullable();
            $table->timestampTz('ends_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestampsTz();
        });

        Schema::create('announcements', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('body');
            $table->string('level')->default('info'); // info|warning|emergency
            $table->timestampTz('starts_at')->nullable();
            $table->timestampTz('ends_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestampsTz();
        });

        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->json('value');
            $table->string('group')->default('general');
            $table->timestampsTz();
        });

        // ============ 9. NOTIFIKASI & AUDIT LOG ============
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('category'); // appointment|queue|prescription|laboratory|payment|hospital_info
            $table->string('title');
            $table->text('message');
            $table->string('action_url')->nullable();
            $table->timestampTz('read_at')->nullable();
            $table->timestampsTz();
            $table->index(['user_id', 'category']);
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('role_snapshot');
            $table->string('action'); // AUTH_LOGIN|EMR_FINALIZED|BREAK_GLASS_ACCESS|PRESCRIPTION_DISPENSED|PAYMENT_PROCESSED...
            $table->string('auditable_type');
            $table->unsignedBigInteger('auditable_id')->nullable();
            $table->foreignId('patient_id')->nullable()->constrained('patients')->nullOnDelete(); // tracing akses PHI (UU PDP)
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->string('url')->nullable();
            $table->text('notes')->nullable();
            $table->timestampsTz();
            $table->index(['user_id', 'action', 'patient_id', 'created_at']);
        });

        // Queueing (jobs + failed_jobs bawaan)
        Schema::create('jobs', function (Blueprint $table) {
            $table->id();
            $table->string('queue')->index();
            $table->longText('payload');
            $table->unsignedTinyInteger('attempts');
            $table->unsignedInteger('reserved_at')->nullable();
            $table->unsignedInteger('available_at');
            $table->unsignedInteger('created_at');
        });

        Schema::create('job_batches', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            $table->integer('total_jobs');
            $table->integer('pending_jobs');
            $table->integer('failed_jobs');
            $table->longText('failed_job_ids');
            $table->mediumText('options')->nullable();
            $table->integer('cancelled_at')->nullable();
            $table->integer('created_at');
            $table->integer('finished_at')->nullable();
        });

        Schema::create('failed_jobs', function (Blueprint $table) {
            $table->id();
            $table->string('uuid')->unique();
            $table->text('connection');
            $table->text('queue');
            $table->longText('payload');
            $table->longText('exception');
            $table->timestamp('failed_at')->useCurrent();
        });
    }

    public function down(): void
    {
        foreach (['failed_jobs', 'job_batches', 'jobs', 'audit_logs', 'notifications', 'settings',
            'announcements', 'banners', 'galleries', 'facilities', 'articles', 'ai_recommendation_doctors',
            'ai_recommendations', 'ai_messages', 'ai_consultations', 'payments', 'invoice_items', 'invoices',
            'inpatient_transfers', 'inpatients', 'beds', 'rooms'] as $t) {
            Schema::dropIfExists($t);
        }
    }
};
