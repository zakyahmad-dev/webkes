"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BookingWizard from "@/components/BookingWizard";
import Link from "next/link";
import {
  Search,
  Calendar,
  Star,
  Stethoscope,
  Filter,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [polyclinics, setPolyclinics] = useState<any[]>([]);
  const [selectedPolyId, setSelectedPolyId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Booking Wizard
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<number | undefined>();
  const [selectedDocPolyId, setSelectedDocPolyId] = useState<number | undefined>();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [docRes, polyRes] = await Promise.all([
        fetch("/api/doctors").then((r) => r.json()),
        fetch("/api/polyclinics").then((r) => r.json()),
      ]);

      if (docRes.success) setDoctors(docRes.data || []);
      if (polyRes.success) setPolyclinics(polyRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredDoctors = doctors.filter((doc) => {
    const matchesPoly = selectedPolyId === "all" || doc.polyclinicId === Number(selectedPolyId);
    const matchesQuery =
      !searchQuery ||
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.specializationName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.polyclinicName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPoly && matchesQuery;
  });

  const handleBook = (docId: number, polyId: number) => {
    setSelectedDocId(docId);
    setSelectedDocPolyId(polyId);
    setIsBookingOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header onOpenBooking={() => setIsBookingOpen(true)} />

      {/* Hero Header */}
      <section className="pt-12 pb-8 border-b border-sandline bg-paper">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <span className="sticker">Direktori Medis</span>
              <h1 className="display-lg">
                Temukan dokter yang <em className="italic-hand text-teal-deep">klik</em> sama kamu.
              </h1>
              <p className="text-xs sm:text-sm text-ink-soft max-w-xl">
                Cari jadwal praktik dokter spesialis dan konsultan. Booking instan — slot terkunci otomatis.
              </p>
            </div>

            <Link href="/ai-consultation" className="btn-ghost-line shrink-0 btn-sm">
              <Sparkles className="w-4 h-4 text-teal-deep" />
              <span>Bingung pilih? Tanya AI</span>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="pt-2">
            <div className="relative max-w-2xl">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama dokter, spesialisasi (contoh: Jantung, Anak, Saraf, dr. Sarah)..."
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border border-slate-300 text-sm shadow-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Polyclinic Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1">
            <button
              onClick={() => setSelectedPolyId("all")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedPolyId === "all"
                  ? "bg-teal-deep text-white"
                  : "bg-paper text-ink border border-sandline hover:border-teal-deep hover:text-teal-deep"
              }`}
            >
              Semua Poliklinik ({doctors.length})
            </button>
            {polyclinics.map((p) => {
              const isSelected = selectedPolyId === String(p.id);
              const count = doctors.filter((d) => d.polyclinicId === p.id).length;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPolyId(String(p.id))}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    isSelected
                      ? "bg-teal-deep text-white"
                      : "bg-paper text-ink border border-sandline hover:border-teal-deep hover:text-teal-deep"
                  }`}
                >
                  {p.name} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Doctor Cards Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="text-center py-20">
            <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500 font-medium">Memuat daftar dokter spesialis...</p>
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 max-w-md mx-auto space-y-3">
            <Stethoscope className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-800 text-base">Tidak Ada Dokter yang Ditemukan</h3>
            <p className="text-xs text-slate-500">
              Coba gunakan kata kunci pencarian lain atau pilih poliklinik yang berbeda.
            </p>
            <button
              onClick={() => {
                setSelectedPolyId("all");
                setSearchQuery("");
              }}
              className="px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700 transition"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDoctors.map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-xl transition duration-200 overflow-hidden flex flex-col justify-between"
              >
                <div className="p-6 space-y-4">
                  {/* Doctor Profile Header */}
                  <div className="flex items-start gap-4">
                    <img
                      src={doc.photoPath || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200"}
                      alt={doc.name}
                      className="w-18 h-18 rounded-2xl object-cover border-2 border-sky-100 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 text-[10px] font-bold uppercase tracking-wider">
                        {doc.specializationName || "Dokter Spesialis"}
                      </span>
                      <h3 className="font-black text-slate-900 text-base mt-1 line-clamp-1">{doc.name}</h3>
                      <p className="text-xs text-sky-700 font-semibold">{doc.polyclinicName}</p>
                      <div className="flex items-center gap-1.5 text-xs text-amber-600 font-bold mt-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{doc.rating || "4.9"}</span>
                        <span className="text-[10px] text-slate-400 font-normal">({doc.reviewsCount || 120} ulasan)</span>
                      </div>
                    </div>
                  </div>

                  {/* Bio & Credentials */}
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {doc.bio}
                  </p>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-[11px] text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Pengalaman:</span>
                      <span className="font-bold text-slate-800">{doc.experienceYears || 5}+ Tahun</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">No. STR:</span>
                      <span className="font-mono text-slate-700">{doc.strNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Lokasi:</span>
                      <span className="font-medium text-slate-800">{doc.polyclinicLocation || "Lantai 2"}</span>
                    </div>
                  </div>

                  {/* Consultation Fee */}
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Biaya Konsultasi</span>
                      <span className="text-sm font-black text-sky-700">
                        Rp {Number(doc.consultationFee).toLocaleString("id-ID")}
                      </span>
                    </div>
                    <span className="badge text-[10px]">
                      Lihat jadwal
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-6 pt-0 flex gap-2">
                  <Link
                    href={`/doctors/${doc.id}`}
                    className="btn-secondary btn-xs flex-1"
                  >
                    <span>Profil & Jadwal</span>
                  </Link>

                  <button
                    onClick={() => handleBook(doc.id, doc.polyclinicId)}
                    className="btn-primary btn-xs flex-1"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Buat Janji</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />

      <BookingWizard
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        preselectedDoctorId={selectedDocId}
        preselectedPolyclinicId={selectedDocPolyId}
      />
    </div>
  );
}
