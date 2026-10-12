"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PortalSidebar from "@/components/PortalSidebar";
import Link from "next/link";
import { Users, Search, Stethoscope, Phone, ShieldCheck } from "lucide-react";

export default function DoctorPatientsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/patients")
      .then((r) => r.json())
      .then((d) => d.success && setPatients(d.data || []))
      .finally(() => setLoading(false));
  }, []);

  const filteredPatients = patients.filter((p) => {
    if (!searchQuery) return true;
    return (
      p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.medicalRecordNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery)
    );
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        <PortalSidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Direktori Pasien Poliklinik
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Daftar pasien teregistrasi dalam sistem rumah sakit dengan riwayat medis terenkripsi.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama, RM, telepon..."
                className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="py-4 px-6">No. Rekam Medis</th>
                  <th className="py-4 px-6">Nama Pasien</th>
                  <th className="py-4 px-6">Tgl Lahir & Usia</th>
                  <th className="py-4 px-6">Kontak & Alamat</th>
                  <th className="py-4 px-6">Alergi Terdata</th>
                  <th className="py-4 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPatients.map((pat) => (
                  <tr key={pat.id} className="hover:bg-slate-50 transition">
                    <td className="py-4 px-6 font-mono font-bold text-sky-700">
                      {pat.medicalRecordNumber}
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-900">
                      {pat.fullName}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        {pat.gender === "L" ? "Laki-laki" : "Perempuan"} · Gol. {pat.bloodType || "O+"}
                      </span>
                    </td>
                    <td className="py-4 px-6">{pat.birthDate}</td>
                    <td className="py-4 px-6">
                      <p className="font-medium text-slate-800">{pat.phone}</p>
                      <p className="text-[10px] text-slate-400">{pat.city}</p>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded text-[10px] border border-rose-200">
                        {pat.allergiesSummary || "Tidak ada alergi"}
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
        </main>
      </div>

      <Footer />
    </div>
  );
}
