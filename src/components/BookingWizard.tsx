"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  X,
  Calendar,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Clock,
  Star,
} from "lucide-react";
import Link from "next/link";

interface PolyclinicItem {
  id: number;
  name: string;
  slug: string;
  queuePrefix: string;
  specializationName?: string;
}

interface DoctorItem {
  id: number;
  name: string;
  titleSuffix?: string | null;
  photoPath?: string | null;
  specializationName?: string;
  polyclinicId: number;
  polyclinicName?: string;
  consultationFee: string;
  rating?: string | null;
  experienceYears?: number | null;
}

interface BookingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedDoctorId?: number;
  preselectedPolyclinicId?: number;
  initialComplaint?: string;
  onBookingSuccess?: (appointment: any) => void;
}

const STEP_LABELS = ["Poliklinik", "Dokter", "Jadwal", "Keluhan & konfirmasi"];

export default function BookingWizard({
  isOpen,
  onClose,
  preselectedDoctorId,
  preselectedPolyclinicId,
  initialComplaint = "",
  onBookingSuccess,
}: BookingWizardProps) {
  const { currentUser } = useAuth();

  const [step, setStep] = useState(1);
  const [polyclinics, setPolyclinics] = useState<PolyclinicItem[]>([]);
  const [doctors, setDoctors] = useState<DoctorItem[]>([]);

  const [selectedPolyId, setSelectedPolyId] = useState<number | null>(preselectedPolyclinicId || null);
  const [selectedDocId, setSelectedDocId] = useState<number | null>(preselectedDoctorId || null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<string>("09:00");
  const [complaint, setComplaint] = useState(initialComplaint);
  const [bookingResult, setBookingResult] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const timeSlots = ["08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "13:30", "14:00", "14:30", "15:00", "15:30"];

  useEffect(() => {
    if (isOpen) {
      fetch("/api/polyclinics").then((r) => r.json()).then((d) => d.success && setPolyclinics(d.data || []));
      fetch("/api/doctors").then((r) => r.json()).then((d) => d.success && setDoctors(d.data || []));

      setSelectedDate(new Date().toISOString().split("T")[0]);
      if (initialComplaint) setComplaint(initialComplaint);
      if (preselectedDoctorId) {
        setSelectedDocId(preselectedDoctorId);
        setStep(3);
      } else if (preselectedPolyclinicId) {
        setSelectedPolyId(preselectedPolyclinicId);
        setStep(2);
      } else {
        setStep(1);
      }
      setBookingResult(null);
      setErrorMsg("");
    }
  }, [isOpen, preselectedDoctorId, preselectedPolyclinicId, initialComplaint]);

  if (!isOpen) return null;

  const filteredDoctors = selectedPolyId
    ? doctors.filter((d) => d.polyclinicId === selectedPolyId)
    : doctors;

  const selectedDoctor = doctors.find((d) => d.id === selectedDocId);
  const selectedPoly = polyclinics.find((p) => p.id === (selectedPolyId || selectedDoctor?.polyclinicId));

  const handleConfirmBooking = async () => {
    if (!selectedDocId || !selectedPoly || !selectedDate || !complaint.trim()) {
      setErrorMsg("Mohon lengkapi semua rincian booking sebelum konfirmasi.");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg("");

      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: currentUser?.patientId || 1,
          doctorId: selectedDocId,
          polyclinicId: selectedPoly.id,
          scheduledAt: `${selectedDate}T${selectedSlot}:00Z`,
          slotTime: selectedSlot,
          complaint,
          source: initialComplaint ? "ai" : "web",
          userId: currentUser?.id || 11,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setErrorMsg(json.message || "Gagal membuat janji temu. Silakan coba slot lain.");
        return; // JANGAN tampilkan tiket jika server tidak mengonfirmasi
      }

      setBookingResult(json.data);
      onBookingSuccess?.(json.data);
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi gangguan koneksi. Silakan coba sesaat lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-ink/50 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Buat janji temu dokter">
      <div className="bg-paper rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-sandline">
        {/* Header kalem */}
        <div className="bg-paper border-b border-sandline px-6 py-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-lg font-semibold flex items-center gap-2">
              <Calendar className="w-4.5 h-4.5 w-5 h-5 text-teal-deep" />
              Buat Janji Temu Dokter
            </h3>
            <p className="text-xs text-ink-soft mt-0.5">
              Nomor antrean dan pengingat otomatis diterbitkan setelah server mengonfirmasi slot Anda.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup formulir booking"
            className="w-9 h-9 rounded-xl border border-sandline bg-paper hover:bg-teal-mist flex items-center justify-center"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Stepper */}
        {!bookingResult && (
          <div className="px-6 py-3 border-b border-sandline bg-teal-mist/40">
            <ol className="flex items-center justify-between text-[11px] font-bold text-ink-soft" aria-label="Tahapan booking">
              {STEP_LABELS.map((label, i) => (
                <li key={label} className={`flex items-center gap-1.5 ${step >= i + 1 ? "text-teal-deep" : ""}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    step >= i + 1 ? "bg-teal-deep text-white" : "bg-sandline/60"
                  }`}>
                    {i + 1}
                  </span>
                  <span className="hidden sm:inline">{label}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-coral-soft border border-[#F2CDBD] text-coral-deep text-xs flex items-start gap-2" role="alert">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* LANGKAH 1 — poli */}
          {!bookingResult && step === 1 && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold">1. Pilih poliklinik tujuan</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                {polyclinics.map((poly) => (
                  <button
                    key={poly.id}
                    onClick={() => { setSelectedPolyId(poly.id); setSelectedDocId(null); setStep(2); }}
                    className={`p-4 rounded-xl border text-left transition flex items-center justify-between ${
                      selectedPolyId === poly.id
                        ? "border-teal-deep bg-teal-mist/70 ring-2 ring-teal-deep/20"
                        : "border-sandline bg-paper hover:border-teal-deep"
                    }`}
                  >
                    <div>
                      <p className="font-bold text-sm">{poly.name}</p>
                      <p className="text-[11px] text-ink-soft mt-0.5">{poly.specializationName || "Layanan spesialis"}</p>
                      <span className="inline-block mt-2 badge text-[10px] py-0.5">
                        Prefix antrean {poly.queuePrefix}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-ink-soft shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* LANGKAH 2 — dokter */}
          {!bookingResult && step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold">2. Pilih dokter — {selectedPoly?.name}</h4>
                <button onClick={() => setStep(1)} className="text-xs font-bold text-teal-deep hover:underline underline-offset-3 flex items-center gap-1">
                  <ChevronLeft className="w-3.5 h-3.5" /> Ganti poli
                </button>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {filteredDoctors.length === 0 ? (
                  <p className="text-xs text-ink-soft text-center py-6">Belum ada dokter aktif di poliklinik ini.</p>
                ) : (
                  filteredDoctors.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => { setSelectedDocId(doc.id); setStep(3); }}
                      className={`w-full p-4 rounded-xl border text-left transition flex items-center gap-4 ${
                        selectedDocId === doc.id
                          ? "border-teal-deep bg-teal-mist/70 ring-2 ring-teal-deep/20"
                          : "border-sandline bg-paper hover:border-teal-deep"
                      }`}
                    >
                      <img
                        src={doc.photoPath || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=120"}
                        alt={`Foto ${doc.name}`}
                        className="w-14 h-14 rounded-full object-cover border border-sandline shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{doc.name}</p>
                        <p className="text-[11px] text-teal-deep font-semibold">{doc.specializationName}</p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-[11px] text-ink-soft">
                          <span className="flex items-center gap-1"><Star className="w-3 h-3 text-sun fill-sun" />{doc.rating}</span>
                          <span>{doc.experienceYears}+ thn</span>
                          <span className="font-bold text-ink">Rp {Number(doc.consultationFee).toLocaleString("id-ID")}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-ink-soft shrink-0" />
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* LANGKAH 3 — jadwal */}
          {!bookingResult && step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold">3. Pilih tanggal & jam</h4>
                <button onClick={() => setStep(preselectedDoctorId ? 1 : 2)} className="text-xs font-bold text-teal-deep hover:underline underline-offset-3 flex items-center gap-1">
                  <ChevronLeft className="w-3.5 h-3.5" /> Kembali
                </button>
              </div>

              {selectedDoctor && (
                <div className="p-3 rounded-xl bg-teal-mist/70 border border-teal-soft flex items-center gap-3 text-xs">
                  <img
                    src={selectedDoctor.photoPath || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100"}
                    alt=""
                    className="w-9 h-9 rounded-full object-cover border border-sandline"
                  />
                  <div>
                    <p className="font-bold">{selectedDoctor.name}</p>
                    <p className="text-ink-soft">{selectedPoly?.name} · Rp {Number(selectedDoctor.consultationFee).toLocaleString("id-ID")}</p>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="booking-date" className="block text-xs font-bold mb-1.5">Tanggal kunjungan</label>
                <input
                  id="booking-date"
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="input-calm"
                />
              </div>

              <div>
                <span className="block text-xs font-bold mb-1.5">Jam konsultasi (durasi 30 menit)</span>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2" role="radiogroup" aria-label="Pilih slot waktu">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      role="radio"
                      aria-checked={selectedSlot === slot}
                      onClick={() => setSelectedSlot(slot)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition ${
                        selectedSlot === slot
                          ? "bg-teal-deep text-white"
                          : "bg-paper border border-sandline hover:border-teal-deep"
                      }`}
                    >
                      {slot} WIB
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={() => setStep(4)} className="btn-primary w-full">
                <span>Lanjut ke keluhan & konfirmasi</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* LANGKAH 4 — keluhan & konfirmasi */}
          {!bookingResult && step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold">4. Keluhan & konfirmasi akhir</h4>
                <button onClick={() => setStep(3)} className="text-xs font-bold text-teal-deep hover:underline underline-offset-3 flex items-center gap-1">
                  <ChevronLeft className="w-3.5 h-3.5" /> Ubah jadwal
                </button>
              </div>

              {/* Ringkasan */}
              <div className="card p-4 space-y-2 text-xs" aria-label="Ringkasan booking">
                {[
                  ["Pasien", currentUser?.name || "Budi Santoso (demo)"],
                  ["Poliklinik", selectedPoly?.name],
                  ["Dokter", selectedDoctor?.name],
                  ["Waktu", `${selectedDate} · ${selectedSlot} WIB (30 mnt)`],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4">
                    <span className="text-ink-soft">{k}</span>
                    <span className="font-bold text-right">{v}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-dashed border-sandline pt-2 mt-1 font-bold">
                  <span>Biaya konsultasi</span>
                  <span className="text-teal-deep">Rp {Number(selectedDoctor?.consultationFee || 0).toLocaleString("id-ID")}</span>
                </div>
              </div>

              <div>
                <label htmlFor="booking-complaint" className="block text-xs font-bold mb-1.5">
                  Keluhan yang dirasakan <span className="text-coral" aria-hidden="true">*</span>
                </label>
                <textarea
                  id="booking-complaint"
                  rows={3}
                  value={complaint}
                  onChange={(e) => setComplaint(e.target.value)}
                  placeholder="Contoh: pusing berputar 2 hari, tensi di rumah sempat 150/95..."
                  className="input-calm"
                />
              </div>

              <div className="p-3 rounded-xl bg-teal-mist/60 border border-teal-soft text-teal-ink text-[11px] flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Slot Anda dikunci saat dikonfirmasi; jika slot ternyata sudah penuh, sistem akan memberi tahu
                  dan menawarkan slot lain — bukan membuat janji palsu.
                </span>
              </div>

              <button
                type="button"
                disabled={submitting || !complaint.trim()}
                onClick={handleConfirmBooking}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{submitting ? "Mengirim & mengunci slot…" : "Konfirmasi booking"}</span>
              </button>
            </div>
          )}

          {/* BERHASIL — setelah server membalas ok */}
          {bookingResult && (
            <div className="text-center py-2 space-y-4">
              <div className="w-14 h-14 bg-teal-mist text-teal-deep rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="display-md">Janji temu terkonfirmasi.</h4>
                <p className="text-xs text-ink-soft mt-1">
                  Slot Anda telah dikunci di sistem dan antrean virtual dikeluarkan.
                </p>
              </div>

              <div className="ticket p-6 max-w-sm mx-auto space-y-2.5 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-ink-soft">Nomor antrean</span>
                  <span className="badge">Terkonfirmasi</span>
                </div>
                <p className="font-mono-alt text-4xl font-bold text-teal-deep">
                  {bookingResult.queueCode || bookingResult.queueNumber || "A-014"}
                </p>
                <div className="pt-2 border-t border-dashed border-sandline text-xs space-y-1">
                  <p><strong>Kode:</strong> {bookingResult.appointmentCode}</p>
                  <p className="text-ink-soft">{selectedPoly?.name} · {selectedDoctor?.name}</p>
                  <p className="text-ink-soft flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {selectedDate} · {selectedSlot} WIB
                  </p>
                </div>
                <p className="text-[11px] text-ink-soft pt-2 border-t border-dashed border-sandline">
                  Pengingat otomatis dikirim kurang dari 2 jam sebelum jadwal (apabila waktu memungkinkan).
                </p>
              </div>

              <div className="flex gap-2 justify-center pt-1">
                <Link href="/queue" onClick={onClose} className="btn-primary btn-sm">
                  Lihat antrean live
                </Link>
                <button onClick={onClose} className="btn-secondary btn-sm">Selesai</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
