"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, DEMO_PERSONAS } from "@/context/AuthContext";
import { UserRole } from "@/lib/types";
import Link from "next/link";
import { HeartPulse, Lock, Mail, ArrowRight, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, switchPersona } = useAuth();

  const [email, setEmail] = useState("patient@healthhub.id");
  const [password, setPassword] = useState("password123");
  const [errorMsg, setErrorMsg] = useState("");

  const goPortal = (role: UserRole) => {
    if (role === "doctor") router.push("/doctor/dashboard");
    else if (role === "nurse") router.push("/nurse/dashboard");
    else if (role === "pharmacist") router.push("/pharmacy/dashboard");
    else if (role === "lab") router.push("/lab/dashboard");
    else if (role === "cashier") router.push("/cashier/dashboard");
    else if (role === "admin" || role === "super-admin") router.push("/admin/dashboard");
    else router.push("/dashboard");
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg("Email wajib diisi ya.");
      return;
    }
    if (login(email, password)) {
      const persona = DEMO_PERSONAS.find((p) => p.email.toLowerCase() === email.toLowerCase());
      goPortal(persona?.role ?? "patient");
    }
  };

  const personaRows = [
    { label: "Pasien", sub: "Budi Santoso", role: "patient" as UserRole, email: "patient@healthhub.id" },
    { label: "Dokter", sub: "dr. Sarah Wijaya", role: "doctor" as UserRole, email: "doctor@healthhub.id" },
    { label: "Perawat", sub: "Ns. Siti Rahayu", role: "nurse" as UserRole, email: "nurse@healthhub.id" },
    { label: "Farmasi", sub: "apt. Hendra", role: "pharmacist" as UserRole, email: "pharmacy@healthhub.id" },
    { label: "Lab", sub: "Maya Indah", role: "lab" as UserRole, email: "lab@healthhub.id" },
    { label: "Kasir", sub: "Rian Pratama", role: "cashier" as UserRole, email: "cashier@healthhub.id" },
    { label: "Admin", sub: "Doni Prasetyo", role: "admin" as UserRole, email: "admin@healthhub.id" },
    { label: "Super Admin", sub: "dr. Alexander", role: "super-admin" as UserRole, email: "superadmin@healthhub.id" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream paper-grain p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Logo + sapaan */}
        <div className="text-center space-y-3">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-full bg-teal-deep border-2 border-ink flex items-center justify-center text-cream">
              <HeartPulse className="w-6 h-6" />
            </div>
            <span className="font-display text-2xl font-semibold">
              Health<span className="text-teal-deep">Hub</span>
            </span>
          </Link>
          <div>
            <h2 className="display-md">Halo lagi, kangen nih.</h2>
            <p className="text-xs text-ink-soft mt-1">
              Masuk buat liat antrean, resep, dan jadwal konsultasimu.
            </p>
          </div>
        </div>

        {/* Kartu form */}
        <div className="card-hand-static p-6 sm:p-7 space-y-5">
          {errorMsg && (
            <p className="text-xs font-semibold text-coral-deep bg-coral-soft rounded-xl px-3 py-2">
              {errorMsg}
            </p>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold mb-1.5">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-ink-soft absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="namamu@email.com"
                  className="input-warm !pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold mb-1.5">Kata Sandi</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-ink-soft absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-warm !pl-10"
                />
              </div>
            </div>

            <button type="submit" className="btn-teal w-full">
              <span>Masuk ke Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Demo personas */}
          <div className="pt-4 border-t-2 border-dashed border-sandline space-y-3">
            <p className="text-[11px] font-bold text-ink-soft uppercase tracking-wider text-center">
              Atau coba sekali klik — 8 peran demo
            </p>
            <div className="grid grid-cols-2 gap-2">
              {personaRows.map((p) => (
                <button
                  key={p.email}
                  type="button"
                  onClick={() => { switchPersona(p.role, p.email); goPortal(p.role); }}
                  className="card-warm px-3 py-2.5 text-left"
                >
                  <p className="text-xs font-bold">{p.label}</p>
                  <p className="text-[10px] text-ink-soft">{p.sub}</p>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-ink-soft text-center italic-hand">
              Semua akun demo pakai sandi yang sama, gampang kan.
            </p>
          </div>
        </div>

        <div className="text-center">
          <Link href="/" className="squiggle text-xs font-bold text-teal-deep">
            Kembali ke beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
