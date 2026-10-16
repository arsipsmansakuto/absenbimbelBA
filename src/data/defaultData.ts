import { Student, PresensiRecord, SppRecord, UserAccount, GlobalSettings } from '../types';

export const MASTER_SPREADSHEET_ID = '1oQMV5G7fiLOxTXlENGAEHEBEs2TaC5tqA8P7b-rdmjo';
export const MASTER_GID_SISWA = '526265062';
export const APP_VERSION = '3.2.0';

export const DEFAULT_USERS: UserAccount[] = [
  { nama: 'Bunda Ani (Admin)', username: 'admin', password: '123', role: 'admin', status: 'Aktif' },
  { nama: 'Kak Rina (Petugas)', username: 'petugas', password: '123', role: 'petugas', status: 'Aktif' }
];

export const DEFAULT_SISWA: Student[] = [
  { username: '202601', password: '123', nama: 'Ahmad Faiz', kelas: '4 SD', alamat: 'Jl. Melati No. 5', sekolah_asal: 'SDN 1 Kebumen', hobi: 'Membaca', kategori_bimbingan: 'BIMBEL', nama_ortu: 'Bpk. Hendra', no_telp: '08123456789', status_akun: 'Aktif' },
  { username: '202602', password: '123', nama: 'Clarissa Putri', kelas: '5 SD', alamat: 'Jl. Mawar No. 8', sekolah_asal: 'SDN 2', hobi: 'Menulis', kategori_bimbingan: 'BIMBA', nama_ortu: 'Ibu Ratna', no_telp: '08129876543', status_akun: 'Aktif' },
  { username: '202603', password: '123', nama: 'Dimas Satria', kelas: '6 SD', alamat: 'Jl. Anggrek No. 12', sekolah_asal: 'SDN 3', hobi: 'Menggambar', kategori_bimbingan: 'PRIVAT', nama_ortu: 'Bpk. Joko', no_telp: '08134567890', status_akun: 'Aktif' }
];

export const DEFAULT_PRESENSI: PresensiRecord[] = [
  { id: 'PRS-1710001', tanggal: '16/10/2026', waktu: '14:15', nis: '202601', nama: 'Ahmad Faiz', kelas: '4 SD', status: 'Hadir', keterangan: '-' },
  { id: 'PRS-1710002', tanggal: '16/10/2026', waktu: '14:20', nis: '202602', nama: 'Clarissa Putri', kelas: '5 SD', status: 'Hadir', keterangan: '-' }
];

export const DEFAULT_SPP: SppRecord[] = [
  { id: 'SPP-2026-001', tanggal: '16/10/2026', nis: '202601', nama: 'Ahmad Faiz', kelas: '4 SD', bulan: 'Oktober', tahun: '2026', nominal: 80000, metode: 'Tunai', status: 'Lunas', petugas: 'Bunda Ani' },
  { id: 'SPP-2026-002', tanggal: '16/10/2026', nis: '202602', nama: 'Clarissa Putri', kelas: '5 SD', bulan: 'Oktober', tahun: '2026', nominal: 110000, metode: 'Transfer Bank', status: 'Lunas', petugas: 'Kak Rina' }
];

export const DEFAULT_SETTINGS: GlobalSettings = {
  apiUrl: '',
  spreadsheetId: MASTER_SPREADSHEET_ID,
  sheetGidSiswa: MASTER_GID_SISWA,
  sheetGidPresensi: '',
  sheetGidSPP: '',
  sheetGidUsers: '',
  isConfigLocked: true
};
