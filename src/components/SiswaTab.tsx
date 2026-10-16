import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  FileSpreadsheet,
  IdCard,
  Search,
  PenSquare,
  Trash2,
  Phone,
  RotateCw,
  Printer
} from 'lucide-react';
import { Student } from '../types';
import { formatNoTelp, getWaUrl } from '../utils/helpers';

interface SiswaTabProps {
  students: Student[];
  onOpenAddModal: () => void;
  onOpenEditModal: (student: Student) => void;
  onOpenDeleteConfirm: (username: string) => void;
  onOpenCardPreview: (student: Student) => void;
  onOpenExportImport: () => void;
  onDownloadAllCardsZip: () => void;
  onOpenPrintAllCardsA4: () => void;
  onRefreshFromSheets: () => void;
}

export const SiswaTab: React.FC<SiswaTabProps> = ({
  students,
  onOpenAddModal,
  onOpenEditModal,
  onOpenDeleteConfirm,
  onOpenCardPreview,
  onOpenExportImport,
  onDownloadAllCardsZip,
  onOpenPrintAllCardsA4,
  onRefreshFromSheets
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStudents = students.filter(s => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (s.nama && s.nama.toLowerCase().includes(q)) ||
      (s.username && s.username.toLowerCase().includes(q)) ||
      (s.kelas && s.kelas.toLowerCase().includes(q)) ||
      (s.sekolah_asal && s.sekolah_asal.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-800 font-brand flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <span>Master Data Siswa</span>
            </h2>
            <p className="text-xs text-slate-500">
              Data otomatis tersinkron realtime dengan Google Sheets di latar belakang
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onRefreshFromSheets}
              className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              title="Tarik data terbaru dari Google Sheets"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Segarkan dari Sheets</span>
            </button>
            <button
              onClick={onOpenPrintAllCardsA4}
              className="px-3 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              title="Cetak Semua Kartu Siswa dalam Format Lembar A4 Siap Cetak & Potong"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Kartu Semua (A4)</span>
            </button>
            <button
              onClick={onOpenAddModal}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Tambah Siswa</span>
            </button>
            <button
              onClick={onOpenExportImport}
              className="px-3 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Impor / Ekspor CSV</span>
            </button>
            <button
              onClick={onDownloadAllCardsZip}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <IdCard className="w-3.5 h-3.5" />
              <span>ZIP Kartu SVG</span>
            </button>
          </div>
        </div>

        {/* Filter Input */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari nama, kelas, atau username siswa..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
        </div>

        {/* Tabel Siswa */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Username / ID</th>
                <th className="py-2.5 px-3">Nama Siswa</th>
                <th className="py-2.5 px-3">Kelas</th>
                <th className="py-2.5 px-3">Kategori</th>
                <th className="py-2.5 px-3">Sekolah & Alamat</th>
                <th className="py-2.5 px-3">No. HP / Ortu</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Data siswa tidak ditemukan.
                  </td>
                </tr>
              ) : (
                filteredStudents.map(s => {
                  const noFormatted = formatNoTelp(s.no_telp);
                  const waUrl = getWaUrl(noFormatted);

                  return (
                    <tr key={s.username} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">{s.username}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-800">{s.nama}</td>
                      <td className="py-2.5 px-3 text-slate-600 font-medium">{s.kelas || '-'}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-indigo-100 text-indigo-800 uppercase">
                          {s.kategori_bimbingan || 'BIMBEL'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        <div className="font-semibold text-slate-800">{s.sekolah_asal || '-'}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-xs">{s.alamat || '-'}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium">{noFormatted}</span>
                          {waUrl && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-600 hover:text-emerald-700 p-0.5 rounded"
                              title="Chat WhatsApp"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">Wali: {s.nama_ortu || '-'}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                          {s.status_akun || 'Aktif'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onOpenCardPreview(s)}
                            title="Cetak Kartu Barcode"
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                          >
                            <IdCard className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onOpenEditModal(s)}
                            title="Edit Data Siswa"
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                          >
                            <PenSquare className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onOpenDeleteConfirm(s.username)}
                            title="Hapus Siswa"
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
