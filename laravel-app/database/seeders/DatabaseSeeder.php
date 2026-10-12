<?php

namespace Database\Seeders;

use App\Models\{
    Appointment, AppointmentReminder, Article, AuditLog, Bed, Doctor, DoctorSchedule,
    Inpatient, Invoice, InvoiceItem, LabOrder, LabResult, LabTestType, MedicalRecord,
    Medicine, Notification, Patient, Payment, Permission, Polyclinic, Prescription,
    Queue, Role, Room, Service, Setting, Specialization, User, VitalSign
};
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        if (User::count() > 0) {
            $this->command->info('Database sudah terisi, seed dilewati.');
            return;
        }

        // ================= 1. ROLES, PERMISSIONS =================
        $roles = collect([
            ['super-admin', 'Super Admin', 'Direktur RS & akses penuh sistem'],
            ['admin', 'Admin Operasional', 'Manajemen master data, jadwal, CMS'],
            ['doctor', 'Dokter Spesialis', 'Pemeriksaan, EMR, resep, order lab'],
            ['nurse', 'Perawat Triage', 'Antrean, tanda vital, admisi'],
            ['pharmacist', 'Farmasi/Apoteker', 'Dispensing & stok obat'],
            ['lab', 'Analis Laboratorium', 'Input & verifikasi hasil lab'],
            ['cashier', 'Kasir & Billing', 'Pembayaran & invoice'],
            ['patient', 'Pasien', 'Booking, EMR, antrean, pembayaran'],
        ])->mapWithKeys(fn ($r) => [$r[0] => Role::create(['name' => $r[0], 'label' => $r[1], 'description' => $r[2]])]);

        $permGroups = [
            'appointment' => ['appointment.view', 'appointment.book', 'appointment.cancel'],
            'queue' => ['queue.view', 'queue.call', 'queue.serve'],
            'emr' => ['emr.view', 'emr.finalize', 'emr.break_glass'],
            'pharmacy' => ['pharmacy.view', 'pharmacy.dispense', 'pharmacy.restock'],
            'laboratory' => ['lab.view', 'lab.verify', 'lab.release'],
            'billing' => ['billing.view', 'billing.collect'],
            'admin' => ['master.manage', 'audit.view', 'settings.manage'],
            'ai' => ['ai.triage'],
        ];
        foreach ($permGroups as $group => $names) {
            foreach ($names as $name) {
                $perm = Permission::create(['name' => $name, 'label' => ucwords(str_replace('.', ' ', $name)), 'group' => $group]);
                $roles['super-admin']->permissions()->attach($perm);
                match (true) {
                    str_starts_with($name, 'appointment.') => $perm->roles()->attach([$roles['doctor']->id, $roles['nurse']->id, $roles['patient']->id] ?? []),
                    str_starts_with($name, 'queue.') => $perm->roles()->attach([$roles['nurse']->id, $roles['doctor']->id]),
                    str_starts_with($name, 'emr.') => $perm->roles()->attach([$roles['doctor']->id, $roles['nurse']->id, $roles['patient']->id]),
                    str_starts_with($name, 'pharmacy.') => $perm->roles()->attach([$roles['pharmacist']->id, $roles['doctor']->id]),
                    str_starts_with($name, 'lab.') => $perm->roles()->attach([$roles['lab']->id, $roles['doctor']->id]),
                    str_starts_with($name, 'billing.') => $perm->roles()->attach([$roles['cashier']->id, $roles['patient']->id]),
                    default => null,
                };
            }
        }

        // ================= 2. USERS (password: password123) =================
        $mkUser = function (string $name, string $email, string $role, string $phone, string $avatar) {
            return User::create([
                'name' => $name, 'email' => $email, 'password' => Hash::make('password123'),
                'role' => $role, 'phone' => $phone, 'avatar_path' => $avatar,
                'email_verified_at' => now(),
            ]);
        };
        $superAdmin = $mkUser('dr. Alexander Pratama, MARS', 'superadmin@healthhub.id', 'super-admin', '081100000001', 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80');
        $admin = $mkUser('Doni Prasetyo, S.Kom', 'admin@healthhub.id', 'admin', '081100000002', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');
        $uSarah = $mkUser('dr. Sarah Wijaya, Sp.PD', 'doctor@healthhub.id', 'doctor', '081234567890', 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80');
        $uDimas = $mkUser('dr. Dimas Wicaksono, Sp.JP(K)', 'dimas@healthhub.id', 'doctor', '081234567891', 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&auto=format&fit=crop&q=80');
        $uAmanda = $mkUser('dr. Amanda Kartika, Sp.A', 'amanda@healthhub.id', 'doctor', '081234567892', 'https://images.unsplash.com/photo-1594824813570-5882650f0c03?w=150&auto=format&fit=crop&q=80');
        $uReza = $mkUser('dr. Reza Pratama, Sp.N', 'reza@healthhub.id', 'doctor', '081234567893', 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80');
        $nurse = $mkUser('Ns. Siti Rahayu, S.Kep', 'nurse@healthhub.id', 'nurse', '081398765432', 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=150&auto=format&fit=crop&q=80');
        $pharm = $mkUser('apt. Hendra Gunawan, S.Farm', 'pharmacy@healthhub.id', 'pharmacist', '081377889900', 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=150&auto=format&fit=crop&q=80');
        $lab = $mkUser('Maya Indah, A.Md.AK', 'lab@healthhub.id', 'lab', '081366554433', 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=150&auto=format&fit=crop&q=80');
        $cashier = $mkUser('Rian Pratama, S.E', 'cashier@healthhub.id', 'cashier', '081311223344', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80');
        $budi = $mkUser('Budi Santoso', 'patient@healthhub.id', 'patient', '081288990011', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80');

        // ================= 3. SPESIALISASI, POLI, DOKTER, JADWAL =================
        $specs = collect([
            ['Penyakit Dalam', 'penyakit-dalam', 'Diagnosis & terapi komprehensif organ dalam, diabetes, hipertensi, ginjal.'],
            ['Jantung & Kardiovaskular', 'jantung-kardiovaskular', 'Pencegahan, Cath Lab intervensi, rehabilitasi jantung.'],
            ['Kesehatan Anak (Pediatri)', 'anak-pediatri', 'Tumbuh kembang, imunisasi, infeksi anak.'],
            ['Saraf & Neurologi', 'saraf-neurologi', 'Stroke Center, epilepsi, vertigo, migrain.'],
            ['Orthopedi & Bedah Tulang', 'orthopedi', 'Patah tulang, cedera ligamen, artroskopi.'],
            ['Mata (Oftalmologi)', 'mata-oftalmologi', 'Katarak phaco, glaukoma, refraksi.'],
        ])->map(fn ($s) => Specialization::create(['name' => $s[0], 'slug' => $s[1], 'description' => $s[2]]));

        $polys = collect([
            [$specs[0]->id, 'Poli Penyakit Dalam', 'poli-penyakit-dalam', 'Gedung A, Lt 2', 'A'],
            [$specs[1]->id, 'Poli Jantung & Kardiovaskular', 'poli-jantung', 'Gedung A, Lt 2', 'B'],
            [$specs[2]->id, 'Poli Kesehatan Anak', 'poli-anak', 'Gedung B, Lt 1', 'C'],
            [$specs[3]->id, 'Poli Saraf & Neurologi', 'poli-saraf', 'Gedung A, Lt 3', 'D'],
            [$specs[4]->id, 'Poli Orthopedi & Traumatologi', 'poli-orthopedi', 'Gedung A, Lt 1', 'E'],
            [$specs[5]->id, 'Poli Mata', 'poli-mata', 'Gedung B, Lt 3', 'F'],
        ])->map(fn ($p) => Polyclinic::create([
            'specialization_id' => $p[0], 'name' => $p[1], 'slug' => $p[2],
            'location_note' => $p[3], 'queue_prefix' => $p[4],
        ]));

        $dSarah = Doctor::create([
            'user_id' => $uSarah->id, 'specialization_id' => $specs[0]->id, 'polyclinic_id' => $polys[0]->id,
            'name' => 'dr. Sarah Wijaya, Sp.PD', 'slug' => 'dr-sarah-wijaya-sppd', 'title_suffix' => 'Sp.PD',
            'str_number' => 'STR-3174-8899210-2026', 'sip_number' => 'SIP-503/442/DPMPTSP/2026',
            'photo_path' => $uSarah->avatar_path, 'bio' => 'Spesialis Penyakit Dalam lulusan FK UI; diabetes, hipertensi kompleks, metabolik.',
            'education' => ['S1 Kedokteran - UI', 'Spesialis Penyakit Dalam - UI', 'Fellowship Endokrinologi - SingHealth'],
            'experience_years' => 11, 'consultation_fee' => 275000, 'rating' => 4.95, 'reviews_count' => 248,
        ]);
        $dDimas = Doctor::create([
            'user_id' => $uDimas->id, 'specialization_id' => $specs[1]->id, 'polyclinic_id' => $polys[1]->id,
            'name' => 'dr. Dimas Wicaksono, Sp.JP(K), FIHA', 'slug' => 'dr-dimas-wicaksono-spjpk', 'title_suffix' => 'Sp.JP(K), FIHA',
            'str_number' => 'STR-3174-7722119-2026', 'sip_number' => 'SIP-503/445/DPMPTSP/2026',
            'photo_path' => $uDimas->avatar_path, 'bio' => 'Konsultan Kardiologi Intervensi: PCI, katerisasi, penyakit jantung koroner akut.',
            'education' => ['S1 Kedokteran - Unair', 'Sp.JP - Unair', 'Subspesialis Intervensi - NHC Singapura'],
            'experience_years' => 14, 'consultation_fee' => 350000, 'rating' => 4.98, 'reviews_count' => 312,
        ]);
        $dAmanda = Doctor::create([
            'user_id' => $uAmanda->id, 'specialization_id' => $specs[2]->id, 'polyclinic_id' => $polys[2]->id,
            'name' => 'dr. Amanda Kartika, Sp.A', 'slug' => 'dr-amanda-kartika-spa', 'title_suffix' => 'Sp.A',
            'str_number' => 'STR-3174-6633445-2026', 'sip_number' => 'SIP-503/448/DPMPTSP/2026',
            'photo_path' => $uAmanda->avatar_path, 'bio' => 'Spesialis Anak: tumbuh kembang, vaksinasi lengkap, infeksi tropis pediatrik.',
            'education' => ['S1 Kedokteran - UGM', 'Sp.A - UGM'], 'experience_years' => 8,
            'consultation_fee' => 250000, 'rating' => 4.92, 'reviews_count' => 185,
        ]);
        $dReza = Doctor::create([
            'user_id' => $uReza->id, 'specialization_id' => $specs[3]->id, 'polyclinic_id' => $polys[3]->id,
            'name' => 'dr. Reza Pratama, Sp.N, FINS', 'slug' => 'dr-reza-pratama-spn', 'title_suffix' => 'Sp.N, FINS',
            'str_number' => 'STR-3174-5544332-2026', 'sip_number' => 'SIP-503/450/DPMPTSP/2026',
            'photo_path' => $uReza->avatar_path, 'bio' => 'Neurolog: Stroke Unit, migrain, saraf kejepit, neuromuskular.',
            'education' => ['S1 Kedokteran - Unpad', 'Sp.N - Unpad'], 'experience_years' => 9,
            'consultation_fee' => 280000, 'rating' => 4.89, 'reviews_count' => 142,
        ]);

        foreach ([$dSarah, $dDimas, $dAmanda, $dReza] as $doc) {
            foreach (range(1, 6) as $day) {
                DoctorSchedule::create([
                    'doctor_id' => $doc->id, 'polyclinic_id' => $doc->polyclinic_id,
                    'day_of_week' => $day,
                    'start_time' => $day === 4 ? '13:00' : ($day % 2 === 0 ? '09:00' : '08:00'),
                    'end_time' => $day === 4 ? '17:00' : ($day % 2 === 0 ? '13:00' : '12:00'),
                    'slot_duration_minutes' => 30, 'slot_capacity' => 1,
                ]);
            }
        }

        // ================= 4. PASIEN =================
        $pBudi = Patient::create([
            'user_id' => $budi->id, 'medical_record_number' => 'RM-202610-001',
            'nik' => '3174051203890001', 'nik_hash' => hash('sha256', '3174051203890001'),
            'full_name' => 'Budi Santoso', 'birth_date' => '1989-03-12', 'gender' => 'L', 'blood_type' => 'O+',
            'phone' => '081288990011', 'address' => 'Jl. Dahlia No. 42, Kebayoran Baru', 'city' => 'Jakarta Selatan',
            'emergency_contact_name' => 'Dewi Lestari', 'emergency_contact_phone' => '081288990099',
            'emergency_contact_relation' => 'Istri', 'allergies_summary' => 'Penisilin, Amoxicillin',
            'bpjs_number' => '0001234567891', 'consent_at' => now(),
        ]);
        $pRatna = Patient::create([
            'medical_record_number' => 'RM-202610-002', 'nik' => '3273014508920003',
            'nik_hash' => hash('sha256', '3273014508920003'), 'full_name' => 'Ratna Kusuma',
            'birth_date' => '1992-08-15', 'gender' => 'P', 'blood_type' => 'A+',
            'phone' => '081399887766', 'address' => 'Jl. Teratai No. 15, Menteng', 'city' => 'Jakarta Pusat',
            'allergies_summary' => 'Tidak ada riwayat alergi', 'bpjs_number' => '0001234567892', 'consent_at' => now(),
        ]);
        $pAhmad = Patient::create([
            'medical_record_number' => 'RM-202610-003', 'nik' => '3172021104800005',
            'nik_hash' => hash('sha256', '3172021104800005'), 'full_name' => 'Ahmad Fauzi',
            'birth_date' => '1980-04-11', 'gender' => 'L', 'blood_type' => 'B+',
            'phone' => '081277665544', 'address' => 'Jl. Mawar Indah Blok C3, Cilandak', 'city' => 'Jakarta Selatan',
            'allergies_summary' => 'Seafood, Kerang', 'bpjs_number' => '0001234567893', 'consent_at' => now(),
        ]);
        $pDewi = Patient::create([
            'medical_record_number' => 'RM-202610-004', 'nik' => '3578016709950002',
            'nik_hash' => hash('sha256', '3578016709950002'), 'full_name' => 'Dewi Sartika',
            'birth_date' => '1995-09-27', 'gender' => 'P', 'blood_type' => 'AB+',
            'phone' => '081355443322', 'address' => 'Jl. Anggrek No. 8, Setiabudi', 'city' => 'Jakarta Selatan',
            'allergies_summary' => 'Aspirin, NSAID', 'consent_at' => now(),
        ]);

        // ================= 5. OBAT & STOK =================
        $meds = collect([
            ['MED-001', 'Amlodipine 10mg', 'Amlodipine Besylate', 'Tablet', '10mg', 'Strip (10 Tab)', 28000, 450, 50],
            ['MED-002', 'Metformin HCl 500mg', 'Metformin HCl', 'Tablet', '500mg', 'Strip (10 Tab)', 18500, 620, 60],
            ['MED-003', 'Lansoprazole 30mg', 'Lansoprazole', 'Kapsul', '30mg', 'Strip (10 Kap)', 35000, 310, 40],
            ['MED-004', 'Paracetamol 500mg', 'Paracetamol', 'Tablet', '500mg', 'Strip (10 Tab)', 12000, 800, 100],
            ['MED-005', 'Atorvastatin 20mg', 'Atorvastatin Calcium', 'Tablet', '20mg', 'Strip (10 Tab)', 68000, 180, 30],
            ['MED-006', 'Cefixime 200mg', 'Cefixime Trihydrate', 'Kapsul', '200mg', 'Strip (10 Kap)', 85000, 140, 25],
        ])->map(fn ($m) => Medicine::create([
            'sku' => $m[0], 'name' => $m[1], 'generic_name' => $m[2], 'form' => $m[3],
            'strength' => $m[4], 'unit' => $m[5], 'price' => $m[6], 'current_stock' => $m[7], 'min_stock' => $m[8],
        ]));
        foreach ($meds as $med) {
            $med->stockMovements()->create([
                'batch_number' => "BATCH-2026-{$med->id}01", 'expiry_date' => '2027-12-31',
                'movement_type' => 'in', 'quantity' => $med->current_stock,
                'balance_after' => $med->current_stock, 'notes' => 'Stok awal batch 2026',
            ]);
        }

        // ================= 6. LAB TEST TYPES =================
        $labTypes = collect([
            ['LAB-CBC', 'Darah Lengkap (CBC)', 'Hematologi', 'Panel', null, null, 'Hb: 12-16 g/dL; Leu: 4-10; Plt: 150-450', 145000],
            ['LAB-GDP', 'Gula Darah Puasa', 'Kimia Darah', 'mg/dL', 70, 100, '70-100 mg/dL', 45000],
            ['LAB-HBA1C', 'HbA1c', 'Kimia Darah', '%', 4.0, 5.7, '<5.7% normal', 195000],
            ['LAB-LIPID', 'Profil Lipid Lengkap', 'Kimia Darah', 'Panel', null, null, 'Kol. Total <200, LDL <100, HDL >40', 240000],
        ])->map(fn ($l) => LabTestType::create([
            'code' => $l[0], 'name' => $l[1], 'category' => $l[2], 'unit' => $l[3],
            'ref_min' => $l[4], 'ref_max' => $l[5], 'ref_text' => $l[6], 'price' => $l[7],
        ]));

        // ================= 7. KAMAR & BED =================
        $rooms = collect([
            ['VIP-301', 'Paviliun VVIP Cendana 301', 'vvip', 3, 1850000],
            ['VIP-302', 'Paviliun VIP Kenanga 302', 'vip', 3, 1250000],
            ['KL1-201', 'Ruang Kelas 1 Flamboyan 201', 'class_1', 2, 750000],
            ['ICU-101', 'Intensive Care Unit Bed 01', 'icu', 1, 2500000],
        ])->map(fn ($r) => Room::create(['code' => $r[0], 'name' => $r[1], 'room_class' => $r[2], 'floor' => $r[3], 'daily_rate' => $r[4]]));

        $bedVip302 = Bed::create(['room_id' => $rooms[1]->id, 'bed_number' => 'Bed 1', 'status' => 'occupied']);
        Bed::create(['room_id' => $rooms[0]->id, 'bed_number' => 'Bed 1', 'status' => 'available']);
        Bed::create(['room_id' => $rooms[2]->id, 'bed_number' => 'Bed A', 'status' => 'available']);
        Bed::create(['room_id' => $rooms[2]->id, 'bed_number' => 'Bed B', 'status' => 'cleaning']);
        Bed::create(['room_id' => $rooms[3]->id, 'bed_number' => 'Bed ICU-1', 'status' => 'available']);

        Inpatient::create([
            'admission_code' => 'ADM-' . now()->format('Ymd') . '-0001', 'patient_id' => $pRatna->id,
            'bed_id' => $bedVip302->id, 'doctor_id' => $dSarah->id, 'admission_source' => 'poli',
            'initial_diagnosis' => 'Observasi Febris H-4 e.c Suspek DHF Derajat II', 'status' => 'admitted',
        ]);

        // ================= 8. APPOINTMENT & ANTREAN HARI INI =================
        $today = now()->startOfDay();
        $apt1 = Appointment::create([
            'appointment_code' => 'APT-' . now()->format('Ymd') . '-0010',
            'patient_id' => $pBudi->id, 'doctor_id' => $dSarah->id, 'polyclinic_id' => $polys[0]->id,
            'scheduled_at' => $today->copy()->setTime(10, 0),
            'slot_key' => $dSarah->id . '_' . $today->toDateString() . '_1000',
            'status' => 'confirmed', 'source' => 'ai',
            'complaint' => 'Pusing berputar, tengkuk berat, tensi sempat 150/95 saat cek mandiri.',
            'queue_number' => 'A-014', 'created_by' => $budi->id,
        ]);
        Queue::create([
            'appointment_id' => $apt1->id, 'polyclinic_id' => $polys[0]->id, 'doctor_id' => $dSarah->id,
            'queue_date' => $today->toDateString(), 'queue_number' => 14, 'queue_code' => 'A-014',
            'status' => 'waiting', 'estimated_wait_minutes' => 15,
        ]);
        AppointmentReminder::create([
            'appointment_id' => $apt1->id, 'type' => 'h_minus_2_hours',
            'scheduled_for' => now(), 'status' => 'sent', 'sent_at' => now(),
        ]);

        $apt2 = Appointment::create([
            'appointment_code' => 'APT-' . now()->format('Ymd') . '-0008',
            'patient_id' => $pAhmad->id, 'doctor_id' => $dDimas->id, 'polyclinic_id' => $polys[1]->id,
            'scheduled_at' => $today->copy()->setTime(9, 30),
            'slot_key' => $dDimas->id . '_' . $today->toDateString() . '_0930',
            'status' => 'in_progress', 'source' => 'web',
            'complaint' => 'Dada berdebar saat aktivitas ringan, riwayat hipertensi 3 tahun.',
            'queue_number' => 'B-008',
        ]);
        Queue::create([
            'appointment_id' => $apt2->id, 'polyclinic_id' => $polys[1]->id, 'doctor_id' => $dDimas->id,
            'queue_date' => $today->toDateString(), 'queue_number' => 8, 'queue_code' => 'B-008',
            'status' => 'serving', 'serving_at' => now(), 'handled_by' => $nurse->id,
        ]);

        // ================= 9. EMR LAMPAU BUDI (tx inline) =================
        $mr = MedicalRecord::create([
            'record_number' => 'EMR-20260915-0042', 'patient_id' => $pBudi->id, 'doctor_id' => $dSarah->id,
            'visit_date' => '2026-09-15', 'visit_type' => 'outpatient',
            'complaint' => 'Kontrol tekanan darah & gula darah 3 bulanan.',
            'medical_history' => 'Hipertensi Stage 1 sejak 2024, DM Tipe 2 terkontrol diet.',
            'allergy_notes' => 'Alergi Penisilin (urtikaria, pruritus).',
            'physical_exam_notes' => 'KU baik, CM. Cor/Pulmo normal. Abdomen supel. Edema (-/-).',
            'doctor_notes' => 'Target TD <130/80. Teruskan Amlodipine 10mg pagi, olahraga 30 mnt 3x/mgg.',
            'status' => 'final', 'finalized_at' => Carbon::parse('2026-09-15T11:30'), 'finalized_by' => $uSarah->id,
        ]);
        $mr->details()->createMany([
            ['type' => 'diagnosis', 'code' => 'I10', 'description' => 'Essential (primary) hypertension', 'is_primary' => true],
            ['type' => 'diagnosis', 'code' => 'E11.9', 'description' => 'Type 2 diabetes mellitus without complications', 'is_primary' => false],
            ['type' => 'treatment', 'code' => '90.59', 'description' => 'Screening GD puasa & edukasi gaya hidup'],
        ]);

        VitalSign::create([
            'patient_id' => $pBudi->id, 'medical_record_id' => $mr->id, 'recorded_by' => $nurse->id,
            'systolic' => 138, 'diastolic' => 88, 'heart_rate' => 78, 'respiratory_rate' => 18,
            'temperature' => '36.6', 'spo2' => 99, 'weight_kg' => 72.5, 'height_cm' => 172, 'bmi' => 24.5,
            'notes' => 'Post istirahat 10 menit', 'recorded_at' => Carbon::parse('2026-09-15T09:15'),
        ]);
        VitalSign::create([
            'patient_id' => $pBudi->id, 'appointment_id' => $apt1->id, 'recorded_by' => $nurse->id,
            'systolic' => 142, 'diastolic' => 92, 'heart_rate' => 82, 'respiratory_rate' => 18,
            'temperature' => '36.7', 'spo2' => 98, 'weight_kg' => 73, 'height_cm' => 172, 'bmi' => 24.7,
            'notes' => 'Triage Poli Penyakit Dalam', 'recorded_at' => now(),
        ]);

        // Resep lampau (selesai didispensing)
        $rx = Prescription::create([
            'prescription_code' => 'RX-20260915-0038', 'medical_record_id' => $mr->id,
            'patient_id' => $pBudi->id, 'doctor_id' => $dSarah->id, 'status' => 'completed',
            'processed_by' => $pharm->id, 'ready_at' => Carbon::parse('2026-09-15T11:45'),
            'completed_at' => Carbon::parse('2026-09-15T12:00'),
        ]);
        $rx->items()->createMany([
            ['medicine_id' => $meds[0]->id, 'dose' => '1 tablet (10mg)', 'frequency' => '1x sehari pagi',
             'duration_days' => 30, 'quantity' => 30, 'instructions' => 'Sesudah makan pagi', 'dispensed_quantity' => 30],
            ['medicine_id' => $meds[1]->id, 'dose' => '1 tablet (500mg)', 'frequency' => '2x sehari',
             'duration_days' => 30, 'quantity' => 60, 'instructions' => 'Bersama makanan', 'dispensed_quantity' => 60],
        ]);

        // Lab lampau (telah dirilis)
        $lo = LabOrder::create([
            'order_code' => 'LAB-20260915-0019', 'patient_id' => $pBudi->id, 'medical_record_id' => $mr->id,
            'ordered_by' => $dSarah->id, 'status' => 'completed', 'processed_by' => $lab->id,
            'completed_at' => Carbon::parse('2026-09-15T14:30'),
            'released_to_patient_at' => Carbon::parse('2026-09-15T14:40'),
        ]);
        foreach ([
            [$labTypes[1], '98', 'mg/dL', '70-100 mg/dL', 'normal'],
            [$labTypes[2], '5.6', '%', '<5.7%', 'normal'],
            [$labTypes[3], '192', 'mg/dL', '<200 mg/dL', 'normal'],
        ] as [$type, $val, $unit, $ref, $flag]) {
            LabResult::create([
                'lab_order_id' => $lo->id, 'lab_test_type_id' => $type->id, 'value' => $val,
                'unit' => $unit, 'reference_range' => $ref, 'flag' => $flag,
                'verified_by' => $lab->id, 'verified_at' => Carbon::parse('2026-09-15T14:30'),
            ]);
        }

        // Invoice lampau lunas
        $inv = Invoice::create([
            'invoice_number' => 'INV-20260915-0088', 'patient_id' => $pBudi->id,
            'subtotal' => 565000, 'discount' => 0, 'tax' => 0, 'total' => 565000,
            'status' => 'paid', 'issued_at' => Carbon::parse('2026-09-15T12:05'),
            'paid_at' => Carbon::parse('2026-09-15T12:15'), 'created_by' => $cashier->id,
        ]);
        $inv->items()->createMany([
            ['item_type' => 'consultation', 'description' => 'Konsultasi dr. Sarah Wijaya, Sp.PD', 'quantity' => 1, 'unit_price' => 275000, 'subtotal' => 275000],
            ['item_type' => 'medicine', 'description' => 'Amlodipine & Metformin (1 bulan)', 'quantity' => 1, 'unit_price' => 145000, 'subtotal' => 145000],
            ['item_type' => 'lab', 'description' => 'Paket Lab Gula & Lipid', 'quantity' => 1, 'unit_price' => 145000, 'subtotal' => 145000],
        ]);
        Payment::create([
            'invoice_id' => $inv->id, 'payment_code' => 'PAY-20260915-0051', 'method' => 'qris',
            'amount' => 565000, 'status' => 'success', 'gateway_reference' => 'QRIS_NMD_9981240182',
            'idempotency_key' => 'idem_inv_0088_qris', 'paid_at' => Carbon::parse('2026-09-15T12:15'),
            'received_by' => $cashier->id,
        ]);

        // ================= 10. SERVICES =================
        foreach ([
            ['Poli Rawat Jalan Eksekutif', 'poli-eksekutif', 'poli', 'Konsultasi spesialis premium terjadwal tepat waktu.', 1],
            ['Cath Lab & Pusat Jantung Terpadu', 'cath-lab-jantung', 'unggulan', 'Katerisasi intervensi jantung 24 jam.', 2],
            ['IGD & Trauma Center 24 Jam', 'igd-trauma-center', 'igd', 'Dokter emergensi + ambulans respons cepat 24/7.', 3],
            ['Radiologi & MRI 3 Tesla Digital', 'radiologi-mri', 'penunjang', 'MRI 3.0T, CT 512 slices, USG 4D, Digital X-Ray.', 4],
            ['Laboratorium Patologi Terpadu', 'laboratorium-terpadu', 'penunjang', 'Hematologi, kimia darah, imunologi cepat & akurat.', 5],
            ['Farmasi Klinis 24 Jam', 'farmasi-24jam', 'penunjang', 'E-resep cepat, konseling apoteker, antar obat.', 6],
        ] as $s) {
            Service::create([
                'name' => $s[0], 'slug' => $s[1], 'type' => $s[2], 'description' => $s[3], 'sort_order' => $s[4],
                'image_path' => 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=80',
            ]);
        }

        // ================= 11. ARTIKEL =================
        foreach ([
            [$uSarah, 'Mengenal Gejala Awal Diabetes Mellitus dan Cara Pencegahannya', 'mengenal-gejala-awal-diabetes-mellitus', 'Penyakit Dalam'],
            [$uDimas, 'Waspada Nyeri Dada: Kapan Harus Segera ke IGD?', 'waspada-nyeri-dada-kapan-ke-igd', 'Jantung & Kardiovaskular'],
            [$uAmanda, 'Panduan Lengkap Jadwal Imunisasi Anak Usia 0-2 Tahun', 'panduan-jadwal-imunisasi-anak', 'Kesehatan Anak'],
            [$uReza, 'Kenali Gejala Stroke dengan Metode FAST', 'kenali-gejala-stroke-metode-fast', 'Saraf & Neurologi'],
        ] as [$author, $title, $slug, $cat]) {
            Article::create([
                'author_id' => $author->id, 'title' => $title, 'slug' => $slug, 'category' => $cat,
                'excerpt' => 'Edukasi klinis tervalidasi dokter spesialis HealthHub.',
                'content' => 'Konten edukasi lengkap — deteksi dini melalui pemeriksaan berkala sangat dianjurkan. Konsultasikan dengan dokter spesialis terkait bila gejala menetap.',
                'read_time_minutes' => 5, 'published_at' => now()->subDays(5),
            ]);
        }

        // ================= 12. NOTIFIKASI =================
        Notification::insert([
            ['user_id' => $budi->id, 'category' => 'appointment', 'title' => 'Pengingat Janji Temu Hari Ini (≤ 2 Jam)',
             'message' => 'Janji temu dr. Sarah Wijaya, Sp.PD pukul 10:00 WIB. Antrean Anda: A-014.', 'action_url' => '/queue', 'created_at' => now(), 'updated_at' => now()],
            ['user_id' => $budi->id, 'category' => 'laboratory', 'title' => 'Hasil Laboratorium Telah Terbit',
             'message' => 'Hasil Darah Lengkap & GDP kunjungan lalu telah diverifikasi dan dapat diunduh.', 'action_url' => '/laboratory', 'created_at' => now(), 'updated_at' => now()],
            ['user_id' => $budi->id, 'category' => 'hospital_info', 'title' => 'Selamat Datang di HealthHub',
             'message' => 'Gunakan AI Health Assistant untuk triage dan booking lebih cepat.', 'action_url' => '/ai-consultation', 'created_at' => now(), 'updated_at' => now()],
        ]);

        // ================= 13. SETTINGS =================
        foreach ([
            ['hospital_name', 'HealthHub General & Specialist Hospital', 'general'],
            ['emergency_hotline', '021-555-0119', 'emergency'],
            ['ambulance_hotline', '021-555-0118 / 119', 'emergency'],
            ['hospital_address', 'Jl. Sudirman Boulevard No. 88, Senayan, Jakarta Pusat 10270', 'contact'],
            ['contact_email', 'info@healthhub.id', 'contact'],
            ['operational_hours', 'Poliklinik Senin-Sabtu 08:00-20:00 WIB; IGD 24 Jam', 'general'],
            ['reminder_threshold_minutes', 120, 'reminder'],
            ['accreditation', 'Paripurna KARS (Bintang 5) No. KARS-SERT/988/X/2025', 'quality'],
        ] as [$key, $value, $group]) {
            Setting::create(['key' => $key, 'value' => $value, 'group' => $group]);
        }

        // ================= 14. AUDIT TRAIL AWAL =================
        AuditLog::insert([
            ['user_id' => $superAdmin->id, 'role_snapshot' => 'super-admin', 'action' => 'SYSTEM_BOOTSTRAP',
             'auditable_type' => 'System', 'notes' => 'Inisialisasi HealthHub Laravel backend + master data.', 'created_at' => now(), 'updated_at' => now()],
            ['user_id' => $uSarah->id, 'role_snapshot' => 'doctor', 'action' => 'EMR_FINALIZED',
             'auditable_type' => 'MedicalRecord', 'auditable_id' => $mr->id, 'patient_id' => $pBudi->id,
             'notes' => 'EMR-20260915-0042 difinalisasi dr. Sarah Wijaya.', 'created_at' => now(), 'updated_at' => now()],
            ['user_id' => $lab->id, 'role_snapshot' => 'lab', 'action' => 'LAB_RESULT_RELEASED',
             'auditable_type' => 'LabOrder', 'auditable_id' => $lo->id, 'patient_id' => $pBudi->id,
             'notes' => 'LAB-20260915-0019 dirilis ke pasien.', 'created_at' => now(), 'updated_at' => now()],
        ]);

        $this->command->info('✅ HealthHub Laravel seeding selesai!');
    }
}
