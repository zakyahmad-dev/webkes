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
  CheckCircle2,
  XCircle,
  AlertCircle,
  Stethoscope,
  Plus,
  Ticket,
  ChevronRight,
} from "lucide-react";

export default function PatientAppointmentsPage() {
  const { currentUser } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [cancelModalId, setCancelModalId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, [currentUser]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const patientId = currentUser?.patientId || 1;
      const res = await fetch(`/api/appointments?patientId=${patientId}`);
      const json = await res.json();
      if (json.success) setAppointments(json.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelModalId) return;
    try {
      setCancelling(true);
      const res = await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: cancelModalId,
          status: "cancelled",
          cancelReason: cancelReason || "Dibatalkan oleh pasien",
          cancelledBy: currentUser?.id,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setCancelModalId(null);
        setCancelReason("");
        fetchAppointments();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header onOpenBooking={() => setIsBookingOpen(true)} />

      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        <PortalSidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Daftar Janji Temu Saya
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Riwayat dan status jadwal janji temu konsultasi dokter spesialis Anda.
              </p>
            </div>

            <button
              onClick={() => setIsBookingOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Janji Temu Baru</span>
            </button>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500">Memuat janji temu...</p>
            </div>
          ) : appointments.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800 text-sm">Belum Ada Janji Temu</h3>
              <p className="text-xs text-slate-500">Anda belum memiliki riwayat atau jadwal janji temu dokter.</p>
              <button
                onClick={() => setIsBookingOpen(true)}
                className="px-4 py-2 bg-sky-600 text-white font-bold text-xs rounded-xl hover:bg-sky-700 transition"
              >
                Buat Janji Sekarang
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((apt) => {
                const isConfirmed = apt.status === "confirmed";
                const isCheckedIn = apt.status === "checked_in";
                const isCompleted = apt.status === "completed";
                const isCancelled = apt.status === "cancelled";

                return (
                  <div
                    key={apt.id}
                    className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs hover:shadow-md transition space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-sky-800 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200">
                          {apt.appointmentCode}
                        </span>
                        <span className="text-xs text-slate-500">
                          Sumber: <strong>{apt.source.toUpperCase()}</strong>
                        </span>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase w-fit ${
                          isConfirmed
                            ? "bg-sky-100 text-sky-800 border border-sky-300"
                            : isCheckedIn
                            ? "bg-teal-100 text-teal-800 border border-teal-300"
                            : isCompleted
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : "bg-rose-100 text-rose-800 border border-rose-300"
                        }`}
                      >
                        {apt.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                      <div className="md:col-span-8 flex items-start gap-4">
                        <img
                          src={apt.doctorPhoto || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=120"}
                          alt={apt.doctorName}
                          className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shrink-0"
                        />
                        <div className="space-y-1">
                          <h3 className="font-bold text-sm sm:text-base text-slate-900">{apt.doctorName}</h3>
                          <p className="text-xs text-teal-700 font-semibold">{apt.polyclinicName}</p>
                          <div className="flex items-center gap-3 text-xs text-slate-600 pt-1">
                            <span className="flex items-center gap-1 font-semibold text-sky-700">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(apt.scheduledAt).toLocaleDateString("id-ID", { dateStyle: "long" })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              {new Date(apt.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} WIB
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 pt-1">
                            <strong>Keluhan:</strong> {apt.complaint}
                          </p>
                        </div>
                      </div>

                      {/* Queue code and action */}
                      <div className="md:col-span-4 flex flex-col items-center md:items-end justify-center gap-2">
                        <div className="p-3 bg-gradient-to-br from-sky-50 to-teal-50 border border-sky-200 rounded-2xl text-center w-full max-w-[200px]">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Antrean</span>
                          <span className="text-2xl font-black text-sky-800">{apt.queueNumber}</span>
                        </div>

                        {isConfirmed && (
                          <div className="flex gap-2 w-full max-w-[200px]">
                            <Link
                              href="/queue"
                              className="flex-1 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-center text-xs font-bold transition"
                            >
                              Live Antrean
                            </Link>
                            <button
                              onClick={() => setCancelModalId(apt.id)}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition border border-rose-200"
                            >
                              Batal
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Cancel Modal */}
      {cancelModalId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 border border-slate-200 shadow-2xl">
            <h3 className="font-bold text-base text-slate-900">Batalkan Janji Temu?</h3>
            <p className="text-xs text-slate-600">
              Apakah Anda yakin ingin membatalkan jadwal janji temu ini? Slot dan antrean Anda akan dilepaskan kembali ke sistem.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Alasan Pembatalan</label>
              <textarea
                rows={2}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Contoh: Ada keperluan mendadak / ganti tanggal..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setCancelModalId(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
              >
                Kembali
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition"
              >
                {cancelling ? "Membatalkan..." : "Ya, Batalkan Janji"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />

      <BookingWizard
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        onBookingSuccess={() => fetchAppointments()}
      />
    </div>
  );
}
