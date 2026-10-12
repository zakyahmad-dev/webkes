"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth, DEMO_PERSONAS } from "@/context/AuthContext";
import { UserRole } from "@/lib/types";
import {
  LayoutDashboard,
  Calendar,
  Clock,
  Stethoscope,
  Pill,
  FlaskConical,
  CreditCard,
  Bell,
  User,
  Shield,
  FileText,
  Activity,
  Bed,
  Settings,
  Users,
  Building,
  HeartPulse,
  LogOut,
  ChevronRight,
  ClipboardList,
  History,
} from "lucide-react";

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number;
}

export default function PortalSidebar() {
  const pathname = usePathname();
  const { currentUser, switchPersona, logout, unreadNotificationsCount } = useAuth();
  const role: UserRole = currentUser?.role || "patient";

  const getMenuItems = (): SidebarItem[] => {
    switch (role) {
      case "doctor":
        return [
          { name: "Doctor Dashboard", href: "/doctor/dashboard", icon: LayoutDashboard },
          { name: "Jadwal & Janji Temu", href: "/doctor/appointments", icon: Calendar },
          { name: "Daftar Pasien", href: "/doctor/patients", icon: Users },
          { name: "Rekam Medis (EMR)", href: "/doctor/medical-records", icon: Stethoscope },
          { name: "Resep Elektronik", href: "/doctor/prescriptions", icon: Pill },
          { name: "Atur Jadwal Praktik", href: "/doctor/schedule", icon: Clock },
        ];
      case "nurse":
        return [
          { name: "Nurse Dashboard", href: "/nurse/dashboard", icon: LayoutDashboard },
          { name: "Antrean Poli & Panggilan", href: "/nurse/queue", icon: Clock },
          { name: "Input Tanda Vital (Triage)", href: "/nurse/vital-signs", icon: Activity },
        ];
      case "pharmacist":
        return [
          { name: "Pharmacy Dashboard", href: "/pharmacy/dashboard", icon: LayoutDashboard },
          { name: "Antrean Resep (Dispense)", href: "/pharmacy/prescriptions", icon: ClipboardList },
          { name: "Katalog & Stok Obat", href: "/pharmacy/medicines", icon: Pill },
        ];
      case "lab":
        return [
          { name: "Lab Dashboard", href: "/lab/dashboard", icon: LayoutDashboard },
          { name: "Order Masuk & Pengujian", href: "/lab/orders", icon: FlaskConical },
          { name: "Verifikasi & Rilis Hasil", href: "/lab/results", icon: CheckCircleIcon },
        ];
      case "cashier":
        return [
          { name: "Cashier Dashboard", href: "/cashier/dashboard", icon: LayoutDashboard },
          { name: "Tagihan & Pembayaran", href: "/cashier/invoices", icon: CreditCard },
        ];
      case "admin":
      case "super-admin":
        return [
          { name: "Executive Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
          { name: "Rawat Inap & Bed Board", href: "/admin/inpatient", icon: Bed },
          { name: "Master Poliklinik", href: "/admin/polyclinics", icon: Building },
          { name: "Master Dokter", href: "/admin/doctors", icon: Stethoscope },
          { name: "Audit Trail (UU PDP)", href: "/admin/audit-logs", icon: History },
          { name: "Pengaturan RS", href: "/admin/settings", icon: Settings },
        ];
      case "patient":
      default:
        return [
          { name: "Ringkasan Pasien", href: "/dashboard", icon: LayoutDashboard },
          { name: "Janji Temu Saya", href: "/appointments", icon: Calendar },
          { name: "Nomor Antrean Hari Ini", href: "/queue", icon: Clock },
          { name: "Rekam Medis (EMR)", href: "/medical-records", icon: FileText },
          { name: "Resep Digital", href: "/prescriptions", icon: Pill },
          { name: "Hasil Laboratorium", href: "/laboratory", icon: FlaskConical },
          { name: "Tagihan & Pembayaran", href: "/payments", icon: CreditCard },
          { name: "Pusat Notifikasi", href: "/notifications", icon: Bell, badge: unreadNotificationsCount || undefined },
          { name: "Profil Kesehatan", href: "/profile", icon: User },
        ];
    }
  };

  function CheckCircleIcon(props: any) {
    return <Stethoscope {...props} />;
  }

  const menuItems = getMenuItems();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between shrink-0 hidden md:flex">
      <div className="space-y-6">
        {/* User Card */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 to-sky-50/50 border border-slate-200 flex items-center gap-3">
          <img
            src={currentUser?.avatarPath || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120"}
            alt={currentUser?.name || "User"}
            className="w-11 h-11 rounded-full object-cover border-2 border-sky-500/30"
          />
          <div className="min-w-0 flex-1">
            <p className="font-bold text-slate-900 text-xs truncate">{currentUser?.name}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
              {role.replace("-", " ")}
            </p>
            {currentUser?.patientId && (
              <span className="inline-block mt-0.5 text-[9px] bg-sky-100 text-sky-800 font-mono px-1.5 py-0.2 rounded font-bold">
                RM-202610-001
              </span>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1">
          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Menu {role.toUpperCase()}
          </p>
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? "bg-sky-600 text-white shadow-sm shadow-sky-600/20"
                    : "text-slate-700 hover:bg-slate-100 hover:text-sky-600"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-500"}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="w-5 h-5 bg-rose-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Switcher & Logout */}
      <div className="pt-4 border-t border-slate-100 space-y-2">
        <Link
          href="/"
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
        >
          <span>← Kembali ke Web Publik</span>
        </Link>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Keluar Sesi</span>
        </button>
      </div>
    </aside>
  );
}
