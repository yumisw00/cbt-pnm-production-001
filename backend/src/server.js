/**
 * Berkas: backend/src/server.js
 * Titik Masuk Peladen Backend RESTful API Terpisah (Port 4000)
 * Sistem Ujian Daring CBT & Koreksi Esai Otomatis — D3 TI Politeknik Negeri Madiun
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/apiRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// Pasang 16 Rute Kontrak RESTful API pada prefix /api/v1
app.use('/api/v1', apiRoutes);

// Layani berkas statis Frontend terpisah apabila diakses langsung
app.use(express.static(path.join(__dirname, '../../frontend')));

if (require.main === module) {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`[BACKEND API] Peladen RESTful API Sistem CBT PNM aktif di http://localhost:${PORT}/api/v1`);
  });
}

module.exports = app;
