import React, { useState } from 'react';
import {
  CloudUpload,
  Code2,
  ExternalLink,
  Lock,
  Unlock,
  Save,
  Wifi,
  Terminal
} from 'lucide-react';
import { GlobalSettings, SyncLogItem } from '../types';

interface SettingsTabProps {
  settings: GlobalSettings;
  stats: {
    siswaCount: number;
    presensiCount: number;
    sppCount: number;
    usersCount: number;
  };
  syncLogs: SyncLogItem[];
  onSaveSettings: (newSettings: GlobalSettings) => void;
  onTestConnection: () => void;
  onOpenScriptModal: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  settings,
  stats,
  syncLogs,
  onSaveSettings,
  onTestConnection,
  onOpenScriptModal
}) => {
  const [formData, setFormData] = useState<GlobalSettings>({ ...settings });
  const [isLocked, setIsLocked] = useState<boolean>(settings.isConfigLocked ?? true);

  const handleToggleLock = () => {
    setIsLocked(!isLocked);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      ...formData,
      isConfigLocked: true
    });
    setIsLocked(true);
  };

  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${formData.spreadsheetId || '1oQMV5G7fiLOxTXlENGAEHEBEs2TaC5tqA8P7b-rdmjo'}/edit?gid=${formData.sheetGidSiswa || '1709630193'}`;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-5">
        {/* Header */}
        <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-800 font-brand flex items-center gap-2">
              <CloudUpload className="w-5 h-5 text-indigo-600" />
              <span>Konfigurasi Sinkronisasi Google Sheets</span>
            </h2>
            <p className="text-xs text-slate-500">
              Sistem otomatis tersinkron realtime di latar belakang tanpa tombol manual
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenScriptModal}
              className="text-xs bg-indigo-100 text-indigo-800 px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-200 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Salin Kode Apps Script</span>
            </button>
            <a
              href={spreadsheetUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Buka Google Spreadsheet</span>
            </a>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <div className="text-[10px] text-slate-500 font-bold uppercase">Siswa Terhubung</div>
            <div className="text-lg font-black text-indigo-700">{stats.siswaCount}</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <div className="text-[10px] text-slate-500 font-bold uppercase">Baris Presensi</div>
            <div className="text-lg font-black text-emerald-700">{stats.presensiCount}</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <div className="text-[10px] text-slate-500 font-bold uppercase">Transaksi SPP</div>
            <div className="text-lg font-black text-amber-700">{stats.sppCount}</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <div className="text-[10px] text-slate-500 font-bold uppercase">Akun Pengguna</div>
            <div className="text-lg font-black text-slate-700">{stats.usersCount}</div>
          </div>
        </div>

        {/* Form Settings */}
        <form onSubmit={handleSave} className="space-y-4 max-w-2xl">
          {/* Lock Banner */}
          <div
            className={`p-3.5 rounded-2xl flex items-center justify-between border ${
              isLocked
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : 'bg-amber-50 border-amber-200 text-amber-950'
            }`}
          >
            <div className="flex items-center gap-2.5 text-xs">
              <span className={`text-base font-bold ${isLocked ? 'text-emerald-600' : 'text-amber-600'}`}>
                {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              </span>
              <div>
                <span className="font-bold">
                  Status Konfigurasi: {isLocked ? 'Terkunci Permanen' : 'Terbuka (Dapat Diedit)'}
                </span>
                <p className={`text-[10px] ${isLocked ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {isLocked
                    ? 'Konfigurasi 4 GID aman, sinkron realtime otomatis setiap saat.'
                    : 'Anda dapat menyesuaikan Web App URL dan 4 GID Sheet.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleLock}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-[11px] font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              {isLocked ? (
                <>
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Buka Kunci</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Kunci Kembali</span>
                </>
              )}
            </button>
          </div>

          {/* Web App URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Web App URL (Google Apps Script / exec)
            </label>
            <input
              type="text"
              readOnly={isLocked}
              value={formData.apiUrl}
              onChange={e => setFormData({ ...formData, apiUrl: e.target.value })}
              placeholder="https://script.google.com/macros/s/.../exec"
              className={`w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-mono transition ${
                isLocked ? 'bg-slate-100 cursor-not-allowed' : 'bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500'
              }`}
            />
          </div>

          {/* Spreadsheet ID & 4 Sheet GID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Spreadsheet ID</label>
              <input
                type="text"
                readOnly={isLocked}
                value={formData.spreadsheetId}
                onChange={e => setFormData({ ...formData, spreadsheetId: e.target.value })}
                className={`w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono transition ${
                  isLocked ? 'bg-slate-100 cursor-not-allowed' : 'bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500'
                }`}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sheet GID (Tab Siswa)
              </label>
              <input
                type="text"
                readOnly={isLocked}
                value={formData.sheetGidSiswa}
                onChange={e => setFormData({ ...formData, sheetGidSiswa: e.target.value })}
                placeholder="Contoh: 1709630193"
                className={`w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono transition ${
                  isLocked ? 'bg-slate-100 cursor-not-allowed' : 'bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500'
                }`}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sheet GID (Tab Presensi)
              </label>
              <input
                type="text"
                readOnly={isLocked}
                value={formData.sheetGidPresensi}
                onChange={e => setFormData({ ...formData, sheetGidPresensi: e.target.value })}
                placeholder="Contoh: 0 atau GID Tab Presensi"
                className={`w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono transition ${
                  isLocked ? 'bg-slate-100 cursor-not-allowed' : 'bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500'
                }`}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Sheet GID (Tab SPP)</label>
              <input
                type="text"
                readOnly={isLocked}
                value={formData.sheetGidSPP}
                onChange={e => setFormData({ ...formData, sheetGidSPP: e.target.value })}
                placeholder="Contoh: GID Tab SPP"
                className={`w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono transition ${
                  isLocked ? 'bg-slate-100 cursor-not-allowed' : 'bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500'
                }`}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sheet GID (Tab Users / Pengguna)
              </label>
              <input
                type="text"
                readOnly={isLocked}
                value={formData.sheetGidUsers}
                onChange={e => setFormData({ ...formData, sheetGidUsers: e.target.value })}
                placeholder="Contoh: GID Tab Users"
                className={`w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono transition ${
                  isLocked ? 'bg-slate-100 cursor-not-allowed' : 'bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500'
                }`}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="submit"
              disabled={isLocked}
              className={`px-4 py-2 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
                isLocked ? 'bg-slate-400 opacity-50 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan & Kunci Konfigurasi</span>
            </button>
            <button
              type="button"
              onClick={onTestConnection}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-300 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Wifi className="w-3.5 h-3.5" />
              <span>Uji Koneksi (Ping)</span>
            </button>
          </div>

          {/* Sync Terminal Box */}
          <div className="bg-slate-900 rounded-xl p-3 text-slate-300 font-mono text-[11px] space-y-1">
            <div className="text-[10px] text-slate-400 font-bold uppercase border-b border-slate-800 pb-1 flex justify-between items-center">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3 h-3 text-emerald-400" />
                <span>Log Aktivitas Sinkronisasi Realtime</span>
              </span>
              <span className="text-emerald-400">Aktif</span>
            </div>
            <div className="max-h-24 overflow-y-auto space-y-0.5 text-slate-400">
              {syncLogs.length === 0 ? (
                <div className="text-slate-500">[SYSTEM] Sinkronisasi realtime otomatis aktif di latar belakang.</div>
              ) : (
                syncLogs.map(log => (
                  <div
                    key={log.id}
                    className={
                      log.type === 'error'
                        ? 'text-rose-400'
                        : log.type === 'success'
                        ? 'text-emerald-400'
                        : 'text-slate-300'
                    }
                  >
                    [{log.timestamp}] {log.message}
                  </div>
                ))
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
