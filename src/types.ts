export type UserRole = 'admin' | 'petugas' | 'siswa';

export interface UserAccount {
  nama: string;
  username: string;
  password?: string;
  role: 'admin' | 'petugas';
  status: 'Aktif' | 'Nonaktif';
}

export interface Student {
  username: string; // ID / NIS
  password?: string;
  nama: string;
  kelas: string;
  alamat?: string;
  sekolah_asal?: string;
  hobi?: string;
  kategori_bimbingan: 'BIMBEL' | 'BIMBA' | 'PRIVAT' | string;
  nama_ortu?: string;
  no_telp?: string;
  status_akun?: 'Aktif' | 'Nonaktif' | string;
}

export interface PresensiRecord {
  id: string;
  tanggal: string; // dd/mm/yyyy
  waktu: string;   // HH:mm
  nis: string;     // username
  nama: string;
  kelas: string;
  status: 'Hadir' | 'Izin' | 'Sakit' | 'Alpa';
  keterangan: string;
}

export interface SppRecord {
  id: string;
  tanggal: string; // dd/mm/yyyy
  nis: string;
  nama: string;
  kelas: string;
  bulan: string;
  tahun: string;
  nominal: number;
  metode: 'Tunai' | 'Transfer Bank' | 'QRIS' | string;
  status: 'Lunas' | 'Belum Lunas' | string;
  petugas?: string;
}

export interface CurrentUserSession {
  nama: string;
  username: string;
  role: UserRole;
}

export interface GlobalSettings {
  apiUrl: string;
  spreadsheetId: string;
  sheetGidSiswa: string;
  sheetGidPresensi: string;
  sheetGidSPP: string;
  sheetGidUsers: string;
  isConfigLocked: boolean;
}

export interface SyncLogItem {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error';
}
