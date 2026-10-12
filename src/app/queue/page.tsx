"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PortalSidebar from "@/components/PortalSidebar";
import { useAuth } from "@/context/AuthContext";
import { announceQueue, playChimeSound } from "@/lib/speech";
import {
  Clock,
  Volume2,
  CheckCircle2,
  Building,
  RefreshCw,
  AlertCircle,
  Users,
  Stethoscope,
  Sparkles,
} from "lucide-react";

export default function QueueBoardPage() {
  const { currentUser } = useAuth();
  const [queues, setQueues] = useState<any[]>([]);
  const [polyclinics, setPolyclinics] = useState<any[]>([]);
  const [selectedPolyId, setSelectedPolyId] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [lastSpeech, setLastSpeech] = useState<string>("");
  const [checkedInSuccess, setCheckedInSuccess] = useState(false);

  useEffect(() => {
    fetchQueues();
    const interval = setInterval(fetchQueues, 5000); // Poll every 5s for real-time queue
    return () => clearInterval(interval);
  }, []);

  const fetchQueues = async () => {
    try {
      const [qRes, pRes] = await Promise.all([
        fetch("/api/queues").then((r) => r.json()),
        fetch("/api/polyclinics").then((r) => r.json()),
      ]);

      if (qRes.success) setQueues(qRes.data || []);
      if (pRes.success) setPolyclinics(pRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleTestAudioAnnouncement = (q: any) => {
    playChimeSound();
    const text = `Nomor antrean ${q.queueCode}, atas nama ${q.patientName}, silakan menuju ${q.polyclinicName}`;
    setLastSpeech(text);
    setTimeout(() => {
      announceQueue(text);
    }, 400);
  };

  const myQueue = queues.find((q) => q.patientName?.toLowerCase().includes(currentUser?.name?.toLowerCase() || "budi"));

  const filteredQueues = selectedPolyId === "all"
    ? queues
    : queues.filter((q) => q.polyclinicId === Number(selectedPolyId));

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        <PortalSidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Papan Antrean Real-time Poliklinik
                </h1>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Pembaruan otomatis setiap 5 detik dengan simulasi pengumuman suara Web Speech API.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchQueues()}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5 text-sky-600" />
                <span>Segarkan</span>
              </button>
            </div>
          </div>

          {/* MY ACTIVE QUEUE TICKET CARD */}
          {myQueue && (
            <div className="bg-gradient-to-r from-sky-700 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="bg-white/20 text-sky-100 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                  Tiket Antrean Aktif Anda Hari Ini
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                  myQueue.status === "serving"
                    ? "bg-amber-400 text-slate-950 animate-pulse"
                    : myQueue.status === "called"
                    ? "bg-emerald-400 text-slate-950"
                    : "bg-sky-500/50 text-white"
                }`}>
                  Status: {myQueue.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-8 space-y-2">
                  <h2 className="text-xl font-bold">{myQueue.polyclinicName}</h2>
                  <p className="text-xs text-teal-200">
                    Dokter: <strong>{myQueue.doctorName}</strong> · Lokasi: {myQueue.polyclinicLocation || "Gedung A"}
                  </p>
                  <p className="text-xs text-slate-300">
                    Estimasi Waktu Tunggu: <strong>~{myQueue.estimatedWaitMinutes || 15} Menit</strong>
                  </p>
                </div>

                <div className="md:col-span-4 p-5 rounded-2xl bg-white text-slate-900 text-center shadow-lg space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">
                    Nomor Anda
                  </span>
                  <div className="text-4xl font-black text-sky-700 tracking-tight">
                    {myQueue.queueCode}
                  </div>
                  <button
                    onClick={() => handleTestAudioAnnouncement(myQueue)}
                    className="w-full py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-sky-600" />
                    <span>Tes Suara Panggilan</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Polyclinic Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedPolyId("all")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedPolyId === "all"
                  ? "bg-sky-600 text-white shadow-xs"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-sky-50"
              }`}
            >
              Semua Poliklinik ({queues.length})
            </button>
            {polyclinics.map((p) => {
              const isSelected = selectedPolyId === String(p.id);
              const count = queues.filter((q) => q.polyclinicId === p.id).length;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPolyId(String(p.id))}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                    isSelected
                      ? "bg-sky-600 text-white shadow-xs"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-sky-50"
                  }`}
                >
                  {p.name} ({count})
                </button>
              );
            })}
          </div>

          {/* Live Queue Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQueues.map((q) => {
              const isServing = q.status === "serving";
              const isCalled = q.status === "called";
              const isWaiting = q.status === "waiting";
              const isCompleted = q.status === "completed";

              return (
                <div
                  key={q.id}
                  className={`bg-white rounded-3xl border p-6 space-y-4 shadow-xs hover:shadow-md transition ${
                    isServing
                      ? "border-amber-400 bg-amber-50/20 ring-2 ring-amber-400/20"
                      : isCalled
                      ? "border-emerald-400 bg-emerald-50/20"
                      : "border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-sky-700 uppercase bg-sky-50 px-2.5 py-0.5 rounded">
                      {q.polyclinicName}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        isServing
                          ? "bg-amber-100 text-amber-900 border border-amber-300 animate-pulse"
                          : isCalled
                          ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                          : isCompleted
                          ? "bg-slate-100 text-slate-600"
                          : "bg-sky-100 text-sky-900"
                      }`}
                    >
                      {q.status}
                    </span>
                  </div>

                  <div className="text-center py-2 space-y-1">
                    <span className="text-3xl font-black text-slate-900 tracking-tight block">
                      {q.queueCode}
                    </span>
                    <p className="text-xs font-bold text-slate-700">{q.patientName}</p>
                    <p className="text-[11px] text-slate-500 font-mono">RM: {q.patientRm}</p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-[11px] space-y-1 text-slate-600">
                    <p><strong>Dokter:</strong> {q.doctorName}</p>
                    <p><strong>Lokasi:</strong> {q.polyclinicLocation || "Lantai 2"}</p>
                    <p><strong>Keluhan:</strong> {q.complaint}</p>
                  </div>

                  <button
                    onClick={() => handleTestAudioAnnouncement(q)}
                    className="w-full py-2 rounded-xl bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-700 font-bold text-xs transition flex items-center justify-center gap-1.5"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-sky-600" />
                    <span>Panggilkan Nomor Ini</span>
                  </button>
                </div>
              );
            })}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
