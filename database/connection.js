/**
 * Berkas: database/connection.js
 * Koneksi Kolam Basis Data Relasional PostgreSQL (pg.Pool) dengan Fallback File JSON/SQLite
 * Mendukung eksekusi kueri terparameterisasi (SEC-04 Parameterized Prepared Statements)
 */

const fs = require('fs');
const path = require('path');

let pgPool = null;
try {
  const { Pool } = require('pg');
  if (process.env.DATABASE_URL) {
    pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 25,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000
    });
  }
} catch (_) {
  pgPool = null;
}

const DATA_FILE = path.join(__dirname, 'cbt_persistent_store.json');

function loadLocalStore(defaultInitialData) {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Gagal membaca penyimpanan lokal, menggunakan skema awal:', err.message);
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(defaultInitialData, null, 2), 'utf-8');
  return defaultInitialData;
}

function saveLocalStore(storeData) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(storeData, null, 2), 'utf-8');
}

module.exports = {
  pgPool,
  loadLocalStore,
  saveLocalStore
};
