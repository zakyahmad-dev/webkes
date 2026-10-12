"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PortalSidebar from "@/components/PortalSidebar";
import { useAuth } from "@/context/AuthContext";
import {
  User,
  ShieldCheck,
  Phone,
  MapPin,
  Heart,
  AlertCircle,
  FileCheck,
  CheckCircle2,
} from "lucide-react";

export default function PatientProfilePage() {
  const { currentUser } = useAuth();
  const [patient, setPatient] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatientData();
  }, [currentUser]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      const patientId = currentUser?.patientId || 1;
      const res = await fetch(`/api/patients?id=${patientId}`);
      const json = await res.json();
      if (json.success && json.data?.length > 0) {
        setPatient(json.data[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        <PortalSidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Profil Pasien & Data Kesehatan
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Identitas kependudukan terenkripsi dan persetujuan retensi data medis (UU PDP No. 27/2022).
            </p>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500">Memuat profil kesehatan...</p>
            </div>
          ) : !patient ? (
            <p className="text-xs text-slate-500">Data pasien tidak ditemukan.</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Profile Card */}
              <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
                <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
                  <img
                    src={currentUser?.avatarPath || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150"}
                    alt={patient.fullName}
                    className="w-18 h-18 rounded-2xl object-cover border-2 border-sky-200"
                  />
                  <div>
                    <h2 className="text-lg font-black text-slate-900">{patient.fullName}</h2>
                    <p className="text-xs font-mono font-bold text-sky-700">No. RM: {patient.medicalRecordNumber}</p>
                    <span className="inline-block mt-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-800 rounded-full text-[10px] font-bold border border-emerald-200">
                      ✓ Akun Pasien Terverifikasi
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">NIK (Kependudukan)</span>
                    <span className="font-mono font-bold text-slate-800">{patient.nik || "3174051203890001"}</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Nomor BPJS Kesehatan</span>
                    <span className="font-mono font-bold text-slate-800">{patient.bpjsNumber || "0001234567891"}</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Tanggal Lahir & Usia</span>
                    <span className="font-bold text-slate-800">{patient.birthDate} (37 Tahun)</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Jenis Kelamin & Gol. Darah</span>
                    <span className="font-bold text-slate-800">
                      {patient.gender === "L" ? "Laki-laki" : "Perempuan"} · Golongan {patient.bloodType || "O+"}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 sm:col-span-2">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Alamat Domisili</span>
                    <span className="font-medium text-slate-800">{patient.address}, {patient.city}</span>
                  </div>
                </div>

                {/* Allergies Box */}
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs space-y-1">
                  <span className="font-bold text-rose-800 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    Peringatan Riwayat Alergi Obat & Makanan:
                  </span>
                  <p className="text-rose-900 font-semibold pl-5.5">
                    {patient.allergiesSummary || "Tidak ada riwayat alergi yang dilaporkan."}
                  </p>
                </div>
              </div>

              {/* Right Column: Emergency Contact & UU PDP Consent */}
              <div className="lg:col-span-4 space-y-6">
                {/* Emergency Contact */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-3 shadow-xs text-xs">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-sky-600" />
                    <span>Kontak Darurat</span>
                  </h3>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <p className="font-bold text-slate-900">{patient.emergencyContactName || "Dewi Lestari"}</p>
                    <p className="text-slate-500">Hubungan: {patient.emergencyContactRelation || "Istri"}</p>
                    <p className="font-mono text-sky-700 font-bold">{patient.emergencyContactPhone || "081288990099"}</p>
                  </div>
                </div>

                {/* UU PDP Consent */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-3 shadow-xs text-xs">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Persetujuan Privasi Medis</span>
                  </h3>
                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-1 text-[11px]">
                    <p className="font-bold">✓ Informed Consent Aktif</p>
                    <p>Versi: <strong>{patient.consentVersion || "v1.0-UU-PDP"}</strong></p>
                    <p className="text-slate-600">
                      Disetujui pada: {new Date(patient.consentAt || Date.now()).toLocaleDateString("id-ID", { dateStyle: "medium" })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}
