# HealthHub — Rumah Sakit Modern & AI Health Assistant

Aplikasi **Next.js 16 (App Router) + TypeScript + Tailwind CSS 4 + Drizzle ORM + PostgreSQL**
untuk manajemen rumah sakit: triage AI, booking dokter, antrean real-time, EMR (SOAP + ICD-10),
farmasi, laboratorium, billing/pembayaran, rawat inap, dan CMS artikel kesehatan.

Folder `laravel-app/` berisi port REST API (Laravel 12) dengan domain yang sama — opsional,
aplikasi Next.js sudah berjalan mandiri dengan API route internalnya sendiri.

> **Mau publish ke internet?** Ikuti langkah lengkap di **[DEPLOY.md](./DEPLOY.md)**.

---

## Menjalankan di lokal

Prasyarat: **Node.js 20+** dan **PostgreSQL 14+** (lokal atau cloud seperti Neon/Supabase).

```bash
# 1) Install dependency
npm install

# 2) Siapkan environment
cp .env.example .env
#   lalu sesuaikan DATABASE_URL dengan database kamu

# 3) Buat semua tabel (44 tabel) dari schema Drizzle
npm run db:migrate          # menjalankan SQL di folder drizzle/
# alternatif cepat saat development: npm run db:push

# 4) Isi data demo (11 user, 4 dokter, jadwal, dsb.)
#    - lewat browser/curl setelah server jalan:
#      curl http://localhost:3000/api/seed

# 5) Jalankan
npm run dev                 # http://localhost:3000
```

Build produksi:

```bash
npm run build && npm start
```

### Kredensial demo (password semua: `password123`)

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

### Script yang tersedia

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Build & jalankan produksi |
| `npm run typecheck` | Cek TypeScript |
| `npm run lint` | ESLint |
| `npm run db:generate` | Generate file SQL migrasi baru dari perubahan `src/db/schema.ts` |
| `npm run db:migrate` | Terapkan migrasi ke database |
| `npm run db:push` | Sinkronkan schema langsung tanpa file migrasi (dev) |
| `npm run db:studio` | Drizzle Studio (GUI database) |

### Environment variables

| Variable | Wajib | Keterangan |
|---|---|---|
| `DATABASE_URL` | ✅ | Connection string PostgreSQL. Dipakai runtime **dan** saat `next build`. |
| `NEXT_OUTPUT_STANDALONE` | — | Set `1` hanya untuk build Docker. |

---

## Struktur proyek

```
.
├── src/app/              # Halaman (App Router) + 30 endpoint API di src/app/api/*
├── src/components/       # Header, Footer, BookingWizard, sidebar portal, dll.
├── src/context/          # AuthContext (persona demo + RBAC 8 peran)
├── src/db/               # schema.ts (Drizzle), index.ts (koneksi pool), seed.ts (data demo)
├── drizzle/              # File SQL migrasi yang sudah di-generate
├── Dockerfile            # Build produksi (standalone) — untuk VPS / Railway / Fly.io
├── docker-compose.yml    # Menjalankan app + PostgreSQL dalam satu perintah
├── DEPLOY.md             # 📘 Panduan deploy step-by-step
└── laravel-app/          # Port backend Laravel 12 (opsional)
```

Endpoint kesehatan aplikasi: `GET /api/health` → `{"ok":true}`.

## Deploy

Ringkasan opsi (detail lengkap di [DEPLOY.md](./DEPLOY.md)):

| Platform | Cara | Catatan |
|---|---|---|
| **Vercel** | Import repo GitHub → set `DATABASE_URL` | Paling cepat, gratis untuk demo |
| **Railway / Render / Fly.io** | Connect repo, tambah Postgres | Perlu set build command + `DATABASE_URL` |
| **VPS (Docker)** | `docker compose up -d --build` | Kontrol penuh, bisa pakai Nginx + domain |

Seeder demo (`/api/seed`) hanya untuk demo — **jangan** dipakai untuk data pasien sungguhan.
