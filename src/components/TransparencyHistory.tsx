import React, { useState } from "react";
import { TransactionHistory } from "../types";
import { ShieldCheck, Search, Filter, Calendar, DollarSign, Sparkles, SlidersHorizontal, ArrowUpRight } from "lucide-react";

interface TransparencyHistoryProps {
  histories: TransactionHistory[];
  onRefresh: () => void;
}

export default function TransparencyHistory({ histories, onRefresh }: TransparencyHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMethod, setFilterMethod] = useState("ALL");

  // Sum of success transactions
  const successTx = histories.filter(h => h.status === "SUCCESS");
  const totalVerifiedFunds = successTx.reduce((sum, h) => sum + h.amount, 0);

  // Filter lists based on widgets inputs
  const filteredHistories = histories.filter((h) => {
    const matchesSearch = h.contributorName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          h.billTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (h.id && h.id.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesMethod = filterMethod === "ALL" || h.paymentMethod.toUpperCase().includes(filterMethod.toUpperCase());
    
    return matchesSearch && matchesMethod;
  });

  return (
    <div className="space-y-6" id="transparency-root-panel">
      
      {/* Analytics Stats Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-emerald-950 text-white rounded-2xl p-6 border border-emerald-900 shadow-lg relative overflow-hidden">
          <div className="absolute right-0 bottom-0 text-emerald-900 opacity-20 transform translate-x-4 translate-y-4 scale-150">
            <DollarSign className="w-32 h-32" />
          </div>
          <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider block">Total Dana Terverifikasi</span>
          <span className="text-3xl font-black font-mono block mt-2 text-emerald-300">
            Rp {totalVerifiedFunds.toLocaleString("id-ID")}
          </span>
          <p className="text-[11px] text-emerald-200 mt-2">Diverifikasi otomatis melalui secure webhooks callback gateway.</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs relative">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Jumlah Transaksi Sukses</span>
          <span className="text-3xl font-black font-mono block mt-2 text-slate-800">
            {successTx.length} <span className="text-sm font-normal text-slate-505 font-sans">Selesai</span>
          </span>
          <p className="text-[11px] text-slate-400 mt-2">100% integrasi real-time instan ke dompet digital SplitBay.</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Metode Pembayaran Utama</span>
          <div className="font-semibold text-xs text-slate-705 block mt-2.5 space-y-1">
            <div className="flex justify-between">
              <span>QRIS Sandbox:</span>
              <span className="font-mono text-emerald-600 font-bold">
                {histories.filter(h => h.paymentMethod.toLowerCase().includes("qris")).length} Sesi
              </span>
            </div>
            <div className="flex justify-between mt-1">
              <span>E-Wallets (GoPay/OVO)::</span>
              <span className="font-mono text-emerald-600 font-bold">
                {histories.filter(h => h.paymentMethod.toLowerCase().includes("gopay") || h.paymentMethod.toLowerCase().includes("ovo") || h.paymentMethod.toLowerCase().includes("shopee")).length} Sesi
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Filter & Search Hub */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Buku Kas Transparansi Riwayat Pembayaran Split
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Semua data di bawah merupakan bukti sah pembayaran yang divalidasi langsung oleh Webhook</p>
          </div>

          <button
            onClick={onRefresh}
            className="text-xs text-emerald-700 hover:text-emerald-800 font-bold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 transition-colors shrink-0 cursor-pointer"
          >
            🔄 Ambil Data Terbaru
          </button>
        </div>

        {/* Input selectors */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative font-sans">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama, judul patungan, atau ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:ring-1 focus:ring-emerald-500 rounded-xl focus:outline-hidden text-slate-800"
            />
          </div>

          <div className="flex items-center gap-2 font-sans">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              className="flex-1 text-xs bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl focus:outline-hidden text-slate-800"
            >
              <option value="ALL">Semua Metode Pembayaran</option>
              <option value="QRIS">QRIS GPN</option>
              <option value="Mandiri">Virtual Account Mandiri</option>
              <option value="GoPay">GoPay</option>
              <option value="OVO">OVO Wallet</option>
              <option value="Shopee">ShopeePay</option>
            </select>
          </div>

          <div className="text-right text-xs text-slate-400 flex items-center justify-end font-sans">
            Menampilkan {filteredHistories.length} dari {histories.length} data riwayat
          </div>
        </div>

        {/* Audit Trail List */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 font-bold text-slate-500 border-b border-slate-200">
                <th className="p-3">WAKTU (GMT+7)</th>
                <th className="p-3">SENDER (PEMBAYAR)</th>
                <th className="p-3">NAMA PATUNGAN</th>
                <th className="p-3">METODE BAYAR</th>
                <th className="p-3 text-right">NOMINAL</th>
                <th className="p-3 text-center">WEBHOOK STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-705 bg-white">
              {filteredHistories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 bg-white">
                    Tidak ditemukan data riwayat pembayaran yang cocok dengan saringan.
                  </td>
                </tr>
              ) : (
                filteredHistories.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3 text-slate-400 font-mono text-[10px]">
                      {new Date(tx.timestamp).toLocaleString("id-ID", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] flex items-center justify-center border border-emerald-100">
                          {tx.contributorName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-slate-800">{tx.contributorName}</span>
                      </div>
                    </td>
                    <td className="p-3 font-medium text-slate-600 max-w-xs truncate">
                      {tx.billTitle}
                    </td>
                    <td className="p-3 font-mono text-[10px] text-slate-500">
                      {tx.paymentMethod}
                    </td>
                    <td className="p-3 text-right font-bold text-emerald-800 font-mono">
                      Rp {tx.amount.toLocaleString("id-ID")}
                    </td>
                    <td className="p-3 text-center">
                      {tx.status === "SUCCESS" ? (
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase inline-flex items-center gap-1">
                          ● Verified
                        </span>
                      ) : (
                        <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase inline-flex items-center gap-1">
                          ● Failed
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
