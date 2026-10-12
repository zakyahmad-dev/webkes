"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BookingWizard from "@/components/BookingWizard";
import Link from "next/link";
import {
  Search,
  BookOpen,
  Clock,
  User,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export default function ArticlesPage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [selectedCat, setSelectedCat] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const categories = ["Semua", "Penyakit Dalam", "Jantung & Kardiovaskular", "Kesehatan Anak", "Saraf & Neurologi"];

  useEffect(() => {
    fetchData();
  }, [selectedCat]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const url = selectedCat === "Semua" ? "/api/articles" : `/api/articles?category=${encodeURIComponent(selectedCat)}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) setArticles(json.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredArticles = articles.filter((a) => {
    if (!searchQuery) return true;
    return (
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header onOpenBooking={() => setIsBookingOpen(true)} />

      {/* Hero */}
      <section className="bg-paper border-b border-sandline py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="badge">Pusat Edukasi</span>
            <h1 className="display-lg">Artikel kesehatan yang ditinjau dokter.</h1>
            <p className="text-xs sm:text-sm text-ink-soft">
              Edukasi medis dari tim spesialis HealthHub — jelas, ringkas, dan dapat dipahami semua usia.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto pt-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari artikel kesehatan, tips, gejala penyakit..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-sky-500 focus:outline-hidden shadow-xs"
              />
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex justify-center gap-2 overflow-x-auto pb-1 pt-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCat(cat)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  selectedCat === cat
                    ? "bg-sky-600 text-white shadow-xs"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-sky-50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Articles Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="text-center py-20">
            <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Memuat artikel edukasi...</p>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-2">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-800 text-sm">Tidak Ada Artikel</h3>
            <p className="text-xs text-slate-500">Coba pilih kategori lain.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((art) => (
              <Link
                key={art.id}
                href={`/articles/${art.slug}`}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-xl transition duration-200 overflow-hidden flex flex-col justify-between group"
              >
                <div>
                  <div className="aspect-16/9 overflow-hidden bg-slate-100">
                    <img
                      src={art.coverPath || "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=500"}
                      alt={art.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  </div>

                  <div className="p-6 space-y-2">
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-semibold">
                      <span className="text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded font-bold">
                        {art.category}
                      </span>
                      <span>•</span>
                      <span>{art.readTimeMinutes || 4} menit baca</span>
                    </div>

                    <h3 className="font-black text-base text-slate-900 group-hover:text-sky-600 transition line-clamp-2">
                      {art.title}
                    </h3>

                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {art.excerpt}
                    </p>
                  </div>
                </div>

                <div className="p-6 pt-0 flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 pt-4">
                  <span className="truncate">Penulis: {art.authorName || "Dokter Spesialis"}</span>
                  <span className="text-sky-600 font-bold flex items-center gap-1 shrink-0">
                    Baca Selengkapnya <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />

      <BookingWizard
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
      />
    </div>
  );
}
