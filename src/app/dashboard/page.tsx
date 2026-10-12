"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PortalSidebar from "@/components/PortalSidebar";
import BookingWizard from "@/components/BookingWizard";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Stethoscope,
  Pill,
  FlaskConical,
  CreditCard,
  Bell,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  User,
  HeartPulse,
} from "lucide-react";

export default function PatientDashboardPage() {
  const { currentUser } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [labOrders, setLabOrders] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [currentUser]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const patientId = currentUser?.patientId || 1;
      const [aptRes, emrRes, rxRes, labRes, invRes] = await Promise.all([
        fetch(`/api/appointments?patientId=${patientId}`).then((r) => r.json()),
        fetch(`/api/medical-records?patientId=${patientId}`).then((r) => r.json()),
        fetch(`/api/prescriptions?patientId=${patientId}`).then((r) => r.json()),
        fetch(`/api/lab-orders?patientId=${patientId}`).then((r) => r.json()),
        fetch(`/api/invoices?patientId=${patientId}`).then((r) => r.json()),
      ]);

      if (aptRes.success) setAppointments(aptRes.data || []);
      if (emrRes.success) setMedicalRecords(emrRes.data || []);
      if (rxRes.success) setPrescriptions(rxRes.data || []);
      if (labRes.success) setLabOrders(labRes.data || []);
      if (invRes.success) setInvoices(invRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const nextAppointment = appointments.find((a) => a.status === "confirmed" || a.status === "checked_in");

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header onOpenBooking={() => setIsBookingOpen(true)} />

      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        <PortalSidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-sky-700 via-sky-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-sky-200 text-[10px] font-bold uppercase tracking-wider">
                  Portal Pasien Terverifikasi
                </span>
                <span className="text-[11px] text-teal-300 font-mono">No. RM: RM-202610-001</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                Selamat Datang, {currentUser?.name || "Budi Santoso"}
              </h1>
              <p className="text-xs text-sky-100 max-w-xl leading-relaxed">
                Kelola jadwal konsultasi dokter, pantau antrean langsung, akses rekam medis (EMR), dan riwayat obat Anda dalam satu portal yang aman.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/ai-consultation"
                className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>AI Health Triage</span>
              </Link>
              <button
                onClick={() => setIsBookingOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
              >
                <Calendar className="w-4 h-4" />
                <span>Buat Janji Baru</span>
              </button>
            </div>
          </div>

          {/* NEXT APPOINTMENT & QUEUE TICKET HIGHLIGHT */}
          {nextAppointment ? (
            <div className="bg-gradient-to-br from-sky-50 via-teal-50/40 to-white rounded-3xl border-2 border-sky-300 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-900">
                    Janji Temu Aktif Mendatang
                  </span>
                </div>
                <span className="text-xs font-bold bg-sky-600 text-white px-3 py-1 rounded-full shadow-xs">
                  {nextAppointment.status === "checked_in" ? "Telah Check-in" : "Terkonfirmasi"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-8 space-y-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={nextAppointment.doctorPhoto || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100"}
                      alt={nextAppointment.doctorName}
                      className="w-14 h-14 rounded-2xl object-cover border border-sky-200 shrink-0"
                    />
                    <div>
                      <h3 className="font-bold text-base text-slate-900">{nextAppointment.doctorName}</h3>
                      <p className="text-xs text-teal-800 font-semibold">{nextAppointment.polyclinicName}</p>
                      <p className="text-[11px] text-slate-500">Kode: {nextAppointment.appointmentCode}</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-sky-100 text-xs text-slate-700 space-y-1">
                    <p><strong>Keluhan Pasien:</strong> {nextAppointment.complaint}</p>
                    <p className="text-[11px] text-teal-700 font-medium">
                      ⏰ Smart Reminder Aktif: Pengingat otomatis terkirim ≤ 2 jam sebelum konsultasi.
                    </p>
                  </div>
                </div>

                {/* Queue Ticket Box */}
                <div className="md:col-span-4 p-5 rounded-2xl bg-white border-2 border-dashed border-sky-400 text-center space-y-2 shadow-xs">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">
                    Nomor Antrean Anda
                  </span>
                  <div className="text-4xl font-black text-sky-700 tracking-tight">
                    {nextAppointment.queueNumber || "A-014"}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Jadwal: {new Date(nextAppointment.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} WIB
                  </p>
                  <Link
                    href="/queue"
                    className="block w-full py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                  >
                    Buka Live Antrean Poli
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Belum Ada Janji Temu Aktif Hari Ini</h3>
                  <p className="text-xs text-slate-500">Pilih dokter spesialis untuk membuat jadwal kunjungan baru.</p>
                </div>
              </div>
              <button
                onClick={() => setIsBookingOpen(true)}
                className="px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-bold hover:bg-sky-700 transition"
              >
                Booking Dokter
              </button>
            </div>
          )}

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/medical-records"
              className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-sky-400 shadow-xs hover:shadow-md transition space-y-2 group"
            >
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-110 transition">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">{medicalRecords.length}</p>
                <p className="text-xs font-semibold text-slate-500">Rekam Medis (EMR)</p>
              </div>
            </Link>

            <Link
              href="/prescriptions"
              className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-amber-400 shadow-xs hover:shadow-md transition space-y-2 group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition">
                <Pill className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">{prescriptions.length}</p>
                <p className="text-xs font-semibold text-slate-500">Resep Obat Digital</p>
              </div>
            </Link>

            <Link
              href="/laboratory"
              className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-teal-400 shadow-xs hover:shadow-md transition space-y-2 group"
            >
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-110 transition">
                <FlaskConical className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">{labOrders.length}</p>
                <p className="text-xs font-semibold text-slate-500">Hasil Laboratorium</p>
              </div>
            </Link>

            <Link
              href="/payments"
              className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-emerald-400 shadow-xs hover:shadow-md transition space-y-2 group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">{invoices.length}</p>
                <p className="text-xs font-semibold text-slate-500">Riwayat Tagihan</p>
              </div>
            </Link>
          </div>

          {/* Recent Medical History & Prescriptions preview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* EMR Snapshot */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-sky-600" />
                  <span>Riwayat Pemeriksaan Terakhir</span>
                </h3>
                <Link href="/medical-records" className="text-xs text-sky-600 hover:underline font-semibold">
                  Semua EMR →
                </Link>
              </div>

              {medicalRecords.length > 0 ? (
                <div className="space-y-3">
                  {medicalRecords.slice(0, 2).map((rec) => (
                    <div key={rec.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-900">{rec.visitDate} · {rec.doctorName}</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          Final EMR
                        </span>
                      </div>
                      <p className="text-slate-600 line-clamp-2"><strong>Keluhan:</strong> {rec.complaint}</p>
                      {rec.diagnoses && rec.diagnoses.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {rec.diagnoses.map((d: any, idx: number) => (
                            <span key={idx} className="bg-sky-100 text-sky-800 px-2 py-0.5 rounded text-[10px] font-medium font-mono">
                              ICD-10: {d.code} {d.description}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-6 text-center">Belum ada riwayat rekam medis.</p>
              )}
            </div>

            {/* Prescriptions Snapshot */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Pill className="w-4 h-4 text-amber-600" />
                  <span>Resep Obat & Dispensing</span>
                </h3>
                <Link href="/prescriptions" className="text-xs text-sky-600 hover:underline font-semibold">
                  Lihat Resep →
                </Link>
              </div>

              {prescriptions.length > 0 ? (
                <div className="space-y-3">
                  {prescriptions.slice(0, 2).map((rx) => (
                    <div key={rx.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-900">{rx.prescriptionCode}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          rx.status === "completed" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                        }`}>
                          {rx.status}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px]">Diresepkan oleh {rx.doctorName}</p>
                      {rx.items && (
                        <div className="space-y-1 pt-1">
                          {rx.items.slice(0, 2).map((item: any) => (
                            <div key={item.id} className="flex justify-between text-slate-700">
                              <span>• {item.medicineName} ({item.dose})</span>
                              <span className="font-medium text-slate-500">{item.frequency}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-6 text-center">Belum ada resep obat tercatat.</p>
              )}
            </div>
          </div>
        </main>
      </div>

      <Footer />

      <BookingWizard
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        onBookingSuccess={() => fetchDashboardData()}
      />
    </div>
  );
}
