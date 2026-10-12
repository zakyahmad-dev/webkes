"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth, DEMO_PERSONAS } from "@/context/AuthContext";
import { UserRole } from "@/lib/types";
import {
  Sparkles,
  Bell,
  Menu,
  X,
  ChevronDown,
  Clock,
  LogOut,
  Stethoscope,
  FlaskConical,
  CreditCard,
  LayoutDashboard,
  HeartPulse,
  Pill,
  CalendarPlus,
  PhoneCall,
} from "lucide-react";

export default function Header({
  onOpenBooking,
}: {
  onOpenBooking?: () => void;
}) {
  const { currentUser, switchPersona, logout, unreadNotificationsCount } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navLinks = [
    { name: "Beranda", href: "/" },
    { name: "Layanan", href: "/services" },
    { name: "Cari Dokter", href: "/doctors" },
    { name: "Jadwal Praktik", href: "/schedule" },
    { name: "Artikel", href: "/articles" },
    { name: "Tentang", href: "/about" },
    { name: "Kontak", href: "/contact" },
  ];

  const getDashboardHref = (role?: UserRole) => {
    switch (role) {
      case "doctor": return "/doctor/dashboard";
      case "nurse": return "/nurse/dashboard";
      case "pharmacist": return "/pharmacy/dashboard";
      case "lab": return "/lab/dashboard";
      case "cashier": return "/cashier/dashboard";
      case "admin":
      case "super-admin": return "/admin/dashboard";
      default: return "/dashboard";
    }
  };

  const roleLabel = (role?: UserRole) => {
    switch (role) {
      case "super-admin": return "Super Admin";
      case "admin": return "Admin RS";
      case "doctor": return "Dokter";
      case "nurse": return "Perawat";
      case "pharmacist": return "Farmasi";
      case "lab": return "Lab";
      case "cashier": return "Kasir";
      default: return "Pasien";
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full">
      {/* 1. Strip informasi statis — darurat & jam layanan (data nyata settings seed) */}
      <div className="bg-ink text-cream/90 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-4">
          <a href="tel:0215550119" className="flex items-center gap-1.5 font-bold text-white hover:text-sun transition">
            <PhoneCall className="w-3.5 h-3.5 text-coral" />
            <span>IGD 24 Jam: <span className="underline underline-offset-2">021-555-0119</span> / Ambulans 119</span>
          </a>
          <div className="hidden sm:flex items-center gap-1.5 text-cream/70">
            <Clock className="w-3.5 h-3.5" />
            <span>Poliklinik Senin–Sabtu, 08.00–20.00 WIB</span>
          </div>
        </div>
      </div>

      {/* 2. Navbar utama — bersih, satu garis */}
      <div className="bg-paper/95 backdrop-blur-sm border-b border-sandline">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group" aria-label="HealthHub Beranda">
              <div className="w-9 h-9 rounded-full bg-teal-deep flex items-center justify-center text-white group-hover:bg-teal-ink transition">
                <HeartPulse className="w-5 h-5" />
              </div>
              <span className="font-display text-xl font-semibold tracking-tight">
                Health<span className="text-teal-deep">Hub</span>
              </span>
            </Link>

            {/* Nav desktop */}
            <nav className="hidden lg:flex items-center gap-6" aria-label="Navigasi utama">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`text-[13px] font-semibold transition ${
                      isActive ? "text-teal-deep" : "text-ink-soft hover:text-ink"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>

            {/* Aksi kanan */}
            <div className="hidden md:flex items-center gap-2">
              <Link href="/ai-consultation" className="btn-secondary btn-xs">
                <Sparkles className="w-3.5 h-3.5 text-teal-deep" />
                <span>Konsultasi AI</span>
              </Link>

              {onOpenBooking ? (
                <button onClick={onOpenBooking} className="btn-primary btn-xs">
                  <CalendarPlus className="w-3.5 h-3.5" />
                  <span>Buat Janji</span>
                </button>
              ) : (
                <Link href="/doctors" className="btn-primary btn-xs">
                  <CalendarPlus className="w-3.5 h-3.5" />
                  <span>Buat Janji</span>
                </Link>
              )}

              {currentUser ? (
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-full border border-sandline bg-paper hover:border-teal-deep transition text-xs font-bold"
                    aria-haspopup="true"
                    aria-expanded={userDropdownOpen}
                  >
                    <img
                      src={currentUser.avatarPath || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"}
                      alt={`Foto profil ${currentUser.name}`}
                      className="w-6 h-6 rounded-full object-cover border border-sandline"
                    />
                    <span className="max-w-[90px] truncate">{currentUser.name.split(" ")[0]}</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>

                  {userDropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-60 card p-2 z-50 text-xs shadow-xl"
                      onMouseLeave={() => setUserDropdownOpen(false)}
                      role="menu"
                    >
                      <div className="px-3 py-2 border-b border-dashed border-sandline">
                        <p className="font-bold">{currentUser.name}</p>
                        <p className="text-[10px] text-ink-soft truncate">{currentUser.email}</p>
                        <span className="badge mt-1.5">{roleLabel(currentUser.role)}</span>
                      </div>
                      <div className="py-1">
                        <Link href={getDashboardHref(currentUser.role)} onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-teal-mist font-semibold" role="menuitem">
                          <LayoutDashboard className="w-4 h-4 text-teal-deep" /> Portal {roleLabel(currentUser.role)}
                        </Link>
                        {currentUser.role === "patient" && (
                          <>
                            <Link href="/queue" onClick={() => setUserDropdownOpen(false)} role="menuitem"
                              className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-teal-mist">
                              <Clock className="w-4 h-4 text-teal-deep" /> Antrean Saya
                            </Link>
                            <Link href="/medical-records" onClick={() => setUserDropdownOpen(false)} role="menuitem"
                              className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-teal-mist">
                              <Stethoscope className="w-4 h-4 text-teal-deep" /> Rekam Medis
                            </Link>
                            <Link href="/prescriptions" onClick={() => setUserDropdownOpen(false)} role="menuitem"
                              className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-teal-mist">
                              <Pill className="w-4 h-4 text-teal-deep" /> Resep Obat
                            </Link>
                            <Link href="/laboratory" onClick={() => setUserDropdownOpen(false)} role="menuitem"
                              className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-teal-mist">
                              <FlaskConical className="w-4 h-4 text-teal-deep" /> Hasil Lab
                            </Link>
                            <Link href="/payments" onClick={() => setUserDropdownOpen(false)} role="menuitem"
                              className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-teal-mist">
                              <CreditCard className="w-4 h-4 text-teal-deep" /> Tagihan
                            </Link>
                          </>
                        )}
                        <Link href="/notifications" onClick={() => setUserDropdownOpen(false)} role="menuitem"
                          className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-teal-mist">
                          <span className="flex items-center gap-2.5"><Bell className="w-4 h-4 text-teal-deep" /> Notifikasi</span>
                          {unreadNotificationsCount > 0 && (
                            <span className="min-w-5 h-5 px-1 bg-coral text-white rounded-full text-[10px] flex items-center justify-center font-bold" aria-label={`${unreadNotificationsCount} notifikasi belum dibaca`}>
                              {unreadNotificationsCount}
                            </span>
                          )}
                        </Link>
                      </div>
                      <div className="pt-1 border-t border-dashed border-sandline">
                        <button
                          onClick={() => { logout(); setUserDropdownOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-coral-deep font-semibold hover:bg-coral-soft" role="menuitem"
                        >
                          <LogOut className="w-4 h-4" /> Keluar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/login" className="btn-primary btn-xs">Masuk</Link>
              )}
            </div>

            {/* Tombol mobile */}
            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="w-10 h-10 rounded-xl border border-sandline bg-paper flex items-center justify-center"
                aria-label="Buka menu navigasi"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Menu mobile fullscreen — sederhana dan aksesibel */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-cream overflow-y-auto" role="dialog" aria-modal="true" aria-label="Menu navigasi">
          <div className="max-w-lg mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
              <span className="font-display text-2xl font-semibold">
                Health<span className="text-teal-deep">Hub</span>
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-10 h-10 rounded-xl border border-sandline bg-paper flex items-center justify-center"
                aria-label="Tutup menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="space-y-1" aria-label="Navigasi mobile">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-current={pathname === link.href ? "page" : undefined}
                  className={`block py-3.5 border-b border-dashed border-sandline font-display text-xl transition ${
                    pathname === link.href ? "text-teal-deep" : "text-ink hover:text-teal-deep"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => { setMobileMenuOpen(false); onOpenBooking?.(); }}
                className="btn-primary justify-center"
              >
                <CalendarPlus className="w-4 h-4" /> Buat Janji Dokter
              </button>
              <Link href="/ai-consultation" onClick={() => setMobileMenuOpen(false)} className="btn-secondary justify-center">
                <Sparkles className="w-4 h-4 text-teal-deep" /> Konsultasi AI
              </Link>
            </div>

            {currentUser && (
              <div className="card p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-ink-soft">Masuk sebagai</p>
                  <p className="font-bold text-sm">{currentUser.name}</p>
                </div>
                <Link
                  href={getDashboardHref(currentUser.role)}
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-primary btn-xs"
                >
                  Buka Portal
                </Link>
              </div>
            )}

            <a href="tel:0215550119" className="block text-center text-xs font-bold text-coral-deep pt-2">
              IGD 24 jam: 021-555-0119 — ketuk untuk menelepon
            </a>
          </div>
        </div>
      )}

      {/* Persona switcher floating (demo) */}
      <div className="fixed bottom-4 right-4 z-40 hidden md:block">
        <div className="relative">
          <button
            onClick={() => setRoleSwitcherOpen(!roleSwitcherOpen)}
            className="flex items-center gap-2 bg-paper border border-sandline rounded-full pl-3 pr-2.5 py-1.5 text-[11px] font-bold shadow-md hover:translate-y-[-1px] transition"
            aria-haspopup="true"
            aria-expanded={roleSwitcherOpen}
          >
            <span className="w-2 h-2 rounded-full bg-teal-deep" />
            Demo: {roleLabel(currentUser?.role)}
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {roleSwitcherOpen && (
            <div
              className="absolute bottom-12 right-0 w-72 card py-2 z-50 text-xs shadow-2xl"
              onMouseLeave={() => setRoleSwitcherOpen(false)}
            >
              <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-soft border-b border-dashed border-sandline">
                Coba 8 peran sistem
              </p>
              <div className="max-h-72 overflow-y-auto">
                {DEMO_PERSONAS.map((persona) => {
                  const isSelected = currentUser?.email === persona.email;
                  return (
                    <button
                      key={persona.id}
                      onClick={() => {
                        switchPersona(persona.role, persona.email);
                        setRoleSwitcherOpen(false);
                        router.push(getDashboardHref(persona.role));
                      }}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between transition ${
                        isSelected ? "bg-teal-mist" : "hover:bg-teal-mist/60"
                      }`}
                    >
                      <div>
                        <p className="font-bold leading-tight">{persona.name}</p>
                        <p className="text-[10px] text-ink-soft">{persona.email}</p>
                      </div>
                      <span className="badge text-[9px] px-2">{roleLabel(persona.role)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
