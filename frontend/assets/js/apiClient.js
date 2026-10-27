/**
 * Berkas: frontend/assets/js/apiClient.js
 * Klien HTTP RESTful API untuk Menghubungkan Lapisan Frontend dengan Peladen Backend (/api/v1)
 */

class CbtRestApiClient {
  constructor(baseUrl = 'http://localhost:4000/api/v1') {
    this.baseUrl = baseUrl;
    this.token = null;
  }

  setToken(jwtToken) {
    this.token = jwtToken;
  }

  async request(method, path, body = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null
    });
    return response.json();
  }

  login(nomor_induk, password) {
    return this.request('POST', '/auth/login', { nomor_induk, password });
  }

  startSession(id_packet, token_ruang) {
    return this.request('POST', '/sessions/start', { id_packet, token_ruang });
  }

  autosaveAnswer(id_session, payload) {
    return this.request('PUT', `/sessions/${id_session}/autosave`, payload);
  }

  submitSession(id_session) {
    return this.request('POST', `/sessions/${id_session}/submit`);
  }

  sendProctoringEvent(id_session, kode_pelanggaran, detail_telemetri) {
    return this.request('POST', '/proctoring/event', { id_session, kode_pelanggaran, detail_telemetri });
  }
}

window.CbtRestApiClient = CbtRestApiClient;
