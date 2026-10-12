"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PortalSidebar from "@/components/PortalSidebar";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  Clock,
  Calendar,
  Pill,
  FlaskConical,
  CreditCard,
  Info,
  Check,
} from "lucide-react";

export default function NotificationsPage() {
  const { currentUser, setUnreadNotificationsCount } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, [currentUser]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const userId = currentUser?.id || 11;
      const res = await fetch(`/api/notifications?userId=${userId}`);
      const json = await res.json();
      if (json.success) {
        setNotifications(json.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const userId = currentUser?.id || 11;
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true, userId }),
      });
      setUnreadNotificationsCount(0);
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "appointment":
        return <Calendar className="w-5 h-5 text-sky-600" />;
      case "prescription":
        return <Pill className="w-5 h-5 text-amber-600" />;
      case "laboratory":
        return <FlaskConical className="w-5 h-5 text-indigo-600" />;
      case "payment":
        return <CreditCard className="w-5 h-5 text-emerald-600" />;
      default:
        return <Info className="w-5 h-5 text-teal-600" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        <PortalSidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Pusat Notifikasi & Smart Reminder
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Pemberitahuan real-time: pengingat janji temu (≤ 2 Jam), panggilan antrean, status resep, dan rilis lab.
              </p>
            </div>

            <button
              onClick={handleMarkAllRead}
              className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Tandai Semua Dibaca</span>
            </button>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500">Memuat notifikasi...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-2">
              <Bell className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800 text-sm">Tidak Ada Notifikasi Baru</h3>
              <p className="text-xs text-slate-500">Semua pengingat janji temu dan informasi terkini telah terbaca.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notif) => {
                const isUnread = !notif.readAt;
                return (
                  <div
                    key={notif.id}
                    className={`p-5 rounded-2xl border transition flex items-start justify-between gap-4 ${
                      isUnread
                        ? "bg-white border-sky-300 shadow-xs ring-1 ring-sky-300/20"
                        : "bg-slate-50/70 border-slate-200 text-slate-600"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 rounded-2xl bg-slate-100 shrink-0 mt-0.5">
                        {getCategoryIcon(notif.category)}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-slate-900">{notif.title}</h3>
                          {isUnread && (
                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                          )}
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">{notif.message}</p>
                        <span className="text-[10px] text-slate-400 block pt-1">
                          {new Date(notif.createdAt).toLocaleDateString("id-ID", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                      </div>
                    </div>

                    {notif.actionUrl && (
                      <Link
                        href={notif.actionUrl}
                        className="px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs shrink-0 whitespace-nowrap"
                      >
                        Buka Layanan →
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}
