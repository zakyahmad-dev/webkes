"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BookingWizard from "@/components/BookingWizard";
import Link from "next/link";
import {
  Star,
  Calendar,
  Clock,
  ShieldCheck,
  Award,
  GraduationCap,
  MapPin,
  Stethoscope,
  ChevronLeft,
  CheckCircle2,
  PhoneCall,
  Sparkles,
} from "lucide-react";

export default function DoctorDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [doctor, setDoctor] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetch(`/api/doctors/${id}`)
        .then((r) => r.json())
        .then((res) => {
          if (res.success) setDoctor(res.data);
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  const daysMap = ["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-xl font-bold text-slate-800">Dokter tidak ditemukan</h2>
          <Link href="/doctors" className="mt-4 text-xs font-semibold text-sky-600 hover:underline">
            ← Kembali ke direktori dokter
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header onOpenBooking={() => setIsBookingOpen(true)} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Link
          href="/doctors"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 hover:underline"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Dokter</span>
        </Link>

        {/* Doctor Hero Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-4 flex justify-center">
              <img
                src={doctor.photoPath || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400"}
                alt={doctor.name}
                className="w-48 h-48 sm:w-60 sm:h-60 rounded-3xl object-cover border-4 border-sky-100 shadow-md"
              />
            </div>

            <div className="md:col-span-8 space-y-4">
              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-bold uppercase tracking-wider">
                  {doctor.specializationName || "Dokter Spesialis"}
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">{doctor.name}</h1>
                <p className="text-sm text-sky-700 font-bold">{doctor.polyclinicName} · {doctor.polyclinicLocation || "Gedung A"}</p>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                <div className="flex items-center gap-1 text-amber-500 font-bold bg-amber-50 px-2.5 py-1 rounded-lg">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span>{doctor.rating || "4.9"}</span>
                  <span className="text-slate-400 font-normal">({doctor.reviewsCount || 120} ulasan)</span>
                </div>
                <div className="bg-slate-100 px-2.5 py-1 rounded-lg font-medium">
                  Pengalaman: <strong>{doctor.experienceYears || 5}+ Tahun</strong>
                </div>
                <div className="bg-slate-100 px-2.5 py-1 rounded-lg font-mono text-[11px]">
                  STR: <strong>{doctor.strNumber}</strong>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {doctor.bio}
              </p>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100">
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Biaya Konsultasi Medis</span>
                  <span className="text-xl font-black text-sky-700">
                    Rp {Number(doctor.consultationFee).toLocaleString("id-ID")}
                  </span>
                </div>

                <button
                  onClick={() => setIsBookingOpen(true)}
                  className="px-6 py-3 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Pilih Slot Janji Temu</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Schedule Matrix & Education Details */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Weekly Schedule */}
          <div className="md:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-sky-600" />
                <span>Jadwal Praktik Mingguan</span>
              </h3>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                Sistem Slot 30 Menit
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {doctor.schedules && doctor.schedules.length > 0 ? (
                doctor.schedules.map((sch: any) => (
                  <div key={sch.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="font-bold text-slate-900 w-24">
                      {daysMap[sch.dayOfWeek] || "Hari"}
                    </div>
                    <div className="text-slate-600 font-medium">
                      {sch.startTime} - {sch.endTime} WIB
                    </div>
                    <button
                      onClick={() => setIsBookingOpen(true)}
                      className="px-3 py-1 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-600 hover:text-white font-bold text-[11px] transition"
                    >
                      Pilih Slot
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 py-4">Jadwal praktik dokter sedang diperbarui.</p>
              )}
            </div>
          </div>

          {/* Education & Credentials */}
          <div className="md:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-teal-600" />
              <span>Riwayat Pendidikan & Fellowship</span>
            </h3>

            <div className="space-y-3">
              {doctor.education && Array.isArray(doctor.education) ? (
                doctor.education.map((edu: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <span>{edu}</span>
                  </div>
                ))
              ) : (
                <div className="flex items-start gap-2.5 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <span>Fakultas Kedokteran Universitas Terkemuka & Pelatihan Klinis Terakreditasi</span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
              <p><strong>Nomor SIP:</strong> {doctor.sipNumber}</p>
              <p><strong>Status Praktik:</strong> Aktif Berpraktik di HealthHub Hospital</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <BookingWizard
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        preselectedDoctorId={doctor.id}
        preselectedPolyclinicId={doctor.polyclinicId}
      />
    </div>
  );
}
