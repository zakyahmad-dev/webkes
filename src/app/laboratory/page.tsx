"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PortalSidebar from "@/components/PortalSidebar";
import { useAuth } from "@/context/AuthContext";
import {
  FlaskConical,
  CheckCircle2,
  AlertCircle,
  Printer,
  ShieldCheck,
  Calendar,
  FileText,
} from "lucide-react";

export default function PatientLaboratoryPage() {
  const { currentUser } = useAuth();
  const [labOrders, setLabOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLabOrders();
  }, [currentUser]);

  const fetchLabOrders = async () => {
    try {
      setLoading(true);
      const patientId = currentUser?.patientId || 1;
      const res = await fetch(`/api/lab-orders?patientId=${patientId}`);
      const json = await res.json();
      if (json.success) setLabOrders(json.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
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
                Hasil Pemeriksaan Laboratorium
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Hasil uji diagnostik patologi klinis yang telah diverifikasi oleh analis dan dokter penanggung jawab lab.
              </p>
            </div>

            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 shrink-0"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Hasil Lab</span>
            </button>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500">Memuat hasil lab terverifikasi...</p>
            </div>
          ) : labOrders.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-2">
              <FlaskConical className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800 text-sm">Belum Ada Pemeriksaan Laboratorium</h3>
              <p className="text-xs text-slate-500">Hasil laboratorium akan otomatis tampil di sini saat dirilis oleh petugas lab.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {labOrders.map((order) => {
                const isCompleted = order.status === "completed";
                const isReleased = !!order.releasedToPatientAt;

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-5"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                            {order.orderCode}
                          </span>
                          <span className="text-xs text-slate-500">
                            Dokter Perujuk: <strong>{order.doctorName}</strong>
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Tanggal Order: {new Date(order.createdAt).toLocaleDateString("id-ID", { dateStyle: "long" })}
                        </p>
                      </div>

                      <span className="px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200 text-xs font-bold w-fit">
                        ✓ Hasil Terverifikasi & Dirilis
                      </span>
                    </div>

                    {/* Results Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-700">
                        <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                          <tr>
                            <th className="py-3 px-4 rounded-l-lg">Parameter Pemeriksaan</th>
                            <th className="py-3 px-4">Kategori</th>
                            <th className="py-3 px-4">Hasil Uji</th>
                            <th className="py-3 px-4">Satuan</th>
                            <th className="py-3 px-4">Nilai Rujukan Normal</th>
                            <th className="py-3 px-4 rounded-r-lg">Status Flag</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {order.results && order.results.length > 0 ? (
                            order.results.map((res: any) => {
                              const isNormal = res.flag === "normal";
                              const isHigh = res.flag === "high";
                              const isLow = res.flag === "low";
                              const isCritical = res.flag === "critical";

                              return (
                                <tr key={res.id}>
                                  <td className="py-3.5 px-4 font-bold text-slate-900">
                                    {res.testName}
                                  </td>
                                  <td className="py-3.5 px-4 text-slate-500">{res.category}</td>
                                  <td className="py-3.5 px-4 font-mono font-black text-sm text-slate-900">
                                    {res.value}
                                  </td>
                                  <td className="py-3.5 px-4 text-slate-500">{res.unit || "-"}</td>
                                  <td className="py-3.5 px-4 text-slate-600 font-medium">
                                    {res.referenceRange || "-"}
                                  </td>
                                  <td className="py-3.5 px-4">
                                    <span
                                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                        isNormal
                                          ? "bg-emerald-100 text-emerald-800"
                                          : isCritical
                                          ? "bg-rose-600 text-white font-black animate-pulse"
                                          : "bg-amber-100 text-amber-800"
                                      }`}
                                    >
                                      {res.flag}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={6} className="py-4 px-4 text-slate-400">
                                Hasil sedang dalam proses pengujian analis.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {order.notes && (
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
                        <strong>Catatan Klinis:</strong> {order.notes}
                      </div>
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
