"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PortalSidebar from "@/components/PortalSidebar";
import { useAuth } from "@/context/AuthContext";
import {
  Pill,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  ShieldCheck,
  Building,
} from "lucide-react";

export default function PrescriptionsPage() {
  const { currentUser } = useAuth();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrescriptions();
  }, [currentUser]);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const patientId = currentUser?.patientId || 1;
      const res = await fetch(`/api/prescriptions?patientId=${patientId}`);
      const json = await res.json();
      if (json.success) setPrescriptions(json.data || []);
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Resep Obat Elektronik (E-Prescription)
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Daftar obat yang diresepkan dokter spesialis beserta aturan pakai dan status penyiapan di Instalasi Farmasi.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl text-amber-900 text-xs font-semibold">
              <Pill className="w-4 h-4 text-amber-600" />
              <span>Layanan Antar Obat Farmasi 24 Jam Tersedia</span>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500">Memuat resep digital...</p>
            </div>
          ) : prescriptions.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-2">
              <Pill className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800 text-sm">Belum Ada Resep Obat</h3>
              <p className="text-xs text-slate-500">Resep obat dari dokter akan otomatis tercatat di sini.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {prescriptions.map((rx) => {
                const isCompleted = rx.status === "completed";
                const isReady = rx.status === "ready";
                const isProcessing = rx.status === "processing";

                return (
                  <div
                    key={rx.id}
                    className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                          {rx.prescriptionCode}
                        </span>
                        <span className="text-xs text-slate-600">
                          Dokter: <strong>{rx.doctorName}</strong>
                        </span>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase w-fit ${
                          isCompleted
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : isReady
                            ? "bg-teal-100 text-teal-800 border border-teal-300"
                            : "bg-amber-100 text-amber-800 border border-amber-300"
                        }`}
                      >
                        {rx.status === "completed"
                          ? "✓ Selesai / Diserahkan"
                          : rx.status === "ready"
                          ? "Siap Diambil di Loket"
                          : "Sedang Diracik"}
                      </span>
                    </div>

                    {/* Prescribed Items Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-700">
                        <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                          <tr>
                            <th className="py-2.5 px-4 rounded-l-lg">Nama Obat & Bentuk</th>
                            <th className="py-2.5 px-4">Dosis</th>
                            <th className="py-2.5 px-4">Frekuensi & Durasi</th>
                            <th className="py-2.5 px-4">Jumlah</th>
                            <th className="py-2.5 px-4 rounded-r-lg">Aturan Minum</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {rx.items && rx.items.length > 0 ? (
                            rx.items.map((item: any) => (
                              <tr key={item.id}>
                                <td className="py-3 px-4 font-bold text-slate-900">
                                  {item.medicineName}
                                  <span className="block text-[10px] text-slate-400 font-normal">
                                    Sediaan: {item.form}
                                  </span>
                                </td>
                                <td className="py-3 px-4 font-semibold text-slate-800">{item.dose}</td>
                                <td className="py-3 px-4">
                                  <span className="font-bold text-sky-700">{item.frequency}</span>
                                  {item.durationDays && (
                                    <span className="text-[10px] text-slate-400 block font-normal">
                                      Selama {item.durationDays} hari
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-4 font-bold text-slate-900">{item.quantity} unit</td>
                                <td className="py-3 px-4 font-medium text-teal-800">
                                  {item.instructions || "Sesudah makan"}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="py-3 px-4 text-slate-400">Tidak ada item obat.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {rx.notes && (
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
                        <strong>Catatan Apoteker:</strong> {rx.notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}
