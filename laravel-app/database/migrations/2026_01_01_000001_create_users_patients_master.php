<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ============ 1. IDENTITAS & AKSES (USERS & RBAC) ============
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestampTz('email_verified_at')->nullable();
            $table->string('password');
            $table->string('phone')->nullable();
            $table->string('avatar_path')->nullable();
            $table->string('role')->default('patient'); // super-admin|admin|doctor|nurse|pharmacist|lab|cashier|patient
            $table->boolean('is_active')->default(true);
            $table->timestampTz('last_login_at')->nullable();
            $table->string('last_login_ip')->nullable();
            $table->rememberToken();
            $table->timestampsTz();
            $table->softDeletesTz();
            $table->index(['email', 'role', 'is_active']);
        });

        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('label');
            $table->text('description')->nullable();
            $table->timestampsTz();
        });

        Schema::create('permissions', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique(); // appointment.view, emr.finalize, ...
            $table->string('label');
            $table->string('group');
            $table->timestampsTz();
            $table->index('group');
        });

        Schema::create('role_users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('role_id')->constrained('roles')->cascadeOnDelete();
            $table->timestampsTz();
        });

        Schema::create('permission_roles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('permission_id')->constrained('permissions')->cascadeOnDelete();
            $table->foreignId('role_id')->constrained('roles')->cascadeOnDelete();
            $table->timestampsTz();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });

        // ============ 2. PASIEN & MASTER KLINIS ============
        Schema::create('patients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('medical_record_number')->unique(); // RM-202610-001
            $table->string('nik');                 // terenkripsi/masked pada layer privat
            $table->string('nik_hash')->unique();  // SHA-256 lookup cepat
            $table->string('full_name');
            $table->date('birth_date');
            $table->string('gender', 1); // L|P
            $table->string('blood_type', 5)->nullable();
            $table->string('phone');
            $table->text('address');
            $table->string('city');
            $table->string('emergency_contact_name')->nullable();
            $table->string('emergency_contact_phone')->nullable();
            $table->string('emergency_contact_relation')->nullable();
            $table->text('allergies_summary')->nullable();
            $table->string('bpjs_number')->nullable();
            $table->timestampTz('consent_at')->nullable();
            $table->string('consent_version')->default('v1.0-UU-PDP');
            $table->timestampsTz();
            $table->softDeletesTz();
            $table->index(['full_name', 'phone', 'nik_hash']);
        });

        Schema::create('specializations', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('icon')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestampsTz();
            $table->softDeletesTz();
        });

        Schema::create('polyclinics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('specialization_id')->nullable()->constrained('specializations')->nullOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('icon')->nullable();
            $table->string('location_note')->nullable();
            $table->string('queue_prefix', 3)->default('A');
            $table->boolean('is_active')->default(true);
            $table->timestampsTz();
            $table->softDeletesTz();
            $table->index(['slug', 'is_active']);
        });

        Schema::create('doctors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('specialization_id')->constrained('specializations');
            $table->foreignId('polyclinic_id')->constrained('polyclinics');
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('title_prefix')->default('dr.');
            $table->string('title_suffix')->nullable();
            $table->string('str_number')->unique();
            $table->string('sip_number');
            $table->string('photo_path')->nullable();
            $table->text('bio')->nullable();
            $table->json('education')->nullable();
            $table->unsignedSmallInteger('experience_years')->default(5);
            $table->decimal('consultation_fee', 12, 2)->default(250000);
            $table->decimal('rating', 3, 2)->default(4.9);
            $table->unsignedInteger('reviews_count')->default(120);
            $table->boolean('is_active')->default(true);
            $table->timestampsTz();
            $table->softDeletesTz();
            $table->index(['specialization_id', 'polyclinic_id', 'is_active']);
        });

        Schema::create('doctor_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('doctor_id')->constrained('doctors')->cascadeOnDelete();
            $table->foreignId('polyclinic_id')->constrained('polyclinics');
            $table->unsignedTinyInteger('day_of_week'); // 1=Senin..7=Minggu
            $table->time('start_time');
            $table->time('end_time');
            $table->unsignedSmallInteger('slot_duration_minutes')->default(30);
            $table->unsignedTinyInteger('slot_capacity')->default(1);
            $table->date('valid_from')->default('2026-01-01');
            $table->date('valid_until')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestampsTz();
            $table->index(['doctor_id', 'day_of_week', 'is_active']);
        });

        Schema::create('doctor_schedule_exceptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('doctor_id')->constrained('doctors')->cascadeOnDelete();
            $table->date('date');
            $table->boolean('is_off')->default(true);
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            $table->string('reason')->nullable();
            $table->timestampsTz();
        });

        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('type'); // poli|penunjang|igd|rawat_inap|unggulan
            $table->text('description');
            $table->text('facilities_text')->nullable();
            $table->foreignId('polyclinic_id')->nullable()->constrained('polyclinics')->nullOnDelete();
            $table->string('icon')->nullable();
            $table->string('image_path')->nullable();
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestampsTz();
        });
    }

    public function down(): void
    {
        foreach (['services', 'doctor_schedule_exceptions', 'doctor_schedules', 'doctors', 'polyclinics',
            'specializations', 'patients', 'sessions', 'password_reset_tokens', 'permission_roles',
            'role_users', 'permissions', 'roles', 'users'] as $t) {
            Schema::dropIfExists($t);
        }
    }
};
