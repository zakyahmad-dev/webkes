"use client";

import React, { useState, useRef, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BookingWizard from "@/components/BookingWizard";
import EmergencyAlertModal from "@/components/EmergencyAlertModal";
import { useAuth } from "@/context/AuthContext";
import {
  Sparkles,
  Send,
  AlertTriangle,
  Stethoscope,
  Calendar,
  PhoneCall,
  User,
  Bot,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Info,
  RefreshCw,
} from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  isEmergency?: boolean;
  emergencyReason?: string;
  urgencyLevel?: "emergency" | "urgent" | "routine";
  extractedSymptoms?: string[];
  recommendedPolyclinic?: { id?: number; name?: string; location?: string };
  recommendedDoctors?: Array<{
    id: number;
    name: string;
    titleSuffix?: string | null;
    photoPath?: string | null;
    rating?: string | null;
    experienceYears?: number | null;
    consultationFee: string;
    polyclinicId: number;
    polyclinicName?: string;
    specializationName?: string;
    nextSlot?: string;
  }>;
  createdAt: Date;
}

export default function AiConsultationPage() {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      role: "assistant",
      content:
        "Halo! Aku **Sahabat Sehat** — asisten AI-nya HealthHub.\n\nCeritain aja keluhanmu pakai bahasamu sendiri. Aku bantu tebak poli yang pas, urgensinya seberapa, dan siapa dokter yang cocok. Kalau ada yang buru-buru, aku juga jujur bilang — langsung arahin ke IGD.\n\nLagi ngerasain apa hari ini?",
      createdAt: new Date(),
    },
  ]);

  const [inputMsg, setInputMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [emergencyData, setEmergencyData] = useState<{ reason?: string; symptoms?: string[] }>({});

  // Booking Wizard State
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingPrefill, setBookingPrefill] = useState<{
    doctorId?: number;
    polyclinicId?: number;
    complaint?: string;
  }>({});

  const chatEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    { label: "Contoh darurat (red flag)", text: "Dada saya sakit hebat seperti tertindih beban berat dan sesak napas menjalar ke lengan kiri." },
    { label: "Pusing & tensi tinggi", text: "Kepala saya pusing berputar, tengkuk terasa kaku dan tensi sempat 150/95 saat cek tadi pagi." },
    { label: "Demam pada anak", text: "Anak saya usia 3 tahun mengalami demam 38.5°C disertai batuk pilek sudah 2 hari." },
    { label: "Sakit kepala sebelah", text: "Sakit kepala sebelah berdenyut hebat dan pandangan terasa silau sejak kemarin malam." },
    { label: "Nyeri lutut", text: "Lutut kanan saya nyeri dan bengkak saat ditekuk atau dipakai menaiki tangga." },
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMsg;
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          userId: currentUser?.id,
          patientId: currentUser?.patientId,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        const data = json.data;
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: data.message,
          isEmergency: data.isEmergency,
          emergencyReason: data.emergencyReason,
          urgencyLevel: data.urgencyLevel,
          extractedSymptoms: data.extractedSymptoms,
          recommendedPolyclinic: data.recommendedPolyclinic,
          recommendedDoctors: data.recommendedDoctors,
          createdAt: new Date(),
        };

        setMessages((prev) => [...prev, aiMsg]);

        if (data.isEmergency) {
          setEmergencyData({
            reason: data.emergencyReason,
            symptoms: data.extractedSymptoms,
          });
          setEmergencyModalOpen(true);
        }
      }
    } catch (err) {
      console.error("AI Error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: "Maaf, terjadi gangguan sementara pada koneksi AI. Silakan coba sesaat lagi.",
          createdAt: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const startBookingWithRecommendation = (doc: any, complaintText: string) => {
    setBookingPrefill({
      doctorId: doc.id,
      polyclinicId: doc.polyclinicId,
      complaint: complaintText || `Keluhan konsultasi AI: ${doc.specializationName || ""}`,
    });
    setIsBookingOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header onOpenBooking={() => setIsBookingOpen(true)} />

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col">
        {/* Sapaan kalem + batasan peran AI yang jelas */}
        <div className="card p-6 sm:p-7 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-teal-mist text-teal-deep flex items-center justify-center shrink-0 mt-0.5">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="display-md">Halo, saya Sahabat Sehat.</h1>
                <span className="badge">Online 24 jam</span>
              </div>
              <p className="text-xs text-ink-soft mt-1.5 max-w-xl leading-relaxed">
                Saya asisten kesehatan berbasis AI — saya bantu memilah keluhan dan mengarahkan
                Anda ke poli serta jadwal dokter yang tersedia. Saya bukan pengganti dokter,
                dan saya akan selalu jujur bila kondisi Anda perlu segera ke IGD.
              </p>
            </div>
          </div>

          <span className="badge shrink-0">
            <ShieldCheck className="w-3.5 h-3.5" />
            Data aman · UU PDP
          </span>
        </div>

        {/* Chat Container */}
        <div className="flex-1 card-hand-static flex flex-col overflow-hidden min-h-[500px]">
          {/* Messages Scroll Area */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div key={msg.id} className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
                  {!isUser && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-600 to-sky-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`max-w-2xl space-y-3 ${isUser ? "items-end" : "items-start"}`}>
                    {/* Message Bubble */}
                    <div
                      className={`p-4 text-xs sm:text-sm leading-relaxed whitespace-pre-line ${
                        isUser
                          ? "bg-teal-deep text-white rounded-2xl rounded-br-md"
                          : msg.isEmergency
                          ? "bg-coral-soft text-coral-deep border border-[#F2CDBD] rounded-2xl rounded-bl-md font-medium"
                          : "bg-paper border border-sandline text-ink rounded-2xl rounded-bl-md"
                      }`}
                    >
                      {msg.content}
                    </div>

                    {/* Extracted Symptoms Badges */}
                    {msg.extractedSymptoms && msg.extractedSymptoms.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Gejala Terdeteksi:
                        </span>
                        {msg.extractedSymptoms.map((sym, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 text-[10px] font-bold border border-teal-200"
                          >
                            ✓ {sym}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Red Alert Emergency Action Box */}
                    {msg.isEmergency && (
                      <div className="p-4 rounded-2xl bg-rose-600 text-white space-y-3 shadow-lg shadow-rose-600/20">
                        <div className="flex items-center gap-2 font-bold text-xs">
                          <AlertTriangle className="w-5 h-5 text-amber-300 animate-bounce" />
                          <span>KEGAWATAN MEDIS: SEGERA HUBUNGI IGD</span>
                        </div>
                        <p className="text-xs text-rose-100">
                          Jangan menunda. Tim IGD HealthHub siaga 24 jam dengan ambulans respons cepat.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <a
                            href="tel:0215550119"
                            className="px-4 py-2 rounded-xl bg-white text-rose-700 font-black text-xs hover:bg-rose-50 transition flex items-center gap-1.5 shadow-sm"
                          >
                            <PhoneCall className="w-4 h-4" />
                            <span>Hubungi IGD: 021-555-0119</span>
                          </a>
                          <button
                            onClick={() => setEmergencyModalOpen(true)}
                            className="px-3 py-2 rounded-xl bg-rose-800 text-white text-xs font-semibold hover:bg-rose-900 transition"
                          >
                            Info Bantuan Darurat
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Doctor Recommendations Cards */}
                    {!msg.isEmergency && msg.recommendedDoctors && msg.recommendedDoctors.length > 0 && (
                      <div className="space-y-2.5 pt-2">
                        <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <Stethoscope className="w-4 h-4 text-sky-600" />
                          <span>Dokter Spesialis Rekomendasi Terdekat:</span>
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {msg.recommendedDoctors.map((doc) => (
                            <div
                              key={doc.id}
                              className="card p-3.5 space-y-3"
                            >
                              <div className="flex items-center gap-3">
                                <img
                                  src={doc.photoPath || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=120"}
                                  alt={doc.name}
                                  className="w-12 h-12 rounded-full object-cover border border-slate-200"
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-slate-900 text-xs truncate">{doc.name}</p>
                                  <p className="text-[11px] text-teal-700 font-semibold">{doc.polyclinicName}</p>
                                  <p className="text-[10px] text-slate-500">{doc.experienceYears || 8}+ thn pengalaman · ⭐ {doc.rating || "4.9"}</p>
                                </div>
                              </div>

                              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                <div>
                                  <span className="text-[10px] text-slate-400 block">Biaya Konsultasi</span>
                                  <span className="text-xs font-bold text-sky-700">
                                    Rp {Number(doc.consultationFee).toLocaleString("id-ID")}
                                  </span>
                                </div>
                                <button
                                  onClick={() => startBookingWithRecommendation(doc, messages[messages.length - 2]?.content || "Konsultasi AI")}
                                  className="btn-primary btn-xs"
                                >
                                  <Calendar className="w-3.5 h-3.5" />
                                  <span>Pilih Slot</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <span className="text-[10px] text-slate-400 block pt-0.5">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-1">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-3 justify-start items-center">
                <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div className="px-4 py-3 rounded-2xl bg-slate-100 text-slate-600 text-xs font-medium flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-600 animate-spin-slow" />
                  <span>AI sedang menganalisis gejala & mencocokkan dokter spesialis...</span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Quick Prompts Chips */}
          <div className="px-4 py-2.5 bg-ivory/60 border-t-2 border-dashed border-ivory overflow-x-auto flex items-center gap-2">
            <span className="text-[10px] font-bold text-ink-soft uppercase tracking-wider shrink-0 flex items-center gap-1 italic-hand">
              Bingung mulai? Ketuk yang mirip:
            </span>
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(p.text)}
                className="sticker sticker-teal hover:bg-sun transition whitespace-nowrap"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Message Input Box */}
          <div className="p-4 bg-paper border-t-2 border-ink">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                placeholder="Ceritain keluhanmu… misal “batuk 3 hari nggak berenti” atau “pusing sebelah kerasa berdenyut”"
                disabled={loading}
                className="input-warm flex-1 !px-4 !py-3"
              />
              <button
                type="submit"
                disabled={loading || !inputMsg.trim()}
                className="btn-teal btn-xs !py-3"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Kirim</span>
              </button>
            </form>
            <p className="text-[10px] text-ink-soft mt-2 text-center italic-hand">
              Aku asisten triage, bukan dokter — kalau badanmu teriak darurat, langsung telepon IGD 021-555-0119 ya.
            </p>
          </div>
        </div>
      </main>

      <Footer />

      {/* Emergency Red Alert Modal */}
      <EmergencyAlertModal
        isOpen={emergencyModalOpen}
        onClose={() => setEmergencyModalOpen(false)}
        reason={emergencyData.reason}
        symptoms={emergencyData.symptoms}
      />

      {/* Booking Wizard */}
      <BookingWizard
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        preselectedDoctorId={bookingPrefill.doctorId}
        preselectedPolyclinicId={bookingPrefill.polyclinicId}
        initialComplaint={bookingPrefill.complaint}
      />
    </div>
  );
}
