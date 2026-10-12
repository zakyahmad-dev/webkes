<?php

use App\Http\Controllers\{
    AppointmentController, AiTriageController, AuthController, ClinicalController,
    FinanceAdminController, LookupController, PharmacyLabController
};
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

// ============ PUBLIC ============
Route::get('/health', fn () => response()->json([
    'ok' => true,
    'framework' => 'laravel',
    'db' => DB::select('select 1') ? 'connected' : 'error',
    'time' => now()->toIso8601String(),
]));

Route::post('/auth/login', [AuthController::class, 'login']);

// Lookup publik (direktori & jadwal)
Route::get('/doctors', [LookupController::class, 'doctors']);
Route::get('/doctors/{id}', [LookupController::class, 'doctorDetail']);
Route::get('/polyclinics', [LookupController::class, 'polyclinics']);
Route::get('/specializations', [LookupController::class, 'specializations']);
Route::get('/services', [LookupController::class, 'services']);
Route::get('/schedules', [LookupController::class, 'schedules']);
Route::get('/articles', [LookupController::class, 'articles']);
Route::get('/articles/{slug}', [LookupController::class, 'articleDetail']);
Route::get('/settings', [LookupController::class, 'settings']);
Route::get('/patients', [LookupController::class, 'patients']);

// AI Triage — publik (guardrails emergency internal)
Route::post('/ai/triage', [AiTriageController::class, 'triage']);

// Antrean — pembacaan publik (live board), transisi terproteksi
Route::get('/queues', [AppointmentController::class, 'queues']);

// Seed endpoint (demo bootstrap seperti /api/seed Next.js)
Route::post('/seed', [FinanceAdminController::class, 'seed']);
Route::get('/seed', [FinanceAdminController::class, 'seed']);

// ============ PROTECTED (token) ============
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    // Appointments (anti double-booking, auto antrean, reminder, pembatalan)
    Route::get('/appointments', [AppointmentController::class, 'index']);
    Route::post('/appointments', [AppointmentController::class, 'store']);
    Route::patch('/appointments', [AppointmentController::class, 'update']);

    // Transisi antrean (panggil/layani/selesai/lewat) — perawat & admin
    Route::post('/queues', [AppointmentController::class, 'transitionQueue']);

    // EMR klinis
    Route::get('/medical-records', [ClinicalController::class, 'index']);
    Route::post('/medical-records', [ClinicalController::class, 'store']);
    Route::post('/medical-records/break-glass', [ClinicalController::class, 'breakGlass']);
    Route::get('/vital-signs', [ClinicalController::class, 'vitalSigns']);
    Route::post('/vital-signs', [ClinicalController::class, 'storeVitalSigns']);

    // Farmasi
    Route::get('/prescriptions', [PharmacyLabController::class, 'prescriptions']);
    Route::patch('/prescriptions', [PharmacyLabController::class, 'updatePrescriptionStatus']);
    Route::post('/prescriptions/dispense', [PharmacyLabController::class, 'dispense']);
    Route::get('/medicines', [PharmacyLabController::class, 'medicines']);
    Route::post('/medicines', [PharmacyLabController::class, 'manageMedicine']);

    // Laboratorium
    Route::get('/lab-orders', [PharmacyLabController::class, 'labOrders']);
    Route::get('/lab-orders/types', [PharmacyLabController::class, 'labTestTypes']);
    Route::post('/lab-orders', [PharmacyLabController::class, 'saveLabResults']);

    // Billing & pembayaran
    Route::get('/invoices', [FinanceAdminController::class, 'invoices']);
    Route::post('/invoices/pay', [FinanceAdminController::class, 'pay']);

    // Rawat inap (bed board, admisi, transfer, discharge)
    Route::get('/beds', [FinanceAdminController::class, 'beds']);
    Route::get('/inpatients', [FinanceAdminController::class, 'inpatients']);
    Route::post('/inpatients', [FinanceAdminController::class, 'manageInpatient']);

    // Notifikasi & audit
    Route::get('/notifications', [FinanceAdminController::class, 'notifications']);
    Route::patch('/notifications', [FinanceAdminController::class, 'readNotifications']);
    Route::get('/audit-logs', [FinanceAdminController::class, 'auditLogs']);
});
