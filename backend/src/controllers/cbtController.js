/**
 * Berkas: backend/src/controllers/cbtController.js
 * Pengendali Logika Bisnis Sistem Ujian Daring CBT, Pengacakan Fisher-Yates,
 * Koreksi Esai Otomatis TF-IDF Cosine Similarity & Pengawasan Kecurangan
 */

const { loadLocalStore, saveLocalStore } = require('../../../database/connection');
const { buatTokenJwt } = require('../middlewares/authRbacMiddleware');
const { bangkitkanPaketSoalMahasiswa } = require('../services/fisherYatesService');
const { praProsesDanStemmingIndonesia, hitungSkorEsaiOtomatis } = require('../services/essayScoringService');
const { ATURAN_PELANGGARAN_DEFAULT, prosesPeristiwaPelanggaran } = require('../services/proctoringService');

const INITIAL_STORE = {
  users: [
    { id_user: 1, nomor_induk: '198303172014042001', nama_lengkap: 'Lutfiyah Dwi Setia, S.Kom., M.Kom.', email_institusi: 'lutfiyah@pnm.ac.id', peran_pengguna: 'ADMIN', kelas_angkatan: 'Koordinator Prodi D3 TI', status_aktif: true },
    { id_user: 2, nomor_induk: '198805142019031007', nama_lengkap: 'Ardian Prima Atmaja, S.Kom., M.Cs.', email_institusi: 'ardian@pnm.ac.id', peran_pengguna: 'DOSEN', kelas_angkatan: 'Dosen Pembimbing I', status_aktif: true },
    { id_user: 3, nomor_induk: '199108222020122014', nama_lengkap: 'Rahmania Kumalasari, S.Kom., M.Kom.', email_institusi: 'rahmania@pnm.ac.id', peran_pengguna: 'DOSEN', kelas_angkatan: 'Dosen Pembimbing II', status_aktif: true },
    { id_user: 4, nomor_induk: '199504102022031004', nama_lengkap: 'Bagus Prasetyo, S.Tr.Kom.', email_institusi: 'bagus.lab@pnm.ac.id', peran_pengguna: 'PENGAWAS', kelas_angkatan: 'Lab Jaringan & RPL', status_aktif: true },
    { id_user: 5, nomor_induk: '223307105', nama_lengkap: 'Rendra Aditya Pratama', email_institusi: 'rendra.223307105@mahasiswa.pnm.ac.id', peran_pengguna: 'MAHASISWA', kelas_angkatan: 'TI-3D / 2022', status_aktif: true }
  ],
  courses: [
    { id_course: 1, kode_matkul: 'TI501', nama_matkul: 'Keamanan Jaringan dan Kriptografi', semester_paket: 5, sks_total: 3, id_dosen_koordinator: 2 },
    { id_course: 2, kode_matkul: 'TI304', nama_matkul: 'Sistem Basis Data Terdistribusi', semester_paket: 3, sks_total: 3, id_dosen_koordinator: 3 },
    { id_course: 3, kode_matkul: 'TI402', nama_matkul: 'Rekayasa Perangkat Lunak Berbasis Web', semester_paket: 4, sks_total: 3, id_dosen_koordinator: 2 }
  ],
  exam_packets: [
    {
      id_packet: 101,
      id_course: 1,
      judul_ujian: 'Ujian Akhir Semester Keamanan Jaringan dan Kriptografi',
      token_ruang: 'PNM26A',
      waktu_mulai: '2026-10-27T08:00:00Z',
      waktu_selesai: '2026-10-27T18:00:00Z',
      durasi_menit: 90,
      bobot_pilgan_persen: 60.00,
      bobot_esai_persen: 40.00,
      batas_penalti_maks: 100
    }
  ],
  question_banks: [],
  essay_rubrics: [],
  exam_sessions: [],
  student_answers: [],
  violation_rules: { ...ATURAN_PELANGGARAN_DEFAULT },
  proctoring_logs: []
};

const store = loadLocalStore(INITIAL_STORE);

exports.loginPengguna = (req, res) => {
  const { nomor_induk } = req.body;
  const user = store.users.find(u => u.nomor_induk === String(nomor_induk || '').trim() && u.status_aktif);
  if (!user) {
    return res.status(401).json({ status: 'error', kode_http: 401, pesan: 'Nomor Induk (NPM/NIP) tidak terdaftar atau akun tidak aktif.' });
  }
  const token = buatTokenJwt({
    id_user: user.id_user,
    nomor_induk: user.nomor_induk,
    nama_lengkap: user.nama_lengkap,
    peran_pengguna: user.peran_pengguna
  });
  return res.status(200).json({ status: 'success', kode_http: 200, token, profil: user });
};

exports.ambilProfilPengguna = (req, res) => {
  const user = store.users.find(u => u.id_user === req.user.id_user);
  return res.status(200).json({ status: 'success', profil: user, daftar_pengguna: store.users });
};

exports.tambahPenggunaBaru = (req, res) => {
  const { nomor_induk, nama_lengkap, email_institusi, peran_pengguna, kelas_angkatan } = req.body;
  if (!nomor_induk || !nama_lengkap || !peran_pengguna) {
    return res.status(400).json({ status: 'error', pesan: 'Nomor induk, nama lengkap, dan peran wajib diisi.' });
  }
  if (store.users.some(u => u.nomor_induk === nomor_induk)) {
    return res.status(409).json({ status: 'error', pesan: 'Nomor induk sudah terdaftar di basis data.' });
  }
  const userBaru = {
    id_user: store.users.length + 1,
    nomor_induk,
    nama_lengkap,
    email_institusi: email_institusi || `${nomor_induk}@pnm.ac.id`,
    peran_pengguna,
    kelas_angkatan: kelas_angkatan || null,
    status_aktif: true
  };
  store.users.push(userBaru);
  saveLocalStore(store);
  return res.status(201).json({ status: 'success', data: userBaru });
};

exports.ambilDaftarMataKuliah = (req, res) => {
  return res.status(200).json({ status: 'success', data: store.courses });
};

exports.perbaruiAturanPenalti = (req, res) => {
  const kode = req.params.kode;
  if (!store.violation_rules[kode]) {
    return res.status(404).json({ status: 'error', pesan: 'Kode aturan pelanggaran tidak ditemukan.' });
  }
  if (req.body.poin_penalti_bobot !== undefined) {
    store.violation_rules[kode].poin_penalti_bobot = Number(req.body.poin_penalti_bobot);
  }
  if (req.body.pesan_peringatan !== undefined) {
    store.violation_rules[kode].pesan_peringatan = String(req.body.pesan_peringatan);
  }
  saveLocalStore(store);
  return res.status(200).json({ status: 'success', data: store.violation_rules[kode] });
};

exports.ambilDaftarPaketUjian = (req, res) => {
  return res.status(200).json({ status: 'success', data: store.exam_packets });
};

exports.buatPaketUjianBaru = (req, res) => {
  const { id_course, judul_ujian, token_ruang, durasi_menit, bobot_pilgan_persen, bobot_esai_persen, batas_penalti_maks } = req.body;
  const paketBaru = {
    id_packet: store.exam_packets.length + 101,
    id_course: Number(id_course || 1),
    judul_ujian,
    token_ruang: String(token_ruang || 'PNM26B').toUpperCase(),
    waktu_mulai: new Date().toISOString(),
    waktu_selesai: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
    durasi_menit: Number(durasi_menit || 90),
    bobot_pilgan_persen: Number(bobot_pilgan_persen || 60),
    bobot_esai_persen: Number(bobot_esai_persen || 40),
    batas_penalti_maks: Number(batas_penalti_maks || 100)
  };
  store.exam_packets.push(paketBaru);
  saveLocalStore(store);
  return res.status(201).json({ status: 'success', data: paketBaru });
};

exports.ambilBankSoalPaket = (req, res) => {
  const idPacket = Number(req.params.id);
  const soalList = store.question_banks.filter(q => q.id_packet === idPacket);
  return res.status(200).json({ status: 'success', data: soalList, rubrics: store.essay_rubrics });
};

exports.tambahButirSoalBank = (req, res) => {
  const idPacket = Number(req.params.id);
  const { kode_soal, tipe_soal, teks_pertanyaan, opsi_json, kunci_pilgan, bobot_skor_soal, teks_kunci_referensi, daftar_kata_wajib, koefisien_alfa } = req.body;
  const idQuestion = store.question_banks.length + 101;
  const soalBaru = {
    id_question: idQuestion,
    id_packet: idPacket,
    kode_soal: kode_soal || `S${String(store.question_banks.length + 1).padStart(2, '0')}`,
    tipe_soal,
    teks_pertanyaan,
    opsi_json: tipe_soal === 'PILIHAN_GANDA' ? opsi_json : null,
    kunci_pilgan: tipe_soal === 'PILIHAN_GANDA' ? kunci_pilgan : null,
    bobot_skor_soal: Number(bobot_skor_soal || 10)
  };
  store.question_banks.push(soalBaru);

  let rubrikBaru = null;
  if (tipe_soal === 'URAIAN_ESAI' && teks_kunci_referensi) {
    const prep = praProsesDanStemmingIndonesia(teks_kunci_referensi);
    rubrikBaru = {
      id_rubric: store.essay_rubrics.length + 1,
      id_question: idQuestion,
      teks_kunci_referensi,
      stem_kunci_tersimpan: prep.hasilStem.join(' '),
      daftar_kata_wajib: daftar_kata_wajib || '',
      koefisien_alfa: Number(koefisien_alfa || 0.70)
    };
    store.essay_rubrics.push(rubrikBaru);
  }
  saveLocalStore(store);
  return res.status(201).json({ status: 'success', data: { soal: soalBaru, rubrik: rubrikBaru } });
};

exports.hapusButirSoalBank = (req, res) => {
  const idQ = Number(req.params.questionId);
  store.question_banks = store.question_banks.filter(q => q.id_question !== idQ);
  store.essay_rubrics = store.essay_rubrics.filter(r => r.id_question !== idQ);
  saveLocalStore(store);
  return res.status(200).json({ status: 'success', pesan: 'Butir soal berhasil dihapus dari bank soal.' });
};

exports.mulaiSesiUjianFisherYates = (req, res) => {
  const { id_packet, token_ruang } = req.body;
  const paket = store.exam_packets.find(p => p.id_packet === Number(id_packet));
  if (!paket || paket.token_ruang.toUpperCase() !== String(token_ruang || '').trim().toUpperCase()) {
    return res.status(400).json({ status: 'error', kode_http: 400, pesan: 'Token ruang laboratorium tidak cocok dengan paket ujian.' });
  }

  let sesi = store.exam_sessions.find(s => s.id_packet === paket.id_packet && s.id_mahasiswa === req.user.id_user);
  if (!sesi) {
    const daftarSoal = store.question_banks.filter(q => q.id_packet === paket.id_packet);
    const urutanFisher = bangkitkanPaketSoalMahasiswa(daftarSoal);
    sesi = {
      id_session: store.exam_sessions.length + 4082,
      id_packet: paket.id_packet,
      id_mahasiswa: req.user.id_user,
      urutan_soal_fisher: urutanFisher,
      waktu_mulai_peserta: new Date().toISOString(),
      waktu_submit_peserta: null,
      skor_total_pilgan: 0,
      skor_total_esai: 0,
      nilai_akhir_ujian: 0,
      poin_penalti_akumulasi: 0,
      indeks_integritas: 100,
      status_sesi: 'AKTIF'
    };
    store.exam_sessions.push(sesi);
    saveLocalStore(store);
  }
  return res.status(201).json({ status: 'success', data: sesi });
};

exports.ambilNaskahSoalSesi = (req, res) => {
  const idSession = Number(req.params.id);
  const sesi = store.exam_sessions.find(s => s.id_session === idSession);
  if (!sesi) return res.status(404).json({ status: 'error', pesan: 'Sesi ujian tidak ditemukan.' });

  // SEC-01: Jangan pernah kirim kunci_pilgan atau teks_kunci_referensi ke mahasiswa
  const naskahTanpaKunci = sesi.urutan_soal_fisher.map(item => {
    const soalAsli = store.question_banks.find(q => q.id_question === item.id_question);
    return {
      id_question: item.id_question,
      kode_soal: item.kode_soal,
      tipe_soal: item.tipe,
      teks_pertanyaan: soalAsli ? soalAsli.teks_pertanyaan : '',
      bobot_skor_soal: soalAsli ? soalAsli.bobot_skor_soal : 0,
      opsi_urut: item.opsi_urut
    };
  });

  return res.status(200).json({ status: 'success', sesi, naskah: naskahTanpaKunci });
};

exports.simpanJawabanOtomatis = (req, res) => {
  const idSession = Number(req.params.id);
  const sesi = store.exam_sessions.find(s => s.id_session === idSession);
  if (!sesi) return res.status(404).json({ status: 'error', pesan: 'Sesi ujian tidak ditemukan.' });
  if (sesi.status_sesi !== 'AKTIF') {
    return res.status(403).json({ status: 'error', pesan: 'Operasi ditolak (SEC-03): Sesi telah berakhir atau terkunci penalti.' });
  }

  const { id_question, jawaban_opsi_dipilih, teks_jawaban_esai } = req.body;
  let rekaman = store.student_answers.find(a => a.id_session === idSession && a.id_question === Number(id_question));
  if (!rekaman) {
    rekaman = {
      id_answer: store.student_answers.length + 1,
      id_session: idSession,
      id_question: Number(id_question),
      jawaban_opsi_dipilih: jawaban_opsi_dipilih || null,
      teks_jawaban_esai: teks_jawaban_esai || null,
      stem_jawaban_mahasiswa: null,
      skor_cosine_similarity: 0,
      rasio_kata_kunci: 0,
      skor_butir_diperoleh: 0,
      waktu_simpan_terakhir: new Date().toISOString()
    };
    store.student_answers.push(rekaman);
  } else {
    if (jawaban_opsi_dipilih !== undefined) rekaman.jawaban_opsi_dipilih = jawaban_opsi_dipilih;
    if (teks_jawaban_esai !== undefined) rekaman.teks_jawaban_esai = teks_jawaban_esai;
    rekaman.waktu_simpan_terakhir = new Date().toISOString();
  }
  saveLocalStore(store);
  return res.status(200).json({ status: 'success', waktu_simpan: rekaman.waktu_simpan_terakhir, data: rekaman });
};

exports.akhiriDanNilaiUjian = (req, res) => {
  const idSession = Number(req.params.id);
  const sesi = store.exam_sessions.find(s => s.id_session === idSession);
  if (!sesi) return res.status(404).json({ status: 'error', pesan: 'Sesi tidak ditemukan.' });
  if (sesi.status_sesi === 'TERKUNCI_PENALTI') {
    return res.status(403).json({ status: 'error', pesan: 'Sesi terkunci penalti (SEC-03). Tidak dapat mengirim jawaban sebelum dibuka pengawas.' });
  }

  const jawabanList = store.student_answers.filter(a => a.id_session === idSession);
  let totalPilgan = 0;
  let totalEsai = 0;

  for (const jwb of jawabanList) {
    const soal = store.question_banks.find(q => q.id_question === jwb.id_question);
    if (!soal) continue;
    if (soal.tipe_soal === 'PILIHAN_GANDA') {
      jwb.skor_butir_diperoleh = jwb.jawaban_opsi_dipilih === soal.kunci_pilgan ? Number(soal.bobot_skor_soal) : 0;
      totalPilgan += jwb.skor_butir_diperoleh;
    } else if (soal.tipe_soal === 'URAIAN_ESAI') {
      const rubrik = store.essay_rubrics.find(r => r.id_question === soal.id_question);
      if (rubrik) {
        const prepMhs = praProsesDanStemmingIndonesia(jwb.teks_jawaban_esai || '');
        const tokenDosen = rubrik.stem_kunci_tersimpan.split(' ').filter(Boolean);
        const wajibList = rubrik.daftar_kata_wajib.split(',').map(s => s.trim()).filter(Boolean);
        const evaluasi = hitungSkorEsaiOtomatis(tokenDosen, prepMhs.hasilStem, wajibList, Number(rubrik.koefisien_alfa), Number(soal.bobot_skor_soal));
        jwb.stem_jawaban_mahasiswa = prepMhs.hasilStem.join(' ');
        jwb.skor_cosine_similarity = evaluasi.nilaiCosine;
        jwb.rasio_kata_kunci = evaluasi.rasioWajib;
        jwb.skor_butir_diperoleh = evaluasi.skorAkhir;
        totalEsai += evaluasi.skorAkhir;
      }
    }
  }

  sesi.skor_total_pilgan = Number(totalPilgan.toFixed(2));
  sesi.skor_total_esai = Number(totalEsai.toFixed(2));
  sesi.nilai_akhir_ujian = Number((totalPilgan + totalEsai).toFixed(2));
  sesi.waktu_submit_peserta = new Date().toISOString();
  sesi.status_sesi = 'SELESAI';
  saveLocalStore(store);

  return res.status(200).json({ status: 'success', kode_http: 200, data_hasil_ujian: sesi });
};

exports.catatPeristiwaPelanggaran = (req, res) => {
  const { id_session, kode_pelanggaran, detail_telemetri } = req.body;
  const sesi = store.exam_sessions.find(s => s.id_session === Number(id_session));
  if (!sesi) return res.status(404).json({ status: 'error', pesan: 'Sesi tidak ditemukan.' });

  const paket = store.exam_packets.find(p => p.id_packet === sesi.id_packet);
  const batasMaks = paket ? paket.batas_penalti_maks : 100;
  const hasil = prosesPeristiwaPelanggaran(sesi, kode_pelanggaran, detail_telemetri, store.violation_rules, batasMaks);

  sesi.poin_penalti_akumulasi = hasil.poin_penalti_akumulasi;
  sesi.indeks_integritas = hasil.indeks_integritas;
  sesi.status_sesi = hasil.status_sesi;
  store.proctoring_logs.push(hasil.logEntry);
  saveLocalStore(store);

  return res.status(201).json({ status: 'success', data: hasil });
};

exports.pantauSesiLangsung = (req, res) => {
  const idPacket = Number(req.params.packetId);
  const sesiList = store.exam_sessions.filter(s => s.id_packet === idPacket);
  return res.status(200).json({ status: 'success', data: sesiList, logs: store.proctoring_logs });
};

exports.bukaKunciSesiUjian = (req, res) => {
  const sesi = store.exam_sessions.find(s => s.id_session === Number(req.params.sessionId));
  if (!sesi) return res.status(404).json({ status: 'error', pesan: 'Sesi tidak ditemukan.' });
  sesi.status_sesi = 'AKTIF';
  sesi.poin_penalti_akumulasi = Math.min(sesi.poin_penalti_akumulasi, 60);
  sesi.indeks_integritas = Math.max(40, 100 - sesi.poin_penalti_akumulasi);
  saveLocalStore(store);
  return res.status(200).json({ status: 'success', pesan: 'Kunci sesi ujian berhasil dibuka kembali oleh pengawas.', data: sesi });
};

exports.ambilRincianMatriksEsai = (req, res) => {
  const ans = store.student_answers.find(a => a.id_answer === Number(req.params.answerId));
  if (!ans) return res.status(404).json({ status: 'error', pesan: 'Jawaban esai tidak ditemukan.' });
  return res.status(200).json({ status: 'success', data: ans });
};

exports.ubahNilaiEsaiManual = (req, res) => {
  const ans = store.student_answers.find(a => a.id_answer === Number(req.params.answerId));
  if (!ans) return res.status(404).json({ status: 'error', pesan: 'Jawaban esai tidak ditemukan.' });
  ans.skor_butir_diperoleh = Number(req.body.skor_baru);
  saveLocalStore(store);
  return res.status(200).json({ status: 'success', data: ans });
};

exports.eksporRekapitulasiNilai = (req, res) => {
  const idPacket = Number(req.params.packetId);
  const sesiList = store.exam_sessions.filter(s => s.id_packet === idPacket);
  return res.status(200).json({ status: 'success', total_peserta: sesiList.length, rekapitulasi: sesiList });
};
