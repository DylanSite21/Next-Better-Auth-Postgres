# BukuRuang — Toko Buku & Peminjaman Buku

Aplikasi web untuk **menjual** dan **meminjamkan** buku, dengan dua peran: **user** dan **admin**.
Dibangun dengan Next.js (App Router), TypeScript, PostgreSQL, Drizzle ORM, dan Better Auth.

**Stack:** Next.js 16 · React 19 · TypeScript · PostgreSQL · Drizzle ORM · Better Auth · Zod · Tailwind CSS 4

---

## Preview

![Landing Page](./preview-images/Landing-Page.png)

![Katalog Page](./preview-images/Katalog-Page.png)

## Link Figma

[View Figma Design](https://www.figma.com/design/LfKPxaHjlC2Reg3njGOK4u/MockUp-BookStore?node-id=0-1&p=f&t=APd7c0yl4SIYjB1O-0)

## Daftar Isi

1. [Petunjuk Teknis Bahasa Pemrograman Terkait](#1-petunjuk-teknis-bahasa-pemrograman-terkait)
2. [Spesifikasi Teknis Aplikasi yang Sedang Dibuat](#2-spesifikasi-teknis-aplikasi-yang-sedang-dibuat)
3. [Perangkat Lunak Terkait](#3-perangkat-lunak-terkait)
4. [Perangkat Lunak Pemrograman yang Sesuai](#4-perangkat-lunak-pemrograman-yang-sesuai)
5. [Perangkat Keras yang Sesuai](#5-perangkat-keras-yang-sesuai)
6. [Dokumen Teknis Aplikasi yang Akan Dipergunakan Kembali](#6-dokumen-teknis-aplikasi-yang-akan-dipergunakan-kembali)
7. [Spesifikasi Aplikasi yang Akan Dikembangkan](#7-spesifikasi-aplikasi-yang-akan-dikembangkan)
8. [Kode Sumber dan Perangkat Lunak yang Lama](#8-kode-sumber-dan-perangkat-lunak-yang-lama)
9. [Manual Bahasa Pemrograman](#9-manual-bahasa-pemrograman)

---

## Mulai Cepat

```bash
git clone https://github.com/<username>/<nama-repo>.git
cd <nama-repo>
npm install
```

1. Buat database kosong bernama `bookstore` di PostgreSQL (lewat pgAdmin atau `psql`).
2. Salin `.env.example` menjadi `.env`, lalu isi:

   ```env
   DATABASE_URL="postgresql://postgres:PASSWORD@localhost:5432/bookstore"
   BETTER_AUTH_SECRET="isi-string-acak-minimal-32-karakter"   # openssl rand -base64 32
   BETTER_AUTH_URL="http://localhost:3000"                    # sama dengan alamat di browser
   ```

   Jika password database mengandung karakter khusus (`@`, `#`, `/`), tulis dalam bentuk URL-encoded.

3. Buat tabel dan isi data awal, lalu jalankan:

   ```bash
   npm run db:push
   npm run db:seed
   npm run dev
   ```

4. Buka `http://localhost:3000`. Akun demo hasil seed:

   | Peran | Email                  | Password   |
   | ----- | ---------------------- | ---------- |
   | Admin | `admin@bukuruang.test` | `admin123` |
   | User  | `user@bukuruang.test`  | `user123`  |

   Seed juga membuat 5 kategori dan 15 buku beserta stoknya. Seed aman dijalankan ulang: data yang sudah ada tidak dihapus atau ditimpa.

> **Penting:** akun demo hanya untuk pengembangan. Jangan dipakai di server publik. File `.env` sudah ada di `.gitignore`, pastikan tidak pernah ter-commit.

---

## 1. Petunjuk Teknis Bahasa Pemrograman Terkait

Bahasa utama: **TypeScript** (mode `strict`) dengan **TSX** untuk antarmuka. Runtime: **Node.js**. Kueri database memakai **SQL** lewat Drizzle ORM.

### Konvensi kode

- **Server Component sebagai bawaan.** Tambahkan `"use client"` hanya pada komponen yang butuh state atau event browser (contoh: `checkout-form.tsx`, `cart-quantity-control.tsx`).
- **Mutasi data lewat Server Action** di folder `actions/` (diawali `"use server"`). Bacaan data dilakukan langsung di `page.tsx`.
- **Impor memakai alias `@/`** yang menunjuk ke root proyek (`@/lib/dal`, `@/actions/cart`).
- **Validasi input dengan Zod** (`lib/validations/`). Server tidak pernah memercayai data dari form.
- **Pesan kesalahan untuk pengguna memakai Bahasa Indonesia** dan dikembalikan sebagai `FormState` (`{ error?: string }`).

### Pola wajib

**1. Setiap action dan halaman terlindungi memakai guard dari `lib/dal.ts`.**

```ts
import { requireAdmin, requireUser } from "@/lib/dal";

const user = await requireUser(); // belum login        -> halaman 401 (unauthorized.tsx)
const admin = await requireAdmin(); // login, bukan admin -> halaman 403 (forbidden.tsx)
```

`unauthorized()` dan `forbidden()` aktif karena `experimental.authInterrupts: true` di `next.config.ts`. Guard di layout saja tidak cukup, karena Server Action dapat dipanggil langsung.

**2. Operasi yang mengubah stok atau status harus berada dalam transaksi dengan kunci baris.**

```ts
await db.transaction(async (tx) => {
  const [stock] = await tx
    .select()
    .from(stocks)
    .where(eq(stocks.bookId, bookId))
    .for("update") // kunci baris agar tidak balapan
    .limit(1);
  if (!stock || stock.availableQuantity < quantity)
    throw new Error("Stok tidak mencukupi.");
  // ... update stok + catat stock_movements dalam transaksi yang sama
});
```

**3. Uang disimpan sebagai `numeric(12,2)` dan diproses sebagai string**, bukan `float`:

```ts
import { addMoney, multiplyMoney } from "@/lib/utils";
const subtotal = multiplyMoney("85000.00", 2); // "170000.00"
```

**4. Update bersyarat untuk perubahan status.** Sertakan status lama pada `WHERE` dan periksa baris yang terpengaruh (`.returning()`), supaya dua klik bersamaan tidak memproses dua kali.

**5. Pencarian teks memakai `ilike`** (PostgreSQL membedakan huruf besar dan kecil pada `like`).

**6. Snapshot data transaksi.** Judul dan harga buku disalin ke `transaction_items` agar riwayat tidak berubah ketika data buku diedit.

### Penamaan

| Objek                    | Aturan                 | Contoh                                    |
| ------------------------ | ---------------------- | ----------------------------------------- |
| File komponen            | kebab-case             | `admin-book-form.tsx`                     |
| Fungsi Server Action     | camelCase, kata kerja  | `addToCart`, `approveLoan`                |
| Tabel dan kolom database | snake_case             | `stock_movements`, `available_quantity`   |
| Properti TypeScript      | camelCase              | `availableQuantity`                       |
| Nomor referensi          | prefiks + waktu + acak | `INV-20261123001020-31563B5B`, `LOAN-...` |

---

## 2. Spesifikasi Teknis Aplikasi yang Sedang Dibuat

### 2.1 Gambaran umum

| Item                | Keterangan                                                                      |
| ------------------- | ------------------------------------------------------------------------------- |
| Nama aplikasi       | BukuRuang                                                                       |
| Jenis               | Aplikasi web full-stack (Next.js App Router)                                    |
| Fungsi              | Penjualan buku (keranjang, checkout, bukti bayar) dan peminjaman buku (14 hari) |
| Peran               | `user` (pelanggan) dan `admin` (pengelola)                                      |
| Basis data          | PostgreSQL, diakses lewat Drizzle ORM                                           |
| Autentikasi         | Better Auth (email dan password, sesi berbasis cookie, masa berlaku 1 hari)     |
| Halaman error akses | `unauthorized.tsx` (401) dan `forbidden.tsx` (403)                              |

### 2.2 Fitur

**Umum (tanpa login):** halaman utama, tentang kami, kontak, katalog buku dengan pencarian dan filter kategori, detail buku, `GET /api/books`.

**User:** registrasi dan login (NIK 16 digit, alamat), keranjang, checkout (transfer bank), unggah bukti pembayaran, riwayat transaksi, ajukan dan batalkan peminjaman, kirim pesan kontak.

**Admin:** dashboard; CRUD buku (termasuk arsip dan unggah sampul); CRUD kategori; kelola stok dengan riwayat pergerakan; verifikasi pembayaran (setujui atau tolak dengan alasan); proses peminjaman (setujui, tolak, serahkan, catat pengembalian); kelola pengguna (aktif atau nonaktif); baca pesan kontak.

> Akun admin tidak dapat berbelanja atau meminjam. Menonaktifkan user langsung mengeluarkannya (semua sesinya dihapus).

### 2.3 Rute halaman dan API

| Rute                                                         | Akses  | Keterangan                                      |
| ------------------------------------------------------------ | ------ | ----------------------------------------------- |
| `/`, `/about`, `/contact`                                    | Publik | Landing, tentang, kontak                        |
| `/login`, `/register`                                        | Publik | Autentikasi                                     |
| `/books`, `/books/[slug]`                                    | Publik | Katalog dan detail                              |
| `/cart`, `/loans`, `/transactions`, `/transactions/[id]`     | User   | Keranjang, peminjaman, riwayat transaksi        |
| `/transaction`, `/transaction/[id]`                          | User   | Rute lama, diarahkan ke `/transactions`         |
| `/admin`                                                     | Admin  | Dashboard                                       |
| `/admin/books`, `/admin/books/new`, `/admin/books/[id]/edit` | Admin  | Kelola buku                                     |
| `/admin/categories`, `/admin/categories/[id]`                | Admin  | Kelola kategori                                 |
| `/admin/stocks`, `/admin/stocks/[id]`                        | Admin  | Kelola stok dan riwayatnya                      |
| `/admin/transactions`                                        | Admin  | Verifikasi pembayaran                           |
| `/admin/loans`                                               | Admin  | Proses peminjaman                               |
| `/admin/users`, `/admin/messages`                            | Admin  | Pengguna dan pesan kontak                       |
| `GET /api/books`                                             | Publik | Daftar buku (JSON), mendukung `?q=`             |
| `GET /api/payment-proofs/[filename]`                         | Login  | Bukti bayar; hanya pemilik transaksi atau admin |
| `/api/auth/[...all]`                                         | Publik | Endpoint Better Auth                            |

Perilaku akses: tanpa login ke halaman terlindungi menghasilkan **401**; user biasa ke `/admin/*` menghasilkan **403**; endpoint `/api/admin/*` dan `/api/payment-proofs/*` tanpa cookie sesi dijawab **401 JSON** oleh `proxy.ts`.

### 2.4 Alur bisnis

**Transaksi pembelian**

```mermaid
stateDiagram-v2
    [*] --> pending: checkout
    pending --> awaiting_verification: user unggah bukti
    rejected --> awaiting_verification: user unggah ulang
    awaiting_verification --> paid: admin setujui (stok berkurang)
    awaiting_verification --> rejected: admin tolak (alasan wajib)
    paid --> [*]
```

Stok baru berkurang **setelah pembayaran diverifikasi**, dan dicatat sebagai pergerakan `purchase`. Status `cancelled` dan `refunded` tersedia di skema untuk pengembangan berikutnya.

**Peminjaman buku**

```mermaid
stateDiagram-v2
    [*] --> pending: user ajukan
    pending --> cancelled: user batalkan
    pending --> rejected: admin tolak (alasan wajib)
    pending --> approved: admin setujui (stok dipesan)
    approved --> borrowed: admin serahkan (jatuh tempo +14 hari)
    borrowed --> returned: admin catat pengembalian
    returned --> [*]
```

Pergerakan stok untuk peminjaman: `loan_reserved` (tersedia → dipesan), `loan_issued` (dipesan → dipinjam), `loan_returned` (dipinjam → tersedia). Status `overdue` tersedia di skema.

### 2.5 Model data

```mermaid
erDiagram
    users ||--o| carts : memiliki
    users ||--o{ sessions : memiliki
    users ||--o{ accounts : memiliki
    users ||--o{ loans : mengajukan
    users ||--o{ transactions : melakukan
    users ||--o{ contact_messages : mengirim
    carts ||--o{ cart_items : berisi
    categories ||--o{ books : mengelompokkan
    books ||--o{ cart_items : dimasukkan
    books ||--|| stocks : "punya stok"
    books ||--o{ stock_movements : "riwayat stok"
    books ||--o{ loan_items : dipinjam
    books ||--o{ transaction_items : dibeli
    loans ||--o{ loan_items : berisi
    transactions ||--o{ transaction_items : berisi
```

| Tabel                                            | Fungsi                                                                                      |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `users`, `sessions`, `accounts`, `verifications` | Dikelola Better Auth. `users` memiliki field tambahan `nik`, `address`, `role`, `is_active` |
| `categories`, `books`                            | Katalog (status buku: `draft`, `published`, `archived`)                                     |
| `stocks`, `stock_movements`                      | Jumlah total, tersedia, dipesan, dipinjam, dan riwayat perubahannya                         |
| `carts`, `cart_items`                            | Keranjang satu per user                                                                     |
| `transactions`, `transaction_items`              | Pembelian, dengan snapshot judul dan harga                                                  |
| `loans`, `loan_items`                            | Peminjaman                                                                                  |
| `contact_messages`                               | Pesan dari halaman kontak (`unread` atau `read`)                                            |

Primary key berupa UUID (`varchar(36)`). Skema lengkap ada di `lib/db/schema.ts`, relasi di `lib/db/relations.ts`.

### 2.6 Keamanan

- Password di-hash oleh Better Auth; panjang minimal 10 karakter.
- `role` dan `is_active` tidak dapat diisi dari form pendaftaran.
- Setiap Server Action memeriksa peran lewat `lib/dal.ts`.
- Unggahan gambar (JPG, PNG, WebP, maksimal 5 MB) divalidasi sampai ke isi file (magic bytes) dan diberi nama acak.
- Bukti pembayaran disimpan di luar `public/` (`uploads/payment-proofs/`) dan hanya dapat diakses lewat route ber-otorisasi.
- Kunci baris (`FOR UPDATE`) dan update bersyarat mencegah stok negatif dan pemrosesan ganda.
- NIK adalah data pribadi: jangan ditampilkan di tempat umum, dan pertimbangkan enkripsi kolom bila dipakai di produksi.

### 2.7 Struktur folder

```
.
├── actions/                 # Server Action (auth, books, cart, loans, transactions, admin, contact)
├── app/
│   ├── (auth)/              # login, register
│   ├── (user)/              # books, cart, loans, transactions
│   ├── admin/               # panel admin
│   ├── api/                 # auth, books, payment-proofs
│   ├── components/          # komponen UI
│   ├── forbidden.tsx        # halaman 403
│   └── unauthorized.tsx     # halaman 401
├── lib/
│   ├── auth.ts, auth-config.ts   # konfigurasi Better Auth
│   ├── dal.ts                    # guard akses (getCurrentUser, requireUser, requireAdmin)
│   ├── db/                       # index, schema, relations, seed, reset
│   ├── services/stock.service.ts # logika pergerakan stok
│   ├── validations/              # skema Zod
│   ├── uploads.ts                # validasi dan penyimpanan gambar
│   └── utils.ts                  # uang, nomor referensi, LOAN_DAYS
├── uploads/payment-proofs/  # bukti bayar (tidak di-commit)
├── public/uploads/          # sampul buku (tidak di-commit)
├── proxy.ts                 # penjaga cepat untuk endpoint API
├── drizzle.config.ts
└── next.config.ts
```

---

## 3. Perangkat Lunak Terkait

Versi mengikuti `package.json`. Pengujian dilakukan dengan Next.js 16.4, PostgreSQL 16, dan Better Auth 1.7.

| Perangkat lunak             | Versi                                         | Fungsi                                     |
| --------------------------- | --------------------------------------------- | ------------------------------------------ |
| Node.js                     | 20.9 atau lebih baru (disarankan LTS terbaru) | Runtime JavaScript                         |
| npm                         | Bawaan Node.js                                | Pengelola paket                            |
| PostgreSQL                  | 14 atau lebih baru (diuji pada 16)            | Basis data                                 |
| Next.js                     | ^16.4                                         | Framework web (App Router, Server Actions) |
| React                       | 19.3                                          | Pustaka antarmuka                          |
| TypeScript                  | ^5                                            | Bahasa pemrograman                         |
| Drizzle ORM dan drizzle-kit | ^1.0.0-rc                                     | ORM, skema, dan sinkronisasi tabel         |
| Better Auth                 | ^1.3                                          | Autentikasi dan sesi                       |
| pg                          | ^8                                            | Driver PostgreSQL                          |
| Zod                         | ^4                                            | Validasi data                              |
| Tailwind CSS                | ^4 (`@tailwindcss/turbopack`)                 | Gaya tampilan                              |
| tsx                         | ^4                                            | Menjalankan skrip TypeScript (seed, reset) |
| ESLint                      | ^9                                            | Pemeriksaan kode                           |
| dotenv                      | ^18                                           | Membaca file `.env`                        |

Browser yang didukung: versi terbaru Chrome, Edge, Firefox, atau Safari.

---

## 4. Perangkat Lunak Pemrograman yang Sesuai

| Kebutuhan     | Pilihan                                                                  |
| ------------- | ------------------------------------------------------------------------ |
| Editor kode   | Visual Studio Code, dengan ekstensi ESLint dan Tailwind CSS IntelliSense |
| Basis data    | pgAdmin 4, DBeaver, `psql`, atau `npm run db:studio` (Drizzle Studio)    |
| Kontrol versi | Git dan GitHub                                                           |
| Uji API       | `curl`, Postman, atau Thunder Client                                     |
| Terminal      | PowerShell, Command Prompt, Windows Terminal, atau Bash                  |
| Debugging     | Browser DevTools (Network, Application) dan log terminal `next dev`      |

### Perintah npm

| Perintah                             | Fungsi                                               |
| ------------------------------------ | ---------------------------------------------------- |
| `npm run dev`                        | Server pengembangan                                  |
| `npm run build`                      | Build produksi                                       |
| `npm run start`                      | Menjalankan hasil build                              |
| `npm run lint`                       | Pemeriksaan ESLint                                   |
| `npm run db:push`                    | Menyinkronkan skema ke database (untuk pengembangan) |
| `npm run db:generate` / `db:migrate` | Membuat dan menjalankan file migrasi                 |
| `npm run db:seed`                    | Mengisi kategori, buku, stok, dan akun demo          |
| `npm run db:reset`                   | **Menghapus seluruh tabel** (ditolak di production)  |
| `npm run db:fresh`                   | Reset, push, lalu seed                               |
| `npm run db:studio`                  | Membuka Drizzle Studio                               |

Akses `psql` lewat terminal:

```bash
psql -U postgres -d bookstore
```

Jika perintah `psql` tidak dikenali di Windows, tambahkan folder `bin` PostgreSQL (misalnya `C:\Program Files\PostgreSQL\16\bin`) ke variabel lingkungan `Path`.

---

## 5. Perangkat Keras yang Sesuai

Angka berikut adalah **rekomendasi** untuk skala tugas, demo, dan pengguna terbatas.

| Peran                     | Prosesor                                   | RAM             | Penyimpanan       | Lainnya                                       |
| ------------------------- | ------------------------------------------ | --------------- | ----------------- | --------------------------------------------- |
| Pengembangan (minimal)    | 2 core                                     | 4 GB            | 5 GB kosong       | Koneksi internet untuk `npm install`          |
| Pengembangan (disarankan) | 4 core atau lebih                          | 8 GB atau lebih | SSD, 10 GB kosong | Layar 1366x768 atau lebih besar               |
| Server produksi kecil     | 2 vCPU                                     | 2 GB            | SSD 20 GB         | Penyimpanan persisten untuk folder `uploads/` |
| Perangkat pengguna        | Komputer atau ponsel dengan browser modern |                 |                   | Koneksi internet                              |

Catatan: sampul buku dan bukti bayar disimpan di disk server, sehingga hosting harus punya penyimpanan yang tidak terhapus saat deploy ulang (VPS atau volume persisten). Pada platform serverless, ganti `lib/uploads.ts` dengan layanan penyimpanan objek (S3, Cloudinary, dan sejenisnya).

---

## 6. Dokumen Teknis Aplikasi yang Akan Dipergunakan Kembali

Bagian proyek ini dirancang agar dapat dipakai ulang untuk aplikasi e-commerce atau peminjaman lain (toko alat, perpustakaan, dan sebagainya).

| Dokumen atau komponen                   | Lokasi                                                           | Dapat dipakai ulang untuk                                   |
| --------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------- |
| Skema database dan ERD                  | `lib/db/schema.ts`, `lib/db/relations.ts`, bagian 2.5            | Dasar tabel katalog, stok, keranjang, transaksi, peminjaman |
| Diagram status transaksi dan peminjaman | Bagian 2.4                                                       | Dokumentasi alur bisnis dan kebutuhan fungsional            |
| Pola guard akses (DAL)                  | `lib/dal.ts`, `app/unauthorized.tsx`, `app/forbidden.tsx`        | Proteksi peran di aplikasi Next.js lain                     |
| Konfigurasi autentikasi                 | `lib/auth-config.ts`, `lib/auth.ts`                              | Login, sesi, dan field tambahan pengguna                    |
| Layanan stok                            | `lib/services/stock.service.ts`                                  | Pencatatan pergerakan stok yang konsisten                   |
| Pola transaksi dengan kunci baris       | `actions/cart.ts`, `actions/loans.ts`, `actions/transactions.ts` | Checkout, reservasi, dan verifikasi tanpa balapan data      |
| Validasi Zod                            | `lib/validations/`                                               | Skema form registrasi, login, buku                          |
| Utilitas unggah gambar                  | `lib/uploads.ts`                                                 | Unggah aman dengan pemeriksaan isi file                     |
| Utilitas uang dan nomor referensi       | `lib/utils.ts`                                                   | Perhitungan harga tanpa float, nomor invoice                |
| Seed dan reset database                 | `lib/db/seed.ts`, `lib/db/reset.ts`                              | Data demo dan reset lingkungan pengembangan                 |
| Contoh variabel lingkungan              | `.env.example`                                                   | Panduan konfigurasi proyek baru                             |
| README ini                              | `README.md`                                                      | Kerangka dokumentasi proyek lain                            |

**Cara memakai ulang untuk tema lain:** salin repositori, ubah nama dan isi `categories`/`books` (tabel `books` dapat diganti menjadi alat, produk, dan sebagainya beserta kolom khususnya), sesuaikan teks antarmuka dan data seed, lalu pertahankan `lib/dal.ts`, pola transaksi, layanan stok, dan konfigurasi autentikasi.

---

## 7. Spesifikasi Aplikasi yang Akan Dikembangkan

Daftar berikut adalah **rencana pengembangan** dan belum ada di versi saat ini.

| Prioritas | Fitur                                      | Keterangan                                                                                                                      |
| --------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Tinggi    | Penyimpanan sampul yang aman di produksi   | Layani sampul lewat route atau penyimpanan objek, karena file di `public/` yang ditambahkan setelah build tidak selalu tersedia |
| Tinggi    | Pengujian otomatis                         | Vitest (unit) dan Playwright (alur login, checkout, peminjaman)                                                                 |
| Tinggi    | CI dan kontainerisasi                      | GitHub Actions (lint, type-check, build) dan `docker-compose` untuk Next.js + PostgreSQL                                        |
| Sedang    | Payment gateway                            | Midtrans atau Xendit dengan webhook, menggantikan verifikasi manual                                                             |
| Sedang    | Pembatalan transaksi dan pengembalian dana | Memakai status `cancelled` dan `refunded` yang sudah ada di skema                                                               |
| Sedang    | Keterlambatan peminjaman                   | Penandaan `overdue` otomatis (penjadwalan) dan perhitungan denda                                                                |
| Sedang    | Verifikasi email dan lupa password         | Didukung Better Auth, memerlukan layanan pengiriman email                                                                       |
| Rendah    | Laporan dan ekspor                         | Rekap penjualan, peminjaman, dan stok (CSV atau PDF)                                                                            |
| Rendah    | Pembatasan laju (rate limiting)            | Pada login, registrasi, dan form kontak                                                                                         |
| Rendah    | Enkripsi data pribadi                      | Enkripsi kolom NIK                                                                                                              |

---

## 8. Kode Sumber dan Perangkat Lunak yang Lama

Versi pertama proyek ini memakai **MySQL** dan autentikasi buatan sendiri. Versi saat ini memakai **PostgreSQL** dan **Better Auth**, dengan alasan kesederhanaan kode autentikasi dan kemudahan memakai fitur relasi Drizzle.

| Aspek                    | Versi lama                                                       | Versi sekarang                                                    |
| ------------------------ | ---------------------------------------------------------------- | ----------------------------------------------------------------- |
| Basis data               | MySQL / MariaDB (`mysql2`)                                       | PostgreSQL (`pg`)                                                 |
| Skema                    | `mysqlTable`, `mysqlEnum`, `decimal`, `datetime`                 | `pgTable`, `pgEnum`, `numeric`, `timestamp`                       |
| Autentikasi              | Token JWT di cookie (`jose`) dan hash `bcryptjs`, ditulis manual | Better Auth                                                       |
| Berkas autentikasi       | `lib/session.ts`, `lib/session-token.ts`                         | `lib/auth.ts`, `lib/auth-config.ts`                               |
| Tabel pengguna           | `users` dengan kolom `password`                                  | `users` + `accounts` (hash password), `sessions`, `verifications` |
| Variabel lingkungan      | `AUTH_SECRET`                                                    | `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`                           |
| Pencarian teks           | `like` (tidak membedakan huruf besar kecil)                      | `ilike`                                                           |
| Jumlah baris terpengaruh | `result[0].affectedRows`                                         | `.returning()` lalu cek panjang hasil                             |
| Upsert keranjang         | `onDuplicateKeyUpdate`                                           | `onConflictDoNothing`                                             |
| Kolom enum               | Dinamai sesuai enum (`user_role`, `book_status`)                 | Dinamai sesuai fungsi (`role`, `status`)                          |
| Penjaga akses            | `lib/dal.ts` (bentuk API sama)                                   | `lib/dal.ts` (bentuk API sama, memakai sesi Better Auth)          |

Yang **tidak berubah:** seluruh alur bisnis, struktur folder `actions/` dan `app/`, validasi Zod, layanan stok, dan halaman 401/403.

### Mengarsipkan kode lama

Simpan kode MySQL lama di cabang atau tag sebelum menimpa `main`:

```bash
git checkout -b legacy-mysql          # cabang arsip dari kode lama
git push origin legacy-mysql
git checkout main
git tag v1-mysql legacy-mysql         # opsional: penanda versi
git push origin v1-mysql
```

### Migrasi data dari versi lama

- Data MySQL **tidak otomatis pindah**. Untuk data demo, cukup jalankan `npm run db:seed`.
- Hash password lama tidak kompatibel dengan Better Auth, sehingga pengguna lama perlu mendaftar ulang atau diatur ulang kata sandinya.
- Primary key UUID dipertahankan, jadi data katalog (kategori, buku, stok) dapat diekspor dari MySQL dan diimpor ke PostgreSQL dengan menyesuaikan tipe kolom.
- Bukti pembayaran dan sampul lama (folder `uploads/` dan `public/uploads/`) dapat disalin apa adanya.

---

## 9. Manual Bahasa Pemrograman

Dokumentasi resmi untuk bahasa, kerangka kerja, dan pustaka yang dipakai:

| Topik                                                                    | Sumber                                                |
| ------------------------------------------------------------------------ | ----------------------------------------------------- |
| TypeScript                                                               | https://www.typescriptlang.org/docs/                  |
| JavaScript (MDN)                                                         | https://developer.mozilla.org/id/docs/Web/JavaScript  |
| React                                                                    | https://react.dev                                     |
| Next.js (App Router, Server Actions, `unauthorized()` dan `forbidden()`) | https://nextjs.org/docs                               |
| Node.js                                                                  | https://nodejs.org/docs/latest/api/                   |
| Drizzle ORM dan drizzle-kit                                              | https://orm.drizzle.team/docs/overview                |
| Better Auth                                                              | https://www.better-auth.com/docs                      |
| Zod                                                                      | https://zod.dev                                       |
| Tailwind CSS                                                             | https://tailwindcss.com/docs                          |
| PostgreSQL                                                               | https://www.postgresql.org/docs/                      |
| SQL dasar dan `psql`                                                     | https://www.postgresql.org/docs/current/tutorial.html |
| Git                                                                      | https://git-scm.com/doc                               |
| Mermaid (diagram di README)                                              | https://mermaid.js.org                                |

Catatan versi: Drizzle ORM 1.0 masih berstatus RC, sehingga sebagian sintaks (misalnya `defineRelations`) berbeda dari tutorial lama. Selalu cocokkan dengan dokumentasi versi yang terpasang.

---

## Kontribusi dan Lisensi

- Gunakan cabang terpisah untuk setiap fitur, lalu ajukan pull request ke `main`.
- Jalankan `npm run lint` dan `npm run build` sebelum membuat pull request.
- Lisensi: belum ditentukan. Tambahkan berkas `LICENSE` sesuai kebutuhan.
