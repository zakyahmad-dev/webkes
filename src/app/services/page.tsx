"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BookingWizard from "@/components/BookingWizard";
import {
  Stethoscope,
  HeartPulse,
  Activity,
  Pill,
  FlaskConical,
  Ambulance,
  Calendar,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export default function ServicesPage() {
  const [servicesList, setServicesList] = useState<any[]>([]);
  const [polyclinics, setPolyclinics] = useState<any[]>([]);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "unggulan" | "poli" | "penunjang">("all");

  useEffect(() => {
    fetch("/api/services").then((r) => r.json()).then((d) => d.success && setServicesList(d.data || []));
    fetch("/api/polyclinics").then((r) => r.json()).then((d) => d.success && setPolyclinics(d.data || []));
  }, []);

  const filteredServices = servicesList.filter((s) => {
    if (activeTab === "all") return true;
    return s.type === activeTab;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header onOpenBooking={() => setIsBookingOpen(true)} />

      {/* Hero */}
      <section className="bg-paper border-b border-sandline py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <span className="badge">Layanan & Fasilitas</span>
          <h1 className="display-lg">
            Pusat pelayanan medis & penunjang diagnostik.
          </h1>
          <p className="text-xs sm:text-sm text-ink-soft max-w-2xl mx-auto">
            Dari layanan emergensi 24 jam, katerisasi jantung presisi, laboratorium patologi
            terakreditasi, hingga poliklinik rawat jalan.
          </p>

          {/* Filter Tabs */}
          <div className="flex flex-wrap justify-center gap-2 pt-4">
            {[
              { id: "all", label: "Semua Layanan" },
              { id: "unggulan", label: "Pusat Unggulan" },
              { id: "poli", label: "Poliklinik Rawat Jalan" },
              { id: "penunjang", label: "Penunjang Medis & Lab" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={activeTab === tab.id ? "btn-primary btn-xs" : "btn-secondary btn-xs"}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredServices.map((srv) => (
            <div
              key={srv.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-xl transition duration-200 overflow-hidden flex flex-col justify-between group"
            >
              <div>
                <div className="aspect-16/9 overflow-hidden bg-slate-100">
                  <img
                    src={srv.imagePath || "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600"}
                    alt={srv.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                </div>

                <div className="p-6 space-y-3">
                  <span className="inline-block px-2.5 py-0.5 rounded-md bg-sky-50 text-sky-800 text-[10px] font-bold uppercase tracking-wider">
                    {srv.type.replace("_", " ")}
                  </span>
                  <h3 className="text-lg font-black text-slate-900 group-hover:text-sky-600 transition">
                    {srv.name}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {srv.description}
                  </p>
                </div>
              </div>

              <div className="p-6 pt-0">
                <button
                  onClick={() => setIsBookingOpen(true)}
                  className="btn-secondary btn-xs w-full"
                >
                  <Calendar className="w-3.5 h-3.5 text-teal-deep" />
                  <span>Konsultasi / Buat Janji</span>
                </button>
              </div>
            </div>
          ))}
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
