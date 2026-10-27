-- =========================================================================================
-- DATA AWAL AKADEMIK PROGRAM STUDI D3 TEKNOLOGI INFORMASI - POLITEKNIK NEGERI MADIUN
-- =========================================================================================

INSERT INTO users (nomor_induk, nama_lengkap, email_institusi, password_hash, peran_pengguna, kelas_angkatan, status_aktif) VALUES
('198303172014042001', 'Lutfiyah Dwi Setia, S.Kom., M.Kom.', 'lutfiyah@pnm.ac.id', '$2b$10$PNMAdminHash2026', 'ADMIN', NULL, TRUE),
('198805142019031007', 'Ardian Prima Atmaja, S.Kom., M.Cs.', 'ardian@pnm.ac.id', '$2b$10$PNMDosen1Hash2026', 'DOSEN', NULL, TRUE),
('199108222020122014', 'Rahmania Kumalasari, S.Kom., M.Kom.', 'rahmania@pnm.ac.id', '$2b$10$PNMDosen2Hash2026', 'DOSEN', NULL, TRUE),
('199504102022031004', 'Bagus Prasetyo, S.Tr.Kom.', 'bagus.lab@pnm.ac.id', '$2b$10$PNMPengawasHash2026', 'PENGAWAS', 'Laboratorium Jaringan & RPL', TRUE),
('223307105', 'Rendra Aditya Pratama', 'rendra.223307105@mahasiswa.pnm.ac.id', '$2b$10$PNMMhs1Hash2026', 'MAHASISWA', 'TI-3D / 2022', TRUE),
('223307101', 'Bagas Pratama Putra', 'bagas.223307101@mahasiswa.pnm.ac.id', '$2b$10$PNMMhs2Hash2026', 'MAHASISWA', 'TI-3D / 2022', TRUE),
('223307108', 'Nadia Putri Maharani', 'nadia.223307108@mahasiswa.pnm.ac.id', '$2b$10$PNMMhs3Hash2026', 'MAHASISWA', 'TI-3D / 2022', TRUE),
('223307112', 'Dimas Wahyu Saputra', 'dimas.223307112@mahasiswa.pnm.ac.id', '$2b$10$PNMMhs4Hash2026', 'MAHASISWA', 'TI-3D / 2022', TRUE),
('223307119', 'Rizky Ananda Pratama', 'rizky.223307119@mahasiswa.pnm.ac.id', '$2b$10$PNMMhs5Hash2026', 'MAHASISWA', 'TI-3D / 2022', TRUE);

INSERT INTO courses (kode_matkul, nama_matkul, semester_paket, sks_total, id_dosen_koordinator) VALUES
('TI501', 'Keamanan Jaringan dan Kriptografi', 5, 3, 2),
('TI304', 'Sistem Basis Data Terdistribusi', 3, 3, 3),
('TI402', 'Rekayasa Perangkat Lunak Berbasis Web', 4, 3, 2);

INSERT INTO exam_packets (id_course, judul_ujian, token_ruang, waktu_mulai, waktu_selesai, durasi_menit, bobot_pilgan_persen, bobot_esai_persen, batas_penalti_maks) VALUES
(1, 'Ujian Akhir Semester Keamanan Jaringan dan Kriptografi', 'PNM26A', '2026-10-27 08:00:00', '2026-10-27 18:00:00', 90, 60.00, 40.00, 100);
