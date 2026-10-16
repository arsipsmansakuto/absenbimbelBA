import React, { useState } from 'react';
import {
  GraduationCap,
  LogOut,
  ClipboardList,
  Receipt,
  IdCard,
  CalendarCheck,
  Award,
  Wallet,
  AlertCircle,
  Phone,
  Clock
} from 'lucide-react';
import { Student, PresensiRecord, SppRecord } from '../types';
import {
  formatTanggalIndo,
  formatRupiah,
  formatNoTelp,
  getWaUrl,
  parseNominalAngka
} from '../utils/helpers';

interface PortalSiswaProps {
  student: Student;
  presensiList: PresensiRecord[];
  sppList: SppRecord[];
  onLogout: () => void;
  onViewReceipt: (record: SppRecord) => void;
}

export const PortalSiswa: React.FC<PortalSiswaProps> = ({
  student,
  presensiList,
  sppList,
  onLogout,
  onViewReceipt
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'presensi' | 'spp' | 'profil'>('presensi');

  const uNorm = (student.username || '').toLowerCase();
  const nNorm = (student.nama || '').toLowerCase();

  // Student's presence records
  const myPresensi = presensiList.filter(
    p =>
      (p.nis && p.nis.toLowerCase() === uNorm) ||
      (p.nama && p.nama.toLowerCase() === nNorm)
  );

  const totalHadir = myPresensi.filter(p => p.status === 'Hadir').length;
  const paketSelesai = Math.floor(totalHadir / 12);
  const paketKe = paketSelesai + 1;
  const sesiBerjalan = totalHadir % 12;
  const progressPercent = Math.round((sesiBerjalan / 12) * 100);

  // Student's SPP records
  const mySpp = sppList.filter(
    s =>
      (s.nis && s.nis.toLowerCase() === uNorm) ||
      (s.nama && s.nama.toLowerCase() === nNorm)
  );

  let totalSppLunasNominal = 0;
  let totalBelumLunasCount = 0;

  mySpp.forEach(s => {
    const nom = parseNominalAngka(s.nominal);
    if (String(s.status || '').toLowerCase() === 'lunas') {
      totalSppLunasNominal += nom;
    } else {
      totalBelumLunasCount++;
    }
  });

  const telpFormatted = formatNoTelp(student.no_telp);
  const waUrl = getWaUrl(telpFormatted);

  return (
    <div className="space-y-6">
      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-indigo-950 rounded-3xl p-6 text-white shadow-lg space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-400 text-indigo-950 flex items-center justify-center text-3xl font-bold shadow-md flex-shrink-0">
              <GraduationCap className="w-9 h-9" />
            </div>
            <div>
              <div className="text-xs text-indigo-200 uppercase font-semibold">Selamat Datang,</div>
              <h2 className="text-xl sm:text-2xl font-bold font-brand tracking-wide">{student.nama}</h2>
              <div className="text-xs text-indigo-200 flex flex-wrap items-center gap-2 mt-1">
                <span>
                  Username: <b className="text-white font-mono">{student.username}</b>
                </span>
                <span>•</span>
                <span>
                  Kelas: <b className="text-white">{student.kelas || '-'}</b>
                </span>
                <span>•</span>
                <span className="bg-amber-400 text-slate-950 font-bold px-2 py-0.5 rounded-full text-[10px] uppercase">
                  {student.kategori_bimbingan || 'BIMBEL'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="self-start sm:self-auto px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold transition flex items-center gap-2 cursor-pointer border border-white/20"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar</span>
          </button>
        </div>

        {/* Progres Paket (12x Pertemuan) */}
        <div className="bg-indigo-950/60 rounded-2xl p-4 border border-indigo-500/30 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Progres Paket Bimbingan Belajar</span>
            </span>
            <span className="text-white">
              {sesiBerjalan} / 12 Pertemuan (Paket ke-{paketKe})
            </span>
          </div>
          <div className="w-full bg-indigo-900/80 rounded-full h-3 overflow-hidden border border-indigo-700/50">
            <div
              className="bg-gradient-to-r from-amber-400 to-amber-300 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="bg-white rounded-2xl p-2 shadow-sm border border-slate-200 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveSubTab('presensi')}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === 'presensi'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Riwayat Kehadiran Saya</span>
        </button>
        <button
          onClick={() => setActiveSubTab('spp')}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === 'spp'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Rekap Pembayaran SPP</span>
        </button>
        <button
          onClick={() => setActiveSubTab('profil')}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === 'profil'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <IdCard className="w-4 h-4" />
          <span>Profil Siswa</span>
        </button>
      </div>

      {/* SUB TAB 1: PRESENSI */}
      {activeSubTab === 'presensi' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">Hadir Masuk</div>
                <div className="text-2xl font-extrabold text-slate-800">{totalHadir}</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl font-bold">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">Paket Selesai (12x)</div>
                <div className="text-2xl font-extrabold text-slate-800">{paketSelesai} Paket</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 font-brand">Daftar Presensi Kehadiran Saya</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Tanggal</th>
                    <th className="py-2.5 px-3">Waktu</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Catatan / Paket</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myPresensi.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">
                        Belum ada riwayat presensi kehadiran yang tercatat.
                      </td>
                    </tr>
                  ) : (
                    myPresensi.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {formatTanggalIndo(p.tanggal)}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600 flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{p.waktu}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                            {p.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{p.keterangan || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB TAB 2: SPP */}
      {activeSubTab === 'spp' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl font-bold">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">Total SPP Lunas</div>
                <div className="text-2xl font-extrabold text-slate-800">
                  {formatRupiah(totalSppLunasNominal)}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-xl font-bold">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">Tagihan SPP Belum Lunas</div>
                <div className="text-2xl font-extrabold text-slate-800">
                  {totalBelumLunasCount} Tagihan
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 font-brand">
              Riwayat Transaksi Pembayaran SPP
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">No Kuitansi</th>
                    <th className="py-2.5 px-3">Tanggal Bayar</th>
                    <th className="py-2.5 px-3">Bulan / Tahun</th>
                    <th className="py-2.5 px-3">Nominal</th>
                    <th className="py-2.5 px-3">Metode</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Petugas</th>
                    <th className="py-2.5 px-3 text-center">Bukti Kuitansi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mySpp.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Belum ada transaksi pembayaran SPP yang tercatat.
                      </td>
                    </tr>
                  ) : (
                    mySpp.map(s => {
                      const isLunas = String(s.status || '').toLowerCase() === 'lunas';
                      return (
                        <tr key={s.id} className="hover:bg-slate-50 transition">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{s.id}</td>
                          <td className="py-2.5 px-3 font-medium text-slate-800">
                            {formatTanggalIndo(s.tanggal)}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-indigo-700">
                            {s.bulan} {s.tahun}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">
                            {formatRupiah(s.nominal)}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">{s.metode || 'Tunai'}</td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                isLunas ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {s.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">{s.petugas || 'Admin'}</td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              onClick={() => onViewReceipt(s)}
                              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-bold shadow-xs flex items-center justify-center gap-1 mx-auto transition cursor-pointer"
                              title="Lihat & Cetak Kuitansi"
                            >
                              <Receipt className="w-3 h-3" />
                              <span>Kuitansi</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB TAB 3: PROFIL SISWA */}
      {activeSubTab === 'profil' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 max-w-3xl">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg">
              <IdCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 font-brand">Data Profil Siswa Lengkap</h3>
              <p className="text-xs text-slate-500">
                Informasi biodata siswa diambil langsung dari Master Data Google Sheets
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="text-slate-500 block text-[11px]">Nama Lengkap Siswa</span>
              <span className="font-bold text-slate-800 text-sm">{student.nama}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="text-slate-500 block text-[11px]">Username</span>
              <span className="font-bold font-mono text-indigo-700 text-sm">{student.username}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="text-slate-500 block text-[11px]">Kelas & Tingkat</span>
              <span className="font-bold text-slate-800">{student.kelas || '-'}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="text-slate-500 block text-[11px]">Kategori Bimbingan</span>
              <span className="font-bold text-slate-800">{student.kategori_bimbingan || 'BIMBEL'}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="text-slate-500 block text-[11px]">Sekolah Asal</span>
              <span className="font-bold text-slate-800">{student.sekolah_asal || '-'}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="text-slate-500 block text-[11px]">Hobi / Minat</span>
              <span className="font-bold text-slate-800">{student.hobi || '-'}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 sm:col-span-2">
              <span className="text-slate-500 block text-[11px]">Alamat Lengkap</span>
              <span className="font-bold text-slate-800">{student.alamat || '-'}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="text-slate-500 block text-[11px]">Nama Orang Tua / Wali</span>
              <span className="font-bold text-slate-800">{student.nama_ortu || '-'}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="text-slate-500 block text-[11px]">No. Telepon / WhatsApp</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">{telpFormatted}</span>
                {waUrl && (
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg text-[10px] font-bold flex items-center gap-1 transition"
                  >
                    <Phone className="w-3 h-3" />
                    <span>WhatsApp</span>
                  </a>
                )}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 sm:col-span-2">
              <span className="text-slate-500 block text-[11px]">Status Akun</span>
              <span className="font-bold text-emerald-700">{student.status_akun || 'Aktif'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
