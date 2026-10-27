/**
 * Berkas: src/services/essayScoringService.js
 * Mesin Penilaian Esai Otomatis Berbahasa Indonesia
 * Pra-pemrosesan (Case Folding, Tokenizing, Stopword Tala, Stemming Nazief-Adriani)
 * Pembobotan Matriks TF-IDF & Kemiripan Sudut Vektor Cosine Similarity
 * Program Studi D3 Teknologi Informasi - Politeknik Negeri Madiun
 */

const KAMUS_STOPWORD_TALA = new Set([
  'ada', 'adalah', 'adanya', 'adapun', 'agak', 'agaknya', 'agar', 'akan', 'akankah', 'akhir',
  'akhiri', 'akhirnya', 'aku', 'akulah', 'amat', 'amatlah', 'anda', 'andalah', 'antar', 'antara',
  'antaranya', 'apa', 'apaan', 'apabila', 'apakah', 'apalagi', 'apatah', 'artinya', 'asal',
  'asalkan', 'atas', 'atau', 'ataukah', 'ataupun', 'awal', 'awalnya', 'bagai', 'bagaikan',
  'bagaimana', 'bagaimanakah', 'bagaimanapun', 'bagi', 'bagian', 'bahkan', 'bahwa', 'bahwasanya',
  'baik', 'bakal', 'bakalan', 'balik', 'banyak', 'bapak', 'baru', 'bawah', 'beberapa', 'begini',
  'beginian', 'beginikah', 'beginilah', 'begitu', 'begitukah', 'begitulah', 'begitupun', 'bekerja',
  'belakang', 'belakangan', 'belum', 'belumlah', 'benar', 'benarkah', 'benarlah', 'berada',
  'berakhir', 'berakhirlah', 'berakhirnya', 'berapa', 'berapakah', 'berapalah', 'berapapun',
  'berarti', 'berawal', 'berbagai', 'berdatangan', 'beri', 'berikan', 'berikut', 'berikutnya',
  'berjumlah', 'berkali', 'berkata', 'berkehendak', 'berkeinginan', 'berkenaan', 'berlainan',
  'berlalu', 'berlangsung', 'berlebihan', 'bermacam', 'bermaksud', 'bermula', 'bersama',
  'bersiap', 'bertanya', 'berturut', 'bertutur', 'berujar', 'berupa', 'besar', 'betul',
  'betulkah', 'biasa', 'biasanya', 'bila', 'bilakah', 'bisa', 'bisakah', 'boleh', 'bolehkah',
  'bolehlah', 'buat', 'bukan', 'bukankah', 'bukanlah', 'bukannya', 'bulan', 'bung', 'cara',
  'caranya', 'cukup', 'cukupkah', 'cukuplah', 'cuma', 'dahulu', 'dalam', 'dan', 'dapat', 'dari',
  'daripada', 'datang', 'dekat', 'demi', 'demikian', 'demikianlah', 'dengan', 'depan', 'di',
  'dia', 'diakhiri', 'diakhirinya', 'dialah', 'diantara', 'diantaranya', 'diberi', 'diberikan',
  'diberikannya', 'dibuat', 'dibuatnya', 'didapat', 'didatangkan', 'diibaratkan', 'diibaratkannya',
  'diingat', 'diingatkan', 'diinginkan', 'dijawab', 'dijelaskan', 'dijelaskannya', 'dikarenakan',
  'dikatakan', 'dikatakannya', 'dikerjakan', 'diketahui', 'diketahuinya', 'dikira', 'dilakukan',
  'dilalui', 'dilihat', 'dimaksud', 'dimaksudkan', 'dimaksudkannya', 'dimaksudnya', 'diminta',
  'dimintai', 'dimisalkan', 'dimulai', 'dimulailah', 'dimulainya', 'dimungkinkan', 'dini',
  'dipastikan', 'diperbuat', 'diperbuatnya', 'dipergunakan', 'diperkirakan', 'diperlihatkan',
  'diperlukan', 'diperlukannya', 'dipersoalkan', 'dipertanyakan', 'dipunyai', 'diri', 'dirinya',
  'disampaikan', 'disebut', 'disebutkan', 'disebutkannya', 'disini', 'disinilah', 'ditambahkan',
  'ditandaskan', 'ditanya', 'ditanyai', 'ditanyakan', 'ditegaskan', 'ditujukan', 'ditunjuk',
  'ditunjuki', 'ditunjukkan', 'ditunjukkannya', 'ditunjuknya', 'dituturkan', 'dituturkannya',
  'diucapkan', 'diucapkannya', 'diungkapkan', 'dong', 'dua', 'dulu', 'empat', 'enggak',
  'enggaknya', 'entah', 'entahlah', 'guna', 'hal', 'hampir', 'hanya', 'hanyalah', 'hari',
  'harus', 'haruslah', 'harusnya', 'hendak', 'hendaklah', 'hendaknya', 'hingga', 'ia', 'ialah',
  'ibarat', 'ibaratkan', 'ibaratnya', 'ibu', 'ikut', 'ingat', 'ingin', 'inginkah', 'inginkan',
  'ini', 'inikah', 'inilah', 'itu', 'itukah', 'itulah', 'jadi', 'jadilah', 'jadinya', 'jangan',
  'jangankan', 'janganlah', 'jauh', 'jawab', 'jawaban', 'jawabnya', 'jelas', 'jelaskan',
  'jelaslah', 'jelasnya', 'jika', 'jikalau', 'juga', 'jumlah', 'jumlahnya', 'justru', 'kala',
  'kalau', 'kalaulah', 'kalaupun', 'kali', 'kalian', 'kami', 'kamilah', 'kamu', 'kamulah',
  'kan', 'kapan', 'kapankah', 'kapanpun', 'karena', 'karenanya', 'kasus', 'kata', 'katakan',
  'katakanlah', 'katanya', 'ke', 'keadaan', 'kebetulan', 'kecil', 'kedua', 'keduanya',
  'keinginan', 'kelamaan', 'kelihatan', 'kelihatannya', 'kelima', 'keluar', 'kembali',
  'kemudian', 'kemungkinan', 'kemungkinannya', 'kenapa', 'kepada', 'kepadanya', 'kesampaian',
  'keseluruhan', 'keseluruhannya', 'keterlaluan', 'ketika', 'khususnya', 'kini', 'kinilah',
  'kira', 'kiranya', 'kita', 'kitalah', 'kok', 'kurang', 'lagi', 'lagian', 'lah', 'lain',
  'lainnya', 'lalu', 'lama', 'lamanya', 'lanjut', 'lanjutnya', 'lebih', 'lewat', 'lima', 'luar',
  'macam', 'maka', 'makanya', 'makin', 'malah', 'malahan', 'mampu', 'mampukah', 'mana',
  'manakala', 'manalagi', 'masa', 'masalah', 'masalahnya', 'masih', 'masihkah', 'masing',
  'mau', 'maupun', 'melainkan', 'melakukan', 'melalui', 'melihat', 'melihatnya', 'memang',
  'memastikan', 'memberi', 'memberikan', 'membuat', 'memerlukan', 'memihak', 'meminta',
  'memintakan', 'memisalkan', 'memperbuat', 'mempergunakan', 'memperkirakan', 'memperlihatkan',
  'mempersiapkan', 'mempersoalkan', 'mempertanyakan', 'mempunyai', 'memulai', 'memungkinkan',
  'menaiki', 'menambahkan', 'menandaskan', 'menanti', 'menantikan', 'menanya', 'menanyai',
  'menanyakan', 'mendapat', 'mendapatkan', 'mendatang', 'mendatangi', 'mendatangkan',
  'menegaskan', 'mengakhiri', 'mengapa', 'mengatakan', 'mengatakannya', 'mengenai',
  'mengerjakan', 'mengetahui', 'menghendaki', 'mengibaratkan', 'mengibaratkannya',
  'mengingat', 'mengingatkan', 'menginginkan', 'mengira', 'mengucapkan', 'mengucapkannya',
  'mengungkapkan', 'menjadi', 'menjawab', 'menjelaskan', 'menuju', 'menunjuk', 'menunjuki',
  'menunjukkan', 'menunjuknya', 'menurut', 'menuturkan', 'menyampaikan', 'menyangkut',
  'menyatakan', 'menyebutkan', 'menyeluruh', 'menyiapkan', 'merasa', 'mereka', 'merekalah',
  'merupakan', 'meski', 'meskipun', 'meyakini', 'meyakinkan', 'minta', 'mirip', 'misal',
  'misalkan', 'misalnya', 'mula', 'mulai', 'mulailah', 'mulanya', 'mungkin', 'mungkinkah',
  'nah', 'naik', 'namun', 'nanti', 'nantinya', 'nyaris', 'nyatanya', 'oleh', 'olehnya', 'pada',
  'padahal', 'padanya', 'paling', 'panjang', 'pantas', 'para', 'pasti', 'pastilah', 'penting',
  'pentingnya', 'per', 'percuma', 'perlu', 'perlukah', 'perlunya', 'pernah', 'persoalan',
  'pertama', 'pertanyaan', 'pertanyakan', 'pihak', 'pihaknya', 'pukul', 'pula', 'pun', 'punya',
  'rasa', 'rasanya', 'rata', 'rupanya', 'saat', 'saatnya', 'saja', 'sajalah', 'saling', 'sama',
  'sambil', 'sampai', 'sampaikan', 'sana', 'sangat', 'sangatlah', 'satu', 'saya', 'sayalah',
  'se', 'sebab', 'sebabnya', 'sebagai', 'sebagaimana', 'sebagainya', 'sebagian', 'sebaik',
  'sebaiknya', 'sebaliknya', 'sebanyak', 'sebegini', 'sebegitu', 'sebelum', 'sebelumnya',
  'sebenarnya', 'seberapa', 'sebesar', 'sebetulnya', 'sebisanya', 'sebuah', 'sebut', 'sebutlah',
  'sebutnya', 'secara', 'secukupnya', 'sedang', 'sedangkan', 'sedemikian', 'sedikit',
  'sedikitnya', 'seenaknya', 'segala', 'segalanya', 'segera', 'seharusnya', 'sehingga',
  'seingat', 'sejak', 'sejauh', 'sejenak', 'sejumlah', 'sekadar', 'sekadarnya', 'sekali',
  'sekalian', 'sekaligus', 'sekalipun', 'sekarang', 'sekecil', 'seketika', 'sekiranya',
  'sekitar', 'sekitarnya', 'sekurang', 'sekurangnya', 'sela', 'selain', 'selaku', 'selalu',
  'selama', 'selamanya', 'selanjutnya', 'seluruh', 'seluruhnya', 'semacam', 'semakin', 'semampu',
  'semampunya', 'semasa', 'semasih', 'semata', 'semaunya', 'sementara', 'semisal', 'semisalnya',
  'sempat', 'semua', 'semuanya', 'semula', 'sendiri', 'sendirian', 'sendirinya', 'seolah',
  'seorang', 'sepanjang', 'sepantasnya', 'sepantasnyalah', 'seperlunya', 'seperti', 'sepertinya',
  'sepihak', 'sering', 'seringnya', 'serta', 'serupa', 'sesaat', 'sesama', 'sesampai',
  'sesegera', 'sesekali', 'seseorang', 'sesuatu', 'sesuatunya', 'sesudah', 'sesudahnya',
  'setelah', 'setempat', 'setengah', 'seterusnya', 'setiap', 'setiba', 'setibanya', 'setidak',
  'setidaknya', 'setinggi', 'seusai', 'sewaktu', 'siap', 'siapa', 'siapakah', 'siapapun',
  'sini', 'sinilah', 'suatu', 'sudah', 'sudahkah', 'sudahlah', 'supaya', 'tadi', 'tadinya',
  'tahu', 'tahun', 'tak', 'tambah', 'tambahnya', 'tampak', 'tampaknya', 'tandas', 'tandasnya',
  'tanpa', 'tanya', 'tanyakan', 'tanyanya', 'tapi', 'tegas', 'tegasnya', 'telah', 'tempat',
  'tengah', 'tentang', 'tentu', 'tentulah', 'tentunya', 'tepat', 'terakhir', 'terasa',
  'terbanyak', 'terdahulu', 'terdapat', 'terdiri', 'terhadap', 'terhadapnya', 'teringat',
  'terjadi', 'terjadilah', 'terjadinya', 'terkena', 'terkira', 'terlalu', 'terlebih', 'terlihat',
  'termasuk', 'ternyata', 'tersampaikan', 'tersebut', 'tersebutlah', 'tertentu', 'tertuju',
  'terus', 'terutama', 'tetap', 'tetapi', 'tiap', 'tiba', 'tidak', 'tidakkah', 'tidaklah',
  'tiga', 'toh', 'tunjuk', 'turut', 'tutur', 'tuturnya', 'ucap', 'ucapnya', 'ujar', 'ujarnya',
  'umum', 'umumnya', 'ungkap', 'ungkapnya', 'untuk', 'usah', 'usai', 'waduh', 'wah', 'wahai',
  'waktu', 'waktunya', 'walau', 'walaupun', 'wong', 'yaitu', 'yakin', 'yakni', 'yang'
]);

const KAMUS_KATA_DASAR = new Set([
  'protokol', 'https', 'http', 'guna', 'enkripsi', 'dekripsi', 'tls', 'ssl', 'aman',
  'komunikasi', 'data', 'peramban', 'klien', 'peladen', 'server', 'web', 'sadap',
  'pakai', 'kirim', 'tampil', 'halaman', 'situs', 'jaring', 'komputer', 'kunci',
  'publik', 'privat', 'asimetris', 'simetris', 'sertifikat', 'digital', 'autentikasi',
  'integritas', 'rahasia', 'paket', 'rute', 'alamat', 'ip', 'port', 'firewall',
  'serang', 'cegah', 'lapis', 'aplikasi', 'transpor', 'koneksi', 'sesi', 'basis',
  'tabel', 'relasi', 'kueri', 'indeks', 'normalisasi', 'entitas', 'atribut', 'kandidat',
  'primer', 'asing', 'transaksi', 'konkurensi', 'pulih', 'cadang', 'algoritma',
  'acak', 'urut', 'hitung', 'bobot', 'vektor', 'sudut', 'mirip', 'kata', 'dasar',
  'kalimat', 'teks', 'dokumen', 'frekuensi', 'uji', 'sistem', 'informasi', 'akses',
  'peran', 'sandi', 'token', 'validasi', 'verifikasi', 'otorisasi'
]);

const PEMETAAN_EKSAK_NAZIEF = {
  'menggunakan': 'guna',
  'digunakan': 'guna',
  'penggunaan': 'guna',
  'pengguna': 'guna',
  'mengamankan': 'aman',
  'keamanan': 'aman',
  'diamankan': 'aman',
  'penyadapan': 'sadap',
  'menyadap': 'sadap',
  'disadap': 'sadap',
  'memakai': 'pakai',
  'dipakai': 'pakai',
  'pemakaian': 'pakai',
  'pengiriman': 'kirim',
  'mengirimkan': 'kirim',
  'mengirim': 'kirim',
  'dikirim': 'kirim',
  'menampilkan': 'tampil',
  'ditampilkan': 'tampil',
  'tampilan': 'tampil',
  'jaringan': 'jaring',
  'komunikasi': 'komunikasi',
  'berkomunikasi': 'komunikasi',
  'pertukaran': 'tukar',
  'menukarkan': 'tukar',
  'enkripsi': 'enkripsi',
  'dienkripsi': 'enkripsi',
  'mengenkripsi': 'enkripsi',
  'peladen': 'peladen',
  'peramban': 'peramban'
};

function stemNaziefAdriani(kata) {
  if (!kata || kata.length <= 3) return kata;
  if (PEMETAAN_EKSAK_NAZIEF[kata]) return PEMETAAN_EKSAK_NAZIEF[kata];
  if (KAMUS_KATA_DASAR.has(kata)) return kata;

  let w = kata;
  w = w.replace(/(lah|kah|tah|pun)$/, '');
  if (KAMUS_KATA_DASAR.has(w)) return w;

  w = w.replace(/(ku|mu|nya)$/, '');
  if (KAMUS_KATA_DASAR.has(w)) return w;

  const sebelumSuffix = w;
  w = w.replace(/(kan|an|i)$/, '');
  if (KAMUS_KATA_DASAR.has(w)) return w;

  const cobaPrefix = (teks) => {
    if (teks.startsWith('meng')) {
      const k1 = teks.slice(4);
      const k2 = 'k' + k1;
      if (KAMUS_KATA_DASAR.has(k2)) return k2;
      if (KAMUS_KATA_DASAR.has(k1)) return k1;
      return k1.length >= 3 ? k1 : teks;
    }
    if (teks.startsWith('meny')) return 's' + teks.slice(4);
    if (teks.startsWith('men')) {
      const k1 = teks.slice(3);
      const k2 = 't' + k1;
      if (KAMUS_KATA_DASAR.has(k2)) return k2;
      return k1;
    }
    if (teks.startsWith('mem')) {
      const k1 = teks.slice(3);
      const k2 = 'p' + k1;
      if (KAMUS_KATA_DASAR.has(k2)) return k2;
      return k1;
    }
    if (teks.startsWith('me')) return teks.slice(2);
    if (teks.startsWith('peng')) {
      const k1 = teks.slice(4);
      const k2 = 'k' + k1;
      if (KAMUS_KATA_DASAR.has(k2)) return k2;
      return k1;
    }
    if (teks.startsWith('peny')) return 's' + teks.slice(4);
    if (teks.startsWith('pen')) {
      const k1 = teks.slice(3);
      const k2 = 't' + k1;
      if (KAMUS_KATA_DASAR.has(k2)) return k2;
      return k1;
    }
    if (teks.startsWith('pem')) {
      const k1 = teks.slice(3);
      const k2 = 'p' + k1;
      if (KAMUS_KATA_DASAR.has(k2)) return k2;
      return k1;
    }
    if (teks.startsWith('di') || teks.startsWith('ke') || teks.startsWith('se')) {
      return teks.slice(2);
    }
    if (teks.startsWith('ter') || teks.startsWith('ber') || teks.startsWith('per')) {
      return teks.slice(3);
    }
    return teks;
  };

  const hasilPrefix = cobaPrefix(w);
  if (hasilPrefix.length >= 3) return hasilPrefix;
  return sebelumSuffix;
}

function praProsesDanStemmingIndonesia(teksMentah) {
  if (!teksMentah || typeof teksMentah !== 'string') {
    return { caseFolding: '', tokens: [], tanpaStopword: [], hasilStem: [] };
  }
  const caseFolding = teksMentah.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const tokens = caseFolding ? caseFolding.split(' ').filter(kata => kata.length > 1) : [];
  const tanpaStopword = tokens.filter(kata => !KAMUS_STOPWORD_TALA.has(kata));
  const hasilStem = tanpaStopword.map(kata => stemNaziefAdriani(kata));

  return {
    caseFolding,
    tokens,
    tanpaStopword,
    hasilStem
  };
}

/**
 * Menghitung matriks TF-IDF dan Cosine Similarity.
 * Mendukung korpus tambahan (misal [tokenM2]) untuk mereproduksi Tabel 3.5 & 3.6 (N = 3 dokumen)
 * maupun perbandingan berpasangan (N = 2 dokumen, Kode Sumber 4.2).
 */
function hitungSkorEsaiOtomatis(tokenDosen, tokenMahasiswa, kataWajibList = [], alfa = 0.70, skorMaks = 20.0, dokumenTambahanKorpus = []) {
  if (!tokenMahasiswa || tokenMahasiswa.length === 0) {
    return {
      matriksTfIdf: [],
      dotProduct: 0,
      kuadratNormaDosen: 0,
      kuadratNormaMhs: 0,
      normaDosen: 0,
      normaMhs: 0,
      nilaiCosine: 0,
      rasioWajib: 0,
      kataWajibCocok: [],
      nilaiGabungan: 0,
      skorAkhir: 0
    };
  }

  const semuaDokumen = [tokenDosen, tokenMahasiswa, ...dokumenTambahanKorpus];
  const jumlahDokumen = semuaDokumen.length;
  const kosakataUnik = Array.from(new Set(semuaDokumen.flat()));

  let dotProduct = 0.0;
  let kuadratNormaDosen = 0.0;
  let kuadratNormaMhs = 0.0;
  const matriksTfIdf = [];

  for (const term of kosakataUnik) {
    const tfDosen = tokenDosen.filter(k => k === term).length;
    const tfMhs = tokenMahasiswa.filter(k => k === term).length;
    const dfTerm = semuaDokumen.filter(dok => dok.includes(term)).length;
    const nilaiIdf = Math.log10(jumlahDokumen / dfTerm) + 1.0;
    const bobotDosen = tfDosen * nilaiIdf;
    const bobotMhs = tfMhs * nilaiIdf;

    dotProduct += bobotDosen * bobotMhs;
    kuadratNormaDosen += bobotDosen * bobotDosen;
    kuadratNormaMhs += bobotMhs * bobotMhs;

    if (tfDosen > 0 || tfMhs > 0) {
      matriksTfIdf.push({
        term,
        tfDosen,
        tfMhs,
        dfTerm,
        nilaiIdf: Number(nilaiIdf.toFixed(4)),
        bobotDosen: Number(bobotDosen.toFixed(4)),
        bobotMhs: Number(bobotMhs.toFixed(4)),
        kaliTitik: Number((bobotDosen * bobotMhs).toFixed(4))
      });
    }
  }

  const normaDosen = Math.sqrt(kuadratNormaDosen);
  const normaMhs = Math.sqrt(kuadratNormaMhs);
  const pembagiNorma = normaDosen * normaMhs;
  const nilaiCosine = pembagiNorma > 0 ? (dotProduct / pembagiNorma) : 0.0;

  const setTokenMhs = new Set(tokenMahasiswa);
  const kataWajibBersih = kataWajibList.map(w => stemNaziefAdriani(w.trim().toLowerCase())).filter(Boolean);
  const kataWajibCocok = kataWajibBersih.filter(w => setTokenMhs.has(w));
  const rasioWajib = kataWajibBersih.length > 0 ? (kataWajibCocok.length / kataWajibBersih.length) : 1.0;

  const nilaiGabungan = (alfa * nilaiCosine) + ((1.0 - alfa) * rasioWajib);
  const skorAkhir = Math.round(nilaiGabungan * skorMaks * 100) / 100;

  return {
    matriksTfIdf,
    dotProduct: Number(dotProduct.toFixed(4)),
    kuadratNormaDosen: Number(kuadratNormaDosen.toFixed(4)),
    kuadratNormaMhs: Number(kuadratNormaMhs.toFixed(4)),
    normaDosen: Number(normaDosen.toFixed(4)),
    normaMhs: Number(normaMhs.toFixed(4)),
    nilaiCosine: Number(nilaiCosine.toFixed(4)),
    rasioWajib: Number(rasioWajib.toFixed(4)),
    kataWajibCocok,
    nilaiGabungan: Number(nilaiGabungan.toFixed(4)),
    skorAkhir
  };
}

module.exports = {
  KAMUS_STOPWORD_TALA,
  stemNaziefAdriani,
  praProsesDanStemmingIndonesia,
  hitungSkorEsaiOtomatis
};
