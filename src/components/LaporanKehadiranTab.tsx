import React, { useState } from 'react';
import {
  ClipboardList,
  Printer,
  FileSpreadsheet,
  Filter,
  User,
  X,
  ListFilter,
  UserCheck,
  Award,
  PenSquare,
  Trash2,
  Calendar
} from 'lucide-react';
import { Student, PresensiRecord } from '../types';
import { formatTanggalIndo, parseTanggalIndoKeIso } from '../utils/helpers';

interface LaporanKehadiranTabProps {
  students: Student[];
  presensiList: PresensiRecord[];
  onOpenEditPresensi: (record: PresensiRecord) => void;
  onDeletePresensi: (id: string) => void;
  onPrintPdf: () => void;
  onDownloadCsv: () => void;
}

export const LaporanKehadiranTab: React.FC<LaporanKehadiranTabProps> = ({
  students,
  presensiList,
  onOpenEditPresensi,
  onDeletePresensi,
  onPrintPdf,
  onDownloadCsv
}) => {
  const [filterName, setFilterName] = useState('');
  const [filterBulan, setFilterBulan] = useState('');
  const [filterTahun, setFilterTahun] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTglMulai, setFilterTglMulai] = useState('');
  const [filterTglSampai, setFilterTglSampai] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Autocomplete for filter student
  const filteredStudents = filterName.trim()
    ? students.filter(
        s =>
          (s.nama && s.nama.toLowerCase().includes(filterName.toLowerCase())) ||
          (s.username && s.username.toLowerCase().includes(filterName.toLowerCase()))
      )
    : [];

  const handleSelectFilterStudent = (nama: string) => {
    setFilterName(nama);
    setIsDropdownOpen(false);
  };

  const handleClearFilterStudent = () => {
    setFilterName('');
    setIsDropdownOpen(false);
  };

  const handleResetFilter = () => {
    setFilterName('');
    setFilterBulan('');
    setFilterTahun('');
    setFilterStatus('');
    setFilterTglMulai('');
    setFilterTglSampai('');
  };

  // Filter logic
  const filteredData = presensiList.filter(p => {
    const pNama = (p.nama || '').toLowerCase();
    const pNis = (p.nis || '').toLowerCase();
    const pTanggal = formatTanggalIndo(p.tanggal);
    const pIso = parseTanggalIndoKeIso(pTanggal);

    if (filterName.trim()) {
      const q = filterName.toLowerCase().trim();
      if (!pNama.includes(q) && !pNis.includes(q)) return false;
    }

    if (filterStatus && p.status !== filterStatus) return false;

    const parts = pTanggal.split('/');
    if (parts.length === 3) {
      if (filterBulan && parts[1] !== filterBulan) return false;
      if (filterTahun && parts[2] !== filterTahun) return false;
    }

    const isoMulai = filterTglMulai ? parseTanggalIndoKeIso(filterTglMulai) : '';
    const isoSampai = filterTglSampai ? parseTanggalIndoKeIso(filterTglSampai) : '';

    if (isoMulai && pIso < isoMulai) return false;
    if (isoSampai && pIso > isoSampai) return false;

    return true;
  });

  // Calculate metrics
  const totalData = filteredData.length;
  const totalHadir = filteredData.filter(d => d.status === 'Hadir').length;
  const paketSelesai = Math.floor(totalHadir / 12);
  const sesiSisa = totalHadir % 12;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-5">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-800 font-brand flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-indigo-600" />
              <span>Rekap Laporan Kehadiran</span>
            </h2>
            <p className="text-xs text-slate-500">
              Laporan presensi siswa dan rekapitulasi paket 12 pertemuan (Otomatis Realtime)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onPrintPdf}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak PDF</span>
            </button>
            <button
              onClick={onDownloadCsv}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Filter Siswa */}
            <div className="relative">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Filter Siswa</label>
              <div className="relative">
                <input
                  type="text"
                  value={filterName}
                  onChange={e => {
                    setFilterName(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  autoComplete="off"
                  placeholder="Ketik nama siswa..."
                  className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-7 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <User className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                {filterName && (
                  <button
                    type="button"
                    onClick={handleClearFilterStudent}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {isDropdownOpen && filterName.trim() && (
                <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl z-30 divide-y divide-slate-100">
                  {filteredStudents.length === 0 ? (
                    <div className="p-3 text-xs text-slate-400 text-center">Siswa tidak ditemukan</div>
                  ) : (
                    filteredStudents.slice(0, 5).map(s => (
                      <div
                        key={s.username}
                        onClick={() => handleSelectFilterStudent(s.nama)}
                        className="p-2.5 hover:bg-indigo-50 cursor-pointer flex items-center justify-between transition"
                      >
                        <div>
                          <div className="font-bold text-slate-800 text-xs">{s.nama}</div>
                          <div className="text-[10px] text-slate-500">
                            Username: {s.username} • Kelas: {s.kelas || '-'}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Periode Bulan */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Periode Bulan</label>
              <select
                value={filterBulan}
                onChange={e => setFilterBulan(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-xs text-slate-800 focus:outline-none"
              >
                <option value="">Semua Bulan</option>
                <option value="01">Januari</option>
                <option value="02">Februari</option>
                <option value="03">Maret</option>
                <option value="04">April</option>
                <option value="05">Mei</option>
                <option value="06">Juni</option>
                <option value="07">Juli</option>
                <option value="08">Agustus</option>
                <option value="09">September</option>
                <option value="10">Oktober</option>
                <option value="11">November</option>
                <option value="12">Desember</option>
              </select>
            </div>

            {/* Tahun */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Tahun</label>
              <input
                type="number"
                value={filterTahun}
                onChange={e => setFilterTahun(e.target.value)}
                placeholder="Contoh: 2026"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
              />
            </div>

            {/* Status Kehadiran */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Status Kehadiran</label>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-xs text-slate-800 focus:outline-none"
              >
                <option value="">Semua Kehadiran</option>
                <option value="Hadir">Hadir</option>
                <option value="Izin">Izin</option>
                <option value="Sakit">Sakit</option>
                <option value="Alpa">Alpa</option>
              </select>
            </div>

            {/* Tanggal Mulai */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Tanggal Mulai (dd/mm/yyyy)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={filterTglMulai}
                  onChange={e => setFilterTglMulai(e.target.value)}
                  placeholder="dd/mm/yyyy"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                />
                <Calendar className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Tanggal Sampai */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Tanggal Sampai (dd/mm/yyyy)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={filterTglSampai}
                  onChange={e => setFilterTglSampai(e.target.value)}
                  placeholder="dd/mm/yyyy"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                />
                <Calendar className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="sm:col-span-2 flex items-end gap-2">
              <button
                type="button"
                onClick={handleResetFilter}
                className="w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Reset Filter
              </button>
            </div>
          </div>
        </div>

        {/* METRIK REKAP & PAKET 12X */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-lg">
              <ListFilter className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-indigo-700 uppercase">Total Data Presensi</div>
              <div className="text-xl font-extrabold text-indigo-950">{totalData}</div>
            </div>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-lg">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-emerald-700 uppercase">Total Hadir Masuk</div>
              <div className="text-xl font-extrabold text-emerald-950">{totalHadir}</div>
            </div>
          </div>

          {/* KARTU REKAP PAKET 12X MERAH */}
          <div className="bg-rose-50/80 border-2 border-rose-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-rose-600 text-white flex items-center justify-center text-lg">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-rose-700 tracking-wider uppercase">
                Rekap Paket (12x Pertemuan)
              </div>
              <div className="text-xs sm:text-sm font-black text-rose-600 uppercase tracking-tight">
                {paketSelesai} PAKET SELESAI ({sesiSisa}/12 SESI BERJALAN)
              </div>
            </div>
          </div>
        </div>

        {/* TABEL REKAP KEHADIRAN (DENGAN AKSI EDIT & HAPUS) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">No</th>
                <th className="py-2.5 px-3">Tanggal</th>
                <th className="py-2.5 px-3">Waktu</th>
                <th className="py-2.5 px-3">Username / ID</th>
                <th className="py-2.5 px-3">Nama Siswa</th>
                <th className="py-2.5 px-3">Kelas</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Keterangan / Paket</th>
                <th className="py-2.5 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Tidak ada data kehadiran yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredData.map((p, idx) => {
                  let badgeClass = 'bg-emerald-100 text-emerald-800';
                  if (p.status === 'Izin') badgeClass = 'bg-amber-100 text-amber-800';
                  else if (p.status === 'Sakit') badgeClass = 'bg-sky-100 text-sky-800';
                  else if (p.status === 'Alpa') badgeClass = 'bg-rose-100 text-rose-800';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3 text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {formatTanggalIndo(p.tanggal)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{p.waktu}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">{p.nis}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-800">{p.nama}</td>
                      <td className="py-2.5 px-3 text-slate-600">{p.kelas || '-'}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${badgeClass}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{p.keterangan || '-'}</td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onOpenEditPresensi(p)}
                            title="Edit Presensi"
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                          >
                            <PenSquare className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeletePresensi(p.id)}
                            title="Hapus Presensi"
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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
  );
};
