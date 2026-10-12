"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PortalSidebar from "@/components/PortalSidebar";
import { useAuth } from "@/context/AuthContext";
import { announceQueue, playChimeSound } from "@/lib/speech";
import Link from "next/link";
import {
  Stethoscope,
  Clock,
  Users,
  Calendar,
  Volume2,
  CheckCircle2,
  FileText,
  Activity,
  Pill,
  FlaskConical,
  ArrowRight,
} from "lucide-react";

export default function DoctorDashboardPage() {
  const { currentUser } = useAuth();
  const [queues, setQueues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDoctorQueues();
  }, [currentUser]);

  const fetchDoctorQueues = async () => {
    try {
      setLoading(true);
      const docId = currentUser?.doctorId || 1;
      const res = await fetch(`/api/queues?doctorId=${docId}`);
      const json = await res.json();
      if (json.success) setQueues(json.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCallPatient = async (q: any) => {
    playChimeSound();
    const text = `Nomor antrean ${q.queueCode}, atas nama ${q.patientName}, silakan masuk ke Ruang Konsultasi Dokter`;
    setTimeout(() => {
      announceQueue(text);
    }, 300);

    try {
      await fetch("/api/queues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          queueId: q.id,
          action: "serve",
          handledByUserId: currentUser?.id,
        }),
      });
      fetchDoctorQueues();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        <PortalSidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 text-[10px] font-bold uppercase tracking-wider">
                Ruang Praktik Dokter Spesialis
              </span>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                {currentUser?.name || "dr. Sarah Wijaya, Sp.PD"}
              </h1>
              <p className="text-xs text-emerald-100">
                Poli Penyakit Dalam · Ruang 201 · Jadwal Hari Ini: 08:00 - 12:00 WIB
              </p>
            </div>

            <Link
              href="/doctor/medical-records"
              className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition flex items-center gap-2 shrink-0"
            >
              <Stethoscope className="w-4 h-4" />
              <span>Buka Form EMR Konsultasi</span>
            </Link>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-slate-400">Total Pasien Hari Ini</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{queues.length}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-slate-400">Menunggu (Waiting)</span>
              <p className="text-2xl font-black text-sky-700 mt-1">
                {queues.filter((q) => q.status === "waiting" || q.status === "called").length}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-slate-400">Sedang Diperiksa</span>
              <p className="text-2xl font-black text-amber-600 mt-1">
                {queues.filter((q) => q.status === "serving").length}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-slate-400">Selesai (Completed)</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">
                {queues.filter((q) => q.status === "completed").length}
              </p>
            </div>
          </div>

          {/* Today's Consultation Queue Table */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>Antrean Pasien Poliklinik Hari Ini</span>
              </h3>
              <span className="text-[11px] font-bold text-slate-500">
                Panggilan Terintegrasi Audio Speech API
              </span>
            </div>

            {loading ? (
              <p className="text-xs text-slate-500 py-6 text-center">Memuat antrean...</p>
            ) : queues.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">Tidak ada pasien dalam antrean saat ini.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                    <tr>
                      <th className="py-3 px-4 rounded-l-lg">No. Antrean</th>
                      <th className="py-3 px-4">Nama Pasien & No. RM</th>
                      <th className="py-3 px-4">Keluhan Utama</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 rounded-r-lg text-right">Aksi Klinis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {queues.map((q) => {
                      const isServing = q.status === "serving";
                      const isWaiting = q.status === "waiting" || q.status === "called";
                      return (
                        <tr key={q.id} className={isServing ? "bg-amber-50/50" : ""}>
                          <td className="py-3.5 px-4 font-black text-sm text-slate-900 font-mono">
                            {q.queueCode}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            {q.patientName}
                            <span className="block font-mono text-[10px] text-slate-400 font-normal">
                              RM: {q.patientRm}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                            {q.complaint}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                isServing
                                  ? "bg-amber-100 text-amber-900 animate-pulse"
                                  : isWaiting
                                  ? "bg-sky-100 text-sky-900"
                                  : "bg-emerald-100 text-emerald-900"
                              }`}
                            >
                              {q.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              {isWaiting && (
                                <button
                                  onClick={() => handleCallPatient(q)}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center gap-1 shadow-xs"
                                >
                                  <Volume2 className="w-3.5 h-3.5" />
                                  <span>Panggil Pasien</span>
                                </button>
                              )}
                              <Link
                                href="/doctor/medical-records"
                                className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition flex items-center gap-1 shadow-xs"
                              >
                                <Stethoscope className="w-3.5 h-3.5" />
                                <span>Input EMR</span>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
