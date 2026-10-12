import { pgTable, serial, text, timestamp, integer, boolean, numeric, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";

// ==========================================
// 1. IDENTITAS & AKSES (USERS & RBAC)
// ==========================================

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  password: text("password").notNull(),
  phone: text("phone"),
  avatarPath: text("avatar_path"),
  role: text("role").notNull().default("patient"), // super-admin, admin, doctor, nurse, pharmacist, lab, cashier, patient
  isActive: boolean("is_active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  lastLoginIp: text("last_login_ip"),
  rememberToken: text("remember_token"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => [
  index("users_email_idx").on(table.email),
  index("users_role_idx").on(table.role),
  index("users_is_active_idx").on(table.isActive),
]);

export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // super-admin, admin, doctor, nurse, pharmacist, lab, cashier, patient
  label: text("label").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // e.g. appointment.view, medical_record.view
  label: text("label").notNull(),
  group: text("group").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("permissions_group_idx").on(table.group),
]);

export const roleUsers = pgTable("role_users", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  roleId: integer("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const permissionRoles = pgTable("permission_roles", {
  id: serial("id").primaryKey(),
  permissionId: integer("permission_id").notNull().references(() => permissions.id, { onDelete: "cascade" }),
  roleId: integer("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ==========================================
// 2. PASIEN & MASTER KLINIS
// ==========================================

export const patients = pgTable("patients", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  medicalRecordNumber: text("medical_record_number").notNull().unique(), // RM-000123
  nik: text("nik").notNull(), // encrypted representation / masked in UI
  nikHash: text("nik_hash").notNull().unique(), // SHA-256 for fast indexed lookup
  fullName: text("full_name").notNull(),
  birthDate: text("birth_date").notNull(), // YYYY-MM-DD
  gender: text("gender").notNull(), // L (Laki-laki) / P (Perempuan)
  bloodType: text("blood_type"), // A+, B+, AB+, O+, A-, B-, AB-, O-
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactPhone: text("emergency_contact_phone"),
  emergencyContactRelation: text("emergency_contact_relation"),
  allergiesSummary: text("allergies_summary"), // e.g. Penisilin, Seafood
  bpjsNumber: text("bpjs_number"),
  consentAt: timestamp("consent_at", { withTimezone: true }),
  consentVersion: text("consent_version").default("v1.0-UU-PDP"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => [
  index("patients_full_name_idx").on(table.fullName),
  index("patients_phone_idx").on(table.phone),
  index("patients_nik_hash_idx").on(table.nikHash),
]);

export const specializations = pgTable("specializations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // e.g. Spesialis Penyakit Dalam, Jantung & Pembuluh Darah
  slug: text("slug").notNull().unique(),
  description: text("description"),
  icon: text("icon"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const polyclinics = pgTable("polyclinics", {
  id: serial("id").primaryKey(),
  specializationId: integer("specialization_id").references(() => specializations.id),
  name: text("name").notNull(), // e.g. Poli Penyakit Dalam
  slug: text("slug").notNull().unique(),
  description: text("description"),
  icon: text("icon"),
  locationNote: text("location_note"), // e.g. Lantai 2 Sayap Barat
  queuePrefix: text("queue_prefix").notNull().default("A"), // e.g. A, B, C
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => [
  index("polyclinics_slug_idx").on(table.slug),
  index("polyclinics_is_active_idx").on(table.isActive),
]);

export const doctors = pgTable("doctors", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  specializationId: integer("specialization_id").notNull().references(() => specializations.id),
  polyclinicId: integer("polyclinic_id").notNull().references(() => polyclinics.id),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  titlePrefix: text("title_prefix").default("dr."),
  titleSuffix: text("title_suffix"), // Sp.PD-KKV, Sp.JP, Sp.A, dll.
  strNumber: text("str_number").notNull().unique(),
  sipNumber: text("sip_number").notNull(),
  photoPath: text("photo_path"),
  bio: text("bio"),
  education: jsonb("education").$type<string[]>(),
  experienceYears: integer("experience_years").default(5),
  consultationFee: numeric("consultation_fee", { precision: 12, scale: 2 }).notNull().default("250000"),
  rating: numeric("rating", { precision: 3, scale: 2 }).default("4.9"),
  reviewsCount: integer("reviews_count").default(120),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => [
  index("doctors_specialization_idx").on(table.specializationId),
  index("doctors_polyclinic_idx").on(table.polyclinicId),
  index("doctors_is_active_idx").on(table.isActive),
]);

export const doctorSchedules = pgTable("doctor_schedules", {
  id: serial("id").primaryKey(),
  doctorId: integer("doctor_id").notNull().references(() => doctors.id, { onDelete: "cascade" }),
  polyclinicId: integer("polyclinic_id").notNull().references(() => polyclinics.id),
  dayOfWeek: integer("day_of_week").notNull(), // 1=Senin, 2=Selasa, ... 7=Minggu
  startTime: text("start_time").notNull(), // "08:00"
  endTime: text("end_time").notNull(), // "12:00"
  slotDurationMinutes: integer("slot_duration_minutes").notNull().default(30),
  slotCapacity: integer("slot_capacity").notNull().default(1),
  validFrom: text("valid_from").notNull().default("2026-01-01"),
  validUntil: text("valid_until"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("doctor_schedules_doc_day_idx").on(table.doctorId, table.dayOfWeek, table.isActive),
]);

export const doctorScheduleExceptions = pgTable("doctor_schedule_exceptions", {
  id: serial("id").primaryKey(),
  doctorId: integer("doctor_id").notNull().references(() => doctors.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // YYYY-MM-DD
  isOff: boolean("is_off").notNull().default(true),
  startTime: text("start_time"),
  endTime: text("end_time"),
  reason: text("reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  type: text("type").notNull(), // poli, penunjang, igd, rawat_inap, unggulan
  description: text("description").notNull(),
  facilitiesText: text("facilities_text"),
  polyclinicId: integer("polyclinic_id").references(() => polyclinics.id),
  icon: text("icon"),
  imagePath: text("image_path"),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ==========================================
// 3. APPOINTMENTS, ANTREAN, REMINDER
// ==========================================

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  appointmentCode: text("appointment_code").notNull().unique(), // APT-YYYYMMDD-NNNNN
  patientId: integer("patient_id").notNull().references(() => patients.id),
  doctorId: integer("doctor_id").notNull().references(() => doctors.id),
  polyclinicId: integer("polyclinic_id").notNull().references(() => polyclinics.id),
  doctorScheduleId: integer("doctor_schedule_id").references(() => doctorSchedules.id),
  aiConsultationId: integer("ai_consultation_id"),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  durationMinutes: integer("duration_minutes").default(30),
  slotKey: text("slot_key").notNull().unique(), // doc_id + "_" + YYYYMMDD_HHMM (Prevents Double Booking)
  status: text("status").notNull().default("confirmed"), // pending, confirmed, checked_in, in_progress, completed, cancelled, no_show
  source: text("source").notNull().default("web"), // web, ai, admin, walk_in
  complaint: text("complaint").notNull(),
  queueNumber: text("queue_number").notNull(), // Snapshot e.g. A-014
  reminderSentAt: timestamp("reminder_sent_at", { withTimezone: true }),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  cancelledBy: integer("cancelled_by").references(() => users.id),
  cancelReason: text("cancel_reason"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => [
  index("appointments_patient_sched_idx").on(table.patientId, table.scheduledAt),
  index("appointments_doc_sched_status_idx").on(table.doctorId, table.scheduledAt, table.status),
]);

export const appointmentReminders = pgTable("appointment_reminders", {
  id: serial("id").primaryKey(),
  appointmentId: integer("appointment_id").notNull().references(() => appointments.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // h_minus_1_day, h_minus_2_hours, h_minus_30_min, start
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }).notNull(),
  status: text("status").notNull().default("pending"), // pending, sent, failed, skipped
  attempts: integer("attempts").default(0),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  lastError: text("last_error"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("appointment_reminder_unique_idx").on(table.appointmentId, table.type),
  index("appointment_reminders_sched_idx").on(table.scheduledFor, table.status),
]);

export const queues = pgTable("queues", {
  id: serial("id").primaryKey(),
  appointmentId: integer("appointment_id").notNull().references(() => appointments.id, { onDelete: "cascade" }),
  polyclinicId: integer("polyclinic_id").notNull().references(() => polyclinics.id),
  doctorId: integer("doctor_id").notNull().references(() => doctors.id),
  queueDate: text("queue_date").notNull(), // YYYY-MM-DD
  queueNumber: integer("queue_number").notNull(),
  queueCode: text("queue_code").notNull(), // e.g. A-014
  status: text("status").notNull().default("waiting"), // waiting, called, serving, completed, cancelled, no_show
  calledAt: timestamp("called_at", { withTimezone: true }),
  servingAt: timestamp("serving_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  handledBy: integer("handled_by").references(() => users.id),
  estimatedWaitMinutes: integer("estimated_wait_minutes").default(15),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("queues_poly_date_num_unique").on(table.polyclinicId, table.queueDate, table.queueNumber),
  index("queues_date_status_idx").on(table.queueDate, table.status),
]);

// ==========================================
// 4. KLINIS (EMR, VITAL SIGN, RESEP, LAB)
// ==========================================

export const medicalRecords = pgTable("medical_records", {
  id: serial("id").primaryKey(),
  recordNumber: text("record_number").notNull().unique(), // EMR-YYYYMMDD-NNNN
  patientId: integer("patient_id").notNull().references(() => patients.id),
  appointmentId: integer("appointment_id").references(() => appointments.id),
  doctorId: integer("doctor_id").notNull().references(() => doctors.id),
  visitDate: text("visit_date").notNull(), // YYYY-MM-DD
  visitType: text("visit_type").notNull().default("outpatient"), // outpatient, inpatient, emergency
  complaint: text("complaint").notNull(),
  medicalHistory: text("medical_history"),
  allergyNotes: text("allergy_notes"),
  physicalExamNotes: text("physical_exam_notes"),
  doctorNotes: text("doctor_notes"),
  status: text("status").notNull().default("final"), // draft, final, amended
  finalizedAt: timestamp("finalized_at", { withTimezone: true }),
  finalizedBy: integer("finalized_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => [
  index("medical_records_patient_idx").on(table.patientId),
  index("medical_records_doctor_idx").on(table.doctorId),
  index("medical_records_visit_date_idx").on(table.visitDate),
]);

export const medicalRecordDetails = pgTable("medical_record_details", {
  id: serial("id").primaryKey(),
  medicalRecordId: integer("medical_record_id").notNull().references(() => medicalRecords.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // examination, diagnosis, treatment, doctor_note
  code: text("code"), // ICD-10 e.g. I10, E11.9 or ICD-9-CM
  description: text("description").notNull(),
  isPrimary: boolean("is_primary").default(false),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const vitalSigns = pgTable("vital_signs", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patients.id),
  appointmentId: integer("appointment_id").references(() => appointments.id),
  medicalRecordId: integer("medical_record_id").references(() => medicalRecords.id),
  recordedBy: integer("recorded_by").references(() => users.id),
  systolic: integer("systolic"), // mmHg
  diastolic: integer("diastolic"), // mmHg
  heartRate: integer("heart_rate"), // bpm
  respiratoryRate: integer("respiratory_rate"), // breaths/min
  temperature: numeric("temperature", { precision: 4, scale: 1 }), // Celcius e.g. 36.6
  spo2: integer("spo2"), // % e.g. 98
  weightKg: numeric("weight_kg", { precision: 5, scale: 2 }), // kg
  heightCm: numeric("height_cm", { precision: 5, scale: 2 }), // cm
  bmi: numeric("bmi", { precision: 4, scale: 1 }), // kg/m2
  notes: text("notes"),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("vital_signs_patient_idx").on(table.patientId),
  index("vital_signs_recorded_at_idx").on(table.recordedAt),
]);

export const medicines = pgTable("medicines", {
  id: serial("id").primaryKey(),
  sku: text("sku").notNull().unique(), // MED-001
  name: text("name").notNull(), // e.g. Amlodipine 10mg
  genericName: text("generic_name").notNull(),
  form: text("form").notNull(), // Tablet, Kapsul, Sirup, Injeksi, Salep
  strength: text("strength"), // 10mg, 500mg, 125mg/5ml
  unit: text("unit").notNull(), // Strip, Botol, Vial, Tube, Pcs
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  currentStock: integer("current_stock").notNull().default(0),
  minStock: integer("min_stock").notNull().default(10),
  requiresPrescription: boolean("requires_prescription").default(true),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => [
  index("medicines_name_idx").on(table.name),
  index("medicines_generic_name_idx").on(table.genericName),
]);

export const medicineStocks = pgTable("medicine_stocks", {
  id: serial("id").primaryKey(),
  medicineId: integer("medicine_id").notNull().references(() => medicines.id),
  batchNumber: text("batch_number").notNull(),
  expiryDate: text("expiry_date").notNull(), // YYYY-MM-DD
  movementType: text("movement_type").notNull(), // in, out, adjustment, dispense
  quantity: integer("quantity").notNull(), // Signed integer (+50 or -5)
  balanceAfter: integer("balance_after").notNull(),
  referenceType: text("reference_type"), // prescription_item, purchase, adjustment
  referenceId: integer("reference_id"),
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("medicine_stocks_med_idx").on(table.medicineId),
  index("medicine_stocks_expiry_idx").on(table.expiryDate),
]);

export const prescriptions = pgTable("prescriptions", {
  id: serial("id").primaryKey(),
  prescriptionCode: text("prescription_code").notNull().unique(), // RX-YYYYMMDD-NNNN
  medicalRecordId: integer("medical_record_id").references(() => medicalRecords.id),
  patientId: integer("patient_id").notNull().references(() => patients.id),
  doctorId: integer("doctor_id").notNull().references(() => doctors.id),
  status: text("status").notNull().default("pending"), // pending, processing, ready, completed, cancelled
  notes: text("notes"),
  processedBy: integer("processed_by").references(() => users.id),
  readyAt: timestamp("ready_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => [
  index("prescriptions_patient_idx").on(table.patientId),
  index("prescriptions_status_idx").on(table.status),
]);

export const prescriptionItems = pgTable("prescription_items", {
  id: serial("id").primaryKey(),
  prescriptionId: integer("prescription_id").notNull().references(() => prescriptions.id, { onDelete: "cascade" }),
  medicineId: integer("medicine_id").notNull().references(() => medicines.id),
  dose: text("dose").notNull(), // e.g. "1 tablet"
  frequency: text("frequency").notNull(), // e.g. "3x sehari"
  durationDays: integer("duration_days").default(5),
  quantity: integer("quantity").notNull(),
  instructions: text("instructions").notNull(), // "Sesudah makan"
  dispensedQuantity: integer("dispensed_quantity").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const labTestTypes = pgTable("lab_test_types", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // LAB-001
  name: text("name").notNull(), // Darah Lengkap, HbA1c, Profil Lipid
  category: text("category").notNull(), // Hematologi, Kimia Darah, Imunologi, Urinalisis
  unit: text("unit"), // g/dL, mg/dL, %, /uL
  refMin: numeric("ref_min", { precision: 8, scale: 2 }),
  refMax: numeric("ref_max", { precision: 8, scale: 2 }),
  refText: text("ref_text"), // e.g. "12.0 - 16.0 g/dL" or "Negatif"
  price: numeric("price", { precision: 12, scale: 2 }).notNull().default("150000"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const labOrders = pgTable("lab_orders", {
  id: serial("id").primaryKey(),
  orderCode: text("order_code").notNull().unique(), // LAB-YYYYMMDD-NNNN
  patientId: integer("patient_id").notNull().references(() => patients.id),
  medicalRecordId: integer("medical_record_id").references(() => medicalRecords.id),
  orderedBy: integer("ordered_by").notNull().references(() => doctors.id),
  status: text("status").notNull().default("requested"), // requested, processing, completed
  priority: text("priority").notNull().default("routine"), // routine, urgent
  notes: text("notes"),
  processedBy: integer("processed_by").references(() => users.id),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  releasedToPatientAt: timestamp("released_to_patient_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => [
  index("lab_orders_patient_idx").on(table.patientId),
  index("lab_orders_status_idx").on(table.status),
]);

export const labResults = pgTable("lab_results", {
  id: serial("id").primaryKey(),
  labOrderId: integer("lab_order_id").notNull().references(() => labOrders.id, { onDelete: "cascade" }),
  labTestTypeId: integer("lab_test_type_id").notNull().references(() => labTestTypes.id),
  value: text("value").notNull(), // "13.8", "110", "Negatif"
  unit: text("unit"),
  referenceRange: text("reference_range"),
  flag: text("flag").notNull().default("normal"), // normal, high, low, critical
  notes: text("notes"),
  verifiedBy: integer("verified_by").references(() => users.id),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ==========================================
// 5. RAWAT INAP (BED & INPATIENT MANAGEMENT)
// ==========================================

export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // e.g. R-301
  name: text("name").notNull(), // e.g. Paviliun Melati 301
  roomClass: text("room_class").notNull(), // vvip, vip, class_1, class_2, class_3, icu, nicu
  floor: integer("floor").notNull().default(3),
  dailyRate: numeric("daily_rate", { precision: 12, scale: 2 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const beds = pgTable("beds", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull().references(() => rooms.id, { onDelete: "cascade" }),
  bedNumber: text("bed_number").notNull(), // e.g. "A", "B", "1", "2"
  status: text("status").notNull().default("available"), // available, occupied, cleaning, maintenance
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("beds_room_num_unique").on(table.roomId, table.bedNumber),
  index("beds_status_idx").on(table.status),
]);

export const inpatients = pgTable("inpatients", {
  id: serial("id").primaryKey(),
  admissionCode: text("admission_code").notNull().unique(), // ADM-YYYYMMDD-NNNN
  patientId: integer("patient_id").notNull().references(() => patients.id),
  bedId: integer("bed_id").notNull().references(() => beds.id),
  doctorId: integer("doctor_id").notNull().references(() => doctors.id),
  admissionSource: text("admission_source").notNull().default("poli"), // igd, poli, direct
  initialDiagnosis: text("initial_diagnosis").notNull(),
  admittedAt: timestamp("admitted_at", { withTimezone: true }).defaultNow().notNull(),
  checkedOutAt: timestamp("checked_out_at", { withTimezone: true }),
  status: text("status").notNull().default("admitted"), // admitted, discharged, transferred
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => [
  index("inpatients_patient_idx").on(table.patientId),
  index("inpatients_bed_idx").on(table.bedId),
  index("inpatients_status_idx").on(table.status),
]);

export const inpatientTransfers = pgTable("inpatient_transfers", {
  id: serial("id").primaryKey(),
  inpatientId: integer("inpatient_id").notNull().references(() => inpatients.id, { onDelete: "cascade" }),
  fromBedId: integer("from_bed_id").notNull().references(() => beds.id),
  toBedId: integer("to_bed_id").notNull().references(() => beds.id),
  reason: text("reason").notNull(),
  transferredAt: timestamp("transferred_at", { withTimezone: true }).defaultNow().notNull(),
  transferredBy: integer("transferred_by").references(() => users.id),
});

// ==========================================
// 6. KEUANGAN & PEMBAYARAN (BILLING & CASHIER)
// ==========================================

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(), // INV-YYYYMMDD-NNNN
  patientId: integer("patient_id").notNull().references(() => patients.id),
  appointmentId: integer("appointment_id").references(() => appointments.id),
  inpatientId: integer("inpatient_id").references(() => inpatients.id),
  subtotal: numeric("subtotal", { precision: 14, scale: 2 }).notNull(),
  discount: numeric("discount", { precision: 14, scale: 2 }).default("0"),
  tax: numeric("tax", { precision: 14, scale: 2 }).default("0"),
  total: numeric("total", { precision: 14, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // pending, paid, cancelled
  issuedAt: timestamp("issued_at", { withTimezone: true }).defaultNow().notNull(),
  dueAt: timestamp("due_at", { withTimezone: true }),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  cancelledReason: text("cancelled_reason"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => [
  index("invoices_patient_idx").on(table.patientId),
  index("invoices_status_idx").on(table.status),
]);

export const invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull().references(() => invoices.id, { onDelete: "cascade" }),
  itemType: text("item_type").notNull(), // consultation, medicine, lab, room, procedure, other
  itemableType: text("itemable_type"),
  itemableId: integer("itemable_id"),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull().references(() => invoices.id),
  paymentCode: text("payment_code").notNull().unique(), // PAY-YYYYMMDD-NNNN
  method: text("method").notNull(), // cash, qris, transfer_va, debit_card, bpjs, mock
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  status: text("status").notNull().default("success"), // pending, success, failed, refunded
  gatewayReference: text("gateway_reference").unique(),
  idempotencyKey: text("idempotency_key").unique(),
  paidAt: timestamp("paid_at", { withTimezone: true }).defaultNow().notNull(),
  receivedBy: integer("received_by").references(() => users.id),
  gatewayPayload: jsonb("gateway_payload"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("payments_invoice_idx").on(table.invoiceId),
]);

// ==========================================
// 7. AI HEALTH ASSISTANT & TRIAGE
// ==========================================

export const aiConsultations = pgTable("ai_consultations", {
  id: serial("id").primaryKey(),
  consultationCode: text("consultation_code").notNull().unique(), // ULID
  userId: integer("user_id").references(() => users.id),
  patientId: integer("patient_id").references(() => patients.id),
  sessionTokenHash: text("session_token_hash"),
  status: text("status").notNull().default("active"), // active, completed, emergency, abandoned
  emergencyFlag: boolean("emergency_flag").notNull().default(false),
  emergencyReason: text("emergency_reason"),
  summary: text("summary"),
  provider: text("provider").default("HealthHub-Clinical-AI-v1"),
  modelVersion: text("model_version").default("triage-gpt-4o-med"),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  ipHash: text("ip_hash"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("ai_consultations_user_idx").on(table.userId),
  index("ai_consultations_emerg_idx").on(table.emergencyFlag),
]);

export const aiMessages = pgTable("ai_messages", {
  id: serial("id").primaryKey(),
  aiConsultationId: integer("ai_consultation_id").notNull().references(() => aiConsultations.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // user, assistant, system
  content: text("content").notNull(),
  extractedSymptoms: jsonb("extracted_symptoms").$type<string[]>(),
  safetyFlags: jsonb("safety_flags").$type<{ isEmergency: boolean; redFlags: string[] }>(),
  tokensUsed: integer("tokens_used").default(120),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const aiRecommendations = pgTable("ai_recommendations", {
  id: serial("id").primaryKey(),
  aiConsultationId: integer("ai_consultation_id").notNull().references(() => aiConsultations.id, { onDelete: "cascade" }),
  specializationId: integer("specialization_id").references(() => specializations.id),
  polyclinicId: integer("polyclinic_id").references(() => polyclinics.id),
  urgencyLevel: text("urgency_level").notNull().default("routine"), // emergency, urgent, routine
  reasoningSummary: text("reasoning_summary").notNull(),
  disclaimerShownAt: timestamp("disclaimer_shown_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const aiRecommendationDoctors = pgTable("ai_recommendation_doctors", {
  id: serial("id").primaryKey(),
  aiRecommendationId: integer("ai_recommendation_id").notNull().references(() => aiRecommendations.id, { onDelete: "cascade" }),
  doctorId: integer("doctor_id").notNull().references(() => doctors.id),
  rank: integer("rank").notNull().default(1),
  matchedSlotCount: integer("matched_slot_count").default(3),
});

// ==========================================
// 8. CMS & KONTEN PUBLIK
// ==========================================

export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  authorId: integer("author_id").references(() => users.id),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  coverPath: text("cover_path"),
  category: text("category").notNull(), // Jantung, Anak, Nutrisi, Penyakit Dalam, Tips Sehat
  status: text("status").notNull().default("published"), // draft, published
  readTimeMinutes: integer("read_time_minutes").default(4),
  publishedAt: timestamp("published_at", { withTimezone: true }).defaultNow(),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => [
  index("articles_category_idx").on(table.category),
  index("articles_published_idx").on(table.publishedAt),
]);

export const facilities = pgTable("facilities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  icon: text("icon"),
  imagePath: text("image_path"),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const galleries = pgTable("galleries", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  imagePath: text("image_path").notNull(),
  altText: text("alt_text").notNull(), // WCAG accessibility compliance
  category: text("category").notNull(), // Ruang Perawatan, Alat Medis, Gedung & Lobi, Layanan
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const banners = pgTable("banners", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  imagePath: text("image_path"),
  ctaLabel: text("cta_label"),
  ctaUrl: text("cta_url"),
  sortOrder: integer("sort_order").default(0),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  level: text("level").notNull().default("info"), // info, warning, emergency
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: jsonb("value").notNull(),
  group: text("group").notNull().default("general"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ==========================================
// 9. NOTIFIKASI & AUDIT LOG
// ==========================================

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  category: text("category").notNull(), // appointment, queue, registration, prescription, laboratory, payment, hospital_info
  title: text("title").notNull(),
  message: text("message").notNull(),
  actionUrl: text("action_url"),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("notifications_user_idx").on(table.userId),
  index("notifications_category_idx").on(table.category),
]);

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  roleSnapshot: text("role_snapshot").notNull(),
  action: text("action").notNull(), // e.g. "AUTH_LOGIN", "MEDICAL_RECORD_VIEW", "BREAK_GLASS_ACCESS", "PRESCRIPTION_DISPENSE", "PAYMENT_PROCESSED"
  auditableType: text("auditable_type").notNull(), // e.g. "MedicalRecord", "Patient", "Invoice"
  auditableId: integer("auditable_id"),
  patientId: integer("patient_id").references(() => patients.id), // For tracing who accessed patient X (UU PDP & Permenkes compliance)
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  url: text("url"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("audit_logs_user_idx").on(table.userId),
  index("audit_logs_action_idx").on(table.action),
  index("audit_logs_patient_idx").on(table.patientId),
  index("audit_logs_created_idx").on(table.createdAt),
]);
