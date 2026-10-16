import React, { useState } from 'react';
import {
  Receipt,
  Printer,
  FileSpreadsheet,
  Search,
  X,
  Coins,
  FileText,
  Hourglass
} from 'lucide-react';
import { SppRecord } from '../types';
import { formatTanggalIndo, formatRupiah, parseNominalAngka } from '../utils/helpers';

interface RekapSppTabProps {
  sppList: SppRecord[];
  onPrintPdf: () => void;
  onDownloadCsv: () => void;
}

export const RekapSppTab: React.FC<RekapSppTabProps> = ({
  sppList,
  onPrintPdf,
  onDownloadCsv
}) => {
  const [filterNama, setFilterNama] = useState('');
  const [filterBulan, setFilterBulan] = useState('');
  const [filterTahun, setFilterTahun] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const filteredData = sppList.filter(s => {
    const sNama = (s.nama || '').toLowerCase();
    const sNis = (s.nis || '').toLowerCase();

    if (filterNama.trim()) {
      const q = filterNama.toLowerCase().trim();
      if (!sNama.includes(q) && !sNis.includes(q)) return false;
    }
    if (filterBulan && s.bulan !== filterBulan) return false;
    if (filterTahun && String(s.tahun) !== filterTahun.trim()) return false;
    if (filterStatus && s.status !== filterStatus) return false;

    return true;
  });

  // Financial summary
  let totalLunasNominal = 0;
  let totalBelumLunasCount = 0;

  filteredData.forEach(d => {
    const nom = parseNominalAngka(d.nominal);
    if (String(d.status || '').toLowerCase() === 'lunas') {
      totalLunasNominal += nom;
    } else {
      totalBelumLunasCount++;
    }
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-5">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-800 font-brand flex items-center gap-2">
              <Receipt className="w-5 h-5 text-amber-500" />
              <span>Rekap Laporan SPP</span>
            </h2>
            <p className="text-xs text-slate-500">
              Laporan pemasukan dan rekapitulasi pembayaran SPP siswa
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
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Cari Nama / Username Siswa
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={filterNama}
                  onChange={e => setFilterNama(e.target.value)}
                  placeholder="Ketik nama atau username..."
                  className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-7 py-2 text-xs text-slate-800 focus:outline-none"
                />
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                {filterNama && (
                  <button
                    type="button"
                    onClick={() => setFilterNama('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Bulan SPP</label>
              <select
                value={filterBulan}
                onChange={e => setFilterBulan(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-xs text-slate-800 focus:outline-none"
              >
                <option value="">Semua Bulan</option>
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
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Tahun</label>
              <input
                type="number"
                value={filterTahun}
                onChange={e => setFilterTahun(e.target.value)}
                placeholder="Contoh: 2026"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Status Pembayaran
              </label>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-xs text-slate-800 focus:outline-none"
              >
                <option value="">Semua Status</option>
                <option value="Lunas">Lunas</option>
                <option value="Belum Lunas">Belum Lunas</option>
              </select>
            </div>
          </div>
        </div>

        {/* Ringkasan Finansial */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500 text-white flex items-center justify-center text-lg">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-amber-700 uppercase">
                Total Pemasukan Lunas
              </div>
              <div className="text-xl font-extrabold text-amber-950">
                {formatRupiah(totalLunasNominal)}
              </div>
            </div>
          </div>

          <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-600 text-white flex items-center justify-center text-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-600 uppercase">Total Transaksi</div>
              <div className="text-xl font-extrabold text-slate-900">{filteredData.length}</div>
            </div>
          </div>

          <div className="bg-rose-50/70 border border-rose-100 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-500 text-white flex items-center justify-center text-lg">
              <Hourglass className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-rose-700 uppercase">SPP Belum Lunas</div>
              <div className="text-xl font-extrabold text-rose-950">{totalBelumLunasCount} Transaksi</div>
            </div>
          </div>
        </div>

        {/* Tabel Rekap SPP */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">No Kuitansi</th>
                <th className="py-2.5 px-3">Tanggal Bayar</th>
                <th className="py-2.5 px-3">Username / ID</th>
                <th className="py-2.5 px-3">Nama Siswa</th>
                <th className="py-2.5 px-3">Kelas</th>
                <th className="py-2.5 px-3">Bulan / Tahun</th>
                <th className="py-2.5 px-3">Nominal</th>
                <th className="py-2.5 px-3">Metode</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Tidak ada data transaksi SPP yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredData.map(s => {
                  const isLunas = String(s.status || '').toLowerCase() === 'lunas';
                  return (
                    <tr key={s.id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{s.id}</td>
                      <td className="py-2.5 px-3 text-slate-800">{formatTanggalIndo(s.tanggal)}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">{s.nis}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-800">{s.nama}</td>
                      <td className="py-2.5 px-3 text-slate-600">{s.kelas || '-'}</td>
                      <td className="py-2.5 px-3 font-semibold text-indigo-700">
                        {s.bulan} {s.tahun}
                      </td>
                      <td className="py-2.5 px-3 font-extrabold text-slate-900">
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
