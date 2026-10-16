import { Student, PresensiRecord, SppRecord, UserAccount, GlobalSettings } from '../types';
import { formatTanggalIndo, formatNoTelp, parseNominalAngka, getTodayDdMmYyyy } from './helpers';

export const APPS_SCRIPT_CODE_TEMPLATE = `function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : '';
  if (action === 'ping') {
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'Pong! Server BIMBEL BA Aktif' })).setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'SIM BIMBEL BA Web App Ready' })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var data = {};
  try {
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    }
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }

  var action = data.action || '';
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  if (action === 'simpanPresensi') {
    var sheet = getOrCreateSheet(ss, 'Presensi', ['ID Presensi', 'Tanggal', 'Waktu', 'Username', 'Nama Siswa', 'Kelas', 'Status', 'Keterangan']);
    sheet.appendRow([data.id, data.tanggal, data.waktu, data.nis, data.nama, data.kelas, data.status, data.keterangan]);
  } else if (action === 'updatePresensi') {
    var sheet = getOrCreateSheet(ss, 'Presensi', ['ID Presensi', 'Tanggal', 'Waktu', 'Username', 'Nama Siswa', 'Kelas', 'Status', 'Keterangan']);
    upsertPresensi(sheet, data);
  } else if (action === 'hapusPresensi') {
    hapusBarisBerdasarkanKolom(ss, 'Presensi', 1, data.id);
  } else if (action === 'simpanSPP' || action === 'updateSPP') {
    var sheetSPP = getOrCreateSheet(ss, 'SPP', ['No Kuitansi', 'Tanggal', 'Username', 'Nama Siswa', 'Kelas', 'Bulan', 'Tahun', 'Nominal', 'Metode', 'Status', 'Petugas']);
    upsertSPP(sheetSPP, data);
  } else if (action === 'hapusSPP') {
    hapusBarisBerdasarkanKolom(ss, 'SPP', 1, data.id);
  } else if (action === 'tambahSiswa' || action === 'updateSiswa') {
    var sheetSiswa = getOrCreateSheet(ss, 'Siswa', ['Username', 'Password', 'Nama Lengkap', 'Kelas', 'Alamat', 'Sekolah Asal', 'Hobi', 'Kategori Bimbingan', 'Nama Ortu', 'No Telp', 'Status Akun']);
    upsertSiswa(sheetSiswa, data);
  } else if (action === 'hapusSiswa') {
    hapusBarisBerdasarkanKolom(ss, 'Siswa', 1, data.username);
  } else if (action === 'simpanUser' || action === 'updateUser') {
    var sheetUser = getOrCreateSheet(ss, 'Users', ['Nama Pengguna', 'Username', 'Password', 'Peran', 'Status']);
    upsertUser(sheetUser, data);
  } else if (action === 'hapusUser') {
    hapusBarisBerdasarkanKolom(ss, 'Users', 2, data.username);
  }

  return ContentService.createTextOutput(JSON.stringify({ status: 'success' })).setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSheet(ss, name, headers) {
  var s = ss.getSheetByName(name);
  if (!s) {
    s = ss.insertSheet(name);
    s.appendRow(headers);
    s.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#e2e8f0');
  }
  return s;
}

function upsertPresensi(sheet, p) {
  var data = sheet.getDataRange().getValues();
  var idTarget = String(p.id || '').trim().toLowerCase();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim().toLowerCase() === idTarget) {
      sheet.getRange(i + 1, 1, 1, 8).setValues([[p.id, p.tanggal, p.waktu, p.nis, p.nama, p.kelas, p.status, p.keterangan]]);
      return;
    }
  }
  sheet.appendRow([p.id, p.tanggal, p.waktu, p.nis, p.nama, p.kelas, p.status, p.keterangan]);
}

function upsertSiswa(sheet, s) {
  var data = sheet.getDataRange().getValues();
  var u = String(s.username || '').toLowerCase();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).toLowerCase() === u) {
      sheet.getRange(i + 1, 1, 1, 11).setValues([[s.username, s.password||'123', s.nama, s.kelas, s.alamat, s.sekolah_asal, s.hobi, s.kategori_bimbingan, s.nama_ortu, "'" + s.no_telp, s.status_akun||'Aktif']]);
      return;
    }
  }
  sheet.appendRow([s.username, s.password||'123', s.nama, s.kelas, s.alamat, s.sekolah_asal, s.hobi, s.kategori_bimbingan, s.nama_ortu, "'" + s.no_telp, s.status_akun||'Aktif']);
}

function upsertSPP(sheet, spp) {
  var data = sheet.getDataRange().getValues();
  var idTarget = String(spp.id || '').trim();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === idTarget) {
      sheet.getRange(i + 1, 1, 1, 11).setValues([[spp.id, spp.tanggal, spp.nis, spp.nama, spp.kelas, spp.bulan, spp.tahun, Number(spp.nominal || 0), spp.metode, spp.status, spp.petugas]]);
      return;
    }
  }
  sheet.appendRow([spp.id, spp.tanggal, spp.nis, spp.nama, spp.kelas, spp.bulan, spp.tahun, Number(spp.nominal || 0), spp.metode, spp.status, spp.petugas]);
}

function upsertUser(sheet, u) {
  var data = sheet.getDataRange().getValues();
  var username = String(u.username || '').toLowerCase().trim();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][1]).toLowerCase().trim() === username) {
      sheet.getRange(i + 1, 1, 1, 5).setValues([[u.nama, u.username, u.password, u.role, u.status || 'Aktif']]);
      return;
    }
  }
  sheet.appendRow([u.nama, u.username, u.password, u.role, u.status || 'Aktif']);
}

function hapusBarisBerdasarkanKolom(ss, sheetName, colIndex, valueToMatch) {
  var s = ss.getSheetByName(sheetName);
  if (!s) return;
  var rows = s.getDataRange().getValues();
  for (var r = rows.length - 1; r >= 1; r--) {
    if (String(rows[r][colIndex - 1]).toLowerCase().trim() === String(valueToMatch).toLowerCase().trim()) {
      s.deleteRow(r + 1);
      return;
    }
  }
}`;

export function parseGoogleSheetCSVRows(csvText: string): string[][] {
  if (!csvText) return [];
  const lines = csvText.split(/\r\n|\n/).filter(line => line.trim() !== '');
  if (lines.length === 0) return [];

  return lines.map(line => {
    const values: string[] = [];
    let cur = '';
    let insideQuote = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' && (i === 0 || line[i - 1] !== '\\')) {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        values.push(cur.replace(/^"|"$/g, '').trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    values.push(cur.replace(/^"|"$/g, '').trim());
    return values;
  });
}

export function parseSiswaCSV(csvText: string): Student[] {
  const rows = parseGoogleSheetCSVRows(csvText);
  if (rows.length < 2) return [];

  const headers = rows[0].map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  let idxUser = -1, idxPass = -1, idxNama = -1, idxKelas = -1, idxAlamat = -1, idxSekolah = -1, idxHobi = -1, idxKategori = -1, idxOrtu = -1, idxTelp = -1;

  headers.forEach((h, idx) => {
    if (idxUser === -1 && (h.includes('nis') || h.includes('user') || h.includes('id') || h.includes('noinduk'))) idxUser = idx;
    if (idxPass === -1 && (h.includes('pass') || h.includes('sandi') || h.includes('pin'))) idxPass = idx;
    if (idxNama === -1 && (h.includes('nama') || h.includes('siswa'))) idxNama = idx;
    if (idxKelas === -1 && (h.includes('kelas') || h.includes('tingkat') || h.includes('grade'))) idxKelas = idx;
    if (idxAlamat === -1 && (h.includes('alamat') || h.includes('domisili') || h.includes('address'))) idxAlamat = idx;
    if (idxSekolah === -1 && (h.includes('sekolah') || h.includes('school') || h.includes('asal'))) idxSekolah = idx;
    if (idxHobi === -1 && (h.includes('hobi') || h.includes('minat') || h.includes('hobby'))) idxHobi = idx;
    if (idxKategori === -1 && (h.includes('kategori') || h.includes('program') || h.includes('paket'))) idxKategori = idx;
    if (idxOrtu === -1 && (h.includes('ortu') || h.includes('wali') || h.includes('ayah') || h.includes('ibu') || h.includes('parent'))) idxOrtu = idx;
    if (idxTelp === -1 && (h.includes('telp') || h.includes('hp') || h.includes('wa') || h.includes('kontak') || h.includes('phone') || h.includes('mobile'))) idxTelp = idx;
  });

  if (idxUser === -1) idxUser = 0;
  if (idxNama === -1) idxNama = 1;

  const hasil: Student[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    let u = row[idxUser] || '';
    let n = (idxNama >= 0 ? row[idxNama] : '') || '';
    if (!u && !n) continue;
    if (!u) u = '2026' + String(r).padStart(2, '0');
    if (!n) n = 'Siswa ' + u;

    hasil.push({
      username: u,
      password: (idxPass >= 0 && row[idxPass]) ? row[idxPass] : '123',
      nama: n,
      kelas: (idxKelas >= 0 && row[idxKelas]) ? row[idxKelas] : '-',
      alamat: (idxAlamat >= 0 && row[idxAlamat]) ? row[idxAlamat] : '-',
      sekolah_asal: (idxSekolah >= 0 && row[idxSekolah]) ? row[idxSekolah] : '-',
      hobi: (idxHobi >= 0 && row[idxHobi]) ? row[idxHobi] : '-',
      kategori_bimbingan: (idxKategori >= 0 && row[idxKategori]) ? row[idxKategori] : 'BIMBEL',
      nama_ortu: (idxOrtu >= 0 && row[idxOrtu]) ? row[idxOrtu] : '-',
      no_telp: (idxTelp >= 0 && row[idxTelp]) ? formatNoTelp(row[idxTelp]) : '-',
      status_akun: 'Aktif'
    });
  }
  return hasil;
}

export function parsePresensiCSV(csvText: string): PresensiRecord[] {
  const rows = parseGoogleSheetCSVRows(csvText);
  if (rows.length < 2) return [];

  const headers = rows[0].map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const idxId = headers.findIndex(h => h.includes('id'));
  const idxTgl = headers.findIndex(h => h.includes('tgl') || h.includes('tanggal'));
  const idxWaktu = headers.findIndex(h => h.includes('waktu') || h.includes('jam'));
  const idxNis = headers.findIndex(h => h.includes('nis') || h.includes('user') || h.includes('id'));
  const idxNama = headers.findIndex(h => h.includes('nama'));
  const idxKelas = headers.findIndex(h => h.includes('kelas'));
  const idxStatus = headers.findIndex(h => h.includes('status'));
  const idxKet = headers.findIndex(h => h.includes('ket'));

  const hasil: PresensiRecord[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0 || (row.length === 1 && !row[0])) continue;

    const rawStatus = (idxStatus >= 0 && row[idxStatus]) ? row[idxStatus] : 'Hadir';
    const statusVal: 'Hadir' | 'Izin' | 'Sakit' | 'Alpa' =
      rawStatus === 'Izin' || rawStatus === 'Sakit' || rawStatus === 'Alpa' ? rawStatus : 'Hadir';

    hasil.push({
      id: (idxId >= 0 && row[idxId]) ? row[idxId] : 'PRS-' + r,
      tanggal: (idxTgl >= 0 && row[idxTgl]) ? formatTanggalIndo(row[idxTgl]) : getTodayDdMmYyyy(),
      waktu: (idxWaktu >= 0 && row[idxWaktu]) ? row[idxWaktu] : '00:00',
      nis: (idxNis >= 0 && row[idxNis]) ? row[idxNis] : '-',
      nama: (idxNama >= 0 && row[idxNama]) ? row[idxNama] : '-',
      kelas: (idxKelas >= 0 && row[idxKelas]) ? row[idxKelas] : '-',
      status: statusVal,
      keterangan: (idxKet >= 0 && row[idxKet]) ? row[idxKet] : '-'
    });
  }
  return hasil;
}

export function parseSppCSV(csvText: string): SppRecord[] {
  const rows = parseGoogleSheetCSVRows(csvText);
  if (rows.length < 2) return [];

  const headers = rows[0].map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

  let idxId = headers.findIndex(h => h === 'nokuitansi' || h === 'id' || h.includes('kuitansi') || h.includes('struk'));
  let idxTgl = headers.findIndex(h => h === 'tanggal' || h === 'tgl' || h.includes('tanggal') || h.includes('tglbayar'));
  let idxNis = headers.findIndex(h => h === 'nis' || h === 'username' || h.includes('nis') || h.includes('user'));
  let idxNama = headers.findIndex(h => h === 'nama' || h === 'namasiswa' || h.includes('namasiswa') || h.includes('nama'));
  let idxKelas = headers.findIndex(h => h === 'kelas' || h.includes('kelas'));
  let idxBulan = headers.findIndex(h => h === 'bulan' || h.includes('bulan'));
  let idxTahun = headers.findIndex(h => h === 'tahun' || h.includes('tahun'));
  let idxNom = headers.findIndex(h => h === 'nominal' || h === 'jumlah' || h === 'total' || h.includes('nominal') || h.includes('bayar') || h.includes('biaya'));
  let idxMetode = headers.findIndex(h => h === 'metode' || h.includes('metode'));
  let idxStatus = headers.findIndex(h => h === 'status' || h.includes('status'));
  let idxPetugas = headers.findIndex(h => h === 'petugas' || h.includes('petugas') || h.includes('admin'));

  if (idxId === -1) idxId = 0;
  if (idxTgl === -1) idxTgl = 1;
  if (idxNis === -1) idxNis = 2;
  if (idxNama === -1) idxNama = 3;
  if (idxKelas === -1) idxKelas = 4;
  if (idxBulan === -1) idxBulan = 5;
  if (idxTahun === -1) idxTahun = 6;
  if (idxNom === -1) idxNom = 7;
  if (idxMetode === -1) idxMetode = 8;
  if (idxStatus === -1) idxStatus = 9;
  if (idxPetugas === -1) idxPetugas = 10;

  const hasil: SppRecord[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0 || (row.length === 1 && !row[0])) continue;

    const rawNomVal = (idxNom >= 0 && row[idxNom]) ? row[idxNom] : '0';
    let nominalVal = parseNominalAngka(rawNomVal);

    if (nominalVal === 0 || (rawNomVal && (rawNomVal.includes('/') || rawNomVal.includes('-')))) {
      for (let c = 0; c < row.length; c++) {
        if (c !== idxTgl && c !== idxId && c !== idxNis) {
          const candidate = parseNominalAngka(row[c]);
          if (candidate >= 10000 && candidate <= 5000000) {
            nominalVal = candidate;
            break;
          }
        }
      }
    }

    hasil.push({
      id: (idxId >= 0 && row[idxId]) ? row[idxId] : 'SPP-' + r,
      tanggal: (idxTgl >= 0 && row[idxTgl]) ? formatTanggalIndo(row[idxTgl]) : getTodayDdMmYyyy(),
      nis: (idxNis >= 0 && row[idxNis]) ? row[idxNis] : '-',
      nama: (idxNama >= 0 && row[idxNama]) ? row[idxNama] : '-',
      kelas: (idxKelas >= 0 && row[idxKelas]) ? row[idxKelas] : '-',
      bulan: (idxBulan >= 0 && row[idxBulan]) ? row[idxBulan] : 'Oktober',
      tahun: (idxTahun >= 0 && row[idxTahun]) ? row[idxTahun] : '2026',
      nominal: nominalVal,
      metode: (idxMetode >= 0 && row[idxMetode]) ? row[idxMetode] : 'Tunai',
      status: (idxStatus >= 0 && row[idxStatus]) ? row[idxStatus] : 'Lunas',
      petugas: (idxPetugas >= 0 && row[idxPetugas]) ? row[idxPetugas] : 'Admin'
    });
  }
  return hasil;
}

export function parseUsersCSV(csvText: string): UserAccount[] {
  const rows = parseGoogleSheetCSVRows(csvText);
  if (rows.length < 2) return [];

  const headers = rows[0].map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const idxNama = headers.findIndex(h => h.includes('nama'));
  const idxUser = headers.findIndex(h => h.includes('user'));
  const idxPass = headers.findIndex(h => h.includes('pass') || h.includes('sandi'));
  const idxRole = headers.findIndex(h => h.includes('role') || h.includes('peran'));
  const idxStatus = headers.findIndex(h => h.includes('status'));

  const hasil: UserAccount[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;
    const roleRaw = (idxRole >= 0 && row[idxRole]) ? row[idxRole].toLowerCase() : 'petugas';

    hasil.push({
      nama: (idxNama >= 0 && row[idxNama]) ? row[idxNama] : 'Pengguna ' + r,
      username: (idxUser >= 0 && row[idxUser]) ? row[idxUser] : 'user' + r,
      password: (idxPass >= 0 && row[idxPass]) ? row[idxPass] : '123',
      role: roleRaw === 'admin' ? 'admin' : 'petugas',
      status: (idxStatus >= 0 && row[idxStatus]) ? (row[idxStatus] as 'Aktif' | 'Nonaktif') : 'Aktif'
    });
  }
  return hasil;
}

export async function fetchCsvFromGoogleSheet(spreadsheetId: string, gidOrSheetName: string): Promise<string | null> {
  if (!spreadsheetId) return null;
  const cleanGid = gidOrSheetName.trim();
  const isGid = /^\d+$/.test(cleanGid);
  const param = isGid ? `gid=${cleanGid}` : `sheet=${encodeURIComponent(cleanGid)}`;
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&${param}&_t=${Date.now()}`;

  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (res.ok) {
      const text = await res.text();
      if (text && text.length > 5) return text;
    }
  } catch (err) {
    console.warn(`Direct fetch CSV (${cleanGid}) failed, trying server proxy:`, err);
  }

  // Fallback to server endpoint proxy
  try {
    const proxyUrl = `/api/sheets/siswa?spreadsheetId=${encodeURIComponent(spreadsheetId)}&gid=${encodeURIComponent(cleanGid)}`;
    const proxyRes = await fetch(proxyUrl);
    if (proxyRes.ok) {
      const proxyText = await proxyRes.text();
      if (proxyText && proxyText.length > 5) return proxyText;
    }
  } catch (proxyErr) {
    console.warn('Proxy fetch CSV error:', proxyErr);
  }

  return null;
}

export async function sendPayloadToGoogleAppsScript(apiUrl: string, payload: Record<string, unknown>): Promise<boolean> {
  // Always send to server proxy so it is logged and persistent
  try {
    fetch('/api/sync-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiUrl, payload })
    }).catch(() => {});
  } catch {}

  if (!apiUrl || apiUrl.includes('YourDeploymentId')) return false;

  try {
    await fetch(apiUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    return true;
  } catch (err) {
    console.warn('Apps Script send error:', err);
    return false;
  }
}
