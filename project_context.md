# Konteks Proyek: Website PT Fortuna Solusi Group

> **Tujuan dokumen ini:** Untuk diberikan ke AI online (Claude/Gemini/ChatGPT) yang memiliki akses search, agar bisa merekomendasikan spesifikasi hosting dan harga yang cocok.

---

## 1. Informasi Umum Proyek

| Item | Detail |
|---|---|
| **Nama Proyek** | Website PT Fortuna Solusi Group |
| **Jenis Website** | Company Profile + Admin Panel (CMS sederhana) |
| **Bidang Usaha** | Jasa Instalasi Listrik, Pengurusan NIDI (Nomor Identitas Instalasi) & SLO |
| **Lokasi Perusahaan** | Bogor, Jawa Barat, Indonesia |
| **Target Audiens** | Calon pelanggan di Indonesia yang membutuhkan jasa instalasi listrik & pengurusan NIDI |
| **Bahasa Website** | Bahasa Indonesia |

---

## 2. Tech Stack

| Komponen | Teknologi | Versi |
|---|---|---|
| **Framework** | Next.js (App Router) | 16.1.6 |
| **Runtime** | React | 19.2.3 |
| **Bahasa** | TypeScript | ^5 |
| **Styling** | TailwindCSS v4 + Inline CSS (JSX style tags) | ^4 |
| **Database** | PostgreSQL (via Prisma ORM) | - |
| **ORM** | Prisma Client | ^7.6.0 |
| **Package Manager** | pnpm / npm | - |
| **Build Tool** | Next.js built-in (Webpack/Turbopack) | - |

---

## 3. Arsitektur & Struktur Halaman

### 3.1 Halaman Publik (Frontend)

| Route | Deskripsi | Tipe Rendering |
|---|---|---|
| `/` | **Homepage** — Landing page dengan hero, tentang, layanan, proses kerja, CTA | SSR/SSG |
| `/layanan` | **Halaman Layanan** — Detail layanan NIDI, instalasi, dll | SSR/SSG |
| `/layanan/alur` | Sub-halaman alur pengurusan NIDI | SSR/SSG |
| `/layanan/cetak-nidi` | Cetak sertifikat NIDI (fitur generate/print) | Client-side |
| `/layanan/harga` | Halaman harga layanan | SSR/SSG |
| `/layanan/instalasi` | Detail layanan instalasi listrik | SSR/SSG |
| `/layanan/kantor` | Info kantor/cabang | SSR/SSG |
| `/layanan/status` | Cek status pengurusan NIDI | Client-side |
| `/pricelist` | **Pricelist publik** — tabel harga dari localStorage | Client-side |
| `/tentang` | **Tentang Perusahaan** — visi misi, tim (9 anggota), coverage area | SSR/SSG |
| `/kontak` | **Halaman Kontak** — form kontak → redirect ke WhatsApp, info kontak | Client-side |
| `/sertifikat` | **Cek Sertifikat NIDI** — pencarian & verifikasi sertifikat | Client-side |

### 3.2 Halaman Admin (Panel CMS)

| Route | Deskripsi |
|---|---|
| `/admin/login` | Login admin (localStorage-based auth) |
| `/admin/dashboard` | Dashboard admin — statistik, preview pricelist, jam operasional, quick links |
| `/admin/pricelist` | CRUD manajemen pricelist (simpan ke localStorage) |
| `/admin/nidi` | Manajemen data sertifikat NIDI |
| `/admin/sidebar` | Sidebar navigasi admin |
| `/admin/status` | Manajemen status pengurusan |

### 3.3 API Routes

| Route | Deskripsi |
|---|---|
| `/api/nidi/search` | API pencarian sertifikat NIDI (query ke PostgreSQL via Prisma) |
| `/api/admin/nidi` | API CRUD data sertifikat NIDI (PostgreSQL via Prisma) |

---

## 4. Database Schema

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model NidiCertificate {
  id           String   @id @default(cuid())
  nidiNumber   String   @unique      // e.g. "NIDI-2025-002"
  ownerName    String                // Nama pemilik
  buildingType String?               // Rumah, Ruko, Kantor, dll
  capacity     String?               // Kapasitas daya (e.g. "1300")
  fileUrl      String                // Base64 encoded image/document
  status       String   @default("Laik Operasi")
  createdAt    DateTime @default(now())
}
```

> [!IMPORTANT]
> Database hanya punya **1 tabel** (`NidiCertificate`). Data pricelist disimpan di **localStorage** browser admin, bukan di database.

---

## 5. Ukuran Proyek

| Metrik | Nilai |
|---|---|
| **Total file kode** (`.tsx`, `.ts`, `.css`) | 33 file |
| **Total ukuran kode** | ~520 KB |
| **Komponen React** | 8 komponen (`AdminSidebar`, `DashboardAdmin`, `Footer`, `LayoutClient`, `Navbar`, `PricelistAdmin`, `Sertifikat`, `ServiceCard`) |
| **Static Assets** | Logo perusahaan (25 KB), 1 foto tim (83 KB), SVG icons |
| **Data JSON** | 1 file `db.json` (~200 KB, berisi data sertifikat dengan base64 images) |

---

## 6. Fitur & Fungsionalitas

### Frontend
- ✅ Landing page responsif dengan animasi CSS
- ✅ Multi-halaman company profile (layanan, tentang, kontak, pricelist)
- ✅ Form kontak → redirect ke WhatsApp (wa.me)
- ✅ Pencarian & verifikasi sertifikat NIDI online
- ✅ Tabel pricelist dengan filter & search

### Admin Panel
- ✅ Login sederhana (localStorage-based, tanpa backend auth)
- ✅ Dashboard dengan statistik
- ✅ CRUD pricelist (localStorage)
- ✅ CRUD sertifikat NIDI (PostgreSQL via Prisma + API Routes)
- ✅ Upload file sertifikat (base64, max 10MB body size)

### Yang BELUM ada / Belum digunakan
- ❌ Tidak ada sistem autentikasi backend (JWT/session)
- ❌ Tidak ada email service
- ❌ Tidak ada payment gateway
- ❌ Tidak ada real-time features (WebSocket, dll)
- ❌ Tidak ada file storage service (menggunakan base64 di database)

---

## 7. Estimasi Kebutuhan & Traffic

| Parameter | Estimasi |
|---|---|
| **Target traffic** | 100-500 pengunjung/hari (website bisnis lokal) |
| **Concurrent users** | ~10-30 |
| **Database size** | Kecil (< 1 GB, mayoritas base64 images) |
| **API calls** | Rendah (~100-500/hari, hanya pencarian NIDI) |
| **Build size** | ~10-20 MB (Next.js production build) |
| **Bandwidth** | ~5-10 GB/bulan |

---

## 8. Kebutuhan Hosting

### Yang Dibutuhkan:
1. **Node.js runtime** — untuk Next.js SSR (App Router)
2. **PostgreSQL database** — untuk data sertifikat NIDI
3. **Custom domain support** — untuk domain perusahaan
4. **HTTPS/SSL** — wajib untuk website bisnis
5. **Indonesian/Asia server** — untuk latency rendah ke pengunjung Indonesia

### Yang TIDAK Dibutuhkan:
- ❌ GPU/ML computing
- ❌ Large file storage (S3, dll) — saat ini base64 di DB
- ❌ Redis/caching layer
- ❌ CI/CD pipeline (manual deploy ok)
- ❌ Multi-region deployment

---

## 9. Pertanyaan untuk AI Online

Tolong bantu carikan dan rekomendasikan:

1. **Platform hosting** yang cocok untuk proyek ini (Vercel, Railway, Render, DigitalOcean, dll) beserta **perbandingan harga**
2. **Tier/plan** yang paling cost-effective untuk skala proyek ini
3. **PostgreSQL hosting** — apakah lebih baik bundled dengan hosting atau terpisah (Supabase, Neon, Railway, dll)?
4. **Estimasi biaya bulanan** total (hosting + database)
5. **Rekomendasi untuk scaling** jika traffic naik di masa depan
6. **Apakah ada free tier** yang cukup untuk proyek skala ini?

### Preferensi:
- Budget: **Semurah mungkin** tapi tetap reliable
- Prioritas: **Uptime > Kecepatan > Fitur**
- Lokasi server: **Asia/Singapore** lebih disukai
- Kemudahan deploy: **Git push deploy** lebih disukai

---

## 10. Catatan Tambahan

- Website ini untuk **bisnis kecil-menengah** di bidang jasa instalasi listrik
- **Tidak ada** kebutuhan untuk high-availability atau SLA enterprise
- Admin panel digunakan oleh **1-3 orang** saja
- Data sertifikat NIDI menggunakan **base64 encoding** langsung di database — ini bisa di-optimize ke file storage di masa depan
- Pricelist saat ini di **localStorage** — bisa di-migrasi ke database jika diperlukan
- Next.js konfigurasi saat ini menggunakan `serverActions` dengan `bodySizeLimit: 10mb` untuk upload sertifikat
