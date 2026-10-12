import { db } from "./index";
import {
  users, roles, permissions, roleUsers, permissionRoles,
  patients, specializations, polyclinics, doctors, doctorSchedules,
  services, appointments, appointmentReminders, queues,
  medicalRecords, medicalRecordDetails, vitalSigns,
  medicines, medicineStocks, prescriptions, prescriptionItems,
  labTestTypes, labOrders, labResults,
  rooms, beds, inpatients,
  invoices, invoiceItems, payments,
  articles, facilities, galleries, banners, announcements,
  settings, notifications, auditLogs
} from "./schema";
import { sql } from "drizzle-orm";

export async function seedDatabase() {
  console.log("🌱 Seeding HealthHub database...");

  // Check if already seeded
  const existingUsers = await db.select().from(users).limit(1);
  if (existingUsers.length > 0) {
    console.log("Database already seeded. Skipping initial seed.");
    return;
  }

  // 1. ROLES
  const roleList = [
    { name: "super-admin", label: "Super Admin", description: "Direktur RS & Akses Penuh Sistem" },
    { name: "admin", label: "Admin Operasional", description: "Manajemen data master, jadwal, CMS" },
    { name: "doctor", label: "Dokter Spesialis", description: "Pemeriksaan medis, rekam medis EMR, resep, lab" },
    { name: "nurse", label: "Perawat Triage", description: "Antrean, vital signs, admisi awal" },
    { name: "pharmacist", label: "Farmasi / Apoteker", description: "Dispensing obat, kontrol stok farmasi" },
    { name: "lab", label: "Analis Laboratorium", description: "Pemeriksaan lab, input hasil & verifikasi" },
    { name: "cashier", label: "Kasir & Billing", description: "Pembayaran, invoice, kasir RS" },
    { name: "patient", label: "Pasien", description: "Akses booking, riwayat rekam medis, antrean, pembayaran" },
  ];
  const insertedRoles = await db.insert(roles).values(roleList).returning();

  // 2. USERS (Password for all demo users: password123)
  const demoUsers = [
    {
      name: "dr. Alexander Pratama, MARS",
      email: "superadmin@healthhub.id",
      password: "password123",
      role: "super-admin",
      phone: "081100000001",
      avatarPath: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80",
    },
    {
      name: "Doni Prasetyo, S.Kom",
      email: "admin@healthhub.id",
      password: "password123",
      role: "admin",
      phone: "081100000002",
      avatarPath: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
    {
      name: "dr. Sarah Wijaya, Sp.PD",
      email: "doctor@healthhub.id",
      password: "password123",
      role: "doctor",
      phone: "081234567890",
      avatarPath: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80",
    },
    {
      name: "dr. Dimas Wicaksono, Sp.JP(K)",
      email: "dimas@healthhub.id",
      password: "password123",
      role: "doctor",
      phone: "081234567891",
      avatarPath: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&auto=format&fit=crop&q=80",
    },
    {
      name: "dr. Amanda Kartika, Sp.A",
      email: "amanda@healthhub.id",
      password: "password123",
      role: "doctor",
      phone: "081234567892",
      avatarPath: "https://images.unsplash.com/photo-1594824813570-5882650f0c03?w=150&auto=format&fit=crop&q=80",
    },
    {
      name: "dr. Reza Pratama, Sp.N",
      email: "reza@healthhub.id",
      password: "password123",
      role: "doctor",
      phone: "081234567893",
      avatarPath: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80",
    },
    {
      name: "Ns. Siti Rahayu, S.Kep",
      email: "nurse@healthhub.id",
      password: "password123",
      role: "nurse",
      phone: "081398765432",
      avatarPath: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=150&auto=format&fit=crop&q=80",
    },
    {
      name: "apt. Hendra Gunawan, S.Farm",
      email: "pharmacy@healthhub.id",
      password: "password123",
      role: "pharmacist",
      phone: "081377889900",
      avatarPath: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=150&auto=format&fit=crop&q=80",
    },
    {
      name: "Maya Indah, A.Md.AK",
      email: "lab@healthhub.id",
      password: "password123",
      role: "lab",
      phone: "081366554433",
      avatarPath: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=150&auto=format&fit=crop&q=80",
    },
    {
      name: "Rian Pratama, S.E",
      email: "cashier@healthhub.id",
      password: "password123",
      role: "cashier",
      phone: "081311223344",
      avatarPath: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
    {
      name: "Budi Santoso",
      email: "patient@healthhub.id",
      password: "password123",
      role: "patient",
      phone: "081288990011",
      avatarPath: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    },
  ];
  const insertedUsers = await db.insert(users).values(demoUsers).returning();

  // 3. SPECIALIZATIONS
  const specializationsData = [
    { name: "Penyakit Dalam", slug: "penyakit-dalam", description: "Diagnosis & terapi komprehensif penyakit organ dalam dewasa, diabetes, hipertensi, dan ginjal.", icon: "Stethoscope" },
    { name: "Jantung & Kardiovaskular", slug: "jantung-kardiovaskular", description: "Layanan pencegahan, intervensi katerisasi (Cath Lab), dan rehabilitasi jantung.", icon: "HeartPulse" },
    { name: "Kesehatan Anak (Pediatri)", slug: "anak-pediatri", description: "Pelayanan tumbuh kembang anak, imunisasi, dan penanganan penyakit infeksi anak.", icon: "Baby" },
    { name: "Saraf & Neurologi", slug: "saraf-neurologi", description: "Pusat penanganan stroke akut, epilepsi, vertigo, migrain, dan gangguan saraf.", icon: "Brain" },
    { name: "Orthopedi & Bedah Tulang", slug: "orthopedi", description: "Penanganan patah tulang, cedera ligamen olahraga, artroskopi, dan penggantian sendi.", icon: "Bone" },
    { name: "Mata (Oftalmologi)", slug: "mata-oftalmologi", description: "Pemeriksaan visus, katarak phaco, glaukoma, dan kesehatan refraksi mata.", icon: "Eye" },
    { name: "Kebidanan & Kandungan", slug: "kebidanan-kandungan", description: "Pemeriksaan USG 4D kehamilan, persalinan gentle birth, dan kesehatan reproduksi.", icon: "Sparkles" },
    { name: "THT-KL", slug: "tht-kl", description: "Pemeriksaan endoskopi THT, gangguan pendengaran, sinusitis, dan amandel.", icon: "Ear" },
  ];
  const insertedSpecs = await db.insert(specializations).values(specializationsData).returning();

  // 4. POLYCLINICS
  const polyclinicsData = [
    { specializationId: insertedSpecs[0].id, name: "Poli Penyakit Dalam", slug: "poli-penyakit-dalam", description: "Lantai 2 Sayap Barat - Ruang 201-204", locationNote: "Gedung A, Lt 2", queuePrefix: "A" },
    { specializationId: insertedSpecs[1].id, name: "Poli Jantung & Kardiovaskular", slug: "poli-jantung", description: "Lantai 2 Sayap Timur - Ruang 210-212 (Dekat Cath Lab)", locationNote: "Gedung A, Lt 2", queuePrefix: "B" },
    { specializationId: insertedSpecs[2].id, name: "Poli Kesehatan Anak", slug: "poli-anak", description: "Lantai 1 Sayap Ramah Anak (Area Bermain)", locationNote: "Gedung B, Lt 1", queuePrefix: "C" },
    { specializationId: insertedSpecs[3].id, name: "Poli Saraf & Neurologi", slug: "poli-saraf", description: "Lantai 3 Sayap Barat - Ruang 305", locationNote: "Gedung A, Lt 3", queuePrefix: "D" },
    { specializationId: insertedSpecs[4].id, name: "Poli Orthopedi & Traumatologi", slug: "poli-orthopedi", description: "Lantai 1 Dekat Ruang Radiologi & Fisioterapi", locationNote: "Gedung A, Lt 1", queuePrefix: "E" },
    { specializationId: insertedSpecs[5].id, name: "Poli Mata", slug: "poli-mata", description: "Lantai 3 Sayap Timur - Ruang Refraksi", locationNote: "Gedung B, Lt 3", queuePrefix: "F" },
  ];
  const insertedPolys = await db.insert(polyclinics).values(polyclinicsData).returning();

  // 5. DOCTORS
  const doctorsData = [
    {
      userId: insertedUsers[2].id, // Sarah
      specializationId: insertedSpecs[0].id,
      polyclinicId: insertedPolys[0].id,
      name: "dr. Sarah Wijaya, Sp.PD",
      slug: "dr-sarah-wijaya-sppd",
      titlePrefix: "dr.",
      titleSuffix: "Sp.PD",
      strNumber: "STR-3174-8899210-2026",
      sipNumber: "SIP-503/442/DPMPTSP/2026",
      photoPath: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=500&auto=format&fit=crop&q=80",
      bio: "Spesialis Penyakit Dalam lulusan FK UI dengan pengalaman lebih dari 10 tahun menangani diabetes, hipertensi kompleks, dan gangguan metabolik.",
      education: ["S1 Kedokteran Umum - Universitas Indonesia", "Spesialis Penyakit Dalam - Universitas Indonesia", "Fellowship Endokrinologi & Diabetes - SingHealth Singapore"],
      experienceYears: 11,
      consultationFee: "275000",
      rating: "4.95",
      reviewsCount: 248,
    },
    {
      userId: insertedUsers[3].id, // Dimas
      specializationId: insertedSpecs[1].id,
      polyclinicId: insertedPolys[1].id,
      name: "dr. Dimas Wicaksono, Sp.JP(K), FIHA",
      slug: "dr-dimas-wicaksono-spjpk",
      titlePrefix: "dr.",
      titleSuffix: "Sp.JP(K), FIHA",
      strNumber: "STR-3174-7722119-2026",
      sipNumber: "SIP-503/445/DPMPTSP/2026",
      photoPath: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=500&auto=format&fit=crop&q=80",
      bio: "Konsultan Kardiologi Intervensi dengan keahlian pemasangan stent jantung (PCI), katerisasi, dan penanganan penyakit jantung koroner akut.",
      education: ["S1 Kedokteran - Universitas Airlangga", "Spesialis Jantung & Pembuluh Darah - Universitas Airlangga", "Subspesialis Intervensi Kardiovaskular - National Heart Centre"],
      experienceYears: 14,
      consultationFee: "350000",
      rating: "4.98",
      reviewsCount: 312,
    },
    {
      userId: insertedUsers[4].id, // Amanda
      specializationId: insertedSpecs[2].id,
      polyclinicId: insertedPolys[2].id,
      name: "dr. Amanda Kartika, Sp.A",
      slug: "dr-amanda-kartika-spa",
      titlePrefix: "dr.",
      titleSuffix: "Sp.A",
      strNumber: "STR-3174-6633445-2026",
      sipNumber: "SIP-503/448/DPMPTSP/2026",
      photoPath: "https://images.unsplash.com/photo-1594824813570-5882650f0c03?w=500&auto=format&fit=crop&q=80",
      bio: "Spesialis Anak ramah dan berpengalaman dalam memantau tumbuh kembang anak, vaksinasi lengkap, serta infeksi tropis pediatrik.",
      education: ["S1 Kedokteran - Universitas Gadjah Mada", "Spesialis Ilmu Kesehatan Anak - Universitas Gadjah Mada"],
      experienceYears: 8,
      consultationFee: "250000",
      rating: "4.92",
      reviewsCount: 185,
    },
    {
      userId: insertedUsers[5].id, // Reza
      specializationId: insertedSpecs[3].id,
      polyclinicId: insertedPolys[3].id,
      name: "dr. Reza Pratama, Sp.N, FINS",
      slug: "dr-reza-pratama-spn",
      titlePrefix: "dr.",
      titleSuffix: "Sp.N, FINS",
      strNumber: "STR-3174-5544332-2026",
      sipNumber: "SIP-503/450/DPMPTSP/2026",
      photoPath: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=500&auto=format&fit=crop&q=80",
      bio: "Spesialis Neurologi dengan fokus pada tatalaksana Stroke Center, sakit kepala kronis/migrain, saraf kejepit, dan gangguan neuromuskular.",
      education: ["S1 Kedokteran - Universitas Padjadjaran", "Spesialis Neurologi - Universitas Padjadjaran"],
      experienceYears: 9,
      consultationFee: "280000",
      rating: "4.89",
      reviewsCount: 142,
    },
  ];
  const insertedDoctors = await db.insert(doctors).values(doctorsData).returning();

  // 6. DOCTOR SCHEDULES (Days: 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat)
  const schedulesData = [];
  for (const doc of insertedDoctors) {
    schedulesData.push(
      { doctorId: doc.id, polyclinicId: doc.polyclinicId, dayOfWeek: 1, startTime: "08:00", endTime: "12:00", slotDurationMinutes: 30, slotCapacity: 1 },
      { doctorId: doc.id, polyclinicId: doc.polyclinicId, dayOfWeek: 2, startTime: "09:00", endTime: "13:00", slotDurationMinutes: 30, slotCapacity: 1 },
      { doctorId: doc.id, polyclinicId: doc.polyclinicId, dayOfWeek: 3, startTime: "08:00", endTime: "12:00", slotDurationMinutes: 30, slotCapacity: 1 },
      { doctorId: doc.id, polyclinicId: doc.polyclinicId, dayOfWeek: 4, startTime: "13:00", endTime: "17:00", slotDurationMinutes: 30, slotCapacity: 1 },
      { doctorId: doc.id, polyclinicId: doc.polyclinicId, dayOfWeek: 5, startTime: "08:00", endTime: "12:00", slotDurationMinutes: 30, slotCapacity: 1 },
      { doctorId: doc.id, polyclinicId: doc.polyclinicId, dayOfWeek: 6, startTime: "09:00", endTime: "13:00", slotDurationMinutes: 30, slotCapacity: 1 },
    );
  }
  const insertedSchedules = await db.insert(doctorSchedules).values(schedulesData).returning();

  // 7. PATIENTS
  const patientsData = [
    {
      userId: insertedUsers[10].id, // Budi Santoso
      medicalRecordNumber: "RM-202610-001",
      nik: "3174051203890001",
      nikHash: "hash_3174051203890001",
      fullName: "Budi Santoso",
      birthDate: "1989-03-12",
      gender: "L",
      bloodType: "O+",
      phone: "081288990011",
      address: "Jl. Dahlia No. 42, Kebayoran Baru",
      city: "Jakarta Selatan",
      emergencyContactName: "Dewi Lestari (Istri)",
      emergencyContactPhone: "081288990099",
      emergencyContactRelation: "Istri",
      allergiesSummary: "Penisilin, Amoxicillin",
      bpjsNumber: "0001234567891",
      consentAt: new Date(),
    },
    {
      userId: null,
      medicalRecordNumber: "RM-202610-002",
      nik: "3273014508920003",
      nikHash: "hash_3273014508920003",
      fullName: "Ratna Kusuma",
      birthDate: "1992-08-15",
      gender: "P",
      bloodType: "A+",
      phone: "081399887766",
      address: "Jl. Teratai No. 15, Menteng",
      city: "Jakarta Pusat",
      emergencyContactName: "Gunawan Kusuma (Suami)",
      emergencyContactPhone: "081399887700",
      emergencyContactRelation: "Suami",
      allergiesSummary: "Tidak ada riwayat alergi",
      bpjsNumber: "0001234567892",
      consentAt: new Date(),
    },
    {
      userId: null,
      medicalRecordNumber: "RM-202610-003",
      nik: "3172021104800005",
      nikHash: "hash_3172021104800005",
      fullName: "Ahmad Fauzi",
      birthDate: "1980-04-11",
      gender: "L",
      bloodType: "B+",
      phone: "081277665544",
      address: "Jl. Mawar Indah Blok C3, Cilandak",
      city: "Jakarta Selatan",
      emergencyContactName: "Nurul Hidayah",
      emergencyContactPhone: "081277665500",
      emergencyContactRelation: "Istri",
      allergiesSummary: "Seafood, Kerang",
      bpjsNumber: "0001234567893",
      consentAt: new Date(),
    },
    {
      userId: null,
      medicalRecordNumber: "RM-202610-004",
      nik: "3578016709950002",
      nikHash: "hash_3578016709950002",
      fullName: "Dewi Sartika",
      birthDate: "1995-09-27",
      gender: "P",
      bloodType: "AB+",
      phone: "081355443322",
      address: "Jl. Anggrek No. 8, Setiabudi",
      city: "Jakarta Selatan",
      emergencyContactName: "Bambang Sudiro",
      emergencyContactPhone: "081355443300",
      emergencyContactRelation: "Ayah",
      allergiesSummary: "Aspirin, NSAID",
      bpjsNumber: null,
      consentAt: new Date(),
    },
  ];
  const insertedPatients = await db.insert(patients).values(patientsData).returning();

  // 8. MEDICINES & STOCK
  const medicinesData = [
    { sku: "MED-001", name: "Amlodipine 10mg", genericName: "Amlodipine Besylate", form: "Tablet", strength: "10mg", unit: "Strip (10 Tab)", price: "28000", currentStock: 450, minStock: 50 },
    { sku: "MED-002", name: "Metformin HCl 500mg", genericName: "Metformin HCl", form: "Tablet", strength: "500mg", unit: "Strip (10 Tab)", price: "18500", currentStock: 620, minStock: 60 },
    { sku: "MED-003", name: "Lansoprazole 30mg", genericName: "Lansoprazole", form: "Kapsul", strength: "30mg", unit: "Strip (10 Kap)", price: "35000", currentStock: 310, minStock: 40 },
    { sku: "MED-004", name: "Paracetamol 500mg", genericName: "Paracetamol", form: "Tablet", strength: "500mg", unit: "Strip (10 Tab)", price: "12000", currentStock: 800, minStock: 100 },
    { sku: "MED-005", name: "Atorvastatin 20mg", genericName: "Atorvastatin Calcium", form: "Tablet", strength: "20mg", unit: "Strip (10 Tab)", price: "68000", currentStock: 180, minStock: 30 },
    { sku: "MED-006", name: "Cefixime 200mg", genericName: "Cefixime Trihydrate", form: "Kapsul", strength: "200mg", unit: "Strip (10 Kap)", price: "85000", currentStock: 140, minStock: 25 },
    { sku: "MED-007", name: "Bisoprolol 5mg", genericName: "Bisoprolol Fumarate", form: "Tablet", strength: "5mg", unit: "Strip (10 Tab)", price: "45000", currentStock: 220, minStock: 35 },
    { sku: "MED-008", name: "Salbutamol Inhaler 100mcg", genericName: "Salbutamol", form: "Inhaler", strength: "100mcg / puff", unit: "Canister 200 puffs", price: "92000", currentStock: 65, minStock: 15 },
  ];
  const insertedMeds = await db.insert(medicines).values(medicinesData).returning();

  for (const med of insertedMeds) {
    await db.insert(medicineStocks).values({
      medicineId: med.id,
      batchNumber: `BATCH-2026-${med.id}01`,
      expiryDate: "2027-12-31",
      movementType: "in",
      quantity: med.currentStock,
      balanceAfter: med.currentStock,
      notes: "Stok Awal Batch Farmasi 2026",
    });
  }

  // 9. LAB TEST TYPES
  const labTypesData = [
    { code: "LAB-CBC", name: "Darah Lengkap (CBC + Hitung Jenis)", category: "Hematologi", unit: "Panel", refText: "Hb: 12-16 g/dL, Leu: 4.0-10.0 x10^3/uL, Plt: 150-450 x10^3/uL", price: "145000" },
    { code: "LAB-GDP", name: "Gula Darah Puasa (GDP)", category: "Kimia Darah", unit: "mg/dL", refMin: "70.00", refMax: "100.00", refText: "70 - 100 mg/dL", price: "45000" },
    { code: "LAB-HBA1C", name: "HbA1c (Hemoglobin Terglikasi)", category: "Kimia Darah", unit: "%", refMin: "4.00", refMax: "5.70", refText: "< 5.7% (Normal), 5.7-6.4% (Prediabetes), >= 6.5% (Diabetes)", price: "195000" },
    { code: "LAB-LIPID", name: "Profil Lipid Lengkap (Kolesterol, HDL, LDL, TG)", category: "Kimia Darah", unit: "Panel", refText: "Kol. Total < 200 mg/dL, LDL < 100 mg/dL, HDL > 40 mg/dL, TG < 150 mg/dL", price: "240000" },
    { code: "LAB-RENAL", name: "Fungsi Ginjal (Ureum & Kreatinin Serum)", category: "Kimia Darah", unit: "Panel", refText: "Ureum: 15-45 mg/dL, Kreatinin: 0.6-1.2 mg/dL, eGFR > 90", price: "110000" },
    { code: "LAB-LIVER", name: "Fungsi Hati (SGOT / SGPT / Bilirubin)", category: "Kimia Darah", unit: "Panel", refText: "SGOT: < 35 U/L, SGPT: < 45 U/L", price: "125000" },
  ];
  const insertedLabTypes = await db.insert(labTestTypes).values(labTypesData).returning();

  // 10. ROOMS & BEDS (RAWAT INAP)
  const roomsData = [
    { code: "VIP-301", name: "Paviliun VVIP Cendana 301", roomClass: "vvip", floor: 3, dailyRate: "1850000" },
    { code: "VIP-302", name: "Paviliun VIP Kenanga 302", roomClass: "vip", floor: 3, dailyRate: "1250000" },
    { code: "KL1-201", name: "Ruang Kelas 1 Flamboyan 201", roomClass: "class_1", floor: 2, dailyRate: "750000" },
    { code: "KL2-202", name: "Ruang Kelas 2 Melati 202", roomClass: "class_2", floor: 2, dailyRate: "450000" },
    { code: "ICU-101", name: "Intensive Care Unit (ICU Bed 01)", roomClass: "icu", floor: 1, dailyRate: "2500000" },
  ];
  const insertedRooms = await db.insert(rooms).values(roomsData).returning();

  const bedsData = [
    { roomId: insertedRooms[0].id, bedNumber: "Bed 1", status: "available" },
    { roomId: insertedRooms[1].id, bedNumber: "Bed 1", status: "occupied" },
    { roomId: insertedRooms[2].id, bedNumber: "Bed A", status: "available" },
    { roomId: insertedRooms[2].id, bedNumber: "Bed B", status: "occupied" },
    { roomId: insertedRooms[3].id, bedNumber: "Bed 1", status: "available" },
    { roomId: insertedRooms[3].id, bedNumber: "Bed 2", status: "available" },
    { roomId: insertedRooms[4].id, bedNumber: "Bed ICU-1", status: "available" },
  ];
  const insertedBeds = await db.insert(beds).values(bedsData).returning();

  // Inpatient admission for Bed 2
  await db.insert(inpatients).values({
    admissionCode: "ADM-202610-001",
    patientId: insertedPatients[1].id, // Ratna Kusuma
    bedId: insertedBeds[1].id,
    doctorId: insertedDoctors[0].id,
    admissionSource: "poli",
    initialDiagnosis: "Observasi Febris H-4 e.c Suspek DHF Derajat II",
    status: "admitted",
  });

  // 11. TODAY APPOINTMENTS & QUEUES
  const today = new Date();
  const todayDateStr = today.toISOString().split("T")[0];

  // Appointment 1 for Budi Santoso (Patient login demo)
  const apt1 = await db.insert(appointments).values({
    appointmentCode: "APT-20261007-0012",
    patientId: insertedPatients[0].id,
    doctorId: insertedDoctors[0].id, // dr. Sarah
    polyclinicId: insertedPolys[0].id,
    doctorScheduleId: insertedSchedules[0].id,
    scheduledAt: new Date(new Date().setHours(10, 0, 0, 0)),
    durationMinutes: 30,
    slotKey: `${insertedDoctors[0].id}_${todayDateStr}_1000`,
    status: "confirmed",
    source: "ai",
    complaint: "Pusing berputar, tengkuk terasa berat, dan tekanan darah sempat 150/95 saat cek mandiri di rumah.",
    queueNumber: "A-014",
    reminderSentAt: new Date(),
  }).returning();

  await db.insert(queues).values({
    appointmentId: apt1[0].id,
    polyclinicId: insertedPolys[0].id,
    doctorId: insertedDoctors[0].id,
    queueDate: todayDateStr,
    queueNumber: 14,
    queueCode: "A-014",
    status: "waiting",
    estimatedWaitMinutes: 15,
  });

  await db.insert(appointmentReminders).values({
    appointmentId: apt1[0].id,
    type: "h_minus_2_hours",
    scheduledFor: new Date(),
    status: "sent",
    sentAt: new Date(),
  });

  // Appointment 2 for Ahmad Fauzi (Dr. Dimas, Jantung)
  const apt2 = await db.insert(appointments).values({
    appointmentCode: "APT-20261007-0008",
    patientId: insertedPatients[2].id,
    doctorId: insertedDoctors[1].id, // dr. Dimas
    polyclinicId: insertedPolys[1].id,
    scheduledAt: new Date(new Date().setHours(9, 30, 0, 0)),
    durationMinutes: 30,
    slotKey: `${insertedDoctors[1].id}_${todayDateStr}_0930`,
    status: "in_progress",
    source: "web",
    complaint: "Dada terasa berdebar saat berolahraga ringan, ada riwayat hipertensi 3 tahun.",
    queueNumber: "B-008",
  }).returning();

  await db.insert(queues).values({
    appointmentId: apt2[0].id,
    polyclinicId: insertedPolys[1].id,
    doctorId: insertedDoctors[1].id,
    queueDate: todayDateStr,
    queueNumber: 8,
    queueCode: "B-008",
    status: "serving",
    servingAt: new Date(),
    handledBy: insertedUsers[6].id, // Siti (Nurse)
  });

  // 12. CLINICAL RECORDS (PAST EMR FOR BUDI SANTOSO)
  const pastRecord = await db.insert(medicalRecords).values({
    recordNumber: "EMR-20260915-0042",
    patientId: insertedPatients[0].id,
    doctorId: insertedDoctors[0].id,
    visitDate: "2026-09-15",
    visitType: "outpatient",
    complaint: "Kontrol rutin tekanan darah dan kadar gula darah 3 bulanan.",
    medicalHistory: "Hipertensi Stage 1 sejak 2024, DM Tipe 2 terkontrol diet.",
    allergyNotes: "Alergi obat golongan Penisilin (urtikaria & pruritus).",
    physicalExamNotes: "KU: Baik, CM. Cor/Pulmo: Normal. Abdomen: Supel, BU (+) Normal. Ekstremitas: Edema (-/-).",
    doctorNotes: "Target TD < 130/80 mmHg. Teruskan Amlodipine 10mg 1x1 pagi, olahraga teratur 30 menit 3x seminggu.",
    status: "final",
    finalizedAt: new Date("2026-09-15T11:30:00Z"),
    finalizedBy: insertedUsers[2].id,
  }).returning();

  // Details
  await db.insert(medicalRecordDetails).values([
    { medicalRecordId: pastRecord[0].id, type: "diagnosis", code: "I10", description: "Essential (primary) hypertension - Stage 1", isPrimary: true },
    { medicalRecordId: pastRecord[0].id, type: "diagnosis", code: "E11.9", description: "Type 2 diabetes mellitus without complications", isPrimary: false },
    { medicalRecordId: pastRecord[0].id, type: "treatment", code: "90.59", description: "Pemeriksaan gula darah puasa & edukasi gaya hidup sehat", isPrimary: false },
  ]);

  // Past Vital Signs
  await db.insert(vitalSigns).values([
    {
      patientId: insertedPatients[0].id,
      medicalRecordId: pastRecord[0].id,
      recordedBy: insertedUsers[6].id, // Siti
      systolic: 138,
      diastolic: 88,
      heartRate: 78,
      respiratoryRate: 18,
      temperature: "36.6",
      spo2: 99,
      weightKg: "72.50",
      heightCm: "172.00",
      bmi: "24.5",
      notes: "Pasien tenang, post istirahat 10 menit sebelum pengukuran.",
      recordedAt: new Date("2026-09-15T09:15:00Z"),
    },
    // Vital signs recorded today by triage nurse
    {
      patientId: insertedPatients[0].id,
      appointmentId: apt1[0].id,
      recordedBy: insertedUsers[6].id,
      systolic: 142,
      diastolic: 92,
      heartRate: 82,
      respiratoryRate: 18,
      temperature: "36.7",
      spo2: 98,
      weightKg: "73.00",
      heightCm: "172.00",
      bmi: "24.7",
      notes: "Triage Poli Penyakit Dalam: Pasien sedikit cemas mengeluhkan pusing.",
      recordedAt: new Date(),
    }
  ]);

  // Past Prescription
  const pastPrescription = await db.insert(prescriptions).values({
    prescriptionCode: "RX-20260915-0038",
    medicalRecordId: pastRecord[0].id,
    patientId: insertedPatients[0].id,
    doctorId: insertedDoctors[0].id,
    status: "completed",
    notes: "Minum teratur setelah sarapan.",
    processedBy: insertedUsers[7].id, // Hendra (Pharmacy)
    readyAt: new Date("2026-09-15T11:45:00Z"),
    completedAt: new Date("2026-09-15T12:00:00Z"),
  }).returning();

  await db.insert(prescriptionItems).values([
    { prescriptionId: pastPrescription[0].id, medicineId: insertedMeds[0].id, dose: "1 tablet (10mg)", frequency: "1x sehari pagi", durationDays: 30, quantity: 30, instructions: "Sesudah makan pagi", dispensedQuantity: 30 },
    { prescriptionId: pastPrescription[0].id, medicineId: insertedMeds[1].id, dose: "1 tablet (500mg)", frequency: "2x sehari", durationDays: 30, quantity: 60, instructions: "Bersama makanan / sesudah makan", dispensedQuantity: 60 },
  ]);

  // Past Lab Order & Results
  const pastLabOrder = await db.insert(labOrders).values({
    orderCode: "LAB-20260915-0019",
    patientId: insertedPatients[0].id,
    medicalRecordId: pastRecord[0].id,
    orderedBy: insertedDoctors[0].id,
    status: "completed",
    priority: "routine",
    notes: "Evaluasi kontrol DM & Profil Lemak",
    processedBy: insertedUsers[8].id, // Maya (Lab)
    completedAt: new Date("2026-09-15T14:30:00Z"),
    releasedToPatientAt: new Date("2026-09-15T14:40:00Z"),
  }).returning();

  await db.insert(labResults).values([
    { labOrderId: pastLabOrder[0].id, labTestTypeId: insertedLabTypes[1].id, value: "98", unit: "mg/dL", referenceRange: "70 - 100 mg/dL", flag: "normal", notes: "Kadar gula darah puasa dalam rentang optimal.", verifiedBy: insertedUsers[8].id, verifiedAt: new Date("2026-09-15T14:30:00Z") },
    { labOrderId: pastLabOrder[0].id, labTestTypeId: insertedLabTypes[2].id, value: "5.6", unit: "%", referenceRange: "< 5.7%", flag: "normal", notes: "Kontrol glikemik baik.", verifiedBy: insertedUsers[8].id, verifiedAt: new Date("2026-09-15T14:30:00Z") },
    { labOrderId: pastLabOrder[0].id, labTestTypeId: insertedLabTypes[3].id, value: "192", unit: "mg/dL", referenceRange: "< 200 mg/dL", flag: "normal", notes: "Kolesterol total batas aman.", verifiedBy: insertedUsers[8].id, verifiedAt: new Date("2026-09-15T14:30:00Z") },
  ]);

  // Invoices
  const pastInvoice = await db.insert(invoices).values({
    invoiceNumber: "INV-20260915-0088",
    patientId: insertedPatients[0].id,
    appointmentId: null,
    subtotal: "565000",
    discount: "0",
    tax: "0",
    total: "565000",
    status: "paid",
    issuedAt: new Date("2026-09-15T12:05:00Z"),
    paidAt: new Date("2026-09-15T12:15:00Z"),
    createdBy: insertedUsers[9].id, // Rian (Cashier)
  }).returning();

  await db.insert(invoiceItems).values([
    { invoiceId: pastInvoice[0].id, itemType: "consultation", description: "Jasa Konsultasi dr. Sarah Wijaya, Sp.PD", quantity: 1, unitPrice: "275000", subtotal: "275000" },
    { invoiceId: pastInvoice[0].id, itemType: "medicine", description: "Amlodipine 10mg & Metformin 500mg (1 Bulan)", quantity: 1, unitPrice: "145000", subtotal: "145000" },
    { invoiceId: pastInvoice[0].id, itemType: "lab", description: "Paket Lab Evaluasi Gula & Lipid", quantity: 1, unitPrice: "145000", subtotal: "145000" },
  ]);

  await db.insert(payments).values({
    invoiceId: pastInvoice[0].id,
    paymentCode: "PAY-20260915-0051",
    method: "qris",
    amount: "565000",
    status: "success",
    gatewayReference: "QRIS_NMD_9981240182",
    idempotencyKey: "idem_inv_0088_qris",
    paidAt: new Date("2026-09-15T12:15:00Z"),
    receivedBy: insertedUsers[9].id,
  });

  // 13. SERVICES
  const servicesData = [
    { name: "Poli Rawat Jalan Eksekutif", slug: "poli-eksekutif", type: "poli", description: "Layanan konsultasi spesialis lengkap dengan ruang tunggu premium, sistem janji temu tepat waktu, dan kenyamanan maksimal.", icon: "Building", imagePath: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=80", sortOrder: 1 },
    { name: "Cath Lab & Pusat Jantung Terpadu", slug: "cath-lab-jantung", type: "unggulan", description: "Laboratorium katerisasi jantung berstandar internasional dengan tindakan diagnostik dan intervensi koroner 24 jam nonstop.", icon: "HeartPulse", imagePath: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&auto=format&fit=crop&q=80", sortOrder: 2 },
    { name: "IGD & Trauma Center 24 Jam", slug: "igd-trauma-center", type: "igd", description: "Layanan gawat darurat siaga 24/7 didukung dokter spesialis emergensi, ambulans respons cepat, dan ruang resusitasi modern.", icon: "Ambulance", imagePath: "https://images.unsplash.com/photo-1587745416684-47953f16f02f?w=800&auto=format&fit=crop&q=80", sortOrder: 3 },
    { name: "Radiologi & MRI 3 Tesla Digital", slug: "radiologi-mri", type: "penunjang", description: "Pemeriksaan imaging presisi tinggi: MRI 3.0T Silent Scan, CT-Scan 512 Slices Flash, USG 4D Doppler, dan Digital X-Ray.", icon: "Activity", imagePath: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&auto=format&fit=crop&q=80", sortOrder: 4 },
    { name: "Laboratorium Patologi & PCR Terpadu", slug: "laboratorium-terpadu", type: "penunjang", description: "Pemeriksaan hematologi, kimia darah, imunologi, biomarker jantung, dan mikrobiologi dengan hasil cepat dan akurat.", icon: "FlaskConical", imagePath: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=800&auto=format&fit=crop&q=80", sortOrder: 5 },
    { name: "Farmasi Klinis & Drive-Thru 24 Jam", slug: "farmasi-24jam", type: "penunjang", description: "Pelayanan resep elektronik cepat, konseling obat oleh apoteker tersertifikasi, dan layanan antar obat ke rumah.", icon: "Pill", imagePath: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=80", sortOrder: 6 },
  ];
  await db.insert(services).values(servicesData);

  // 14. ARTICLES
  const articlesData = [
    {
      authorId: insertedUsers[2].id, // dr. Sarah
      title: "Mengenal Gejala Awal Diabetes Mellitus dan Cara Pencegahannya",
      slug: "mengenal-gejala-awal-diabetes-mellitus",
      excerpt: "Sering haus, mudah lelah, dan sering buang air kecil di malam hari? Kenali tanda 3P diabetes dan langkah deteksi dini.",
      content: "Diabetes Mellitus sering dijuluki 'The Silent Killer' karena perkembangannya yang lambat dan kerap tanpa keluhan yang dirasakan berat oleh pasien. Gejala klasik yang dikenal sebagai 3P meliputi: Polidipsia (sering merasa haus berlebih), Polifagia (nafsu makan meningkat namun berat badan bisa turun), dan Poliuria (sering buang air kecil terutama di malam hari). Deteksi dini melalui pemeriksaan Gula Darah Puasa (GDP) dan HbA1c minimal 6 bulan sekali sangat disarankan terutama bagi mereka yang memiliki riwayat keluarga atau gaya hidup sedentari.",
      category: "Penyakit Dalam",
      readTimeMinutes: 4,
      coverPath: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&auto=format&fit=crop&q=80",
    },
    {
      authorId: insertedUsers[3].id, // dr. Dimas
      title: "Waspada Nyeri Dada: Kapan Harus Segera ke IGD?",
      slug: "waspada-nyeri-dada-kapan-ke-igd",
      excerpt: "Nyeri dada seperti tertindih beban berat yang menjalar ke lengan kiri atau leher adalah tanda kegawatan jantung (Serangan Jantung Akut).",
      content: "Serangan jantung terjadi saat aliran darah menuju otot jantung tersumbat secara tiba-tiba. Waktu emas (Golden Period) penanganan adalah dalam kurun waktu 90 menit pertama sejak keluhan dirasakan. Jika Anda atau keluarga merasakan nyeri dada hebat, sesak napas, keringat dingin, atau rasa tercekik yang tidak membaik dengan istirahat, JANGAN tunda untuk segera menghubungi hotline IGD 24 Jam HealthHub di 021-555-0119.",
      category: "Jantung & Kardiovaskular",
      readTimeMinutes: 5,
      coverPath: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&auto=format&fit=crop&q=80",
    },
    {
      authorId: insertedUsers[4].id, // dr. Amanda
      title: "Panduan Lengkap Jadwal Imunisasi Anak Usia 0-2 Tahun",
      slug: "panduan-jadwal-imunisasi-anak",
      excerpt: "Pastikan si kecil mendapatkan perlindungan optimal dari berbagai penyakit infeksi berbahaya sesuai jadwal IDAI terbaru.",
      content: "Imunisasi adalah investasi kesehatan terbaik bagi masa depan buah hati Anda. Mulai dari vaksin Hepatitis B saat lahir, BCG, Polio, DPT-Hib-HepB, hingga vaksin MR/MMR dan PCV, pemberian tepat waktu membantu membentuk kekebalan kelompok (herd immunity) dan mencegah komplikasi penyakit menular.",
      category: "Kesehatan Anak",
      readTimeMinutes: 6,
      coverPath: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=80",
    },
    {
      authorId: insertedUsers[5].id, // dr. Reza
      title: "Kenali Gejala Stroke dengan Metode FAST: Bertindak Cepat Selamatkan Otak",
      slug: "kenali-gejala-stroke-metode-fast",
      excerpt: "Face drooping, Arm weakness, Speech difficulty, Time to call emergency. Setiap detik menentukan pemulihan sel saraf otak.",
      content: "Metode FAST adalah cara termudah mengingat gejala stroke akut: F (Face: wajah mencong ke satu sisi), A (Arm: satu lengan atau tungkai lemas/lumpuh tiba-tiba), S (Speech: bicara pelo atau pelo mendadak tidak bisa mengerti ucapan), T (Time: segera hubungi IGD rumah sakit yang memiliki Stroke Unit).",
      category: "Saraf & Neurologi",
      readTimeMinutes: 5,
      coverPath: "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800&auto=format&fit=crop&q=80",
    },
  ];
  await db.insert(articles).values(articlesData);

  // 15. NOTIFICATIONS (FOR BUDI SANTOSO)
  await db.insert(notifications).values([
    {
      userId: insertedUsers[10].id,
      category: "appointment",
      title: "Pengingat Janji Temu Hari Ini (≤ 2 Jam)",
      message: "Janji temu Anda dengan dr. Sarah Wijaya, Sp.PD di Poli Penyakit Dalam dijadwalkan pukul 10:00 WIB. Nomor antrean Anda: A-014.",
      actionUrl: "/queue",
    },
    {
      userId: insertedUsers[10].id,
      category: "laboratory",
      title: "Hasil Laboratorium Telah Terbit",
      message: "Hasil pemeriksaan Darah Lengkap & Gula Darah Puasa kunjungan lalu telah diverifikasi analis dan dapat diunduh di portal Anda.",
      actionUrl: "/laboratory",
    },
    {
      userId: insertedUsers[10].id,
      category: "hospital_info",
      title: "Selamat Datang di HealthHub Digital Healthcare",
      message: "Akun Anda telah terverifikasi. Gunakan AI Health Assistant untuk bantuan triage gejala dan booking dokter lebih cepat.",
      actionUrl: "/ai-consultation",
    },
  ]);

  // 16. SETTINGS
  const settingsList = [
    { key: "hospital_name", value: "HealthHub General & Specialist Hospital", group: "general" },
    { key: "emergency_hotline", value: "021-555-0119", group: "emergency" },
    { key: "ambulance_hotline", value: "021-555-0118 / 119", group: "emergency" },
    { key: "hospital_address", value: "Jl. Sudirman Boulevard No. 88, Senayan, Jakarta Pusat 10270", group: "contact" },
    { key: "contact_email", value: "info@healthhub.id", group: "contact" },
    { key: "contact_phone", value: "(021) 555-0100", group: "contact" },
    { key: "operational_hours", value: "Poliklinik: Senin - Sabtu (08:00 - 20:00 WIB) | IGD & Farmasi: 24 Jam", group: "general" },
    { key: "accreditation", value: "Terakreditasi Paripurna KARS (Bintang 5) No. KARS-SERT/988/X/2025", group: "quality" },
    { key: "reminder_threshold_minutes", value: 120, group: "reminder" },
  ];
  for (const s of settingsList) {
    await db.insert(settings).values(s);
  }

  // 17. AUDIT LOGS
  await db.insert(auditLogs).values([
    {
      userId: insertedUsers[0].id,
      roleSnapshot: "super-admin",
      action: "SYSTEM_BOOTSTRAP",
      auditableType: "System",
      notes: "Inisialisasi sistem HealthHub Master Blueprint v1.0 dan master data klinis.",
    },
    {
      userId: insertedUsers[2].id,
      roleSnapshot: "doctor",
      action: "EMR_FINALIZED",
      auditableType: "MedicalRecord",
      auditableId: pastRecord[0].id,
      patientId: insertedPatients[0].id,
      notes: "dr. Sarah Wijaya menyelesaikan rekam medis EMR-20260915-0042 untuk Budi Santoso.",
    },
    {
      userId: insertedUsers[8].id,
      roleSnapshot: "lab",
      action: "LAB_RESULT_RELEASED",
      auditableType: "LabOrder",
      auditableId: pastLabOrder[0].id,
      patientId: insertedPatients[0].id,
      notes: "Maya Indah merilis hasil lab LAB-20260915-0019 ke pasien.",
    },
  ]);

  console.log("✅ HealthHub database seeding completed successfully!");
}
