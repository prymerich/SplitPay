import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { Bill, Contributor, SplitNotification, TransactionHistory, BillItem, User } from "./src/types";

// Configuration
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "splitbay_db.json");

// Helper: Read / Write Local Database to keep state across agent runs helper
let db: {
  bills: Bill[];
  notifications: SplitNotification[];
  histories: TransactionHistory[];
  users: User[];
} = {
  bills: [],
  notifications: [],
  histories: [],
  users: []
};

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      db = JSON.parse(raw);
      if (!db.users) {
        db.users = [];
      }
    } else {
      // Default Mock Data in Green visual tone alignment
      const sampleItems1: BillItem[] = [
        { id: "itm1", name: "Sate Ayam Madura Jumbo x3", price: 42000, quantity: 3 },
        { id: "itm2", name: "Es Teh Manis Kelapa x4", price: 12000, quantity: 4 },
        { id: "itm3", name: "Nasi Putih Organik x4", price: 8000, quantity: 4 },
        { id: "itm4", name: "Gurame Bakar Sambal Hijau", price: 110000, quantity: 1 },
        { id: "itm5", name: "Service Charge & PPN 10%", price: 34000, quantity: 1 }
      ];
      
      const sampleItems2: BillItem[] = [
        { id: "itm6", name: "Kado Headset Bluetooth ANC", price: 320000, quantity: 1 },
        { id: "itm7", name: "Kartu Ucapan & Pita Bungkus", price: 30000, quantity: 1 }
      ];

      const sampleItemsCompleted: BillItem[] = [
        { id: "itm8", name: "Sewa Lapangan Futsal 2 Jam", price: 180000, quantity: 1 },
        { id: "itm9", name: "Air Mineral Dus AirDingin", price: 40000, quantity: 1 }
      ];

      const initialBills: Bill[] = [
        {
          id: "bill-sample-completed",
          code: "BAY-7788",
          title: "Patungan Futsal Senin Malam",
          description: "Sewa lapangan dan air mineral bersama tim Futsal Komunitas",
          totalAmount: 220000,
          items: sampleItemsCompleted,
          status: "COMPLETED",
          createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), // Yesterday
          contributors: [
            { id: "c1", name: "Ahmad", shareAmount: 60000, paymentStatus: "PAID", paidAt: new Date(Date.now() - 3600000 * 23).toISOString() },
            { id: "c2", name: "Budi", shareAmount: 60000, paymentStatus: "PAID", paidAt: new Date(Date.now() - 3600000 * 22).toISOString() },
            { id: "c3", name: "Chandra", shareAmount: 50000, paymentStatus: "PAID", paidAt: new Date(Date.now() - 3600000 * 21).toISOString() },
            { id: "c4", name: "Deni", shareAmount: 50000, paymentStatus: "PAID", paidAt: new Date(Date.now() - 3600000 * 21).toISOString() }
          ]
        },
        {
          id: "bill-sample-sharing",
          code: "BAY-4040",
          title: "Makan Keluarga di Saung Hijau",
          description: "Patungan makan bersama keluarga besar setelah acara arisan",
          totalAmount: 350000,
          items: sampleItems1,
          status: "SHARING",
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
          contributors: [
            { id: "c5", name: "Farhan (Organizer)", shareAmount: 110000, paymentStatus: "PENDING", paidAt: null },
            { id: "c6", name: "Gita", shareAmount: 90000, paymentStatus: "PENDING", paidAt: null },
            { id: "c7", name: "Hadi", shareAmount: 100000, paymentStatus: "PENDING", paidAt: null }
          ]
        },
        {
          id: "bill-sample-kado",
          code: "BAY-9090",
          title: "Kado Ultah Siska Juara",
          description: "Patungan beli kado headset ANC modern untuk kejutan Siska",
          totalAmount: 350000,
          items: sampleItems2,
          status: "LOCKED",
          createdAt: new Date(Date.now() - 300000).toISOString(), // 5 mins ago
          contributors: [
            { id: "c8", name: "Rendi", shareAmount: 150000, paymentStatus: "PAID", paidAt: new Date(Date.now() - 100000).toISOString(), transactionId: "TX-SEMI-881273" },
            { id: "c9", name: "Santi", shareAmount: 100000, paymentStatus: "PENDING", paidAt: null },
            { id: "c10", name: "Toni", shareAmount: 100000, paymentStatus: "PENDING", paidAt: null }
          ]
        }
      ];

      const initialHistories: TransactionHistory[] = [
        {
          id: "tx-hist-1",
          billId: "bill-sample-completed",
          billTitle: "Patungan Futsal Senin Malam",
          contributorName: "Ahmad",
          amount: 60000,
          status: "SUCCESS",
          timestamp: new Date(Date.now() - 3600000 * 23).toISOString(),
          paymentMethod: "QRIS Mandiri"
        },
        {
          id: "tx-hist-2",
          billId: "bill-sample-completed",
          billTitle: "Patungan Futsal Senin Malam",
          contributorName: "Budi",
          amount: 60000,
          status: "SUCCESS",
          timestamp: new Date(Date.now() - 3600000 * 22).toISOString(),
          paymentMethod: "GoPay"
        },
        {
          id: "tx-hist-3",
          billId: "bill-sample-completed",
          billTitle: "Patungan Futsal Senin Malam",
          contributorName: "Chandra",
          amount: 50000,
          status: "SUCCESS",
          timestamp: new Date(Date.now() - 3600000 * 21).toISOString(),
          paymentMethod: "ShopeePay"
        },
        {
          id: "tx-hist-4",
          billId: "bill-sample-completed",
          billTitle: "Patungan Futsal Senin Malam",
          contributorName: "Deni",
          amount: 50000,
          status: "SUCCESS",
          timestamp: new Date(Date.now() - 3600000 * 21).toISOString(),
          paymentMethod: "OVO"
        },
        {
          id: "tx-hist-5",
          billId: "bill-sample-kado",
          billTitle: "Kado Ultah Siska Juara",
          contributorName: "Rendi",
          amount: 150000,
          status: "SUCCESS",
          timestamp: new Date(Date.now() - 100000).toISOString(),
          paymentMethod: "QRIS BCA"
        }
      ];

      const initialNotifications: SplitNotification[] = [
        {
          id: "n-1",
          billId: "bill-sample-completed",
          billTitle: "Patungan Futsal Senin Malam",
          message: "Patungan 'Patungan Futsal Senin Malam' lunas sepenuhnya! Rp 220.000 terkumpul.",
          type: "BILL_COMPLETED",
          timestamp: new Date(Date.now() - 3600000 * 21).toISOString()
        },
        {
          id: "n-2",
          billId: "bill-sample-kado",
          billTitle: "Kado Ultah Siska Juara",
          message: "Pembayaran Rp 150.000 terverifikasi dari Rendi via Webhook.",
          type: "PAYMENT_RECEIVED",
          timestamp: new Date(Date.now() - 100000).toISOString()
        }
      ];

      db = {
        bills: initialBills,
        notifications: initialNotifications,
        histories: initialHistories,
        users: []
      };

      saveDatabase();
    }
  } catch (err) {
    console.error("Error reading db_file, starting fresh:", err);
  }
}

function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing db_file:", err);
  }
}

// Helper: Custom billing code generator
function generateBillCode(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `BAY-${num}`;
}

async function start() {
  loadDatabase();

  const app = express();
  app.use(express.json());

  // --- API AUTHENTICATION ENDPOINTS ---
  
  // POST REGISTER USER
  app.post("/api/auth/register", (req, res) => {
    const { username, password, name } = req.body;

    if (!username || !password || !name) {
      return res.status(400).json({ error: "Kolom nama, username, dan password wajib diisi." });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanName = name.trim();

    if (cleanUsername.length < 3) {
      return res.status(400).json({ error: "Username minimal terdiri dari 3 karakter." });
    }
    if (password.length < 4) {
      return res.status(400).json({ error: "Password minimal terdiri dari 4 karakter." });
    }

    // Check duplicate username
    const userExists = db.users.some((u) => u.username === cleanUsername);
    if (userExists) {
      return res.status(400).json({ error: "Username sudah terdaftar. Silakan pilih username lain." });
    }

    const newUser: User = {
      id: "usr-" + Date.now() + Math.floor(Math.random() * 100),
      username: cleanUsername,
      name: cleanName,
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString()
    };

    db.users.push(newUser);
    saveDatabase();

    // Create system notification for new user registration
    const notification: SplitNotification = {
      id: "notif-usr-" + Date.now(),
      billId: "",
      billTitle: "Pendaftaran Pengguna",
      message: `👤 Pengguna baru '${cleanName}' (@${cleanUsername}) telah bergabung ke SplitBay!`,
      type: "INFO",
      timestamp: new Date().toISOString()
    };
    db.notifications.unshift(notification);
    saveDatabase();

    res.json({
      id: newUser.id,
      username: newUser.username,
      name: newUser.name,
      createdAt: newUser.createdAt
    });
  });

  // POST LOGIN USER
  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username dan password wajib diisi." });
    }

    const cleanUsername = username.trim().toLowerCase();
    const hashedPassword = hashPassword(password);

    const user = db.users.find((u) => u.username === cleanUsername && u.passwordHash === hashedPassword);

    if (!user) {
      return res.status(401).json({ error: "Username atau password salah." });
    }

    res.json({
      id: user.id,
      username: user.username,
      name: user.name,
      createdAt: user.createdAt
    });
  });

  // GET ALL BILLS
  app.get("/api/bills", (req, res) => {
    res.json(db.bills);
  });

  // GET BILL BY CODE OR ID
  app.get("/api/bills/:searchVal", (req, res) => {
    const { searchVal } = req.params;
    const bill = db.bills.find(
      (b) => b.id === searchVal || b.code.toUpperCase() === searchVal.toUpperCase()
    );
    if (!bill) {
      return res.status(404).json({ error: "Sesi patungan tidak ditemukan dengan kode tersebut." });
    }
    res.json(bill);
  });

  // POST CREATE BILL (CASHIER PORTAL EFFECT)
  app.post("/api/bills", (req, res) => {
    const { title, description, totalAmount, items, creatorId } = req.body;
    
    if (!title || !totalAmount) {
      return res.status(400).json({ error: "Nama patungan dan total harga wajib diisi." });
    }

    const newBill: Bill = {
      id: "bill-" + Date.now(),
      code: generateBillCode(),
      title,
      description: description || "No description provided",
      totalAmount: Number(totalAmount),
      items: items || [],
      status: "SHARING", // Begins in sharing phase right away as cashiers hand it off
      contributors: [],
      createdAt: new Date().toISOString(),
      creatorId: creatorId || undefined
    };

    db.bills.unshift(newBill);

    // Save state
    saveDatabase();

    // Create system notification
    const notification: SplitNotification = {
      id: "notif-" + Date.now(),
      billId: newBill.id,
      billTitle: newBill.title,
      message: `Tagihan baru '${newBill.title}' dibuat oleh Kasir dengan total Rp ${newBill.totalAmount.toLocaleString("id-ID")}. Kode: ${newBill.code}`,
      type: "INFO",
      timestamp: new Date().toISOString()
    };
    db.notifications.unshift(notification);
    saveDatabase();

    res.json(newBill);
  });

  // JOIN JOINT BILL
  app.post("/api/bills/:id/join", (req, res) => {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "Nama pembayar wajib diisi untuk join patungan." });
    }

    const bill = db.bills.find((b) => b.id === id);
    if (!bill) {
      return res.status(404).json({ error: "Tagihan tidak ditemukan." });
    }

    if (bill.status === "LOCKED" || bill.status === "COMPLETED") {
      return res.status(400).json({ error: "Tagihan sudah dikonfirmasi/lunas, tidak bisa lagi menambah pembayar." });
    }

    // Check duplicate name
    const cleanName = name.trim();
    if (bill.contributors.some((c) => c.name.toLowerCase() === cleanName.toLowerCase())) {
      return res.status(400).json({ error: "Nama ini sudah terpakai di patungan ini. Harap pakai nama unik (misal: Rian B, Rian K)." });
    }

    const newContributor: Contributor = {
      id: "cnt-" + Date.now() + Math.floor(Math.random() * 100),
      name: cleanName,
      shareAmount: 0, // initially zero, can set or distribute manually/via auto balance
      paymentStatus: "PENDING",
      paidAt: null
    };

    bill.contributors.push(newContributor);
    saveDatabase();

    // Notify info
    const notification: SplitNotification = {
      id: "notif-" + Date.now(),
      billId: bill.id,
      billTitle: bill.title,
      message: `${cleanName} bergabung ke patungan '${bill.title}'.`,
      type: "JOIN",
      timestamp: new Date().toISOString()
    };
    db.notifications.unshift(notification);
    saveDatabase();

    res.json(bill);
  });

  // REMOVE CONTRIBUTOR
  app.post("/api/bills/:id/contributors/:contributorId/remove", (req, res) => {
    const { id, contributorId } = req.params;

    const bill = db.bills.find((b) => b.id === id);
    if (!bill) {
      return res.status(404).json({ error: "Tagihan tidak ditemukan." });
    }

    if (bill.status === "LOCKED" || bill.status === "COMPLETED") {
      return res.status(400).json({ error: "Tagihan sudah ditutup/selesai, tidak bisa menghapus anggota." });
    }

    const index = bill.contributors.findIndex((c) => c.id === contributorId);
    if (index === -1) {
      return res.status(404).json({ error: "Anggota tidak ditemukan." });
    }

    const removedName = bill.contributors[index].name;
    bill.contributors.splice(index, 1);
    saveDatabase();

    // Notify subtraction
    const notification: SplitNotification = {
      id: "notif-" + Date.now(),
      billId: bill.id,
      billTitle: bill.title,
      message: `${removedName} keluar dari patungan '${bill.title}'.`,
      type: "INFO",
      timestamp: new Date().toISOString()
    };
    db.notifications.unshift(notification);
    saveDatabase();

    res.json(bill);
  });

  // UPDATE INDIVIDUAL SHARE AMOUNT
  app.put("/api/bills/:id/contributors/:contributorId", (req, res) => {
    const { id, contributorId } = req.params;
    const { shareAmount } = req.body;

    const bill = db.bills.find((b) => b.id === id);
    if (!bill) {
      return res.status(404).json({ error: "Tagihan tidak ditemukan." });
    }

    if (bill.status === "LOCKED" || bill.status === "COMPLETED") {
      return res.status(400).json({ error: "Rincian patungan sudah dikunci. Tidak bisa diubah." });
    }

    const contributor = bill.contributors.find((c) => c.id === contributorId);
    if (!contributor) {
      return res.status(404).json({ error: "Anggota patungan tidak ditemukan." });
    }

    const targetAmount = Number(shareAmount);
    if (isNaN(targetAmount) || targetAmount < 0) {
      return res.status(400).json({ error: "Jumlah pembayaran tidak valid." });
    }

    // Update share
    contributor.shareAmount = targetAmount;
    saveDatabase();

    res.json(bill);
  });

  // AUTO BALANCE OR DISTRIBUTE TAGIHAN
  app.post("/api/bills/:id/auto-balance", (req, res) => {
    const { id } = req.params;
    const { type } = req.body; // 'equal' (bagi rata semua) or 'remainder' (bagi sisa tagihan)

    const bill = db.bills.find((b) => b.id === id);
    if (!bill) {
      return res.status(404).json({ error: "Tagihan tidak ditemukan." });
    }

    if (bill.status === "LOCKED" || bill.status === "COMPLETED") {
      return res.status(400).json({ error: "Tagihan sudah dikunci atau lunas." });
    }

    const count = bill.contributors.length;
    if (count === 0) {
      return res.status(400).json({ error: "Belum ada anggota yang bergabung untuk membagi tagihan." });
    }

    if (type === "equal") {
      // Split entirely equal
      const equalShareByInt = Math.floor(bill.totalAmount / count);
      const remainderPennies = bill.totalAmount % count;

      bill.contributors.forEach((c, index) => {
        // give the tiny penny remainder to the first contributor so it balances perfectly!
        c.shareAmount = equalShareByInt + (index === 0 ? remainderPennies : 0);
      });
    } else {
      // remainder mode: find sums already allocated, distribute spare to members with 0 or to all
      const currentSum = bill.contributors.reduce((sum, c) => sum + c.shareAmount, 0);
      const leftover = bill.totalAmount - currentSum;

      if (leftover <= 0) {
        return res.status(400).json({ error: "Tagihan sudah pas atau melebihi batas. Fitur bagi sisa tidak diperlukan." });
      }

      // Distribute leftover to members who have Rp 0 first, or split among all if none
      const zeroShareMembers = bill.contributors.filter(c => c.shareAmount === 0);
      const targetList = zeroShareMembers.length > 0 ? zeroShareMembers : bill.contributors;
      const targetCount = targetList.length;

      const equalShareByInt = Math.floor(leftover / targetCount);
      const remainderPennies = leftover % targetCount;

      targetList.forEach((c, index) => {
        c.shareAmount += equalShareByInt + (index === 0 ? remainderPennies : 0);
      });
    }

    saveDatabase();
    res.json(bill);
  });

  // LOCK SHARE AND CONFIRM DETAILS
  app.post("/api/bills/:id/lock", (req, res) => {
    const { id } = req.params;

    const bill = db.bills.find((b) => b.id === id);
    if (!bill) {
      return res.status(404).json({ error: "Tagihan tidak ditemukan." });
    }

    if (bill.status !== "SHARING") {
      return res.status(400).json({ error: `Tagihan sudah berstatus ${bill.status}, tidak bisa dikunci.` });
    }

    const assignedSum = bill.contributors.reduce((sum, c) => sum + c.shareAmount, 0);

    if (assignedSum < bill.totalAmount) {
      return res.status(400).json({ 
        error: `Pembayaran masih kurang Rp ${(bill.totalAmount - assignedSum).toLocaleString("id-ID")}. Silakan sesuaikan atau gunakan fitur Auto-Balance.` 
      });
    }

    if (assignedSum > bill.totalAmount) {
      return res.status(400).json({ 
        error: `Pembayaran melebihi total harga Rp ${(assignedSum - bill.totalAmount).toLocaleString("id-ID")}. Harap kurangi kontribusi.` 
      });
    }

    // Sum is exactly equal
    bill.status = "LOCKED";
    saveDatabase();

    const notification: SplitNotification = {
      id: "notif-" + Date.now(),
      billId: bill.id,
      billTitle: bill.title,
      message: `Konstruksi patungan '${bill.title}' berhasil dikunci! Rincian tagihan dipecah menjadi ${bill.contributors.length} invoice terpisah siap bayar.`,
      type: "INFO",
      timestamp: new Date().toISOString()
    };
    db.notifications.unshift(notification);
    saveDatabase();

    res.json(bill);
  });

  // SIMULATED PAYMENT WEBHOOK RECEIVER (INTEGRASI SPLITPAY OTOMATIS BERDASARKAN WEBHOOK)
  app.post("/api/webhook/payment", (req, res) => {
    const { billId, contributorId, amount, paymentMethod, secureToken } = req.body;

    if (!billId || !contributorId || !amount) {
      return res.status(400).json({ error: "Missing webhook payload details (billId, contributorId, amount)." });
    }

    // Mock verification of signature/token
    if (secureToken && secureToken !== "MOCK_SPLITBAY_SECURE_TOKEN") {
      return res.status(401).json({ error: "Verifikasi webhook gagal: Tanda tangan digital atau token tidak valid." });
    }

    const bill = db.bills.find((b) => b.id === billId);
    if (!bill) {
      return res.status(404).json({ error: "Payment Webhook Error: Tagihan tidak terdaftar di SplitBay." });
    }

    const contributor = bill.contributors.find((c) => c.id === contributorId);
    if (!contributor) {
      return res.status(404).json({ error: "Payment Webhook Error: Anggota patungan tidak ditemukan." });
    }

    const receivedAmount = Number(amount);
    if (receivedAmount !== contributor.shareAmount) {
      // Transaction fails if amounts mismatched
      const historyFail: TransactionHistory = {
        id: "tx-hist-" + Date.now() + Math.floor(Math.random() * 1000),
        billId: bill.id,
        billTitle: bill.title,
        contributorName: contributor.name,
        amount: receivedAmount,
        status: "FAILED",
        timestamp: new Date().toISOString(),
        paymentMethod: paymentMethod || "Unknown Gateway"
      };
      db.histories.unshift(historyFail);
      saveDatabase();

      return res.status(400).json({ 
        error: `Pembayaran gagal: Jumlah transfer Rp ${receivedAmount} tidak sesuai dengan tagihan individu Rp ${contributor.shareAmount}.` 
      });
    }

    if (contributor.paymentStatus === "PAID") {
      return res.status(200).json({ status: "ALREADY_PAID", message: "Transaksi ini sebelumnya sudah lunas." });
    }

    // Update Contributor Status
    const txId = "TX-HOOK-" + Math.floor(100000 + Math.random() * 900000);
    contributor.paymentStatus = "PAID";
    contributor.paidAt = new Date().toISOString();
    contributor.transactionId = txId;

    // Record verified transaction for Full Transparency
    const historySuccess: TransactionHistory = {
      id: "tx-hist-" + Date.now() + Math.floor(Math.random() * 10),
      billId: bill.id,
      billTitle: bill.title,
      contributorName: contributor.name,
      amount: receivedAmount,
      status: "SUCCESS",
      timestamp: new Date().toISOString(),
      paymentMethod: paymentMethod || "Virtual Account Mandiri/QRIS"
    };
    db.histories.unshift(historySuccess);

    // Save
    saveDatabase();

    // Notify info payment received in center
    const notification: SplitNotification = {
      id: "notif-pay-" + Date.now(),
      billId: bill.id,
      billTitle: bill.title,
      message: `🔔 Pembayaran Rp ${receivedAmount.toLocaleString("id-ID")} terverifikasi otomatis dari ${contributor.name} via Webhook (${paymentMethod || "QRIS"}).`,
      type: "PAYMENT_RECEIVED",
      timestamp: new Date().toISOString()
    };
    db.notifications.unshift(notification);

    // Check if ALL contributors now PAID
    const allPaid = bill.contributors.every((c) => c.paymentStatus === "PAID");
    if (allPaid) {
      bill.status = "COMPLETED";
      
      const completeNotification: SplitNotification = {
        id: "notif-comp-" + Date.now(),
        billId: bill.id,
        billTitle: bill.title,
        message: `🎉 PATUNGAN LUNAS! Seluruh Rp ${bill.totalAmount.toLocaleString("id-ID")} untuk '${bill.title}' telah berhasil dipenuhi bersama!`,
        type: "BILL_COMPLETED",
        timestamp: new Date().toISOString()
      };
      db.notifications.unshift(completeNotification);
    }

    saveDatabase();

    res.json({
      success: true,
      message: "Webhook verifikasi berhasil diproses. SplitBay status terupdate.",
      updatedStatus: contributor.paymentStatus,
      billStatus: bill.status,
      transactionId: txId
    });
  });

  // GET GLOBAL NOTIFICATIONS FEED
  app.get("/api/notifications", (req, res) => {
    res.json(db.notifications);
  });

  // GET TRANSACTIONS HISTORY FOR TRANSPARENCY
  app.get("/api/history", (req, res) => {
    res.json(db.histories);
  });

  // RESET DATABASE ACTION (Saves a backup manually if needed, or resets)
  app.post("/api/reset", (req, res) => {
    db = { bills: [], notifications: [], histories: [], users: [] };
    if (fs.existsSync(DB_FILE)) {
      try {
        fs.unlinkSync(DB_FILE);
      } catch (e) {}
    }
    loadDatabase();
    res.json({ success: true, message: "Sistem berhasil di-reset ke kondisi awal." });
  });

  // Host Vite preview or serve compiled state depending on production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SplitBay Server dynamically serving on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to bootstrap SplitBay application:", err);
});
