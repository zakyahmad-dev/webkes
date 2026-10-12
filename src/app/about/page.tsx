"use client";

import React, { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BookingWizard from "@/components/BookingWizard";
import {
  Award,
  ShieldCheck,
  Building2,
  Users,
  HeartHandshake,
  Stethoscope,
  Clock,
  Sparkles,
  CheckCircle2,
  PhoneCall,
  MapPin,
  Activity,
  HeartPulse,
} from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const stats = [
    { label: "Dokter Spesialis & Subspesialis", value: "35+" },
    { label: "Kapasitas Tempat Tidur (BOR Optimal)", value: "180+" },
    { label: "Pasien Terlayani per Bulan", value: "12.000+" },
    { label: "Tingkat Kepuasan Pasien (CSAT)", value: "98.7%" },
  ];

  const boardMembers = [
    {
      name: "dr. Alexander Pratama, MARS",
      role: "Direktur Utama & CEO",
      photo: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80",
      bio: "Lebih dari 20 tahun memimpin transformasi digital rumah sakit dan akreditasi internasional KARS/JCI.",
    },
    {
      name: "dr. Dimas Wicaksono, Sp.JP(K), FIHA",
      role: "Direktur Pelayanan Medis & Klinis",
      photo: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&auto=format&fit=crop&q=80",
      bio: "Pakar Kardiologi Intervensi yang mengepalai standar keselamatan pasien dan pusat serangan jantung Cath Lab 24 jam.",
    },
    {
      name: "Ns. Siti Rahayu, S.Kep, M.Kep",
      role: "Kepala Keperawatan & Triage",
      photo: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=300&auto=format&fit=crop&q=80",
      bio: "Berpengalaman mengelola protokol triage emergensi, integrasi EMR tanda vital, dan standar pelayanan ramah pasien.",
    },
    {
      name: "apt. Hendra Gunawan, S.Farm",
      role: "Kepala Instalasi Farmasi Klinis",
      photo: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=300&auto=format&fit=crop&q=80",
      bio: "Memimpin otomatisasi resep elektronik, pencegahan interaksi obat, dan persediaan farmasi presisi.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header onOpenBooking={() => setIsBookingOpen(true)} />

      {/* Hero */}
      <section className="bg-paper border-b border-sandline py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <span className="badge">Tentang HealthHub</span>
          <h1 className="display-xl max-w-3xl mx-auto">
            Pelayanan kesehatan terpadu yang berpusat pada pasien.
          </h1>
          <p className="text-sm text-ink-soft max-w-2xl mx-auto leading-relaxed">
            Berdiri dengan komitmen menghadirkan layanan medis yang tepat waktu, transparan,
            dan manusiawi — didukung teknologi yang tidak terasa menakutkan.
          </p>
        </div>
      </section>

      {/* Stats Counter */}
      <section className="py-10 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            {stats.map((stat, i) => (
              <div key={i} className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700">
                <p className="text-3xl sm:text-4xl font-black text-sky-400">{stat.value}</p>
                <p className="text-xs text-slate-300 mt-1 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Visi & Misi */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 rounded-3xl bg-gradient-to-br from-sky-50 to-teal-50 border border-sky-100 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-sky-600 text-white flex items-center justify-center">
                <HeartPulse className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Visi Kami</h3>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                Menjadi pusat rujukan medis modern berstandar internasional yang mengintegrasikan kecerdasan buatan (AI Clinical Triage), rekam medis elektronik terpadu, dan keramahan pelayanan prima bagi seluruh lapisan masyarakat.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Misi Kami</h3>
              <ul className="text-xs sm:text-sm text-slate-700 space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <span>Memberikan pelayanan klinis akurat dan etis dengan teknologi medis terkini.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <span>Menerapkan rekam medis digital (EMR) yang aman sesuai regulasi UU PDP No. 27/2022.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <span>Menghilangkan waktu tunggu antrean yang berlebihan dengan sistem cerdas terintegrasi.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Direksi & Manajemen */}
      <section className="py-16 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <h2 className="text-xs font-bold text-sky-700 uppercase tracking-widest">Pimpinan Rumah Sakit</h2>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Dewan Direksi & Manajemen Medis
            </h3>
            <p className="text-xs sm:text-sm text-slate-600">
              Dipimpin oleh dokter spesialis dan profesional manajemen berpengalaman.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {boardMembers.map((member, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-lg transition space-y-3"
              >
                <img
                  src={member.photo}
                  alt={member.name}
                  className="w-full aspect-square rounded-xl object-cover"
                />
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{member.name}</h4>
                  <p className="text-xs text-sky-700 font-semibold">{member.role}</p>
                  <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />

      <BookingWizard
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
      />
    </div>
  );
}
