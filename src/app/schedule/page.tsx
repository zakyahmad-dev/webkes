"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BookingWizard from "@/components/BookingWizard";
import {
  Calendar,
  Clock,
  Search,
  Filter,
  Stethoscope,
  ChevronRight,
  User,
} from "lucide-react";

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [polyclinics, setPolyclinics] = useState<any[]>([]);
  const [selectedDay, setSelectedDay] = useState<number>(0); // 0 = Semua hari
  const [selectedPolyId, setSelectedPolyId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Booking Wizard
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingDoctorId, setBookingDoctorId] = useState<number | undefined>();
  const [bookingPolyId, setBookingPolyId] = useState<number | undefined>();

  const daysList = [
    { id: 0, label: "Semua Hari" },
    { id: 1, label: "Senin" },
    { id: 2, label: "Selasa" },
    { id: 3, label: "Rabu" },
    { id: 4, label: "Kamis" },
    { id: 5, label: "Jumat" },
    { id: 6, label: "Sabtu" },
  ];

  const daysMap = ["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [schRes, polyRes] = await Promise.all([
        fetch("/api/schedules").then((r) => r.json()),
        fetch("/api/polyclinics").then((r) => r.json()),
      ]);

      if (schRes.success) setSchedules(schRes.data || []);
      if (polyRes.success) setPolyclinics(polyRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredSchedules = schedules.filter((s) => {
    const matchesDay = selectedDay === 0 || s.dayOfWeek === selectedDay;
    const matchesPoly = selectedPolyId === "all" || s.polyclinicId === Number(selectedPolyId);
    const matchesQuery =
      !searchQuery ||
      s.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.polyclinicName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.specializationName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDay && matchesPoly && matchesQuery;
  });

  const handleBookSlot = (docId: number, polyId: number) => {
    setBookingDoctorId(docId);
    setBookingPolyId(polyId);
    setIsBookingOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header onOpenBooking={() => setIsBookingOpen(true)} />

      {/* Hero Header */}
      <section className="bg-paper border-b border-sandline py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="space-y-2">
            <span className="badge">Jadwal Mingguan</span>
            <h1 className="display-lg">Jadwal praktik dokter, transparan per hari.</h1>
            <p className="text-xs sm:text-sm text-ink-soft">
              Pilih hari dan poliklinik tujuan untuk melihat jam layanan tiap dokter — data dari jadwal aktual.
            </p>
          </div>

          {/* Search & Filter */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
            <div className="md:col-span-8 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama dokter atau poli..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
              />
            </div>
            <div className="md:col-span-4">
              <select
                value={selectedPolyId}
                onChange={(e) => setSelectedPolyId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
              >
                <option value="all">Semua Poliklinik</option>
                {polyclinics.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Day Selector Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-2">
            {daysList.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDay(d.id)}
                className={selectedDay === d.id ? "btn-primary btn-xs shrink-0" : "btn-secondary btn-xs shrink-0"}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Timetable Matrix */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-20">
            <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Memuat jadwal dokter...</p>
          </div>
        ) : filteredSchedules.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-2">
            <Clock className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-800 text-sm">Tidak Ada Jadwal yang Cocok</h3>
            <p className="text-xs text-slate-500">Coba pilih hari atau poliklinik lain.</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                  <tr>
                    <th className="py-4 px-6">Hari</th>
                    <th className="py-4 px-6">Dokter Spesialis</th>
                    <th className="py-4 px-6">Poliklinik</th>
                    <th className="py-4 px-6">Jam Praktik</th>
                    <th className="py-4 px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSchedules.map((sch) => (
                    <tr key={sch.id} className="hover:bg-sky-50/50 transition">
                      <td className="py-4 px-6 font-bold text-slate-900 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-bold">
                          {daysMap[sch.dayOfWeek]}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={sch.doctorPhoto || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100"}
                            alt={sch.doctorName}
                            className="w-9 h-9 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <p className="font-bold text-slate-900">{sch.doctorName}</p>
                            <p className="text-[11px] text-teal-700 font-medium">{sch.specializationName || "Spesialis"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <p className="font-semibold text-slate-800">{sch.polyclinicName}</p>
                        <p className="text-[10px] text-slate-400">Prefix Antrean: {sch.queuePrefix}</p>
                      </td>
                      <td className="py-4 px-6 font-mono text-slate-800 font-bold whitespace-nowrap">
                        {sch.startTime} - {sch.endTime} WIB
                      </td>
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleBookSlot(sch.doctorId, sch.polyclinicId)}
                          className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition shadow-xs"
                        >
                          Booking Slot
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <Footer />

      <BookingWizard
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        preselectedDoctorId={bookingDoctorId}
        preselectedPolyclinicId={bookingPolyId}
      />
    </div>
  );
}
