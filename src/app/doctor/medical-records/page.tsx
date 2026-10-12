"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PortalSidebar from "@/components/PortalSidebar";
import { useAuth } from "@/context/AuthContext";
import {
  Stethoscope,
  Activity,
  Pill,
  FlaskConical,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Search,
  ShieldCheck,
  FileText,
} from "lucide-react";

export default function DoctorMedicalRecordsPage() {
  const { currentUser } = useAuth();
  const [patientsList, setPatientsList] = useState<any[]>([]);
  const [medicinesList, setMedicinesList] = useState<any[]>([]);
  const [labTypesList, setLabTypesList] = useState<any[]>([]);

  // Form State
  const [selectedPatientId, setSelectedPatientId] = useState<string>("1");
  const [visitType, setVisitType] = useState("outpatient");
  const [complaint, setComplaint] = useState("Pusing berputar, tengkuk terasa berat, dan tekanan darah tinggi.");
  const [medicalHistory, setMedicalHistory] = useState("Hipertensi Stage 1 sejak 2024, kontrol teratur.");
  const [allergyNotes, setAllergyNotes] = useState("Alergi Penisilin");
  const [physicalExamNotes, setPhysicalExamNotes] = useState("KU: Baik, CM. Cor: S1-S2 reguler murmur (-), Pulmo: Vesikuler (+/+) wheezing (-/-). Abdomen: Supel, BU (+) normal.");
  const [doctorNotes, setDoctorNotes] = useState("Target tensi < 130/80 mmHg. Kurangi asupan garam, teruskan olahraga aerobik teratur 30 menit 3x/minggu.");

  // Vital Signs
  const [systolic, setSystolic] = useState("140");
  const [diastolic, setDiastolic] = useState("90");
  const [heartRate, setHeartRate] = useState("80");
  const [temperature, setTemperature] = useState("36.6");
  const [spo2, setSpo2] = useState("98");
  const [weightKg, setWeightKg] = useState("72");
  const [heightCm, setHeightCm] = useState("172");

  // ICD-10 Diagnoses
  const [diagnoses, setDiagnoses] = useState<Array<{ code: string; description: string; isPrimary: boolean }>>([
    { code: "I10", description: "Essential (primary) hypertension", isPrimary: true },
    { code: "E11.9", description: "Type 2 diabetes mellitus without complications", isPrimary: false },
  ]);

  // Treatments
  const [treatments, setTreatments] = useState<Array<{ code: string; description: string }>>([
    { code: "89.03", description: "Konsultasi medis & edukasi modifikasi gaya hidup sehat" },
  ]);

  // E-Prescription Items
  const [rxItems, setRxItems] = useState<Array<{
    medicineId: number;
    dose: string;
    frequency: string;
    durationDays: number;
    quantity: number;
    instructions: string;
  }>>([
    { medicineId: 1, dose: "1 tablet (10mg)", frequency: "1x sehari pagi", durationDays: 30, quantity: 30, instructions: "Sesudah makan pagi" },
  ]);

  // Lab Order Test Types
  const [selectedLabTestIds, setSelectedLabTestIds] = useState<number[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const commonICD10 = [
    { code: "I10", description: "Essential (primary) hypertension" },
    { code: "E11.9", description: "Type 2 diabetes mellitus without complications" },
    { code: "K29.7", description: "Gastritis, unspecified" },
    { code: "J06.9", description: "Acute upper respiratory infection, unspecified" },
    { code: "M54.5", description: "Low back pain" },
    { code: "I20.9", description: "Angina pectoris, unspecified" },
    { code: "G43.9", description: "Migraine, unspecified" },
    { code: "R42", description: "Dizziness and giddiness (Vertigo)" },
  ];

  useEffect(() => {
    fetch("/api/patients").then((r) => r.json()).then((d) => d.success && setPatientsList(d.data || []));
    fetch("/api/medicines").then((r) => r.json()).then((d) => d.success && setMedicinesList(d.data || []));
    fetch("/api/lab-orders/types").then((r) => r.json()).then((d) => d.success && setLabTypesList(d.data || []));
  }, []);

  const handleAddDiagnosis = (diag: { code: string; description: string }) => {
    if (!diagnoses.some((d) => d.code === diag.code)) {
      setDiagnoses([...diagnoses, { ...diag, isPrimary: diagnoses.length === 0 }]);
    }
  };

  const handleRemoveDiagnosis = (index: number) => {
    setDiagnoses(diagnoses.filter((_, i) => i !== index));
  };

  const handleAddRxItem = () => {
    if (medicinesList.length > 0) {
      setRxItems([
        ...rxItems,
        {
          medicineId: medicinesList[0].id,
          dose: "1 tablet",
          frequency: "2x sehari",
          durationDays: 5,
          quantity: 10,
          instructions: "Sesudah makan",
        },
      ]);
    }
  };

  const handleRemoveRxItem = (index: number) => {
    setRxItems(rxItems.filter((_, i) => i !== index));
  };

  const toggleLabTest = (testId: number) => {
    if (selectedLabTestIds.includes(testId)) {
      setSelectedLabTestIds(selectedLabTestIds.filter((id) => id !== testId));
    } else {
      setSelectedLabTestIds([...selectedLabTestIds, testId]);
    }
  };

  const handleFinalizeEMR = async () => {
    if (!selectedPatientId || !complaint.trim()) {
      setErrorMsg("Pilih pasien dan isi keluhan klinis.");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg("");

      const docId = currentUser?.doctorId || 1;

      const res = await fetch("/api/medical-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: Number(selectedPatientId),
          doctorId: docId,
          visitType,
          complaint,
          medicalHistory,
          allergyNotes,
          physicalExamNotes,
          doctorNotes,
          diagnoses,
          treatments,
          vitalSignData: {
            systolic: Number(systolic),
            diastolic: Number(diastolic),
            heartRate: Number(heartRate),
            temperature,
            spo2: Number(spo2),
            weightKg,
            heightCm,
          },
          prescriptionItems: rxItems,
          labTestTypeIds: selectedLabTestIds,
          doctorUserId: currentUser?.id,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setErrorMsg(json.message || "Gagal menyimpan rekam medis.");
        return;
      }

      setSavedSuccess(json.data);
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan saat menyimpan rekam medis.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        <PortalSidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-emerald-600" />
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Formulir Konsultasi Medis & EMR Dokter
                </h1>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Pengisian SOAP, Diagnosis ICD-10, E-Resep, dan Permintaan Laboratorium Terintegrasi.
              </p>
            </div>

            <button
              onClick={handleFinalizeEMR}
              disabled={submitting}
              className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center gap-2 shrink-0"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? "Menyimpan & Menandatangani..." : "Finalisasi EMR & Terbitkan Resep"}</span>
            </button>
          </div>

          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {savedSuccess ? (
            <div className="bg-white rounded-3xl border border-emerald-300 p-8 text-center space-y-4 shadow-md">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-xl font-black text-slate-900">Rekam Medis Berhasil Difinalisasi!</h2>
              <div className="p-4 bg-slate-50 rounded-2xl max-w-md mx-auto text-xs text-slate-600 space-y-1">
                <p>No. EMR: <strong className="font-mono text-slate-900">{savedSuccess.record?.recordNumber}</strong></p>
                <p>Resep Elektronik: <strong>#{savedSuccess.prescriptionId || "Tidak ada obat"}</strong></p>
                <p>Order Lab: <strong>#{savedSuccess.labOrderId || "Tidak ada lab"}</strong></p>
                <p>Invoice Tagihan: <strong>#{savedSuccess.invoiceNumber}</strong></p>
              </div>
              <button
                onClick={() => setSavedSuccess(null)}
                className="px-5 py-2.5 rounded-xl bg-sky-600 text-white font-bold text-xs hover:bg-sky-700 transition"
              >
                Input Pasien Berikutnya
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 1. Patient Selector & Visit Type */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <span>1. Identitas Pasien & Tipe Kunjungan</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Pilih Pasien Konsultasi</label>
                    <select
                      value={selectedPatientId}
                      onChange={(e) => setSelectedPatientId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    >
                      {patientsList.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.fullName} (No. RM: {p.medicalRecordNumber}) · NIK: {p.nik} · Alergi: {p.allergiesSummary || "Tidak ada"}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Jenis Layanan</label>
                    <select
                      value={visitType}
                      onChange={(e) => setVisitType(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    >
                      <option value="outpatient">Rawat Jalan (Poli Spesialis)</option>
                      <option value="emergency">Instalasi Gawat Darurat (IGD)</option>
                      <option value="inpatient">Visite Rawat Inap</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 2. SOAP Anamnesis (Subjektif) */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
                <h3 className="font-bold text-sm text-slate-900">
                  2. Anamnesis Pasien (Subjektif)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">
                      Keluhan Utama Pasien <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={complaint}
                      onChange={(e) => setComplaint(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Riwayat Penyakit Terdahulu</label>
                    <textarea
                      rows={2}
                      value={medicalHistory}
                      onChange={(e) => setMedicalHistory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Riwayat Alergi Obat</label>
                    <textarea
                      rows={2}
                      value={allergyNotes}
                      onChange={(e) => setAllergyNotes(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Tanda Vital & Fisik (Objektif) */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-sky-600" />
                  <span>3. Tanda Vital & Pemeriksaan Fisik (Objektif)</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-500 text-[10px] uppercase font-bold mb-1">Sistolik (mmHg)</label>
                    <input
                      type="number"
                      value={systolic}
                      onChange={(e) => setSystolic(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-300 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 text-[10px] uppercase font-bold mb-1">Diastolik (mmHg)</label>
                    <input
                      type="number"
                      value={diastolic}
                      onChange={(e) => setDiastolic(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-300 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 text-[10px] uppercase font-bold mb-1">Nadi (bpm)</label>
                    <input
                      type="number"
                      value={heartRate}
                      onChange={(e) => setHeartRate(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-300 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 text-[10px] uppercase font-bold mb-1">Suhu (°C)</label>
                    <input
                      type="text"
                      value={temperature}
                      onChange={(e) => setTemperature(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-300 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 text-[10px] uppercase font-bold mb-1">SpO2 (%)</label>
                    <input
                      type="number"
                      value={spo2}
                      onChange={(e) => setSpo2(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-300 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 text-[10px] uppercase font-bold mb-1">Berat (kg)</label>
                    <input
                      type="text"
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-300 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 text-[10px] uppercase font-bold mb-1">Tinggi (cm)</label>
                    <input
                      type="text"
                      value={heightCm}
                      onChange={(e) => setHeightCm(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-300 font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Pemeriksaan Fisik</label>
                  <textarea
                    rows={2}
                    value={physicalExamNotes}
                    onChange={(e) => setPhysicalExamNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* 4. ICD-10 Diagnoses (Assessment) */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900">
                    4. Diagnosis Medis ICD-10 (Assessment)
                  </h3>
                </div>

                {/* Predefined ICD-10 Chips */}
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block w-full">
                    Pilih Cepat ICD-10 Umum:
                  </span>
                  {commonICD10.map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => handleAddDiagnosis(item)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-[11px] font-mono border border-slate-200 transition"
                    >
                      + {item.code} {item.description}
                    </button>
                  ))}
                </div>

                {/* Selected Diagnoses List */}
                <div className="space-y-2 pt-2">
                  {diagnoses.map((diag, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-emerald-950 bg-white px-2 py-0.5 rounded border border-emerald-300">
                          {diag.code}
                        </span>
                        <span className="font-semibold text-emerald-950">{diag.description}</span>
                        {diag.isPrimary && (
                          <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded">
                            Primer
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveDiagnosis(idx)}
                        className="text-rose-500 hover:text-rose-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5. E-Prescription Writer */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Pill className="w-4 h-4 text-amber-600" />
                    <span>5. Resep Elektronik (E-Prescription)</span>
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddRxItem}
                    className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 rounded-xl text-xs font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Obat</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {rxItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center text-xs"
                    >
                      <div className="sm:col-span-4">
                        <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Obat</label>
                        <select
                          value={item.medicineId}
                          onChange={(e) => {
                            const updated = [...rxItems];
                            updated[idx].medicineId = Number(e.target.value);
                            setRxItems(updated);
                          }}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-300"
                        >
                          {medicinesList.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} (Stok: {m.currentStock} {m.unit})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Dosis</label>
                        <input
                          type="text"
                          value={item.dose}
                          onChange={(e) => {
                            const updated = [...rxItems];
                            updated[idx].dose = e.target.value;
                            setRxItems(updated);
                          }}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-300"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Frekuensi</label>
                        <input
                          type="text"
                          value={item.frequency}
                          onChange={(e) => {
                            const updated = [...rxItems];
                            updated[idx].frequency = e.target.value;
                            setRxItems(updated);
                          }}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-300"
                        />
                      </div>

                      <div className="sm:col-span-1">
                        <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Jumlah</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => {
                            const updated = [...rxItems];
                            updated[idx].quantity = Number(e.target.value);
                            setRxItems(updated);
                          }}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-300 font-bold"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Aturan Pakai</label>
                        <input
                          type="text"
                          value={item.instructions}
                          onChange={(e) => {
                            const updated = [...rxItems];
                            updated[idx].instructions = e.target.value;
                            setRxItems(updated);
                          }}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-300"
                        />
                      </div>

                      <div className="sm:col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveRxItem(idx)}
                          className="p-2 text-rose-500 hover:text-rose-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 6. Integrated Lab Orders */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-indigo-600" />
                  <span>6. Permintaan Uji Laboratorium (Lab Order)</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  {labTypesList.map((test) => {
                    const isChecked = selectedLabTestIds.includes(test.id);
                    return (
                      <button
                        key={test.id}
                        type="button"
                        onClick={() => toggleLabTest(test.id)}
                        className={`p-3 rounded-xl border text-left transition ${
                          isChecked
                            ? "bg-indigo-50 border-indigo-400 ring-2 ring-indigo-400/20 font-bold text-indigo-900"
                            : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                        }`}
                      >
                        <p>{test.name}</p>
                        <p className="text-[10px] text-slate-400 font-normal">{test.category}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 7. Doctor Notes & Plan */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-3 shadow-xs">
                <h3 className="font-bold text-sm text-slate-900">
                  7. Instruksi, Saran Gaya Hidup & Catatan Dokter
                </h3>
                <textarea
                  rows={3}
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}
