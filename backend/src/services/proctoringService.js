/**
 * Berkas: src/services/proctoringService.js
 * Mesin Deteksi Kecurangan Peramban Web dan Kalkulasi Akumulasi Poin Penalti
 * Persamaan 2.8 & 2.9 serta Tabel 2.5
 * Program Studi D3 Teknologi Informasi - Politeknik Negeri Madiun
 */

const ATURAN_PELANGGARAN_DEFAULT = {
  'VIOL-01': {
    kode_pelanggaran: 'VIOL-01',
    nama_peristiwa: 'Document Visibility Hidden',
    poin_penalti_bobot: 25,
    pesan_peringatan: 'Peringatan Keras: Anda terdeteksi berpindah tabulasi peramban atau membuka tab baru!'
  },
  'VIOL-02': {
    kode_pelanggaran: 'VIOL-02',
    nama_peristiwa: 'Window Blur Out of Focus',
    poin_penalti_bobot: 20,
    pesan_peringatan: 'Peringatan: Fokus jendela beralih ke aplikasi lain di luar jendela peramban ujian!'
  },
  'VIOL-03': {
    kode_pelanggaran: 'VIOL-03',
    nama_peristiwa: 'Fullscreen Exit Event',
    poin_penalti_bobot: 15,
    pesan_peringatan: 'Peringatan: Anda keluar dari tampilan layar penuh selama ujian aktif!'
  },
  'VIOL-04': {
    kode_pelanggaran: 'VIOL-04',
    nama_peristiwa: 'Clipboard Copy Cut Paste',
    poin_penalti_bobot: 15,
    pesan_peringatan: 'Peringatan: Percobaan menyalin atau menempelkan teks dari papan klip diblokir!'
  },
  'VIOL-05': {
    kode_pelanggaran: 'VIOL-05',
    nama_peristiwa: 'Context Menu and DevTools Key',
    poin_penalti_bobot: 10,
    pesan_peringatan: 'Peringatan: Menu konteks klik kanan atau pintasan DevTools tidak diizinkan!'
  }
};

/**
 * Menghitung akumulasi poin penalti P dan indeks integritas ujian I
 * Persamaan 2.8: P = Sigma (Frekuensi_k * Bobot_k)
 * Persamaan 2.9: I = Maksimum(0, 100 - P)
 */
function prosesPeristiwaPelanggaran(sesiSaatIni, kodePelanggaran, detailTelemetri, aturanMap = ATURAN_PELANGGARAN_DEFAULT, batasMaks = 100) {
  const aturan = aturanMap[kodePelanggaran] || ATURAN_PELANGGARAN_DEFAULT['VIOL-05'];
  const poinBaru = (sesiSaatIni.poin_penalti_akumulasi || 0) + aturan.poin_penalti_bobot;
  const indeksIntegritasBaru = Math.max(0, 100 - poinBaru);

  let statusSesiBaru = sesiSaatIni.status_sesi;
  let kategoriPeringatan = 'AKTIF_NORMAL_JUJUR';

  if (poinBaru >= batasMaks) {
    statusSesiBaru = 'TERKUNCI_PENALTI';
    kategoriPeringatan = 'SESI_DIKUNCI_OTOMATIS';
  } else if (poinBaru >= 75) {
    kategoriPeringatan = 'PERINGATAN_KERAS_TERAKHIR';
  } else if (poinBaru > 0) {
    kategoriPeringatan = 'PERINGATAN_TINGKAT_1';
  }

  const logEntry = {
    id_log: Date.now(),
    id_session: sesiSaatIni.id_session,
    kode_pelanggaran: aturan.kode_pelanggaran,
    nama_peristiwa: aturan.nama_peristiwa,
    bobot_poin: aturan.poin_penalti_bobot,
    detail_telemetri: detailTelemetri || aturan.nama_peristiwa,
    poin_penalti_saat_itu: poinBaru,
    indeks_integritas_saat_itu: indeksIntegritasBaru,
    waktu_kejadian: new Date().toISOString()
  };

  return {
    poin_penalti_akumulasi: poinBaru,
    indeks_integritas: indeksIntegritasBaru,
    status_sesi: statusSesiBaru,
    kategori_peringatan: kategoriPeringatan,
    pesan_peringatan: aturan.pesan_peringatan,
    logEntry
  };
}

module.exports = {
  ATURAN_PELANGGARAN_DEFAULT,
  prosesPeristiwaPelanggaran
};
