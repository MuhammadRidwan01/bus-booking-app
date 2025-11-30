# Bus Booking App – Project Context

## 1. Tech Stack & Overview
- Detected main language(s): TypeScript + React (Next.js App Router).
- Framework(s): Next.js 15 (app/ directory), shadcn/ui + Radix primitives, Tailwind CSS.
- Build / runtime tools: pnpm (lockfile present) or npm, Next.js dev/build/start scripts, node-cron for background jobs, Supabase (DB + Realtime), Wablas API for WhatsApp.
- High-level description: Landing + booking flow untuk shuttle bus hotel Ibis (Style & Budget) dengan pilihan jadwal real-time, pembuatan tiket via Supabase, pengiriman kode booking lewat WhatsApp, serta halaman pelacakan tiket.

## 2. Folder & Module Structure
- `app/` – Next.js routes (home, booking/[hotel], booking/confirmation, track) dan API routes (`api/cron/daily-maintenance`, `api/send-wa`). `app/actions` berisi server actions (booking + Supabase admin helper).
- `components/` – UI layer (shadcn/ui kit) plus domain components: `ScheduleSelector`, `BookingCode`, `theme-provider`.
- `hooks/` – Custom hooks (`useRealTimeCapacity`, `use-mobile`, `use-toast`).
- `lib/` – Utilitas dan integrasi: Supabase clients (browser/admin), cron setup, WA sender, validation helpers, general utils.
- `supabase/` – Konfigurasi CLI, migrations (schema, timezone), seed SQL (functions/views/sample data).
- `public/` – Assets gambar logo/foto hotel.
- `styles/`, `tailwind.config.ts`, `postcss.config.mjs` – Styling setup.
- `types/` – Shared TypeScript models untuk hotel/schedule/booking.

## 3. Core Domains & Data Model
- **Hotel**: `id`, `name`, `slug`, `is_active`; relasi ke banyak `bus_schedules`.
- **BusSchedule**: Template jadwal per hotel; `departure_time`, `destination`, `max_capacity`, `is_active`.
- **DailySchedule**: Jadwal harian ter-generate; `bus_schedule_id`, `schedule_date`, `current_booked`, `status` (`active|full|expired|cancelled`). Trigger `sync_daily_schedule_status` menjaga status berdasar kapasitas; tersedia view realtime dan policy select publik.
- **Booking**: `booking_code`, `hotel_id`, `daily_schedule_id`, `customer_name`, `phone`, `passenger_count`, `status`, `whatsapp_sent`, optional `room_number` (di view). Insert dijalankan via server action, kapasitas di-update lewat RPC `increment_capacity`.
- **RoomNumber**: Daftar kamar per hotel (seeded) untuk validasi manual; tidak selalu dipakai di form.
- **Views/Helpers**:
  - `booking_details` view menggabungkan booking + hotel + schedule (dipakai untuk tracking).
  - `available_schedules` view untuk jadwal aktif.
  - Functions: `generate_daily_schedules`, `cleanup_expired_schedules`, `daily_maintenance`, `increment_capacity`, `create_booking_with_capacity`.
- Relasi ringkas: Hotel → BusSchedule → DailySchedule; Booking → DailySchedule & Hotel; RoomNumber → Hotel.

## 4. Main Features (User Flow)
1. **Search & List Buses**
   - Hotel dipilih dari halaman utama (`app/page.tsx`) menuju `/booking/[hotel]` dengan slug `ibis-style|ibis-budget`.
   - Jadwal di halaman booking diambil lewat hook `useRealTimeCapacity` (Supabase read + realtime) untuk hari ini/besok.
2. **Seat Selection / Capacity**
   - Komponen `ScheduleSelector` menampilkan jadwal dengan status `available/almost-full/full`, progress bar, dan blokir jika sudah lewat 20 menit sebelum keberangkatan (`isScheduleAvailable`). Tidak memilih kursi per-seat, hanya kuota penumpang.
3. **Passenger Details & Validation**
   - Form fields: `customerName`, `phoneNumber`, `passengerCount` (1–5), `roomNumber`, hidden `scheduleId` & `bookingDate`.
   - Validasi zod di server action `createBooking` (jumlah penumpang, format nomor, uuid schedule, room number wajib ada).
4. **Booking / Checkout**
   - Server action `createBooking` memeriksa kapasitas `daily_schedules`, generate kode (`IBX...`), insert ke `bookings`, panggil RPC `increment_capacity`, kirim WhatsApp template via `sendWhatsappTemplate` (Wablas), set `whatsapp_sent`, lalu redirect ke `/booking/confirmation?code=...`.
   - Booking code ditampilkan di `BookingCode` dengan tombol copy.
5. **Tracking Tiket**
   - Halaman `/track` menggunakan `getBookingByCode` (select dari view `booking_details`) untuk menampilkan hotel, tanggal, jam, tujuan, jumlah penumpang, status, room number, phone.
6. **Cron / Maintenance**
   - `lib/cron-setup.ts` menjadwalkan: daily maintenance (call API `/api/cron/daily-maintenance`) dan hourly cleanup (`cleanup_expired_schedules`). Trigger manual via `lib/server-init.ts` import.

## 5. API / Routes (Jika Ada)
- `GET /api/cron/daily-maintenance` → handler di `app/api/cron/daily-maintenance/route.ts`, butuh header `Authorization: Bearer <CRON_SECRET>`, menjalankan RPC `daily_maintenance` di Supabase.
- `POST /api/send-wa` → `app/api/send-wa/route.ts`, proxy ke Wablas `send-message` (Authorization masih placeholder) dengan body `{ phone, message }`.
- `GET /api/hello` → default Next sample.
- Page routes: `/` (landing), `/booking/[hotel]`, `/booking/confirmation`, `/track`.

## 6. Frontend Structure (Jika Ada UI)
- Teknologi: Next.js App Router, React client/server components, Tailwind CSS, shadcn/ui (Radix) untuk form/input/modal styling.
- Komponen/halaman utama: Landing hero + kartu hotel (booking CTA), `ScheduleSelector` (list jadwal + kapasitas real-time), Form booking, Halaman konfirmasi kode, Halaman tracking tiket dengan kartu detail.
- Pola UI: step sederhana (pilih hotel → pilih jadwal → isi data → konfirmasi), badge status kapasitas, progress bar occupancy, copy-to-clipboard booking code.

## 7. Configuration & Environment
- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, service role `SUPABASE_SERVICE_ROLE_KEY`/`SUPABASE_SERVICE_ROLE_KEYY` (ada dua versi; action/config memakai yang berakhiran `KEYY`).
- Cron: `CRON_SECRET` (auth header), `NEXTAUTH_URL` dipakai sebagai base URL untuk memanggil endpoint cron.
- WhatsApp (Wablas): `WABLAS_API_KEY`, `WABLAS_TEMPLATE_ID` untuk template API; `/api/send-wa` masih kosong authorization.
- Lain: Next middleware aktif di `/api/*` dan `/booking/*` menambah header `x-url`.

## 8. Known Limitations / TODO (From Code Comments)
- Env mismatch: service role env di beberapa file pakai `SUPABASE_SERVICE_ROLE_KEYY` (double Y) sementara lainnya `SUPABASE_SERVICE_ROLE_KEY` – perlu diseragamkan agar admin client jalan.
- `/api/send-wa` masih memakai Authorization kosong; risk akan gagal kirim WA di production.
- Cron setup memakai `NEXTAUTH_URL` sebagai base URL (tidak ada NextAuth di repo), pastikan env diarahkan ke origin app.
- Room number form tidak divalidasi terhadap tabel `room_numbers`, hanya string bebas.
- Tidak ada auth/admin panel; semua booking dilakukan publik via Supabase anon + service role insert.

## 9. How to Run (Based on Existing Files)
- Install deps: `pnpm install` (atau `npm install`/`yarn` sesuai preferensi; pnpm lock tersedia).
- Jalankan dev server: `pnpm dev` (Next.js).
- Build: `pnpm build`, lalu `pnpm start` untuk production server.
- Pastikan env Supabase + Wablas + cron sudah diisi sebelum run agar booking/cron berfungsi.
