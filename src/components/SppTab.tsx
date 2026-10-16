import React, { useState } from 'react';
import {
  Coins,
  Calendar,
  Search,
  X,
  Receipt,
  RotateCw,
  Clock,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import { Student, SppRecord, CurrentUserSession } from '../types';
import {
  getTodayDdMmYyyy,
  formatTanggalIndo,
  formatRupiah,
  parseNominalAngka,
  normalizeDateToStandard,
  parseTanggalIndoKeIso,
  parseIsoKeTanggalIndo
} from '../utils/helpers';

interface SppTabProps {
  students: Student[];
  sppList: SppRecord[];
  currentUser: CurrentUserSession | null;
  onSubmitSpp: (record: SppRecord) => void;
  onViewReceipt: (record: SppRecord) => void;
  onDeleteSpp: (sppId: string) => void;
}

export const SppTab: React.FC<SppTabProps> = ({
  students,
  sppList,
  currentUser,
  onSubmitSpp,
  onViewReceipt,
  onDeleteSpp
}) => {
  const [sppTanggal, setSppTanggal] = useState<string>(getTodayDdMmYyyy());
  const [searchStudentQuery, setSearchStudentQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [bulan, setBulan] = useState('Oktober');
  const [tahun, setTahun] = useState('2026');
  const [nominalStr, setNominalStr] = useState('80000');
  const [metode, setMetode] = useState('Tunai');
  const [status, setStatus] = useState('Lunas');

  const filteredStudents = searchStudentQuery.trim()
    ? students.filter(
        s =>
          (s.nama && s.nama.toLowerCase().includes(searchStudentQuery.toLowerCase())) ||
          (s.username && s.username.toLowerCase().includes(searchStudentQuery.toLowerCase()))
      )
    : [];

  const handleSelectStudent = (s: Student) => {
    setSelectedStudent(s);
    setSearchStudentQuery('');
    setIsDropdownOpen(false);
  };

  const handleClearStudent = () => {
    setSelectedStudent(null);
    setSearchStudentQuery('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    const nom = parseNominalAngka(nominalStr);
    if (nom <= 0) return;

    const now = new Date();
    const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
      now.getDate()
    ).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(
      2,
      '0'
    )}${String(now.getSeconds()).padStart(2, '0')}`;

    // Pastikan tanggal bayar sesuai dengan inputan pengguna Tanggal Bayar (dd/mm/yyyy)
    const tglBayar = normalizeDateToStandard(sppTanggal.trim() || getTodayDdMmYyyy());

    const newRecord: SppRecord = {
      id: `SPP-${stamp}`,
      tanggal: tglBayar,
      nis: selectedStudent.username,
      nama: selectedStudent.nama,
      kelas: selectedStudent.kelas || '-',
      bulan: bulan,
      tahun: tahun,
      nominal: nom,
      metode: metode,
      status: status,
      petugas: currentUser ? currentUser.nama : 'Admin'
    };

    onSubmitSpp(newRecord);
    handleClearStudent();
    setNominalStr('80000');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* FORM CATAT SPP */}
        <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-800 font-brand flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-500" />
              <span>Catat Pembayaran SPP</span>
            </h2>
            <p className="text-xs text-slate-500">Input transaksi pembayaran SPP bulanan siswa</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tanggal Bayar (dd/mm/yyyy) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Tanggal Bayar (dd/mm/yyyy)
                </label>
                <button
                  type="button"
                  onClick={() => setSppTanggal(getTodayDdMmYyyy())}
                  className="text-[10px] text-amber-700 hover:text-amber-800 font-bold bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded border border-amber-200 transition cursor-pointer"
                >
                  Setel Hari Ini
                </button>
              </div>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={sppTanggal}
                  onChange={e => setSppTanggal(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-3.5 pr-10 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="dd/mm/yyyy"
                />
                <input
                  type="date"
                  value={parseTanggalIndoKeIso(sppTanggal)}
                  onChange={e => {
                    if (e.target.value) {
                      setSppTanggal(parseIsoKeTanggalIndo(e.target.value));
                    }
                  }}
                  className="absolute right-2 opacity-0 w-8 h-8 cursor-pointer z-10"
                  title="Pilih tanggal di kalender"
                />
                <Calendar className="w-4 h-4 absolute right-3.5 text-slate-400 pointer-events-none" />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Tanggal bayar disimpan persis sesuai inputan (contoh: 16/10/2026) dan disinkronkan ke Google Sheets.
              </p>
            </div>

            {/* Nama Siswa Autocomplete */}
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Siswa</label>
              {!selectedStudent ? (
                <div className="relative">
                  <input
                    type="text"
                    value={searchStudentQuery}
                    onChange={e => {
                      setSearchStudentQuery(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    autoComplete="off"
                    placeholder="Ketik nama atau username siswa..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
                </div>
              ) : (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-amber-950">{selectedStudent.nama}</div>
                    <div className="text-[10px] text-amber-800">
                      Username: {selectedStudent.username} | Kelas: {selectedStudent.kelas || '-'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearStudent}
                    className="text-amber-500 hover:text-amber-800 text-xs font-bold p-1 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Dropdown Options */}
              {isDropdownOpen && !selectedStudent && searchStudentQuery.trim() && (
                <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl z-30 divide-y divide-slate-100">
                  {filteredStudents.length === 0 ? (
                    <div className="p-3 text-xs text-slate-400 text-center">Siswa tidak ditemukan</div>
                  ) : (
                    filteredStudents.slice(0, 5).map(s => (
                      <div
                        key={s.username}
                        onClick={() => handleSelectStudent(s)}
                        className="p-2.5 hover:bg-amber-50 cursor-pointer flex items-center justify-between transition"
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

            {/* Bulan & Tahun */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Bulan SPP</label>
                <select
                  value={bulan}
                  onChange={e => setBulan(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {[
                    'Januari',
                    'Februari',
                    'Maret',
                    'April',
                    'Mei',
                    'Juni',
                    'Juli',
                    'Agustus',
                    'September',
                    'Oktober',
                    'November',
                    'Desember'
                  ].map(m => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tahun</label>
                <input
                  type="number"
                  value={tahun}
                  onChange={e => setTahun(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Nominal & Presets */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nominal Pembayaran (Rp)
              </label>
              <input
                type="number"
                value={nominalStr}
                onChange={e => setNominalStr(e.target.value)}
                placeholder="Contoh: 80000"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setNominalStr('80000')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-[11px] font-semibold text-slate-700 transition cursor-pointer"
                >
                  Rp 80.000
                </button>
                <button
                  type="button"
                  onClick={() => setNominalStr('110000')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-[11px] font-semibold text-slate-700 transition cursor-pointer"
                >
                  Rp 110.000
                </button>
                <button
                  type="button"
                  onClick={() => setNominalStr('250000')}
                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg text-[11px] font-bold text-amber-800 transition cursor-pointer"
                >
                  Rp 250.000
                </button>
              </div>
            </div>

            {/* Metode & Status */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Metode Bayar</label>
                <select
                  value={metode}
                  onChange={e => setMetode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs text-slate-800 focus:outline-none"
                >
                  <option value="Tunai">Tunai</option>
                  <option value="Transfer Bank">Transfer Bank</option>
                  <option value="QRIS">QRIS</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-semibold text-emerald-700 focus:outline-none"
                >
                  <option value="Lunas">Lunas</option>
                  <option value="Belum Lunas">Belum Lunas</option>
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!selectedStudent}
              className={`w-full py-2.5 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer ${
                selectedStudent
                  ? 'bg-amber-500 hover:bg-amber-600'
                  : 'bg-slate-300 cursor-not-allowed opacity-75'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Simpan Transaksi SPP</span>
            </button>
          </form>
        </div>

        {/* RIWAYAT TRANSAKSI SPP */}
        <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-800 font-brand flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                <span>Riwayat Pembayaran SPP</span>
              </h2>
              <p className="text-xs text-slate-500">
                Daftar transaksi tersinkronisasi realtime dengan Google Sheets Tab SPP
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Sync Realtime</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">No Kuitansi</th>
                  <th className="py-2.5 px-3">Tanggal Bayar</th>
                  <th className="py-2.5 px-3">Nama Siswa</th>
                  <th className="py-2.5 px-3">Bulan / Tahun</th>
                  <th className="py-2.5 px-3">Nominal</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sppList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Belum ada riwayat transaksi SPP.
                    </td>
                  </tr>
                ) : (
                  sppList.map(s => {
                    const isLunas = String(s.status || '').toLowerCase() === 'lunas';
                    return (
                      <tr key={s.id} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{s.id}</td>
                        <td className="py-2.5 px-3 text-slate-800">{formatTanggalIndo(s.tanggal)}</td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-800">{s.nama}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            NIS: {s.nis || '-'} • Kelas: {s.kelas || '-'}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-indigo-700 font-semibold">
                          {s.bulan} {s.tahun}
                        </td>
                        <td className="py-2.5 px-3 font-extrabold text-slate-900">
                          {formatRupiah(s.nominal)}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              isLunas ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {s.status || 'Lunas'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => onViewReceipt(s)}
                              title="Lihat Kuitansi"
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                            >
                              <Receipt className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDeleteSpp(s.id)}
                              title="Hapus Transaksi"
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
    </div>
  );
};
