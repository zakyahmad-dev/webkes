"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PortalSidebar from "@/components/PortalSidebar";
import { useAuth } from "@/context/AuthContext";
import {
  CreditCard,
  CheckCircle2,
  Clock,
  Printer,
  QrCode,
  Building,
  ShieldCheck,
  Receipt,
  ArrowRight,
  X,
} from "lucide-react";

export default function PatientPaymentsPage() {
  const { currentUser } = useAuth();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePayInvoice, setActivePayInvoice] = useState<any | null>(null);
  const [payMethod, setPayMethod] = useState<string>("qris");
  const [paying, setPaying] = useState(false);
  const [paySuccessData, setPaySuccessData] = useState<any | null>(null);

  useEffect(() => {
    fetchInvoices();
  }, [currentUser]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const patientId = currentUser?.patientId || 1;
      const res = await fetch(`/api/invoices?patientId=${patientId}`);
      const json = await res.json();
      if (json.success) setInvoices(json.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayment = async () => {
    if (!activePayInvoice) return;
    try {
      setPaying(true);
      const res = await fetch("/api/invoices/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: activePayInvoice.id,
          method: payMethod,
          amount: activePayInvoice.total,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setPaySuccessData(json.data);
        fetchInvoices();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPaying(false);
    }
  };

  const handlePrintReceipt = () => {
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
                Riwayat Tagihan & Pembayaran
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Rincian tagihan biaya dokter, resep farmasi, tes laboratorium, dan bukti kuitansi resmi.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500">Memuat tagihan pasien...</p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-2">
              <CreditCard className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800 text-sm">Belum Ada Tagihan</h3>
              <p className="text-xs text-slate-500">Tagihan konsultasi atau layanan rumah sakit akan tampil di sini.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {invoices.map((inv) => {
                const isPaid = inv.status === "paid";
                return (
                  <div
                    key={inv.id}
                    className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-4"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                            {inv.invoiceNumber}
                          </span>
                          <span className="text-xs text-slate-500">
                            Diterbitkan: {new Date(inv.issuedAt).toLocaleDateString("id-ID", { dateStyle: "long" })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                            isPaid
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : "bg-amber-100 text-amber-800 border border-amber-300"
                          }`}
                        >
                          {isPaid ? "✓ Lunas (Paid)" : "Menunggu Pembayaran"}
                        </span>
                      </div>
                    </div>

                    {/* Line Items Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-700">
                        <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                          <tr>
                            <th className="py-2.5 px-4 rounded-l-lg">Deskripsi Layanan / Item</th>
                            <th className="py-2.5 px-4">Tipe</th>
                            <th className="py-2.5 px-4 text-center">Jumlah</th>
                            <th className="py-2.5 px-4 text-right">Harga Satuan</th>
                            <th className="py-2.5 px-4 rounded-r-lg text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {inv.items && inv.items.length > 0 ? (
                            inv.items.map((item: any) => (
                              <tr key={item.id}>
                                <td className="py-3 px-4 font-bold text-slate-900">{item.description}</td>
                                <td className="py-3 px-4 text-slate-500 uppercase text-[10px] font-semibold">
                                  {item.itemType}
                                </td>
                                <td className="py-3 px-4 text-center">{item.quantity}</td>
                                <td className="py-3 px-4 text-right font-mono">
                                  Rp {Number(item.unitPrice).toLocaleString("id-ID")}
                                </td>
                                <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                                  Rp {Number(item.subtotal).toLocaleString("id-ID")}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="py-3 px-4 text-slate-400">Tidak ada rincian item.</td>
                            </tr>
                          )}
                        </tbody>
                        <tfoot className="border-t-2 border-slate-200">
                          <tr>
                            <td colSpan={4} className="py-3 px-4 font-bold text-slate-900 text-right">
                              Total Tagihan:
                            </td>
                            <td className="py-3 px-4 font-mono font-black text-base text-sky-700 text-right">
                              Rp {Number(inv.total).toLocaleString("id-ID")}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2">
                      {!isPaid ? (
                        <button
                          onClick={() => {
                            setActivePayInvoice(inv);
                            setPaySuccessData(null);
                          }}
                          className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2"
                        >
                          <CreditCard className="w-4 h-4" />
                          <span>Bayar Tagihan Sekarang</span>
                        </button>
                      ) : (
                        <button
                          onClick={handlePrintReceipt}
                          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center gap-1.5"
                        >
                          <Receipt className="w-4 h-4 text-slate-500" />
                          <span>Cetak Bukti Kuitansi</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Pay Modal */}
      {activePayInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-sky-600" />
                <span>Pembayaran Tagihan #{activePayInvoice.invoiceNumber}</span>
              </h3>
              <button
                onClick={() => setActivePayInvoice(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!paySuccessData ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-center space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                    Total yang Harus Dibayar
                  </span>
                  <div className="text-3xl font-black text-sky-700 tracking-tight">
                    Rp {Number(activePayInvoice.total).toLocaleString("id-ID")}
                  </div>
                </div>

                {/* Method selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">Pilih Metode Pembayaran</label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { id: "qris", label: "QRIS Instant", desc: "BCA, GoPay, OVO, Shopee" },
                      { id: "transfer_va", label: "Virtual Account", desc: "BCA / Mandiri / BRI VA" },
                      { id: "debit_card", label: "Kartu Debit/Kredit", desc: "Visa / Mastercard" },
                      { id: "cash", label: "Tunai di Kasir", desc: "Loket Kasir RS Lt 1" },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPayMethod(m.id)}
                        className={`p-3 rounded-xl border text-left transition ${
                          payMethod === m.id
                            ? "bg-sky-50 border-sky-600 ring-2 ring-sky-600/20 font-bold text-sky-900"
                            : "bg-white border-slate-200 hover:border-sky-300 text-slate-700"
                        }`}
                      >
                        <p className="text-xs">{m.label}</p>
                        <p className="text-[10px] text-slate-400 font-normal">{m.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {payMethod === "qris" && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
                    <div className="w-32 h-32 bg-white rounded-xl mx-auto border border-slate-300 flex items-center justify-center p-2">
                      <QrCode className="w-full h-full text-slate-800" />
                    </div>
                    <p className="text-[11px] text-slate-500">Scan QRIS menggunakan aplikasi m-banking apa saja</p>
                  </div>
                )}

                <button
                  onClick={handleProcessPayment}
                  disabled={paying}
                  className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                >
                  {paying ? "Memproses Verifikasi Gateway..." : "Konfirmasi Pembayaran (Mock Gateway)"}
                </button>
              </div>
            ) : (
              <div className="text-center py-4 space-y-3">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-slate-900">Pembayaran Berhasil!</h4>
                <p className="text-xs text-slate-500">
                  Kode Pembayaran: <strong className="text-slate-900">{paySuccessData.payment?.paymentCode}</strong>
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setActivePayInvoice(null)}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition"
                  >
                    Tutup & Kembali
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
