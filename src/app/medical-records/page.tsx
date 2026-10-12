"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PortalSidebar from "@/components/PortalSidebar";
import { useAuth } from "@/context/AuthContext";
import {
  Stethoscope,
  Activity,
  FileText,
  Calendar,
  User,
  ShieldCheck,
  Download,
  Printer,
  ChevronDown,
  Pill,
  FlaskConical,
  CheckCircle2,
} from "lucide-react";

export default function MedicalRecordsPage() {
  const { currentUser } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

  useEffect(() => {
    fetchRecords();
  }, [currentUser]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const patientId = currentUser?.patientId || 1;
      const res = await fetch(`/api/medical-records?patientId=${patientId}`);
      const json = await res.json();
      if (json.success) {
        setRecords(json.data || []);
        if (json.data && json.data.length > 0) {
          setSelectedRecord(json.data[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
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
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Rekam Medis Elektronik (EMR)
                </h1>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Kepatuhan Permenkes No. 24/2022 & UU PDP No. 27/2022 · Enkripsi Data Sensitif
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak EMR</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500">Memuat rekam medis terenkripsi...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-2">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800 text-sm">Belum Ada Riwayat Kunjungan</h3>
              <p className="text-xs text-slate-500">Rekam medis akan otomatis tampil setelah dokter menyelesaikan konsultasi.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Visits List */}
              <div className="lg:col-span-4 space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                  Riwayat Kunjungan Medis ({records.length})
                </p>
                {records.map((rec) => {
                  const isSelected = selectedRecord?.id === rec.id;
                  return (
                    <button
                      key={rec.id}
                      onClick={() => setSelectedRecord(rec)}
                      className={`w-full text-left p-4 rounded-2xl border transition space-y-2 ${
                        isSelected
                          ? "bg-sky-50/80 border-sky-400 ring-2 ring-sky-400/20 shadow-xs"
                          : "bg-white border-slate-200 hover:border-sky-300"
                      }`}
                    >
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-900">{rec.visitDate}</span>
                        <span className="font-mono text-[10px] text-sky-800 bg-sky-100 px-1.5 py-0.5 rounded font-bold">
                          {rec.recordNumber}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-teal-800">{rec.doctorName}</p>
                      <p className="text-xs text-slate-500 line-clamp-1">{rec.complaint}</p>
                    </button>
                  );
                })}
              </div>

              {/* Right Column: Active EMR Detailed Viewer */}
              {selectedRecord && (
                <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
                  {/* Record Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                        Rawat Jalan ({selectedRecord.visitType?.toUpperCase()})
                      </span>
                      <h2 className="text-xl font-black text-slate-900 mt-1">
                        Rekam Medis #{selectedRecord.recordNumber}
                      </h2>
                      <p className="text-xs text-slate-500">
                        Tanggal: {selectedRecord.visitDate} · Dokter: <strong>{selectedRecord.doctorName}</strong>
                      </p>
                    </div>

                    <div className="px-3 py-1 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs font-bold w-fit">
                      ✓ Status Final & Terverifikasi
                    </div>
                  </div>

                  {/* Anamnesis / Subjective */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      1. Anamnesis & Riwayat Penyakit (Subjektif)
                    </h3>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                      <p><strong>Keluhan Utama:</strong> {selectedRecord.complaint}</p>
                      {selectedRecord.medicalHistory && (
                        <p><strong>Riwayat Penyakit:</strong> {selectedRecord.medicalHistory}</p>
                      )}
                      {selectedRecord.allergyNotes && (
                        <p className="text-rose-700 font-semibold">
                          <strong>Riwayat Alergi:</strong> {selectedRecord.allergyNotes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Vital Signs (Objektif) */}
                  {selectedRecord.vitalSigns && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        2. Tanda Vital & Pemeriksaan Fisik (Objektif)
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div className="p-3 rounded-xl bg-sky-50 border border-sky-100 text-center">
                          <span className="text-[10px] text-slate-500 block">Tekanan Darah</span>
                          <span className="text-base font-black text-sky-800">
                            {selectedRecord.vitalSigns.systolic}/{selectedRecord.vitalSigns.diastolic} <span className="text-[10px] font-normal">mmHg</span>
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-sky-50 border border-sky-100 text-center">
                          <span className="text-[10px] text-slate-500 block">Denyut Nadi (HR)</span>
                          <span className="text-base font-black text-sky-800">
                            {selectedRecord.vitalSigns.heartRate} <span className="text-[10px] font-normal">bpm</span>
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-sky-50 border border-sky-100 text-center">
                          <span className="text-[10px] text-slate-500 block">Suhu Tubuh</span>
                          <span className="text-base font-black text-sky-800">
                            {selectedRecord.vitalSigns.temperature}°C
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-sky-50 border border-sky-100 text-center">
                          <span className="text-[10px] text-slate-500 block">Saturasi SpO2</span>
                          <span className="text-base font-black text-sky-800">
                            {selectedRecord.vitalSigns.spo2}%
                          </span>
                        </div>
                      </div>

                      {selectedRecord.physicalExamNotes && (
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700">
                          <strong>Pemeriksaan Fisik:</strong> {selectedRecord.physicalExamNotes}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Diagnoses (Assessment ICD-10) */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      3. Diagnosis Medis (ICD-10 Assessment)
                    </h3>
                    <div className="space-y-2">
                      {selectedRecord.diagnoses && selectedRecord.diagnoses.length > 0 ? (
                        selectedRecord.diagnoses.map((d: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-emerald-900 bg-white px-2 py-0.5 rounded shadow-2xs border border-emerald-300">
                                {d.code || "R69"}
                              </span>
                              <span className="font-semibold text-emerald-950">{d.description}</span>
                            </div>
                            {d.isPrimary && (
                              <span className="text-[10px] font-bold uppercase bg-emerald-600 text-white px-2 py-0.5 rounded">
                                Primer
                              </span>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500">Tidak ada kode diagnosis.</p>
                      )}
                    </div>
                  </div>

                  {/* Plan / Doctor Notes */}
                  {selectedRecord.doctorNotes && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        4. Rencana & Anjuran Terapi Dokter (Plan)
                      </h3>
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                        {selectedRecord.doctorNotes}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}
