"use client";

import React from "react";
import { PhoneCall, AlertTriangle, X, ShieldAlert, Ambulance, MapPin } from "lucide-react";

interface EmergencyAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: string;
  symptoms?: string[];
}

export default function EmergencyAlertModal({
  isOpen,
  onClose,
  reason,
  symptoms = [],
}: EmergencyAlertModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-rose-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border-2 border-rose-500 animate-in fade-in zoom-in-95">
        {/* Top Emergency Red Banner */}
        <div className="bg-rose-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-black uppercase tracking-wide">
                Peringatan Kegawatdaruratan Medis
              </h3>
              <p className="text-[11px] text-rose-100">Red Flag Medical Protocol Activated</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs leading-relaxed space-y-2">
            <p className="font-bold text-sm text-rose-800 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              Tanda Bahaya Medis Terdeteksi
            </p>
            <p>
              {reason ||
                "Berdasarkan keluhan yang Anda laporkan, kondisi ini berpotensi mengancam jiwa dan membutuhkan evaluasi langsung di Instalasi Gawat Darurat (IGD) tanpa penundaan."}
            </p>
            {symptoms.length > 0 && (
              <div className="pt-1">
                <span className="font-semibold">Gejala Kritis:</span> {symptoms.join(", ")}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <a
              href="tel:0215550119"
              className="w-full py-3.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-sm text-center shadow-lg shadow-rose-600/30 transition flex items-center justify-center gap-2"
            >
              <PhoneCall className="w-5 h-5 animate-bounce" />
              <span>HUBUNGI IGD 24 JAM: 021-555-0119</span>
            </a>

            <a
              href="tel:119"
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs text-center transition flex items-center justify-center gap-2"
            >
              <Ambulance className="w-4 h-4 text-sky-400" />
              <span>PANGGIL AMBULANS DARURAT (119)</span>
            </a>
          </div>

          <div className="p-3 rounded-lg bg-slate-100 text-slate-700 text-[11px] flex items-start gap-2">
            <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <div>
              <strong>Lokasi IGD Rumah Sakit HealthHub:</strong>
              <p>Gedung Trauma Center Lantai 1, Jl. Sudirman Boulevard No. 88 (Akses Langsung Jalur Merah Ambulans)</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition"
          >
            Tutup Peringatan
          </button>
        </div>
      </div>
    </div>
  );
}
