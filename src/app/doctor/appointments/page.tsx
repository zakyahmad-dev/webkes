"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PortalSidebar from "@/components/PortalSidebar";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function DoctorAppointmentsPage() {
  const { currentUser } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, [currentUser]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const docId = currentUser?.doctorId || 1;
      const res = await fetch(`/api/appointments?doctorId=${docId}`);
      const json = await res.json();
      if (json.success) setAppointments(json.data || []);
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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Jadwal Janji Temu Pasien Dokter
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Daftar pasien terjadwal untuk konsultasi poliklinik spesialis.
              </p>
            </div>
          </div>

          {loading ? (
            <p className="text-xs text-slate-500 py-12 text-center">Memuat jadwal pasien...</p>
          ) : appointments.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-2">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800 text-sm">Belum Ada Janji Temu</h3>
              <p className="text-xs text-slate-500">Pasien yang melakukan booking akan tampil di sini.</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                  <tr>
                    <th className="py-4 px-6">No. Antrean</th>
                    <th className="py-4 px-6">Nama Pasien & Kontak</th>
                    <th className="py-4 px-6">Waktu Konsultasi</th>
                    <th className="py-4 px-6">Keluhan Pasien</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {appointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-slate-50 transition">
                      <td className="py-4 px-6 font-mono font-black text-slate-900">
                        {apt.queueNumber}
                      </td>
                      <td className="py-4 px-6">
                        <p className="font-bold text-slate-900">{apt.patientName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">RM: {apt.patientRm} · Tel: {apt.patientPhone}</p>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <p className="font-bold text-sky-700">
                          {new Date(apt.scheduledAt).toLocaleDateString("id-ID", { dateStyle: "medium" })}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(apt.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} WIB
                        </p>
                      </td>
                      <td className="py-4 px-6 max-w-xs truncate text-slate-600">
                        {apt.complaint}
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-sky-100 text-sky-800">
                          {apt.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <Link
                          href="/doctor/medical-records"
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition"
                        >
                          Buka EMR
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}
