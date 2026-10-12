import React from "react";
import Link from "next/link";
import {
  HeartPulse,
  PhoneCall,
  MapPin,
  Clock,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-ink text-cream mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-10 border-b border-cream/15">
          {/* Brand + IGD */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-teal-deep flex items-center justify-center">
                <HeartPulse className="w-5 h-5" />
              </div>
              <span className="font-display text-2xl font-semibold">
                Health<span className="text-sun">Hub</span>
              </span>
            </div>
            <p className="text-cream/70 text-xs leading-relaxed max-w-sm">
              Rumah sakit digital terpadu: poliklinik spesialis, IGD 24 jam, rawat inap,
              rekam medis elektronik, dan konsultasi AI awal — dalam satu platform yang mudah dipakai.
            </p>

            <a
              href="tel:0215550119"
              className="inline-flex items-center gap-3 bg-coral text-white rounded-2xl px-5 py-3.5 hover:bg-coral-deep transition"
            >
              <PhoneCall className="w-4 h-4" />
              <span>
                <span className="block text-[10px] font-bold uppercase tracking-widest">IGD 24 Jam</span>
                <span className="font-display text-xl font-bold">021-555-0119</span>
              </span>
              <span className="text-[10px] text-white/80">Ambulans: 119</span>
            </a>
          </div>

          {/* Navigasi */}
          <nav className="space-y-3" aria-label="Navigasi footer">
            <h4 className="font-display font-semibold text-sun">Jelajah</h4>
            <ul className="space-y-2 text-xs text-cream/70">
              <li><Link href="/about" className="hover:text-sun transition">Tentang RS</Link></li>
              <li><Link href="/services" className="hover:text-sun transition">Layanan Medis</Link></li>
              <li><Link href="/doctors" className="hover:text-sun transition">Cari Dokter</Link></li>
              <li><Link href="/schedule" className="hover:text-sun transition">Jadwal Praktik</Link></li>
              <li><Link href="/articles" className="hover:text-sun transition">Artikel Kesehatan</Link></li>
              <li><Link href="/contact" className="hover:text-sun transition">Kontak & Lokasi</Link></li>
            </ul>
          </nav>

          {/* Fitur digital */}
          <div className="space-y-3">
            <h4 className="font-display font-semibold text-sun">Portal Pasien</h4>
            <ul className="space-y-2 text-xs text-cream/70">
              <li>
                <Link href="/ai-consultation" className="hover:text-sun transition flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-soft" />
                  Konsultasi AI (panduan awal)
                </Link></li>
              <li><Link href="/queue" className="hover:text-sun transition">Papan Antrean Live</Link></li>
              <li><Link href="/medical-records" className="hover:text-sun transition">Rekam Medis (EMR)</Link></li>
              <li><Link href="/prescriptions" className="hover:text-sun transition">Resep Digital</Link></li>
              <li><Link href="/laboratory" className="hover:text-sun transition">Hasil Laboratorium</Link></li>
              <li><Link href="/payments" className="hover:text-sun transition">Tagihan & Pembayaran</Link></li>
            </ul>
          </div>

          {/* Kontak */}
          <div className="space-y-3">
            <h4 className="font-display font-semibold text-sun">Kunjungi Kami</h4>
            <div className="space-y-2.5 text-xs text-cream/70">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-teal-soft shrink-0 mt-0.5" />
                Jl. Sudirman Boulevard No. 88, Senayan, Jakarta Pusat 10270
              </p>
              <p className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-soft shrink-0" />
                Poliklinik 08.00–20.00 WIB · IGD 24 jam
              </p>
              <p className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-soft shrink-0 mt-0.5" />
                Data kesehatan Anda dilindungi sesuai UU PDP No. 27/2022 dan ketentuan rekam medis Permenkes.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-cream/50">
          <p>© 2026 HealthHub Hospital. Seluruh hak dilindungi.</p>
          <div className="flex items-center gap-4">
            <Link href="/about" className="hover:text-cream transition">Privasi</Link>
            <Link href="/about" className="hover:text-cream transition">Syarat</Link>
            <Link href="/contact" className="hover:text-cream transition">Bantuan</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
