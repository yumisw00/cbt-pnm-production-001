/**
 * Berkas: backend/src/middlewares/authRbacMiddleware.js
 * Middleware Otentikasi Token JWT HMAC-SHA256 (SEC-05) & Pengendalian Hak Akses Berbasis Peran (RBAC Tabel 3.3)
 */

const crypto = require('crypto');
const JWT_SECRET = process.env.JWT_SECRET || 'PNM-D3TI-2026-CBT-HMAC-SHA256-SECRET';

function buatTokenJwt(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (6 * 3600)
  })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifikasiTokenJwt(tokenString) {
  if (!tokenString || typeof tokenString !== 'string') return null;
  const parts = tokenString.split('.');
  if (parts.length !== 3) return null;
  const [header, body, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  if (sig !== expectedSig) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) return null;
    return payload;
  } catch (_) {
    return null;
  }
}

function wajibLogin(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const payload = verifikasiTokenJwt(token);
  if (!payload) {
    return res.status(401).json({
      status: 'error',
      kode_http: 401,
      pesan: 'Akses ditolak: Token sesi JWT tidak ditemukan atau tanda tangan HMAC-SHA256 tidak valid (SEC-05).'
    });
  }
  req.user = payload;
  next();
}

function izinkanPeran(...daftarPeranDiizinkan) {
  return (req, res, next) => {
    if (!req.user || !daftarPeranDiizinkan.includes(req.user.peran_pengguna)) {
      return res.status(403).json({
        status: 'error',
        kode_http: 403,
        pesan: `Akses terlarang (403 Forbidden): Peran ${req.user ? req.user.peran_pengguna : 'ANONIM'} tidak memiliki kewenangan pada rute ini.`
      });
    }
    next();
  };
}

module.exports = {
  buatTokenJwt,
  verifikasiTokenJwt,
  wajibLogin,
  izinkanPeran
};
