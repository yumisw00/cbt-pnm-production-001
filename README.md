# Arsitektur Terpisah (3-Tier) Sistem Ujian Daring CBT & Penilaian Esai Otomatis
**Program Studi Diploma Tiga Teknologi Informasi — Politeknik Negeri Madiun (2026)**
**Penulis:** Rendra Aditya Pratama (NPM: 223307105)

Proyek ini memisahkan secara tegas ketiga lapisan arsitektur perangkat lunak sesuai Gambar 3.2 pada Laporan Tugas Akhir:

## 1. Lapisan Basis Data Relasional (`/database`)
- `01_schema_postgresql.sql` : Skrip DDL PostgreSQL 16 untuk 9 tabel utama ternormalisasi 3NF (`users`, `courses`, `exam_packets`, `question_banks`, `essay_rubrics`, `exam_sessions`, `student_answers`, `violation_rules`, `proctoring_logs`).
- `02_seed_academic_pnm.sql` : Data awal civitas akademika D3 TI PNM, mata kuliah kurikulum, dan paket ujian.
- `connection.js` : Modul koneksi `pg.Pool` PostgreSQL dengan penyimpanan persisten lokal (`cbt_persistent_store.json`) untuk pengujian langsung tanpa instalasi server eksternal.

## 2. Lapisan Backend RESTful API (`/backend`)
- `src/server.js` : Peladen HTTP Express.js yang berjalan pada port `4000` dengan prefix `/api/v1`.
- `src/middlewares/authRbacMiddleware.js` : Otentikasi token kriptografi JWT HMAC-SHA256 (`SEC-05`) dan pengendalian hak akses berbasis peran (`ADMIN`, `DOSEN`, `PENGAWAS`, `MAHASISWA`).
- `src/services/fisherYatesService.js` : Mesin pengacak urutan butir soal dan opsi pilihan ganda A–E dengan algoritma Fisher-Yates Shuffle ($O(n)$ in-place).
- `src/services/essayScoringService.js` : Mesin NLP Bahasa Indonesia (*Case Folding*, *Tokenizing*, *Stopword Removal* kamus Tala, *Stemming* algoritma Nazief-Adriani), pembobotan matriks TF-IDF terhaluskan, dan Cosine Similarity.
- `src/services/proctoringService.js` : Kalkulator akumulasi poin penalti kecurangan ($P$) dan Indeks Integritas Ujian ($I = \max(0, 100 - P)$).
- `src/controllers/cbtController.js` & `src/routes/apiRoutes.js` : Implementasi penuh 16 kontrak endpoint RESTful API (Tabel 3.20).

## 3. Lapisan Antarmuka Klien (`/frontend`)
- `index.html` : Antarmuka Single Page Application (SPA) dengan tema terang akademik profesional.
- `assets/css/theme.css` : Stylesheet desain sistem bernuansa netral-profesional.
- `assets/js/apiClient.js` : Klien HTTP RESTful API untuk komunikasi asinkron dengan peladen backend.
