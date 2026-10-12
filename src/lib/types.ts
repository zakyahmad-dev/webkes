export type UserRole =
  | "super-admin"
  | "admin"
  | "doctor"
  | "nurse"
  | "pharmacist"
  | "lab"
  | "cashier"
  | "patient";

export interface CurrentUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  phone?: string | null;
  avatarPath?: string | null;
  patientId?: number | null;
  doctorId?: number | null;
}

export interface DoctorWithDetails {
  id: number;
  userId?: number | null;
  name: string;
  slug: string;
  titlePrefix?: string | null;
  titleSuffix?: string | null;
  strNumber: string;
  sipNumber: string;
  photoPath?: string | null;
  bio?: string | null;
  education?: string[] | null;
  experienceYears?: number | null;
  consultationFee: string;
  rating?: string | null;
  reviewsCount?: number | null;
  isActive: boolean;
  specializationName?: string;
  specializationSlug?: string;
  polyclinicName?: string;
  polyclinicSlug?: string;
  polyclinicLocation?: string;
  queuePrefix?: string;
}

export interface PolyclinicWithDetails {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  locationNote?: string | null;
  queuePrefix: string;
  specializationId?: number | null;
  specializationName?: string;
  doctorsCount?: number;
}

export interface AppointmentDetail {
  id: number;
  appointmentCode: string;
  patientId: number;
  patientName: string;
  patientRm: string;
  patientPhone: string;
  doctorId: number;
  doctorName: string;
  doctorTitleSuffix?: string | null;
  doctorPhoto?: string | null;
  polyclinicId: number;
  polyclinicName: string;
  scheduledAt: string;
  durationMinutes: number;
  slotKey: string;
  status: "pending" | "confirmed" | "checked_in" | "in_progress" | "completed" | "cancelled" | "no_show";
  source: string;
  complaint: string;
  queueNumber: string;
  queueStatus?: string;
  reminderSentAt?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  createdAt: string;
}

export interface QueueItem {
  id: number;
  appointmentId: number;
  polyclinicId: number;
  polyclinicName: string;
  doctorId: number;
  doctorName: string;
  patientName: string;
  queueDate: string;
  queueNumber: number;
  queueCode: string;
  status: "waiting" | "called" | "serving" | "completed" | "cancelled" | "no_show";
  calledAt?: string | null;
  servingAt?: string | null;
  completedAt?: string | null;
  estimatedWaitMinutes?: number;
}

export interface VitalSignRecord {
  id: number;
  patientId: number;
  patientName?: string;
  appointmentId?: number | null;
  medicalRecordId?: number | null;
  recordedByName?: string;
  systolic?: number | null;
  diastolic?: number | null;
  heartRate?: number | null;
  respiratoryRate?: number | null;
  temperature?: string | null;
  spo2?: number | null;
  weightKg?: string | null;
  heightCm?: string | null;
  bmi?: string | null;
  notes?: string | null;
  recordedAt: string;
}

export interface MedicalRecordView {
  id: number;
  recordNumber: string;
  patientId: number;
  patientName: string;
  patientRm: string;
  patientAge?: number;
  patientGender?: string;
  doctorId: number;
  doctorName: string;
  visitDate: string;
  visitType: "outpatient" | "inpatient" | "emergency";
  complaint: string;
  medicalHistory?: string | null;
  allergyNotes?: string | null;
  physicalExamNotes?: string | null;
  doctorNotes?: string | null;
  status: "draft" | "final" | "amended";
  diagnoses: Array<{ code?: string | null; description: string; isPrimary?: boolean | null }>;
  treatments: Array<{ code?: string | null; description: string }>;
  vitalSigns?: VitalSignRecord | null;
  prescription?: PrescriptionView | null;
  labOrder?: LabOrderView | null;
  finalizedAt?: string | null;
}

export interface PrescriptionView {
  id: number;
  prescriptionCode: string;
  medicalRecordId?: number | null;
  patientId: number;
  patientName: string;
  patientRm: string;
  doctorName: string;
  status: "pending" | "processing" | "ready" | "completed" | "cancelled";
  notes?: string | null;
  items: Array<{
    id: number;
    medicineId: number;
    medicineName: string;
    form: string;
    dose: string;
    frequency: string;
    durationDays?: number | null;
    quantity: number;
    instructions: string;
    dispensedQuantity?: number | null;
    availableStock?: number;
    price?: string;
  }>;
  readyAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
}

export interface LabOrderView {
  id: number;
  orderCode: string;
  patientId: number;
  patientName: string;
  patientRm: string;
  doctorName: string;
  status: "requested" | "processing" | "completed";
  priority: "routine" | "urgent";
  notes?: string | null;
  results: Array<{
    id: number;
    testName: string;
    testCode: string;
    category: string;
    value: string;
    unit?: string | null;
    referenceRange?: string | null;
    flag: "normal" | "high" | "low" | "critical";
    notes?: string | null;
    verifiedByName?: string;
    verifiedAt?: string | null;
  }>;
  completedAt?: string | null;
  releasedToPatientAt?: string | null;
  createdAt: string;
}

export interface InpatientView {
  id: number;
  admissionCode: string;
  patientId: number;
  patientName: string;
  patientRm: string;
  roomCode: string;
  roomName: string;
  roomClass: string;
  floor: number;
  bedNumber: string;
  bedId: number;
  doctorName: string;
  admissionSource: string;
  initialDiagnosis: string;
  admittedAt: string;
  checkedOutAt?: string | null;
  status: "admitted" | "discharged" | "transferred";
}

export interface InvoiceView {
  id: number;
  invoiceNumber: string;
  patientId: number;
  patientName: string;
  patientRm: string;
  subtotal: string;
  discount: string;
  tax: string;
  total: string;
  status: "pending" | "paid" | "cancelled";
  issuedAt: string;
  paidAt?: string | null;
  items: Array<{
    id: number;
    itemType: string;
    description: string;
    quantity: number;
    unitPrice: string;
    subtotal: string;
  }>;
  payment?: {
    method: string;
    paymentCode: string;
    paidAt: string;
  } | null;
}
