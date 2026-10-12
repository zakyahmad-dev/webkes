"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BookingWizard from "@/components/BookingWizard";
import {
  ArrowRight,
  CalendarPlus,
  ChevronRight,
  Clock,
  MapPin,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  Star,
  Search,
  AlertTriangle,
  Stethoscope,
  CalendarCheck,
} from "lucide-react";

export default function HomePage() {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingDoctorId, setBookingDoctorId] = useState<number | undefined>();
  const [bookingPolyId, setBookingPolyId] = useState<number | undefined>();

  const [doctors, setDoctors] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [polyclinics, setPolyclinics] = useState<any[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [activeQueueCount, setActiveQueueCount] = useState<number>(0);

  useEffect(() => {
    fetch("/api/doctors").then((r) => r.json()).then((d) => d.success && setDoctors(d.data || []));
    fetch("/api/articles").then((r) => r.json()).then((d) => d.success && setArticles(d.data.slice(0, 3) || []));
    fetch("/api/polyclinics").then((r) => r.json()).then((d) => d.success && setPolyclinics(d.data || []));
    fetch("/api/settings").then((r) => r.json()).then((d) => d.success && setSettings(d.data || {}));
    fetch("/api/queues").then((r) => r.json()).then((d) => {
      if (d.success) {
        const active = (d.data || []).filter((q: any) => q.status === "waiting" || q.status === "serving").length;
        setActiveQueueCount(active);
      }
    });
  }, []);

  const openBooking = (docId?: number, polyId?: number) => {
    setBookingDoctorId(docId);
    setBookingPolyId(polyId);
    setIsBookingOpen(true);
  };

  const quickActions = [
    {
      icon: Search,
      title: "Cari dokter",
      desc: "Filter per poliklinik dan spesialisasi",
      href: "/doctors",
    },
    {
      icon: Clock,
      title: "Jadwal praktik mingguan",
      desc: "Lihat jam layanan tiap dokter",
      href: "/schedule",
    },
    {
      icon: CalendarCheck,
      title: "Buat janji konsultasi",
      desc: "Tiga langkah, slot terkunci otomatis",
      onClick: () => setIsBookingOpen(true),
    },
    {
      icon: Sparkles,
      title: "Konsultasi AI awal",
      desc: "Panduan memilih poli (bukan diagnosis)",
      href: "/ai-consultation",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header onOpenBooking={() => setIsBookingOpen(true)} />

      {/* ========================= HERO — split layak layanan klinis ========================= */}
      <section className="bg-paper border-b border-sandline">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 space-y-6">
              <span className="badge">{settings.accreditation ? "Terakreditasi KARS Paripurna" : "Rumah Sakit Umum & Spesialis"}</span>

              <h1 className="display-xl">
                Berobat yang jelas,
                <br />
                dari langkah pertama.
              </h1>

              <p className="text-ink-soft text-sm sm:text-base leading-relaxed max-w-lg">
                Pilih dokter spesialis dari jadwal yang transparan, booking online, dan pantau
                nomor antrean secara langsung — tanpa menelepon atau berdiri di loket.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <button onClick={() => setIsBookingOpen(true)} className="btn-primary">
                  <CalendarPlus className="w-4 h-4" />
                  Buat Janji Konsultasi
                </button>
                <Link href="/doctors" className="btn-secondary">
                  <Stethoscope className="w-4 h-4 text-teal-deep" />
                  Lihat Dokter
                </Link>
              </div>

              {/* Data nyata — diambil dari API, bukan statistik karangan */}
              <div className="pt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-ink-soft font-semibold">
                <span className="flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-teal-deep" />
                  {doctors.length > 0 ? `${doctors.length} dokter spesialis aktif` : "Dokter spesialis multidisiplin"}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-teal-deep" />
                  {activeQueueCount > 0 ? `${activeQueueCount} antrean aktif saat ini` : "Antrean real-time"}
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-deep" />
                  Rekam medis elektronik
                </span>
              </div>
            </div>

            {/* Foto fasilitas + info praktis */}
            <div className="lg:col-span-6">
              <div className="card overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1000&auto=format&fit=crop&q=80"
                  alt="Ruang perawatan Rawat Inap HealthHub dengan fasilitas modern"
                  className="w-full h-56 sm:h-72 object-cover"
                />
                <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="flex items-start gap-2.5">
                    <PhoneCall className="w-4 h-4 text-coral shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">IGD 24 Jam</p>
                      <a href={`tel:${(settings.emergency_hotline || "021-555-0119").replace(/[^\d]/g, "")}`} className="text-ink-soft hover:text-teal-deep">
                        {settings.emergency_hotline || "021-555-0119"}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-teal-deep shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Jam Poliklinik</p>
                      <p className="text-ink-soft">Senin–Sabtu 08.00–20.00</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-teal-deep shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Lokasi</p>
                      <Link href="/contact" className="text-ink-soft hover:text-teal-deep">
                        Senayan, Jakarta Pusat
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================= AKSES CEPAT ========================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((qa) => {
            const content = (
              <div className="card p-5 h-full flex flex-col gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-mist text-teal-deep flex items-center justify-center">
                  <qa.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-sm">{qa.title}</p>
                  <p className="text-xs text-ink-soft mt-1 leading-relaxed">{qa.desc}</p>
                </div>
                <span className="mt-auto flex items-center gap-1 text-xs font-bold text-teal-deep">
                  Buka <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            );
            return qa.href ? (
              <Link key={qa.title} href={qa.href}>{content}</Link>
            ) : (
              <button key={qa.title} onClick={qa.onClick} className="text-left">{content}</button>
            );
          })}
        </div>
      </section>

      {/* ========================= POLIKLINIK (data nyata API) ========================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-8">
          <div className="space-y-2">
            <span className="badge">Poliklinik tersedia</span>
            <h2 className="display-lg">Pilih sesuai keluhan Anda.</h2>
          </div>
          <Link href="/services" className="text-sm font-bold text-teal-deep hover:underline underline-offset-4 self-start sm:self-auto">
            Detail layanan <ArrowRight className="w-4 h-4 inline" />
          </Link>
        </div>

        <div className="card overflow-hidden">
          {polyclinics.length === 0 ? (
            <p className="p-6 text-sm text-ink-soft">Memuat daftar poliklinik…</p>
          ) : (
            polyclinics.map((poly, i) => (
              <button
                key={poly.id}
                onClick={() => openBooking(undefined, poly.id)}
                className={`group w-full grid grid-cols-[auto_1fr_auto] sm:grid-cols-[56px_auto_1fr_auto] items-center gap-3 sm:gap-5 px-4 sm:px-6 py-4.5 py-5 text-left transition hover:bg-teal-mist/40 ${
                  i !== polyclinics.length - 1 ? "border-b border-sandline/70" : ""
                }`}
              >
                <span className="w-10 h-10 rounded-xl bg-teal-mist text-teal-deep font-mono-alt text-xs font-bold flex items-center justify-center">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-display text-lg sm:text-xl font-semibold group-hover:text-teal-deep transition">
                  {poly.name}
                </span>
                <span className="hidden sm:block text-xs text-ink-soft truncate">
                  {poly.specializationName || "Layanan spesialis"} · {poly.doctorsCount ?? ""} dokter
                </span>
                <span className="flex items-center gap-3">
                  <span className="hidden md:inline-flex w-8 h-8 rounded-full border border-sandline font-mono-alt text-xs font-bold items-center justify-center bg-paper">
                    {poly.queuePrefix}
                  </span>
                  <ChevronRight className="w-4 h-4 text-ink-soft group-hover:text-teal-deep group-hover:translate-x-0.5 transition" />
                </span>
              </button>
            ))
          )}
        </div>
      </section>

      {/* ========================= DOKTER ========================= */}
      <section className="bg-teal-mist/50 border-y border-sandline">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-10">
            <div className="space-y-2">
              <span className="badge">Tim klinis</span>
              <h2 className="display-lg">Dokter dengan jadwal yang transparan.</h2>
              <p className="text-xs sm:text-sm text-ink-soft max-w-xl">
                Semua nama, spesialisasi, jam praktik, dan biaya diambil dari jadwal aktual rumah sakit.
              </p>
            </div>
            <Link href="/doctors" className="text-sm font-bold text-teal-deep hover:underline underline-offset-4">
              Semua dokter <ArrowRight className="w-4 h-4 inline" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {doctors.slice(0, 4).map((doc) => (
              <div key={doc.id} className="card bg-paper p-4 flex flex-col gap-3">
                <div className="relative">
                  <img
                    src={doc.photoPath || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=500"}
                    alt={`Foto ${doc.name}`}
                    className="w-full aspect-[4/4.2] rounded-xl object-cover object-top"
                  />
                  <span className="absolute top-2.5 right-2.5 badge badge-sun text-[10px] px-2 py-0.5">
                    <Star className="w-3 h-3 fill-current" /> {doc.rating || "4.9"}
                  </span>
                </div>

                <div className="flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-teal-deep">
                    {doc.specializationName}
                  </p>
                  <h3 className="font-display font-semibold leading-tight mt-0.5">{doc.name}</h3>
                  <p className="text-[11px] text-ink-soft mt-1">
                    {doc.experienceYears || 5}+ tahun praktik · {doc.polyclinicName}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-dashed border-sandline pt-3">
                  <div>
                    <p className="text-[10px] text-ink-soft">Biaya konsultasi</p>
                    <p className="font-display font-semibold text-sm">
                      Rp {Number(doc.consultationFee).toLocaleString("id-ID")}
                    </p>
                  </div>
                  <button onClick={() => openBooking(doc.id, doc.polyclinicId)} className="btn-primary btn-xs">
                    Booking
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================= AI ASSISTANT — pendukung, bukan diagnosis ========================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        <div className="card p-6 sm:p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="space-y-4">
              <span className="badge">Fitur pendukung</span>
              <h2 className="display-lg">Belum yakin harus ke poli mana?</h2>
              <p className="text-ink-soft text-sm leading-relaxed max-w-md">
                Ceritakan keluhan Anda kepada asisten AI kami. Ia akan membantu memilah tingkat
                urgensinya dan mengarahkan ke poliklinik serta dokter yang tersedia di jadwal aktual.
              </p>
              <p className="text-[11px] text-ink-soft leading-relaxed max-w-md border-l-2 border-teal-deep pl-3">
                Asisten AI memberikan panduan awal, bukan diagnosis, dan tidak menggantikan pemeriksaan dokter.
                Jika terdeteksi tanda darurat, Anda akan langsung diarahkan ke IGD.
              </p>
              <div className="flex flex-wrap gap-3 pt-1">
                <Link href="/ai-consultation" className="btn-primary">
                  <Sparkles className="w-4 h-4" /> Mulai konsultasi AI
                </Link>
                <a href={`tel:${(settings.emergency_hotline || "021-555-0119").replace(/[^\d]/g, "")}`} className="btn-emergency">
                  <PhoneCall className="w-4 h-4" /> IGD Darurat
                </a>
              </div>
            </div>

            {/* Contoh percakapan yang jujur */}
            <div className="space-y-3 max-w-md w-full">
              <div className="bg-teal-mist rounded-2xl rounded-bl-md p-4 max-w-[88%] text-xs font-medium">
                Pusing sejak dua hari, tensi di rumah sempat 150/95.
              </div>
              <div className="card !shadow-none p-4 max-w-[88%] ml-auto text-[13px] leading-relaxed">
                Gejala tersebut mengarah ke <strong>Poli Penyakit Dalam</strong>. Rekomendasi jadwal
                terdekat: <strong>dr. Sarah Wijaya, Sp.PD</strong> — beserta estimasi biaya konsultasinya.
              </div>
              <div className="bg-coral-soft border border-[#F2CDBD] text-coral-deep rounded-2xl p-4 max-w-[88%] flex items-start gap-2.5 text-[13px] font-semibold">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Jika dada nyeri menjalar ke lengan kiri: itu tanda darurat — hubungi IGD {settings.emergency_hotline || "021-555-0119"}.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================= ARTIKEL ========================= */}
      {articles.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14 sm:pb-20">
          <div className="flex items-end justify-between mb-8">
            <div className="space-y-2">
              <span className="badge">Edukasi klinis</span>
              <h2 className="display-lg">Artikel dari tim medis kami.</h2>
            </div>
            <Link href="/articles" className="text-sm font-bold text-teal-deep hover:underline underline-offset-4 hidden sm:block">
              Semua artikel <ArrowRight className="w-4 h-4 inline" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {articles.map((art) => (
              <Link key={art.id} href={`/articles/${art.slug}`} className="group">
                <div className="card overflow-hidden h-full flex flex-col">
                  <div className="aspect-[16/8] overflow-hidden border-b border-sandline">
                    <img
                      src={art.coverPath || "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800"}
                      alt={`Ilustrasi artikel: ${art.title}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                  </div>
                  <div className="p-5 flex flex-col gap-2 flex-1">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-ink-soft">
                      <span className="badge text-[9px] px-2 py-0.5">{art.category}</span>
                      <span>{art.readTimeMinutes || 4} menit baca</span>
                    </div>
                    <h3 className="font-display font-semibold leading-snug group-hover:text-teal-deep transition">
                      {art.title}
                    </h3>
                    <p className="text-xs text-ink-soft line-clamp-2 mt-auto">{art.excerpt}</p>
                    <p className="text-[11px] text-ink-soft italic-hand mt-2">oleh {art.authorName || "tim medis HealthHub"}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

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
