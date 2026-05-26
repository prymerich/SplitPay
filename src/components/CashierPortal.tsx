import React, { useState } from "react";
import { Plus, Trash, Copy, Check, Sparkles, Receipt, HelpCircle } from "lucide-react";
import { Bill, BillItem } from "../types";

interface CashierPortalProps {
  onBillCreated: (bill: Bill) => void;
  setActiveTab: (tab: string) => void;
  currentUser: { id: string; username: string; name: string } | null;
}

export default function CashierPortal({ onBillCreated, setActiveTab, currentUser }: CashierPortalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState<Omit<BillItem, "id">[]>([
    { name: "Sate Ayam Madura", price: 35000, quantity: 2 },
    { name: "Es Teh Manis Selasih", price: 10000, quantity: 2 },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successBill, setSuccessBill] = useState<Bill | null>(null);
  const [copied, setCopied] = useState(false);

  // Quick Preset Helper
  const applyPreset = (presetName: string) => {
    if (presetName === "seafood") {
      setTitle("Makan Seafood Bersama");
      setDescription("Sesi makan malam tim selepas gajian di Resto Sari Laut");
      setItems([
        { name: "Kepiting Saus Padang Jumbo", price: 180000, quantity: 1 },
        { name: "Cah Kangkung Bawang Putih", price: 25000, quantity: 2 },
        { name: "Kerapu Bakar Madu", price: 95000, quantity: 1 },
        { name: "Nasi Putih Premium Cumi", price: 8000, quantity: 5 },
        { name: "Es Kelapa Muda Gelas", price: 15000, quantity: 5 },
      ]);
    } else if (presetName === "coffee") {
      setTitle("Coffee Break Syukuran");
      setDescription("Syukuran rilis proyek baru, santai sore di kedai kopi");
      setItems([
        { name: "Iced Caramel Macchiato Artisanal", price: 42000, quantity: 3 },
        { name: "Espresso Double Shot", price: 28000, quantity: 2 },
        { name: "Almond Croissant Butter", price: 35000, quantity: 4 },
        { name: "Truffle Fries Garing", price: 38000, quantity: 2 },
      ]);
    } else if (presetName === "villa") {
      setTitle("Patungan Seru Staycation");
      setDescription("Sewa Villa Hijau Puncak akhir pekan untuk refreshing");
      setItems([
        { name: "Biaya Sewa Villa 2 Hari 1 Malam", price: 1200000, quantity: 1 },
        { name: "Paket BBQ Grill Ekonomis", price: 300000, quantity: 1 },
        { name: "Cemilan & Marshmallow Api Unggun", price: 100000, quantity: 1 },
      ]);
    }
    setError("");
  };

  const handleAddItem = () => {
    setItems([...items, { name: "", price: 0, quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    const updated = [...items];
    updated.splice(index, 1);
    setItems(updated);
  };

  const handleItemChange = (index: number, field: keyof Omit<BillItem, "id">, value: any) => {
    const updated = [...items];
    if (field === "price") {
      updated[index].price = Math.max(0, Number(value) || 0);
    } else if (field === "quantity") {
      updated[index].quantity = Math.max(1, Number(value) || 1);
    } else {
      updated[index].name = value;
    }
    setItems(updated);
  };

  // Auto calculate total
  const calculatedTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Nama patungan wajib diisi.");
      return;
    }

    if (calculatedTotal <= 0) {
      setError("Total tagihan harus lebih besar dari Rp 0.");
      return;
    }

    const compiledItems = items
      .filter((itm) => itm.name.trim() !== "")
      .map((itm, index) => ({
        id: `csh-itm-${Date.now()}-${index}`,
        ...itm,
      }));

    setLoading(true);

    try {
      const response = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          totalAmount: calculatedTotal,
          items: compiledItems,
          creatorId: currentUser?.id || undefined,
        }),
      });

      if (!response.ok) {
        const errDetail = await response.json();
        throw new Error(errDetail.error || "Gagal membuat patungan.");
      }

      const freshBill = await response.json();
      setSuccessBill(freshBill);
      onBillCreated(freshBill);
    } catch (err: any) {
      setError(err.message || "Koneksi terganggu.");
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    if (!successBill) return;
    const shareableLink = `${window.location.origin}/join/${successBill.code}`;
    navigator.clipboard.writeText(shareableLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6" id="cashier-root-panel">
      {/* Upper Pitch Card */}
      <div className="bg-emerald-900/10 border border-emerald-500/20 rounded-2xl p-6 text-emerald-950">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-emerald-500 text-white rounded-xl shadow-md shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Portal Utama Kasir SplitBay</h3>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Kasir cukup memasukkan nama tagihan, deskripsi, dan rincian item. Sistem kami akan membuatkan{" "}
              <strong className="text-emerald-700">Kode & Link Patungan Unik</strong>. Kasir tidak perlu pusing membagi nominal atau mengonfirmasi satu per satu pelunasannya, biar pembeli dan tim mereka yang melakukan pembagian mandiri!
            </p>
          </div>
        </div>
      </div>

      {!successBill ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Maker Form */}
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6"
          >
            <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                Buat Tagihan Patungan Baru
              </h2>
              <span className="text-xs text-slate-500 font-mono">STEP 1 OF 3</span>
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Nama Tagihan / Acara *</label>
                <input
                  type="text"
                  placeholder="Contoh: Makan Siang Tim Finance, Kado Ultah Siska"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                    }
                  }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-slate-850 focus:outline-hidden"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Deskripsi Singkat</label>
                <input
                  type="text"
                  placeholder="Keterangan opsional untuk pembayar"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                    }
                  }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-slate-850 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Items Table */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Rincian Menu / Pesanan</h3>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 transition-all hover:bg-emerald-100 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Baris
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-200">
                <div className="bg-slate-50 p-3 grid grid-cols-12 gap-2 text-xs font-bold text-slate-550">
                  <div className="col-span-6">NAMA ITEM / LAYANAN</div>
                  <div className="col-span-3 text-right">HARGA SATUAN (RP)</div>
                  <div className="col-span-2 text-center">QTY</div>
                  <div className="col-span-1"></div>
                </div>

                <div className="space-y-2 p-2 bg-slate-50/50">
                  {items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                      <div className="col-span-6">
                        <input
                          type="text"
                          placeholder="Nama makanan/minuman/jasa..."
                          value={item.name}
                          onChange={(e) => handleItemChange(idx, "name", e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                            }
                          }}
                          className="w-full px-2 py-1 text-sm bg-transparent border-b border-transparent hover:border-slate-350 focus:border-emerald-500 focus:outline-hidden text-slate-800"
                          required
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          placeholder="Harga"
                          value={item.price || ""}
                          onChange={(e) => handleItemChange(idx, "price", e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                            }
                          }}
                          className="w-full px-2 py-1 text-sm text-right bg-transparent border-b border-transparent hover:border-slate-350 focus:border-emerald-500 focus:outline-hidden text-slate-800 font-mono"
                          min="0"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          placeholder="Qty"
                          value={item.quantity || ""}
                          onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                            }
                          }}
                          className="w-full px-2 py-1 text-sm text-center bg-transparent border-b border-transparent hover:border-slate-350 focus:border-emerald-500 focus:outline-hidden text-slate-800 font-mono"
                          min="1"
                        />
                      </div>
                      <div className="col-span-1 text-center font-sans">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          disabled={items.length <= 1}
                          className="text-slate-400 hover:text-red-500 disabled:opacity-35 transition-colors p-1 cursor-pointer"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Total Display */}
            <div className="p-5 bg-emerald-950 text-white rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 shadow-xs">
              <div>
                <span className="text-xs text-emerald-300 font-semibold tracking-wider block uppercase">Akumulasi Total Pembayaran</span>
                <span className="text-3xl font-bold font-mono text-emerald-400">
                  Rp {calculatedTotal.toLocaleString("id-ID")}
                </span>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full md:w-auto px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold rounded-xl shadow-lg shadow-emerald-950/20 hover:shadow-emerald-500/10 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? "Menyimpan tagihan..." : "Buat Tagihan Patungan →"}
              </button>
            </div>
          </form>

          {/* Presets and Tutorial Tips */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                Template Tagihan Instan
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Klik salah satu preset di bawah ini untuk mengisi simulasi meja kasir secara otomatis:
              </p>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => applyPreset("seafood")}
                  className="w-full text-left p-3 border border-slate-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50/40 transition-all cursor-pointer"
                >
                  <span className="font-semibold text-xs text-slate-800 block">🦐 1. Makan Seafood Tim</span>
                  <span className="text-[11px] text-slate-500 block mt-0.5 font-mono">Total: Rp 350.000 / 5 porsi</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyPreset("coffee")}
                  className="w-full text-left p-3 border border-slate-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50/40 transition-all cursor-pointer"
                >
                  <span className="font-semibold text-xs text-slate-800 block">☕ 2. Santai Sore Kopi & Croissant</span>
                  <span className="text-[11px] text-slate-500 block mt-0.5 font-mono">Total: Rp 370.000 / 4 Orang</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyPreset("villa")}
                  className="w-full text-left p-3 border border-slate-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50/40 transition-all cursor-pointer"
                >
                  <span className="font-semibold text-xs text-slate-800 block">🏡 3. Staycation Villa Hijau</span>
                  <span className="text-[11px] text-slate-500 block mt-0.5 font-mono">Total: Rp 1.600.000 / 3 hari</span>
                </button>
              </div>
            </div>

            <div className="bg-amber-50/70 border border-amber-500/10 rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                <HelpCircle className="w-4 h-4" />
                Mengapa cara ini lebih baik?
              </div>
              <ul className="text-xs text-amber-800 space-y-2 list-disc pl-4 leading-relaxed">
                <li>Kasir terbebas dari mengurus nama-nama pengirim transfer bank.</li>
                <li>Invoice tunggal dipecah otomatis ke banyak penyetor via webhook.</li>
                <li>Bebas dari kesalahan kalkulasi manual saat membagi bayaran.</li>
                <li>Live tracker menunjukkan status porsi pembayaran terverifikasi secara real-time.</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        /* Success Screen */
        <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-fade-in" id="cashier-success-notif">
          <div className="bg-emerald-600 p-8 text-center text-white relative">
            <div className="absolute right-4 top-4 bg-emerald-700/50 px-3 py-1.5 rounded-full text-xs font-mono font-semibold">
              KASIR PORTAL
            </div>
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-inner">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
            <h2 className="text-2xl font-black">Tagihan Patungan Terbit!</h2>
            <p className="text-emerald-100 text-xs mt-1.5">Silakan bagikan Kode atau Link di bawah ini kepada pelanggan</p>
          </div>

          <div className="p-8 space-y-6">
            <div className="bg-slate-50 rounded-2xl p-6 text-center space-y-3 border border-slate-100">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">KODE PATUNGAN SPLITBAY</span>
              <div className="text-4xl font-black tracking-widest font-mono text-emerald-800 bg-white border border-slate-200 rounded-xl py-3 px-6 shadow-xs inline-block">
                {successBill.code}
              </div>
              <p className="text-xs text-slate-500">Gunakan kode ini di handphone pembeli untuk bergabung dan split nominal.</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={copyLink}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-all cursor-pointer shadow-md"
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5" />
                    Berhasil Disalin!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    Salin Link Patungan Pembeli
                  </>
                )}
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSuccessBill(null);
                    setTitle("");
                    setDescription("");
                    setItems([
                      { name: "Sate Ayam Madura", price: 35000, quantity: 2 },
                      { name: "Es Teh Manis Selasih", price: 10000, quantity: 2 },
                    ]);
                  }}
                  className="flex-1 px-5 py-3 border border-slate-200 text-slate-705 font-semibold rounded-xl text-xs hover:bg-slate-50 transition-all text-center cursor-pointer font-sans"
                >
                  Buat Tagihan Lain
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("patungan");
                  }}
                  className="flex-1 px-5 py-3 bg-emerald-900 border border-emerald-950 text-emerald-100 font-bold rounded-xl text-xs hover:bg-emerald-805 transition-all text-center cursor-pointer font-sans"
                >
                  Buka Ruang Patungan Ini
                </button>
              </div>
            </div>

            <div className="border-t border-slate-150 pt-4 space-y-2">
              <span className="text-xs font-bold text-slate-700 block uppercase tracking-wider">Detil Transaksi:</span>
              <div className="grid grid-cols-2 gap-y-2 text-xs font-sans">
                <span className="text-slate-400">Judul</span>
                <span className="text-slate-800 font-bold text-right">{successBill.title}</span>
                <span className="text-slate-400">Total Harga</span>
                <span className="text-emerald-700 font-black font-mono text-right">Rp {successBill.totalAmount.toLocaleString("id-ID")}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
