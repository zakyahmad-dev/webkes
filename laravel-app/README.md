# HealthHub — Laravel Backend (Full Port)

Porting lengkap platform **HealthHub — Modern Hospital Management & AI Healthcare** dari stack
Next.js/Drizzle ke **Laravel 12 REST API** (Eloquent ORM + Sanctum untuk autentikasi token).

Seluruh domain fungsional versi Next.js direplikasi 1:1:

| Domain | Endpoint Laravel |
|---|---|
| Auth (token, 8 peran RBAC) | `POST /api/auth/login`, `POST /api/auth/logout` |
| Lookup dokter/poli/jadwal/layanan | `GET /api/doctors`, `/api/polyclinics`, `/api/specializations`, `/api/services`, `/api/schedules` |
| Appointment (anti double-booking `slot_key`, auto antrean, reminder ≤2 jam) | `GET|POST|PATCH /api/appointments` |
| Antrean real-time (call/serve/complete/no_show + teks broadcast) | `GET|POST /api/queues` |
| AI Triage (red-flag emergency guard, pemetaan spesialis, rekomendasi dokter) | `POST /api/ai/triage` |
| EMR SOAP + ICD-10 + tanda vital + e-resep + order lab + auto-invoice | `GET|POST /api/medical-records` |
| Break-glass access (audit permanen, UU PDP) | `POST /api/medical-records/break-glass` |
| Farmasi (antrean resep, dispensing, ledger stok, restock) | `/api/prescriptions*`, `/api/medicines` |
| Laboratorium (order, input hasil, auto flag ref-range, rilis + notifikasi) | `/api/lab-orders*` |
| Billing & pembayaran (invoice itemized, idempotency key, mock gateway) | `/api/invoices`, `POST /api/invoices/pay` |
| Rawat inap (bed board, admisi, transfer bed, discharge) | `/api/beds`, `/api/inpatients` |
| Pasien (profil, NIK hash, consent UU PDP) | `GET /api/patients` |
| CMS (artikel kesehatan), Notifikasi Smart Reminder, Audit trail, Settings | `/api/articles`, `/api/notifications`, `/api/audit-logs`, `/api/settings` |

---

## 1. Struktur File

```
laravel-app/
├── composer.json                      # dependensi (laravel/framework ^12, sanctum ^4)
├── .env.example                       # konfigurasi database & app
├── bootstrap/app.php                  # bootstrap + alias middleware role + sanctum
├── routes/api.php                     # seluruh route REST API
├── app/
│   ├── Models/HealthHubModels.php     # semua Eloquent model (digrupkan per blueprint)
│   └── Http/Controllers/
│       ├── ApiController.php          # base (audit helper, requireRole) + AuthController
│       ├── LookupController.php       # doctors, polyclinics, specs, services, schedules, patients, settings, articles
│       ├── AppointmentController.php  # appointments + queues (slot locking, reminder, broadcast text)
│       ├── AiTriageController.php     # triage klinis dengan emergency red flags
│       ├── ClinicalController.php     # EMR, vital signs, break-glass
│       ├── PharmacyLabController.php  # farmasi + laboratorium
│       └── FinanceAdminController.php # billing, beds/inpatients, notifikasi, audit, seed endpoint
└── database/
    ├── migrations/
    │   ├── 2026_01_01_000001_create_users_patients_master.php
    │   ├── 2026_01_01_000002_create_appointments_clinical.php
    │   └── 2026_01_01_000003_create_inpatient_finance_ai_cms.php
    └── seeders/DatabaseSeeder.php     # seed lengkap: 11 user demo, 4 dokter, RS data, EMR, antrean hari ini
```

> **Catatan arsitektur:** semua model disatukan dalam `app/Models/HealthHubModels.php` demi keringkasan
> blueprint. Untuk konsumsi Eloquent/autoload standar PSR-4 di produksi, pecah satu kelas per file
> (`App\Models\Patient` → `app/Models/Patient.php`) atau daftarkan folder melalui `"autoload": {"classmap": ["app/Models"]}`.

## 2. Cara Menjalankan

```bash
# 1) Siapkan skeleton Laravel (versi 12)
composer create-project laravel/laravel healthhub-laravel
cd healthhub-laravel

# 2) Salin isi folder laravel-app ini menimpa file bawaan
cp -r ../laravel-app/* .

# 3) Konfigurasi env (PostgreSQL disarankan, MYSQL juga didukung)
cp .env.example .env
php artisan key:generate

# 4) Migrasi + seed data demo lengkap
php artisan migrate --seed       # atau POST /api/seed (endpoint FinanceAdminController@seed)

# 5) Jalankan
php artisan serve                # http://127.0.0.1:8000
```

Frontend Next.js cukup mengganti base URL fetch dari route-handler internal ke
`http://127.0.0.1:8000/api/...` — shape response (`{success, data, message}`) dibuat identik.

## 3. Kredensial Demo (password semua: `password123`)

| Peran | Email |
|---|---|
| Super Admin | superadmin@healthhub.id |
| Admin RS | admin@healthhub.id |
| Dokter | doctor@healthhub.id |
| Perawat | nurse@healthhub.id |
| Farmasi | pharmacy@healthhub.id |
| Analis Lab | lab@healthhub.id |
| Kasir | cashier@healthhub.id |
| Pasien | patient@healthhub.id |

Login → `POST /api/auth/login {email,password}` → `{token, user}`; gunakan
`Authorization: Bearer <token>` untuk endpoint tulis.

## 4. Pengingat ≤ 2 Jam (background job)

Tambahkan pada `app/Console/Kernel.php` (Laravel ≤10) / `bootstrap/app.php` schedule:

```php
Schedule::call(fn () => app(\App\Http\Controllers\AppointmentController::class)->processDueReminders())
    ->everyMinute()->name('appointment-reminders-sub2h')->withoutOverlapping();
```

+ `php artisan queue:work` (driver `QUEUE_CONNECTION=database`).
