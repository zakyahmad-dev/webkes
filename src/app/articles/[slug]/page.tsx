"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BookingWizard from "@/components/BookingWizard";
import Link from "next/link";
import {
  BookOpen,
  Clock,
  User,
  ChevronLeft,
  Share2,
  Calendar,
  Sparkles,
  Stethoscope,
} from "lucide-react";

export default function ArticleDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [article, setArticle] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  useEffect(() => {
    if (slug) {
      fetch(`/api/articles/${slug}`)
        .then((r) => r.json())
        .then((res) => {
          if (res.success) setArticle(res.data);
        })
        .finally(() => setLoading(false));
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-xl font-bold text-slate-800">Artikel tidak ditemukan</h2>
          <Link href="/articles" className="mt-4 text-xs font-semibold text-sky-600 hover:underline">
            ← Kembali ke daftar artikel
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header onOpenBooking={() => setIsBookingOpen(true)} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Link
          href="/articles"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 hover:underline"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Kembali ke Semua Artikel</span>
        </Link>

        {/* Article Container */}
        <article className="bg-white rounded-3xl border border-slate-200/90 shadow-md overflow-hidden p-6 sm:p-10 space-y-6">
          {/* Header */}
          <div className="space-y-3">
            <span className="inline-block px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-bold uppercase tracking-wider">
              {article.category}
            </span>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              {article.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-1.5 font-medium text-slate-700">
                <User className="w-4 h-4 text-sky-600" />
                <span>Ditinjau oleh: <strong>{article.authorName || "Dokter Spesialis"}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>{article.readTimeMinutes || 4} menit baca</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>{new Date(article.publishedAt || Date.now()).toLocaleDateString("id-ID", { dateStyle: "long" })}</span>
              </div>
            </div>
          </div>

          {/* Featured Cover */}
          <div className="aspect-16/9 rounded-2xl overflow-hidden bg-slate-100 shadow-xs">
            <img
              src={article.coverPath || "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=1000"}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Article Excerpt */}
          <div className="p-4 rounded-2xl bg-sky-50 border-l-4 border-sky-600 text-sky-950 font-medium text-xs sm:text-sm leading-relaxed">
            {article.excerpt}
          </div>

          {/* Body Content */}
          <div className="prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed space-y-4 text-slate-700">
            <p>{article.content}</p>
            <p>
              Apabila Anda atau anggota keluarga mengalami gejala serupa yang memburuk atau tidak kunjung membaik, disarankan untuk berkonsultasi langsung dengan dokter spesialis di Rumah Sakit HealthHub. Pemeriksaan dini memegang peranan krusial dalam keberhasilan terapi dan pencegahan komplikasi kronis.
            </p>
          </div>

          {/* Doctor Card / CTA */}
          <div className="pt-6 border-t border-slate-200">
            <div className="p-6 rounded-2xl bg-gradient-to-r from-sky-50 to-teal-50 border border-sky-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center shrink-0">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Perlu Penanganan Spesialis Terkait?</h4>
                  <p className="text-xs text-slate-600">Buat janji temu dokter spesialis secara online tanpa repot antre.</p>
                </div>
              </div>
              <button
                onClick={() => setIsBookingOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition shrink-0"
              >
                Buat Janji Sekarang
              </button>
            </div>
          </div>
        </article>
      </main>

      <Footer />

      <BookingWizard
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
      />
    </div>
  );
}
