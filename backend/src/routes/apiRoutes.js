/**
 * Berkas: backend/src/routes/apiRoutes.js
 * Definisi 16 Rute Kontrak Endpoint Layanan Web RESTful API Sistem CBT (Tabel 3.20)
 */

const express = require('express');
const router = express.Router();
const { wajibLogin, izinkanPeran } = require('../middlewares/authRbacMiddleware');
const ctrl = require('../controllers/cbtController');

// Modul Autentikasi & Master Akademik
router.post('/auth/login', ctrl.loginPengguna);
router.get('/auth/profile', wajibLogin, ctrl.ambilProfilPengguna);
router.get('/courses', wajibLogin, ctrl.ambilDaftarMataKuliah);
router.post('/users', wajibLogin, izinkanPeran('ADMIN'), ctrl.tambahPenggunaBaru);
router.put('/violation-rules/:kode', wajibLogin, izinkanPeran('ADMIN', 'DOSEN'), ctrl.perbaruiAturanPenalti);

// Modul Paket Ujian & Bank Soal (Dosen Pengampu)
router.get('/packets', wajibLogin, ctrl.ambilDaftarPaketUjian);
router.post('/packets', wajibLogin, izinkanPeran('DOSEN', 'ADMIN'), ctrl.buatPaketUjianBaru);
router.get('/packets/:id/questions', wajibLogin, izinkanPeran('DOSEN', 'ADMIN'), ctrl.ambilBankSoalPaket);
router.post('/packets/:id/questions', wajibLogin, izinkanPeran('DOSEN', 'ADMIN'), ctrl.tambahButirSoalBank);
router.delete('/questions/:questionId', wajibLogin, izinkanPeran('DOSEN', 'ADMIN'), ctrl.hapusButirSoalBank);

// Modul Sesi Ujian CBT & Fisher-Yates Shuffle (Mahasiswa)
router.post('/sessions/start', wajibLogin, izinkanPeran('MAHASISWA', 'DOSEN'), ctrl.mulaiSesiUjianFisherYates);
router.get('/sessions/:id/paper', wajibLogin, ctrl.ambilNaskahSoalSesi);
router.put('/sessions/:id/autosave', wajibLogin, izinkanPeran('MAHASISWA', 'DOSEN'), ctrl.simpanJawabanOtomatis);
router.post('/sessions/:id/submit', wajibLogin, izinkanPeran('MAHASISWA', 'DOSEN'), ctrl.akhiriDanNilaiUjian);

// Modul Pengawasan Telemetri Peramban & Otorisasi Pengawas
router.post('/proctoring/event', wajibLogin, ctrl.catatPeristiwaPelanggaran);
router.get('/proctoring/live/:packetId', wajibLogin, izinkanPeran('PENGAWAS', 'DOSEN', 'ADMIN'), ctrl.pantauSesiLangsung);
router.post('/proctoring/unlock/:sessionId', wajibLogin, izinkanPeran('PENGAWAS', 'DOSEN', 'ADMIN'), ctrl.bukaKunciSesiUjian);

// Modul Koreksi Esai Otomatis TF-IDF Cosine & Peninjauan Dosen
router.get('/grading/essay-detail/:answerId', wajibLogin, izinkanPeran('DOSEN', 'ADMIN'), ctrl.ambilRincianMatriksEsai);
router.put('/grading/manual-override/:answerId', wajibLogin, izinkanPeran('DOSEN', 'ADMIN'), ctrl.ubahNilaiEsaiManual);
router.get('/reports/packet/:packetId/export', wajibLogin, izinkanPeran('ADMIN', 'DOSEN', 'PENGAWAS'), ctrl.eksporRekapitulasiNilai);

module.exports = router;
