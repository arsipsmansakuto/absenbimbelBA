import React from 'react';
import {
  GraduationCap,
  Barcode,
  Users,
  Coins,
  ClipboardList,
  Receipt,
  UserCheck,
  CloudUpload,
  LogOut,
  UserCircle
} from 'lucide-react';
import { CurrentUserSession } from '../types';

interface HeaderProps {
  currentUser: CurrentUserSession | null;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onLogout: () => void;
  syncStatus: 'synced' | 'syncing' | 'offline';
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  activeTab,
  onSelectTab,
  onLogout,
  syncStatus
}) => {
  const tabs = [
    { id: 'scanner', label: 'Scanner & Presensi', icon: Barcode },
    { id: 'siswa', label: 'Master Data Siswa', icon: Users },
    { id: 'spp', label: 'Pembayaran SPP', icon: Coins, highlight: true },
    { id: 'laporan', label: 'Rekap Kehadiran (12x)', icon: ClipboardList },
    { id: 'rekapSPP', label: 'Rekap Laporan SPP', icon: Receipt },
    { id: 'users', label: 'Manajemen Pengguna', icon: UserCheck },
    { id: 'settings', label: 'Sinkronisasi Sheets', icon: CloudUpload }
  ];

  const isAdminOrPetugas = currentUser && (currentUser.role === 'admin' || currentUser.role === 'petugas');

  return (
    <header className="bg-indigo-900 text-white shadow-md sticky top-0 z-40 border-b border-indigo-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Brand / Logo */}
        <div
          className="flex items-center space-x-3 cursor-pointer select-none"
          onClick={() => {
            if (isAdminOrPetugas) onSelectTab('scanner');
          }}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-300 flex items-center justify-center text-indigo-950 font-bold text-xl shadow-md">
            <GraduationCap className="w-6 h-6 text-indigo-950" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-brand tracking-wide flex items-center gap-2">
              SIM BIMBEL BA
              <span className="text-[11px] bg-amber-400 text-slate-900 font-extrabold px-2 py-0.5 rounded-full uppercase shadow-xs">
                v3.2
              </span>
            </h1>
            <p className="text-xs text-indigo-200">Sistem Informasi Presensi & SPP Terpadu</p>
          </div>
        </div>

        {/* Status, User & Logout */}
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          {/* Cloud Sync Status Indicator */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-950 text-emerald-400 text-[11px] font-mono border border-indigo-800"
            title="Sinkronisasi Google Sheets Realtime Otomatis"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                syncStatus === 'syncing'
                  ? 'bg-amber-400 animate-ping'
                  : syncStatus === 'offline'
                  ? 'bg-rose-400'
                  : 'bg-emerald-400 animate-pulse'
              }`}
            />
            <span className="hidden sm:inline">
              {syncStatus === 'syncing'
                ? 'Sync Realtime...'
                : syncStatus === 'offline'
                ? 'Mode Offline'
                : 'Sheets Terhubung (Realtime)'}
            </span>
            <span className="sm:hidden font-sans text-[10px]">
              {syncStatus === 'syncing' ? 'Sync' : syncStatus === 'offline' ? 'Offline' : 'Online'}
            </span>
          </div>

          {/* User Info Header */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-800/80 border border-indigo-700/60 text-xs">
            <UserCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <div className="max-w-[120px] sm:max-w-none truncate">
              <div className="font-semibold text-slate-100 truncate">
                {currentUser ? currentUser.nama : 'Silakan Login'}
              </div>
              <div className="text-[10px] text-indigo-300 uppercase tracking-wider font-mono">
                {currentUser ? currentUser.role : 'BELUM LOGIN'}
              </div>
            </div>
          </div>

          {/* Tombol Logout */}
          <button
            onClick={onLogout}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm border border-rose-500 cursor-pointer"
            title="Keluar / Ganti Akun"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigasi untuk Admin / Petugas */}
      {isAdminOrPetugas && (
        <nav className="bg-indigo-950/70 border-t border-indigo-800/60 overflow-x-auto no-scrollbar">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex space-x-1 sm:space-x-2 py-2">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400'
                      : tab.highlight
                      ? 'text-amber-300 hover:text-white hover:bg-indigo-800/70'
                      : 'text-indigo-200 hover:text-white hover:bg-indigo-800/70'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${tab.highlight && !isActive ? 'text-amber-400' : ''}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
};
