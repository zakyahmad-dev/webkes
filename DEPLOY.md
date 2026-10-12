# 📘 Panduan Deploy HealthHub (publish dari GitHub)

Repo: **https://github.com/zakyahmad-dev/webkes** — Next.js 16 + PostgreSQL (Drizzle ORM).
Panduan ini ditulis urut dari nol. Pilih **satu** jalur: [Opsi A — Vercel](#opsi-a--vercel-paling-cepat) (rekomendasi),
[Opsi B — Railway](#opsi-b--railway), [Opsi C — Render](#opsi-c--render), [Opsi D — VPS + Docker](#opsi-d--vps--docker).

---

## 0. Yang wajib dipahami dulu (baca 2 menit)

1. **Aplikasi ini butuh database PostgreSQL.** Tanpa `DATABASE_URL` yang benar, halaman akan tampil
   tetapi semua data (dokter, artikel, antrean, dsb.) kosong / error.
2. **`DATABASE_URL` wajib ada bahkan saat proses build**, karena `src/db/index.ts` melempar error
   bila variabel kosong. Jadi set variable ini **sebelum** build/deploy pertama.
3. **Database kosong = belum ada tabel.** Setelah deploy sukses, jalankan migrasi (`drizzle/`) satu kali,
   lalu isi data demo lewat `GET /api/seed` satu kali.
4. **Jangan commit file `.env`.** Simpan `DATABASE_URL` di dashboard platform (Environment Variables/Secrets).
   File `.env.example` sudah disediakan sebagai template.

Alur besarnya:

```
GitHub repo  →  Platform hosting (build otomatis)
                     ↑                    ↓
              DATABASE_URL          butuh database PostgreSQL
                     ↓                    ↓
               1) terapkan migrasi  2) seed data demo  3) buka URL publik
```

---

## 1. Siapkan database PostgreSQL (gratis)

Pilih salah satu, semuanya punya paket gratis dan cocok untuk demo/publish:

| Provider | Cara singkat | Format connection string |
|---|---|---|
| **Neon** (rekomendasi) | neon.tech → New Project → copy *Connection string* | `postgresql://USER:PASS@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require` |
| **Supabase** | supabase.com → New Project → Settings → Database → *Connection pooling* | `postgresql://postgres.REF:PASS@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres` |
| **Railway** | railway.app → New → PostgreSQL → Variables → `DATABASE_URL` | otomatis disediakan |
| **Render** | render.com → New → PostgreSQL → copy *External Database URL* | `postgresql://USER:PASS@dpg-xxx.oregon-postgres.render.com/dbname` |

> ⚠️ Kalau memakai Neon/Supabase, sertakan `?sslmode=require` di akhir URL.
> Untuk **Neon**, gunakan host *pooled* (yang mengandung `-pooler`) agar aman dengan serverless.

**Cek koneksi dari laptop** (opsional, butuh `psql`):

```bash
psql "postgresql://USER:PASS@HOST/DBNAME?sslmode=require" -c "select version();"
```

---

## 2. Terapkan skema tabel ke database

Tabel dibuat dari SQL yang sudah tersedia di folder [`drizzle/`](./drizzle) (44 tabel).
Jalankan **dari komputer kamu** (repo sudah di-clone):

```bash
git clone https://github.com/zakyahmad-dev/webkes.git
cd webkes
npm install

# tulis DATABASE_URL ke .env
cp .env.example .env
nano .env        # ganti isi DATABASE_URL dengan punyamu

# buat semua tabel
npm run db:migrate

# cek: seharusnya ada 44 tabel (daftar tabel healthhub)
psql "$DATABASE_URL" -c "\dt" 2>/dev/null || npx drizzle-kit studio
```

Jika `npm run db:migrate` masih error karena `dotenv` belum terpasang di lingkunganmu, cukup
jalankan SQL-nya langsung (satu file, sekali jalan):

```bash
psql "$DATABASE_URL" -f drizzle/0000_ambitious_drax.sql
```

> Kamu **tidak perlu** menjalankan migrasi lagi setiap kali deploy ulang — cukup ketika schema berubah.
> Kalau nanti `src/db/schema.ts` diubah, generate file migrasi baru dengan `npm run db:generate`
> lalu commit folder `drizzle/` dan jalankan `npm run db:migrate`.

---

## Opsi A — Vercel (paling cepat)

Cocok untuk publish cepat / portofolio. Build & CDN ditangani Vercel.

### A.1 — Import repo

1. Buka **https://vercel.com/new** → login dengan GitHub.
2. Pilih repo **`zakyahmad-dev/webkes`** → klik **Import**.
3. Framework akan terdeteksi otomatis sebagai **Next.js**.
   - Build Command: `npm run build` (biarkan default)
   - Output Directory: biarkan default (kosongkan)
   - Root Directory: `./` (biarkan default) — folder `laravel-app/` diabaikan otomatis.

### A.2 — Tambahkan Environment Variable

Masih di halaman yang sama, buka **Environment Variables**, tambahkan:

| Name | Value | Environments |
|---|---|---|
| `DATABASE_URL` | *(connection string dari langkah 1)* | Production, Preview, Development |

Klik **Deploy** dan tunggu ±1–2 menit.

### A.3 — Seed data demo (sekali saja)

Setelah deploy sukses (`https://<nama-project>.vercel.app`):

```bash
curl https://<nama-project>.vercel.app/api/health   # harus {"ok":true}
curl https://<nama-project>.vercel.app/api/seed     # isi data demo
```

Buka `https://<nama-project>.vercel.app` — seharusnya sudah muncul dokter & artikel.

### A.4 — Deploy ulang otomatis

Setiap `git push` ke branch `main` → Vercel otomatis build & deploy ulang. Selesai. 🎉

**Catatan penting untuk Vercel + Neon/Supabase:** pakai host *pooled* pada `DATABASE_URL`
(Neon: `-pooler`; Supabase: port `6543`) supaya tidak kehabisan koneksi.

---

## Opsi B — Railway

1. Buka **https://railway.app** → **New Project** → **Deploy from GitHub repo** → pilih `webkes`.
2. Di project yang sama: **New** → **Database** → **Add PostgreSQL**.
3. Klik service aplikasi (`webkes`) → tab **Variables** → **New Variable**:
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}` (Railway menyediakan referensi ini otomatis).
4. Tab **Settings** → **Networking** → **Generate Domain** untuk mendapat URL publik.
5. Tunggu build selesai, lalu jalankan migrasi & seed dari laptop (lihat langkah 2),
   atau tambahkan **Deploy → Custom Start Command**:
   ```bash
   npx drizzle-kit migrate && npm start
   ```
   *(pastikan `DATABASE_URL` sudah ada sebelum start command dijalankan)*
6. Seed demo sekali: `curl https://<domain-railway>/api/seed`

---

## Opsi C — Render

1. **New** → **Web Service** → connect repo `webkes`.
2. Isi:
   - Runtime: **Node**
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Environment Variable: `DATABASE_URL` = *External Database URL* dari database Render kamu
     (ganti `postgres://` → tetap boleh, `postgres://` dan `postgresql://` dua-duanya dikenali).
3. **New** → **PostgreSQL** dulu bila belum ada (pilih region yang sama dengan web service).
4. Tunggu deploy → buka URL `https://<nama>.onrender.com`.
5. Jalankan `npm run db:migrate` **dari laptop** dengan `DATABASE_URL` External, lalu
   `curl https://<nama>.onrender.com/api/seed`.
6. Setiap `git push` ke `main` → auto-deploy.

---

## Opsi D — VPS + Docker

Untuk kontrol penuh (domain sendiri, biaya tetap). Contoh Ubuntu 22.04.

### D.1 — Siapkan server

```bash
sudo apt update && sudo apt install -y git docker.io docker-compose-plugin
sudo usermod -aG docker $USER && newgrp docker

git clone https://github.com/zakyahmad-dev/webkes.git
cd webkes
cp .env.example .env     # opsional: ubah POSTGRES_PASSWORD di docker-compose.yml
```

### D.2 — Jalankan app + database

```bash
docker compose up -d --build
docker compose ps                       # tunggu sampai keduanya "running/healthy"

# buat tabel (sekali saja) — dari repo di host, port 5432 sudah dipublikasikan:
DATABASE_URL="postgresql://postgres:layanankesehatan@127.0.0.1:5432/app1_db" \
  npm run db:migrate
# (tanpa Node di host: docker compose exec db psql -U postgres -d app1_db \
#    -c "\i /dev/stdin" < drizzle/0000_ambitious_drax.sql)

# cek + isi data demo
curl http://localhost:3000/api/health
curl http://localhost:3000/api/seed
```

Buka `http://IP-SERVER:3000`. Data tersimpan di volume `pgdata` sehingga aman saat container restart.

### D.3 — Domain + HTTPS (Nginx + Certbot)

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

Buat `/etc/nginx/sites-available/healthhub`:

```nginx
server {
    listen 80;
    server_name rs.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/healthhub /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d rs.example.com        # HTTPS otomatis
```

### D.4 — Update versi baru

```bash
git pull
docker compose up -d --build
```

---

## 3. Checklist setelah deploy

- [ ] `GET /api/health` mengembalikan `{"ok":true}` → koneksi database benar.
- [ ] `GET /api/doctors` mengembalikan data (bukan `[]`) → seed berhasil.
- [ ] Halaman utama menampilkan daftar dokter & artikel.
- [ ] Login `doctor@healthhub.id` / `password123` berhasil.
- [ ] Coba booking dari halaman utama (tombol **Buat Janji**) → muncul di `/appointments` dan `/queue`.
- [ ] `DATABASE_URL` **tidak** ada di dalam repo (`git grep -i "database_url=" -- ':!*.example'` kosong).

---

## 4. Troubleshooting

| Gejala | Penyebab & solusi |
|---|---|
| Build gagal: `Error: DATABASE_URL is required` | Environment variable belum diset di platform, atau hanya diset untuk Production. Set untuk **semua environment** (Production + Preview + Development) lalu redeploy. |
| `{"ok":false}` di `/api/health` | `DATABASE_URL` salah / database belum dibuat / perlu `?sslmode=require`. Cek ulang kredensial. |
| Halaman tampil tapi data kosong | Tabel belum dibuat (jalankan `npm run db:migrate`) atau belum di-seed (`GET /api/seed`). |
| `relation "doctors" does not exist` | Sama seperti di atas — migrasi belum dijalankan pada database yang dipakai platform. |
| Error `too many connections` (Vercel+Neon/Supabase) | Gunakan host pooled: Neon `-pooler`, Supabase port `6543`. |
| `npm run build` error saat cek TypeScript | Jalankan `npm run typecheck` lokal dulu, perbaiki, lalu push. |
| Perubahan tidak muncul setelah push | Cek tab **Deployments** di platform: build mungkin gagal (baca log), atau cache CDN — tunggu ±1 menit. |
| Ingin reset data demo | Hapus data lalu panggil seed lagi: `psql "$DATABASE_URL" -c "drop schema public cascade; create schema public;"` → `npm run db:migrate` → `GET /api/seed`. |

---

## 5. Catatan keamanan (penting)

Aplikasi ini adalah **demo/prototipe**: autentikasi memakai persona demo di `src/context/AuthContext.tsx`
dan endpoint tulis belum dilindungi token. Sebelum dipakai dengan data nyata:

1. Pindahkan auth ke server (session/JWT + hash password) — atau pakai backend `laravel-app/` yang sudah
   punya Sanctum token + RBAC 8 peran.
2. Batasi/lindungi `POST|GET /api/seed` (jangan biarkan publik bisa menimpa data).
3. Aktifkan HTTPS saja, simpan kredensial di secret manager, dan buat backup database otomatis.
4. Untuk data medis sungguhan, patuhi UU PDP / HIPAA: enkripsi, audit trail, dan perjanjian pemrosesan data.
