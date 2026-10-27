-- =========================================================================================
-- SKEMA BASIS DATA RELASIONAL SISTEM UJIAN DARING CBT & PENILAIAN ESAI OTOMATIS
-- Program Studi Diploma Tiga Teknologi Informasi - Politeknik Negeri Madiun
-- Penulis: Rendra Aditya Pratama (NPM: 223307105)
-- =========================================================================================

CREATE TABLE users (
    id_user SERIAL PRIMARY KEY,
    nomor_induk VARCHAR(30) UNIQUE NOT NULL,
    nama_lengkap VARCHAR(120) NOT NULL,
    email_institusi VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    peran_pengguna VARCHAR(25) NOT NULL CHECK (peran_pengguna IN ('ADMIN', 'DOSEN', 'PENGAWAS', 'MAHASISWA')),
    kelas_angkatan VARCHAR(20),
    status_aktif BOOLEAN DEFAULT TRUE
);

CREATE TABLE courses (
    id_course SERIAL PRIMARY KEY,
    kode_matkul VARCHAR(20) UNIQUE NOT NULL,
    nama_matkul VARCHAR(150) NOT NULL,
    semester_paket INTEGER NOT NULL,
    sks_total INTEGER NOT NULL,
    id_dosen_koordinator INTEGER REFERENCES users(id_user) ON DELETE RESTRICT
);

CREATE TABLE exam_packets (
    id_packet SERIAL PRIMARY KEY,
    id_course INTEGER REFERENCES courses(id_course) ON DELETE CASCADE,
    judul_ujian VARCHAR(180) NOT NULL,
    token_ruang VARCHAR(12) NOT NULL,
    waktu_mulai TIMESTAMP NOT NULL,
    waktu_selesai TIMESTAMP NOT NULL,
    durasi_menit INTEGER NOT NULL,
    bobot_pilgan_persen NUMERIC(5,2) NOT NULL,
    bobot_esai_persen NUMERIC(5,2) NOT NULL,
    batas_penalti_maks INTEGER DEFAULT 100
);

CREATE TABLE question_banks (
    id_question SERIAL PRIMARY KEY,
    id_packet INTEGER REFERENCES exam_packets(id_packet) ON DELETE CASCADE,
    kode_soal VARCHAR(15) NOT NULL,
    tipe_soal VARCHAR(20) NOT NULL CHECK (tipe_soal IN ('PILIHAN_GANDA', 'URAIAN_ESAI')),
    teks_pertanyaan TEXT NOT NULL,
    opsi_json JSONB,
    kunci_pilgan CHAR(1),
    bobot_skor_soal NUMERIC(6,2) NOT NULL
);

CREATE TABLE essay_rubrics (
    id_rubric SERIAL PRIMARY KEY,
    id_question INTEGER UNIQUE REFERENCES question_banks(id_question) ON DELETE CASCADE,
    teks_kunci_referensi TEXT NOT NULL,
    stem_kunci_tersimpan TEXT NOT NULL,
    daftar_kata_wajib TEXT NOT NULL,
    koefisien_alfa NUMERIC(4,2) DEFAULT 0.70
);

CREATE TABLE exam_sessions (
    id_session SERIAL PRIMARY KEY,
    id_packet INTEGER REFERENCES exam_packets(id_packet) ON DELETE CASCADE,
    id_mahasiswa INTEGER REFERENCES users(id_user) ON DELETE CASCADE,
    urutan_soal_fisher JSONB NOT NULL,
    waktu_mulai_peserta TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    waktu_submit_peserta TIMESTAMP,
    skor_total_pilgan NUMERIC(6,2) DEFAULT 0.00,
    skor_total_esai NUMERIC(6,2) DEFAULT 0.00,
    nilai_akhir_ujian NUMERIC(6,2) DEFAULT 0.00,
    poin_penalti_akumulasi INTEGER DEFAULT 0,
    indeks_integritas INTEGER DEFAULT 100,
    status_sesi VARCHAR(25) NOT NULL DEFAULT 'AKTIF' CHECK (status_sesi IN ('AKTIF', 'SELESAI', 'TERKUNCI_PENALTI'))
);

CREATE TABLE student_answers (
    id_answer SERIAL PRIMARY KEY,
    id_session INTEGER REFERENCES exam_sessions(id_session) ON DELETE CASCADE,
    id_question INTEGER REFERENCES question_banks(id_question) ON DELETE CASCADE,
    jawaban_opsi_dipilih CHAR(1),
    teks_jawaban_esai TEXT,
    stem_jawaban_mahasiswa TEXT,
    skor_cosine_similarity NUMERIC(6,4) DEFAULT 0.0000,
    rasio_kata_kunci NUMERIC(6,4) DEFAULT 0.0000,
    skor_butir_diperoleh NUMERIC(6,2) DEFAULT 0.00,
    waktu_simpan_terakhir TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_session, id_question)
);

CREATE TABLE violation_rules (
    id_rule SERIAL PRIMARY KEY,
    kode_pelanggaran VARCHAR(20) UNIQUE NOT NULL,
    nama_peristiwa VARCHAR(100) NOT NULL,
    poin_penalti_bobot INTEGER NOT NULL,
    pesan_peringatan VARCHAR(255) NOT NULL
);

CREATE TABLE proctoring_logs (
    id_log SERIAL PRIMARY KEY,
    id_session INTEGER REFERENCES exam_sessions(id_session) ON DELETE CASCADE,
    id_rule INTEGER REFERENCES violation_rules(id_rule) ON DELETE RESTRICT,
    detail_telemetri VARCHAR(255) NOT NULL,
    poin_penalti_saat_itu INTEGER NOT NULL,
    waktu_kejadian TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indeks Optimasi Kueri Konkurensi Tinggi
CREATE INDEX idx_sessions_packet_mhs ON exam_sessions(id_packet, id_mahasiswa);
CREATE INDEX idx_answers_session ON student_answers(id_session);
CREATE INDEX idx_proctoring_session ON proctoring_logs(id_session);

-- Data Awal Aturan Pelanggaran (Tabel 2.5)
INSERT INTO violation_rules (kode_pelanggaran, nama_peristiwa, poin_penalti_bobot, pesan_peringatan) VALUES
('VIOL-01', 'Document Visibility Hidden', 25, 'Peringatan Keras: Anda terdeteksi berpindah tabulasi peramban atau membuka tab baru! (+25 Poin Penalti)'),
('VIOL-02', 'Window Blur Out of Focus', 20, 'Peringatan: Fokus jendela beralih ke aplikasi lain di luar peramban ujian! (+20 Poin Penalti)'),
('VIOL-03', 'Fullscreen Exit Event', 15, 'Peringatan: Anda keluar dari mode layar penuh selama ujian berlangsung! (+15 Poin Penalti)'),
('VIOL-04', 'Clipboard Copy Cut Paste', 15, 'Peringatan: Aksi salin, potong, atau tempel papan klip diblokir selama ujian! (+15 Poin Penalti)'),
('VIOL-05', 'Context Menu and DevTools Key', 10, 'Peringatan: Menu klik kanan dan pintasan inspeksi elemen dinonaktifkan! (+10 Poin Penalti)');
