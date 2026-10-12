"use client";

import React, { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BookingWizard from "@/components/BookingWizard";
import {
  PhoneCall,
  Mail,
  MapPin,
  Clock,
  Ambulance,
  Send,
  CheckCircle2,
  AlertTriangle,
  Building,
} from "lucide-react";

export default function ContactPage() {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [ambulanceRequested, setAmbulanceRequested] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);

  // Form states
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientAddress, setPatientAddress] = useState("");
  const [emergencyNotes, setEmergencyNotes] = useState("");

  const handleAmbulanceRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setAmbulanceRequested(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header onOpenBooking={() => setIsBookingOpen(true)} />

      {/* Hero */}
      <section className="bg-paper border-b border-sandline py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <span className="badge">Kontak & Lokasi</span>
          <h1 className="display-lg">
            Hubungi kami — darurat maupun sekadar bertanya.
          </h1>
          <p className="text-xs sm:text-sm text-ink-soft max-w-xl mx-auto">
            Tim medis dan layanan pelanggan siap membantu kebutuhan informasi dan emergensi Anda setiap saat.
          </p>
        </div>
      </section>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Contact Cards & Ambulance Dispatch */}
          <div className="lg:col-span-6 space-y-6">
            {/* IGD Emergency Box */}
            <div className="p-6 rounded-3xl bg-rose-600 text-white shadow-xl shadow-rose-600/20 space-y-3">
              <div className="flex items-center gap-2 text-rose-200 font-bold text-xs uppercase tracking-wider">
                <PhoneCall className="w-5 h-5 animate-bounce" />
                <span>Pusat Panggilan Darurat (IGD 24 Jam)</span>
              </div>
              <h2 className="text-3xl font-black tracking-tight text-white">021-555-0119 / 119</h2>
              <p className="text-xs text-rose-100 leading-relaxed">
                Siaga 24 jam dengan tim dokter spesialis emergensi, ruang resusitasi kritis, dan respons cepat ambulans.
              </p>
              <a
                href="tel:0215550119"
                className="inline-block px-5 py-2.5 rounded-xl bg-white text-rose-700 font-black text-xs hover:bg-rose-50 transition shadow-xs"
              >
                Panggil IGD Sekarang
              </a>
            </div>

            {/* Quick Contact Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2">
                <MapPin className="w-6 h-6 text-sky-600" />
                <h3 className="font-bold text-sm text-slate-900">Alamat Rumah Sakit</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Jl. Sudirman Boulevard No. 88, Senayan, Jakarta Pusat 10270 (Dekat Pintu MRT)
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2">
                <Clock className="w-6 h-6 text-teal-600" />
                <h3 className="font-bold text-sm text-slate-900">Jam Layanan</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Poliklinik: Senin - Sabtu (08:00 - 20:00 WIB)<br />
                  IGD, Rawat Inap & Farmasi: 24 Jam
                </p>
              </div>
            </div>

            {/* Interactive Ambulance Request Simulator */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                  <Ambulance className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Permintaan Penjemputan Ambulans</h3>
                  <p className="text-[11px] text-slate-500">Dispatch terkoordinasi langsung dengan Command Center IGD.</p>
                </div>
              </div>

              {ambulanceRequested ? (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-2 text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto animate-bounce" />
                  <p className="font-bold text-sm">Ambulans Sedang Diberangkatkan!</p>
                  <p>
                    Unit Ambulans Reaksi Cepat #AMB-04 telah diberangkatkan ke lokasi <strong>{patientAddress}</strong>. Tim paramedis sedang menghubungi nomor <strong>{patientPhone}</strong>.
                  </p>
                  <button
                    onClick={() => setAmbulanceRequested(false)}
                    className="mt-2 px-3 py-1 bg-white text-emerald-700 font-bold rounded-lg border border-emerald-300 text-[11px]"
                  >
                    Reset Permintaan
                  </button>
                </div>
              ) : (
                <form onSubmit={handleAmbulanceRequest} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nama Pasien / Pelapor</label>
                    <input
                      type="text"
                      required
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="Contoh: Ibu Rina (Keluarga Pasien)"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Nomor Telepon Aktif</label>
                      <input
                        type="tel"
                        required
                        value={patientPhone}
                        onChange={(e) => setPatientPhone(e.target.value)}
                        placeholder="0812xxxxxxxx"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Kondisi Kegawatan</label>
                      <select
                        value={emergencyNotes}
                        onChange={(e) => setEmergencyNotes(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                      >
                        <option value="Jantung / Nyeri Dada">Sindrom Koroner / Nyeri Dada Akut</option>
                        <option value="Stroke / Penurunan Kesadaran">Stroke / Mati Rasa Mendadak</option>
                        <option value="Sesak Napas Berat">Sesak Napas Berat / Asma Akut</option>
                        <option value="Trauma / Kecelakaan">Trauma / Patah Tulang / Perdarahan</option>
                        <option value="Lainnya">Kondisi Darurat Lainnya</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Alamat Lengkap Penjemputan</label>
                    <input
                      type="text"
                      required
                      value={patientAddress}
                      onChange={(e) => setPatientAddress(e.target.value)}
                      placeholder="Nama jalan, nomor rumah, patokan..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
                  >
                    <Ambulance className="w-4 h-4" />
                    <span>Kirim Permintaan Ambulans Sekarang</span>
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Right Column: Feedback Form & Location Representation */}
          <div className="lg:col-span-6 space-y-6">
            {/* Feedback / Customer Care Box */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Formulir Pesan & Masukan Pasien</h3>
                  <p className="text-[11px] text-slate-500">Tim Customer Care akan merespons dalam waktu 1x24 jam.</p>
                </div>
              </div>

              {feedbackSent ? (
                <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-sky-900 text-xs text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-sky-600 mx-auto" />
                  <p className="font-bold">Terima kasih atas pesan Anda!</p>
                  <p>Pesan Anda telah kami terima dan diteruskan ke manajemen pelayanan pelanggan.</p>
                  <button
                    onClick={() => setFeedbackSent(false)}
                    className="mt-2 px-3 py-1 bg-white text-sky-700 font-bold rounded-lg border border-sky-300 text-[11px]"
                  >
                    Kirim Pesan Lain
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setFeedbackSent(true);
                  }}
                  className="space-y-3 text-xs"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                      <input
                        type="text"
                        required
                        placeholder="Nama Anda"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Alamat Email</label>
                      <input
                        type="email"
                        required
                        placeholder="email@domain.com"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Topik Pesan</label>
                    <select className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-hidden">
                      <option>Pertanyaan Jadwal & Tarif Layanan</option>
                      <option>Klaim Asuransi & BPJS Kesehatan</option>
                      <option>Saran & Apresiasi Pelayanan</option>
                      <option>Lainnya</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Isi Pesan</label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Tuliskan pertanyaan atau masukan Anda..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Kirim Pesan</span>
                  </button>
                </form>
              )}
            </div>

            {/* Map representation placeholder */}
            <div className="p-6 rounded-3xl bg-slate-900 text-white space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-400">
                <MapPin className="w-4 h-4" />
                <span>Peta Navigasi Rumah Sakit</span>
              </div>
              <p className="text-xs text-slate-300">
                Terletak di pusat Jakarta dengan akses mudah via Stasiun MRT Senayan (Exit B) dan Halte TransJakarta Polda Metro Jaya.
              </p>
              <div className="aspect-16/9 rounded-2xl bg-slate-800 border border-slate-700 flex flex-col items-center justify-center text-slate-400 text-xs p-4 text-center">
                <Building className="w-10 h-10 text-sky-400 mb-2" />
                <strong className="text-white">HealthHub Specialist Hospital & Trauma Center</strong>
                <span>Jl. Sudirman Boulevard No. 88, Senayan, Jakarta Pusat</span>
                <span className="text-[10px] text-teal-400 mt-1">Koordinat: -6.2251° S, 106.8042° E</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <BookingWizard
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
      />
    </div>
  );
}
