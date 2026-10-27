/**
 * Berkas: src/services/fisherYatesService.js
 * Implementasi Algoritma Pengacakan Ganda Fisher-Yates Shuffle (Durstenfeld/Knuth)
 * Kompleksitas Waktu: O(n) | Kompleksitas Memori: O(1) in-place
 * Program Studi D3 Teknologi Informasi - Politeknik Negeri Madiun
 */

/**
 * Mengacak elemen larik menggunakan algoritma Fisher-Yates Shuffle mundur.
 * Mendukung fungsi pembangkit nilai acak kustom untuk simulasi deterministik (Tabel 3.4).
 * @param {Array} larikMasukan - Larik yang akan diacak
 * @param {Function} [customRng=Math.random] - Fungsi penghasil nilai U pada [0, 1)
 * @returns {{larikHasil: Array, logIterasi: Array}}
 */
function jalankanFisherYatesShuffleDenganLog(larikMasukan, customRng = Math.random) {
  const larikHasil = [...larikMasukan];
  const jumlahElemen = larikHasil.length;
  const logIterasi = [];

  for (let indeksI = jumlahElemen - 1; indeksI > 0; indeksI--) {
    const nilaiAcakSeragam = customRng(jumlahElemen - 1 - indeksI);
    const indeksJ = Math.floor(nilaiAcakSeragam * (indeksI + 1));

    const elemenI = larikHasil[indeksI];
    const elemenJ = larikHasil[indeksJ];

    // Pertukaran elemen A[i] <-> A[j] (Persamaan 2.2)
    const penampungSementara = larikHasil[indeksI];
    larikHasil[indeksI] = larikHasil[indeksJ];
    larikHasil[indeksJ] = penampungSementara;

    logIterasi.push({
      iterasi: jumlahElemen - indeksI,
      indeksI,
      nilaiAcakU: Number(nilaiAcakSeragam.toFixed(3)),
      indeksJ,
      pertukaran: `A[${indeksI}] <-> A[${indeksJ}]`,
      elemenDitukar: { dari: elemenI, ke: elemenJ },
      susunanSaatIni: [...larikHasil]
    });
  }

  return { larikHasil, logIterasi };
}

function jalankanFisherYatesShuffle(larikMasukan) {
  return jalankanFisherYatesShuffleDenganLog(larikMasukan).larikHasil;
}

/**
 * Membangkitkan paket soal teracak 2 tingkat (urutan nomor soal & urutan opsi A-E)
 * @param {Array} daftarSoalBank - Daftar butir soal dari tabel question_banks
 */
function bangkitkanPaketSoalMahasiswa(daftarSoalBank) {
  const soalPilgan = daftarSoalBank.filter(item => item.tipe_soal === 'PILIHAN_GANDA');
  const soalEsai = daftarSoalBank.filter(item => item.tipe_soal === 'URAIAN_ESAI');

  const pilganTeracak = jalankanFisherYatesShuffle(soalPilgan).map(soal => {
    const opsiAcak = jalankanFisherYatesShuffle(soal.opsi_json || []);
    return {
      id_question: soal.id_question,
      kode_soal: soal.kode_soal,
      tipe: soal.tipe_soal,
      opsi_urut: opsiAcak
    };
  });

  const esaiTeracak = jalankanFisherYatesShuffle(soalEsai).map(soal => {
    return {
      id_question: soal.id_question,
      kode_soal: soal.kode_soal,
      tipe: soal.tipe_soal,
      opsi_urut: []
    };
  });

  return [...pilganTeracak, ...esaiTeracak];
}

module.exports = {
  jalankanFisherYatesShuffle,
  jalankanFisherYatesShuffleDenganLog,
  bangkitkanPaketSoalMahasiswa
};
