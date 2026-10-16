import React, { useState, useEffect, useRef, useCallback } from 'react';
import JSZip from 'jszip';
import JsBarcode from 'jsbarcode';
import {
  Student,
  PresensiRecord,
  SppRecord,
  UserAccount,
  GlobalSettings,
  CurrentUserSession,
  SyncLogItem
} from './types';
import {
  DEFAULT_USERS,
  DEFAULT_SISWA,
  DEFAULT_PRESENSI,
  DEFAULT_SPP,
  DEFAULT_SETTINGS
} from './data/defaultData';
import {
  getTodayDdMmYyyy,
  getCurrentTimeHhMm,
  formatTanggalIndo,
  parseTanggalIndoKeIso,
  safeFileDownload,
  parseNominalAngka
} from './utils/helpers';
import {
  playSuccessChime,
  playCelebrationChime,
  playWarningSound,
  playErrorSound,
  speakText
} from './utils/audio';
import {
  fetchCsvFromGoogleSheet,
  parseSiswaCSV,
  parsePresensiCSV,
  parseSppCSV,
  parseUsersCSV,
  sendPayloadToGoogleAppsScript
} from './utils/sheetsSync';

import { Header } from './components/Header';
import { ScannerTab } from './components/ScannerTab';
import { SiswaTab } from './components/SiswaTab';
import { SppTab } from './components/SppTab';
import { LaporanKehadiranTab } from './components/LaporanKehadiranTab';
import { RekapSppTab } from './components/RekapSppTab';
import { UsersTab } from './components/UsersTab';
import { SettingsTab } from './components/SettingsTab';
import { PortalSiswa } from './components/PortalSiswa';

import {
  LoginModal,
  SuccessPresenceModal,
  AlreadyPresentModal,
  PackageCelebrationModal,
  ReceiptModal,
  StudentFormModal,
  BarcodeCardModal,
  ExportImportCsvModal,
  UserFormModal,
  EditPresenceModal,
  CustomConfirmModal,
  ScriptCodeModal,
  PrintAllCardsA4Modal
} from './components/Modals';

const STORAGE_KEY = 'sim_bimbel_ba_v3_2_state';
const SETTINGS_KEY = 'sim_bimbel_ba_global_settings';
const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export default function App() {
  // Main Data States
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.siswa) && parsed.siswa.length > 0) return parsed.siswa;
      }
    } catch {}
    return DEFAULT_SISWA;
  });

  const [presensiList, setPresensiList] = useState<PresensiRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.presensi)) return parsed.presensi;
      }
    } catch {}
    return DEFAULT_PRESENSI;
  });

  const [sppList, setSppList] = useState<SppRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.spp)) return parsed.spp;
      }
    } catch {}
    return DEFAULT_SPP;
  });

  const [users, setUsers] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.users) && parsed.users.length > 0) return parsed.users;
      }
    } catch {}
    return DEFAULT_USERS;
  });

  const [settings, setSettings] = useState<GlobalSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {}
    return DEFAULT_SETTINGS;
  });

  // Current session & active UI tab
  const [currentUser, setCurrentUser] = useState<CurrentUserSession | null>(null);
  const [activeTab, setActiveTab] = useState<string>('scanner');
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');
  const [syncLogs, setSyncLogs] = useState<SyncLogItem[]>([]);

  // Toast Notification
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' | 'warning' | 'error' } | null>(null);

  // Modals state
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(true);
  const [successPresenceData, setSuccessPresenceData] = useState<{
    nama: string;
    nis: string;
    kelas: string;
    tanggal: string;
    waktu: string;
  } | null>(null);
  const [alreadyPresentData, setAlreadyPresentData] = useState<{
    nama: string;
    tanggal: string;
    waktu: string;
    status: string;
  } | null>(null);
  const [packageCelebrationData, setPackageCelebrationData] = useState<{
    nama: string;
    paketKe: number;
    totalHadir: number;
  } | null>(null);
  const [receiptRecord, setReceiptRecord] = useState<SppRecord | null>(null);

  const [studentFormState, setStudentFormState] = useState<{
    isOpen: boolean;
    student: Student | null;
  }>({ isOpen: false, student: null });

  const [barcodeCardStudent, setBarcodeCardStudent] = useState<Student | null>(null);
  const [isExportImportOpen, setIsExportImportOpen] = useState(false);
  const [userFormState, setUserFormState] = useState<{
    isOpen: boolean;
    user: UserAccount | null;
  }>({ isOpen: false, user: null });

  const [editPresenceRecord, setEditPresenceRecord] = useState<PresensiRecord | null>(null);

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isDestructive: boolean;
    onConfirm: () => void;
  } | null>(null);

  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);
  const [isPrintAllA4Open, setIsPrintAllA4Open] = useState(false);

  // Idle Timer Ref
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Toast Helper
  const showToast = useCallback((message: string, type: 'info' | 'success' | 'warning' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3200);
  }, []);

  // Add Log Item
  const addSyncLog = useCallback((message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const item: SyncLogItem = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString('id-ID'),
      message,
      type
    };
    setSyncLogs(prev => [item, ...prev.slice(0, 40)]);
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          siswa: students,
          presensi: presensiList,
          spp: sppList,
          users: users
        })
      );
    } catch (e) {
      console.warn('Storage save error:', e);
    }
  }, [students, presensiList, sppList, users]);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Settings save error:', e);
    }
  }, [settings]);

  // Reset Idle Timer
  const resetIdleTimer = useCallback(() => {
    if (!currentUser) return;
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setCurrentUser(null);
      setIsLoginOpen(true);
      showToast('Sesi berakhir: 30 menit tidak ada aktivitas. Silakan login kembali.', 'warning');
      playWarningSound();
      speakText('Sesi Anda telah berakhir karena tidak ada aktivitas');
    }, IDLE_TIMEOUT_MS);
  }, [currentUser, showToast]);

  // Idle Activity Listeners
  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    const handleActivity = () => resetIdleTimer();
    events.forEach(e => window.addEventListener(e, handleActivity, { passive: true }));
    resetIdleTimer();

    return () => {
      events.forEach(e => window.removeEventListener(e, handleActivity));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [resetIdleTimer]);

  // AUTO-SYNC WITH GOOGLE SHEETS
  const syncFromSheets = useCallback(
    async (showNotice = false) => {
      if (!settings.spreadsheetId) return;
      setSyncStatus('syncing');

      try {
        // 1. Siswa
        if (settings.sheetGidSiswa) {
          const csvSiswa = await fetchCsvFromGoogleSheet(settings.spreadsheetId, settings.sheetGidSiswa);
          if (csvSiswa) {
            const parsed = parseSiswaCSV(csvSiswa);
            if (parsed.length > 0) {
              setStudents(prev => {
                if (JSON.stringify(prev) !== JSON.stringify(parsed)) {
                  addSyncLog(`Data siswa disinkronkan (${parsed.length} siswa).`, 'success');
                  return parsed;
                }
                return prev;
              });
            }
          }
        }

        // 2. Presensi
        const gidOrNamePresensi = settings.sheetGidPresensi || 'Presensi';
        const csvPresensi = await fetchCsvFromGoogleSheet(settings.spreadsheetId, gidOrNamePresensi);
        if (csvPresensi) {
          const parsed = parsePresensiCSV(csvPresensi);
          if (parsed.length > 0) {
            setPresensiList(prev => {
              if (JSON.stringify(prev) !== JSON.stringify(parsed)) {
                addSyncLog(`Data presensi disinkronkan (${parsed.length} data).`, 'success');
                return parsed;
              }
              return prev;
            });
          }
        }

        // 3. SPP
        const gidOrNameSpp = settings.sheetGidSPP || 'SPP';
        const csvSpp = await fetchCsvFromGoogleSheet(settings.spreadsheetId, gidOrNameSpp);
        if (csvSpp) {
          const parsed = parseSppCSV(csvSpp);
          if (parsed.length > 0) {
            setSppList(prev => {
              if (JSON.stringify(prev) !== JSON.stringify(parsed)) {
                addSyncLog(`Data transaksi SPP disinkronkan (${parsed.length} data).`, 'success');
                return parsed;
              }
              return prev;
            });
          }
        }

        // 4. Users
        if (settings.sheetGidUsers) {
          const csvUsers = await fetchCsvFromGoogleSheet(settings.spreadsheetId, settings.sheetGidUsers);
          if (csvUsers) {
            const parsed = parseUsersCSV(csvUsers);
            if (parsed.length > 0) {
              setUsers(prev => {
                if (JSON.stringify(prev) !== JSON.stringify(parsed)) {
                  addSyncLog(`Data akun pengguna disinkronkan (${parsed.length} akun).`, 'success');
                  return parsed;
                }
                return prev;
              });
            }
          }
        }

        setSyncStatus('synced');
        if (showNotice) {
          showToast('Data Google Sheets berhasil diperbarui!', 'success');
        }
      } catch (err) {
        console.warn('Sync error:', err);
        setSyncStatus('offline');
        if (showNotice) {
          showToast('Koneksi Google Sheets offline atau terhalang izin.', 'warning');
        }
      }
    },
    [settings, addSyncLog, showToast]
  );

  // Periodic Auto-Sync Timer (every 14s)
  useEffect(() => {
    syncFromSheets(false);
    const interval = setInterval(() => {
      if (!document.hidden) {
        syncFromSheets(false);
      }
    }, 14000);

    const onVisible = () => {
      if (!document.hidden) syncFromSheets(false);
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [syncFromSheets]);

  // LOGIN PROCESSOR
  const handleLogin = (u: string, p: string): boolean => {
    // 1. Check user accounts
    const userFound = users.find(x => x.username.toLowerCase() === u.toLowerCase() && x.password === p);
    if (userFound) {
      setCurrentUser({
        nama: userFound.nama,
        username: userFound.username,
        role: userFound.role
      });
      setIsLoginOpen(false);
      setActiveTab('scanner');
      showToast(`Selamat datang, ${userFound.nama}!`, 'success');
      resetIdleTimer();
      return true;
    }

    // 2. Check student accounts
    const studentFound = students.find(s => s.username.toLowerCase() === u.toLowerCase() && s.password === p);
    if (studentFound) {
      setCurrentUser({
        nama: studentFound.nama,
        username: studentFound.username,
        role: 'siswa'
      });
      setIsLoginOpen(false);
      showToast(`Selamat datang di portal siswa, ${studentFound.nama}!`, 'success');
      resetIdleTimer();
      return true;
    }

    return false;
  };

  // LOGOUT
  const handleLogout = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Konfirmasi Logout',
      message: 'Apakah Anda yakin ingin keluar dari akun saat ini?',
      isDestructive: false,
      onConfirm: () => {
        setCurrentUser(null);
        setIsLoginOpen(true);
        showToast('Anda telah berhasil keluar.', 'success');
      }
    });
  };

  // ATTENDANCE PROCESSOR (Camera Scan & Manual Submit)
  const handleProcessPresensi = (
    scannedQuery: string,
    customTanggal?: string,
    customKeterangan?: string
  ) => {
    if (!scannedQuery.trim()) return;
    const q = scannedQuery.trim().toLowerCase();

    // Match student
    let target = students.find(s => s.username && s.username.toLowerCase() === q);
    if (!target) target = students.find(s => s.nama && s.nama.toLowerCase() === q);
    if (!target) target = students.find(s => s.nama && s.nama.toLowerCase().includes(q));

    if (!target) {
      playErrorSound();
      showToast(`Siswa "${scannedQuery}" tidak terdaftar di database!`, 'error');
      return;
    }

    const tgl = customTanggal ? formatTanggalIndo(customTanggal) : getTodayDdMmYyyy();
    const tglIso = parseTanggalIndoKeIso(tgl);

    const targetNamaNorm = (target.nama || '').trim().toLowerCase().replace(/\s+/g, ' ');
    const targetUsername = (target.username || '').trim().toLowerCase();

    // Anti-duplicate check for today
    const sudah = presensiList.find(p => {
      const pIso = parseTanggalIndoKeIso(p.tanggal);
      const matchTgl = (pIso && tglIso && pIso === tglIso) || formatTanggalIndo(p.tanggal) === tgl;
      const pNamaNorm = (p.nama || '').trim().toLowerCase().replace(/\s+/g, ' ');
      const pNisNorm = (p.nis || '').trim().toLowerCase();
      return matchTgl && (pNamaNorm === targetNamaNorm || pNisNorm === targetUsername);
    });

    if (sudah) {
      playWarningSound();
      speakText('Anda sudah presensi hari ini');
      setAlreadyPresentData({
        nama: target.nama,
        tanggal: tgl,
        waktu: sudah.waktu,
        status: sudah.status
      });
      showToast(`Peringatan: ${target.nama} sudah presensi hari ini!`, 'warning');
      return;
    }

    // Calculate total previous attendance for 12x package
    const totalPrevious = presensiList.filter(p => {
      const match =
        (p.nis && p.nis.toLowerCase() === targetUsername) ||
        (p.nama && (p.nama || '').trim().toLowerCase().replace(/\s+/g, ' ') === targetNamaNorm);
      return match && p.status === 'Hadir';
    }).length;

    const totalNew = totalPrevious + 1;
    let isPaketMilestone = false;
    let keteranganText = customKeterangan && customKeterangan.trim() ? customKeterangan.trim() : '-';

    if (totalNew % 12 === 0) {
      isPaketMilestone = true;
      const paketKe = totalNew / 12;
      keteranganText =
        keteranganText !== '-'
          ? `${keteranganText} [Paket ke-${paketKe} Selesai]`
          : `[Paket ke-${paketKe} Selesai (12 Pertemuan)]`;

      playCelebrationChime();
      speakText(`Selamat, ${target.nama} telah menyelesaikan satu paket bimbingan belajar`);
      setPackageCelebrationData({
        nama: target.nama,
        paketKe,
        totalHadir: totalNew
      });
    }

    const waktuStr = getCurrentTimeHhMm();
    const newRecord: PresensiRecord = {
      id: `PRS-${Date.now()}`,
      tanggal: tgl,
      waktu: waktuStr,
      nis: target.username,
      nama: target.nama,
      kelas: target.kelas || '-',
      status: 'Hadir',
      keterangan: keteranganText
    };

    setPresensiList(prev => [newRecord, ...prev]);

    if (!isPaketMilestone) {
      playSuccessChime();
      speakText(`Presensi Anda tercatat, terima kasih ${target.nama}`);
      setSuccessPresenceData({
        nama: target.nama,
        nis: target.username,
        kelas: target.kelas || '-',
        tanggal: tgl,
        waktu: waktuStr
      });
    }

    showToast(`Presensi berhasil: ${target.nama}`, 'success');

    // Send to Sheets in background
    sendPayloadToGoogleAppsScript(settings.apiUrl, {
      action: 'simpanPresensi',
      ...newRecord
    });
  };

  // SUBMIT SPP PAYMENT
  const handleSubmitSpp = (record: SppRecord) => {
    setSppList(prev => [record, ...prev]);
    setReceiptRecord(record);
    showToast(`Transaksi SPP untuk ${record.nama} berhasil dicatat!`, 'success');

    sendPayloadToGoogleAppsScript(settings.apiUrl, {
      action: 'simpanSPP',
      ...record
    });
  };

  // DELETE SPP
  const handleDeleteSpp = (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Hapus Transaksi SPP',
      message: `Apakah Anda yakin ingin menghapus transaksi dengan No. Kuitansi "${id}"?`,
      isDestructive: true,
      onConfirm: () => {
        setSppList(prev => prev.filter(x => x.id !== id));
        showToast('Transaksi SPP berhasil dihapus', 'success');
        sendPayloadToGoogleAppsScript(settings.apiUrl, {
          action: 'hapusSPP',
          id
        });
      }
    });
  };

  // EDIT PRESENSI
  const handleSaveEditPresensi = (updated: PresensiRecord) => {
    setPresensiList(prev => prev.map(p => (p.id === updated.id ? updated : p)));
    setEditPresenceRecord(null);
    showToast('Data presensi berhasil diperbarui!', 'success');

    sendPayloadToGoogleAppsScript(settings.apiUrl, {
      action: 'updatePresensi',
      ...updated
    });
  };

  // DELETE PRESENSI
  const handleDeletePresensi = (id: string) => {
    const item = presensiList.find(p => p.id === id);
    setConfirmConfig({
      isOpen: true,
      title: 'Hapus Data Presensi',
      message: `Hapus data presensi ${item?.nama || id}? Data di spreadsheet juga akan terhapus.`,
      isDestructive: true,
      onConfirm: () => {
        setPresensiList(prev => prev.filter(p => p.id !== id));
        showToast('Data presensi berhasil dihapus', 'success');
        sendPayloadToGoogleAppsScript(settings.apiUrl, {
          action: 'hapusPresensi',
          id
        });
      }
    });
  };

  // SAVE STUDENT (Add / Edit)
  const handleSaveStudent = (s: Student) => {
    const isEdit = !!studentFormState.student;
    if (isEdit) {
      setStudents(prev => prev.map(item => (item.username === s.username ? s : item)));
      showToast(`Data siswa ${s.nama} berhasil diperbarui`, 'success');
    } else {
      if (students.some(item => item.username === s.username)) {
        showToast(`Username/NIS "${s.username}" sudah digunakan!`, 'error');
        return;
      }
      setStudents(prev => [s, ...prev]);
      showToast(`Siswa baru ${s.nama} berhasil ditambahkan!`, 'success');
    }

    setStudentFormState({ isOpen: false, student: null });

    sendPayloadToGoogleAppsScript(settings.apiUrl, {
      action: isEdit ? 'updateSiswa' : 'tambahSiswa',
      ...s
    });
  };

  // DELETE STUDENT
  const handleDeleteStudent = (username: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Hapus Data Siswa',
      message: `Hapus siswa dengan username "${username}"? Tindakan ini tidak dapat dibatalkan.`,
      isDestructive: true,
      onConfirm: () => {
        setStudents(prev => prev.filter(s => s.username !== username));
        showToast(`Siswa ${username} berhasil dihapus`, 'success');
        sendPayloadToGoogleAppsScript(settings.apiUrl, {
          action: 'hapusSiswa',
          username
        });
      }
    });
  };

  // IMPORT CSV STUDENTS
  const handleImportStudents = (newStudents: Student[]) => {
    let countNew = 0;
    let countUpdated = 0;

    setStudents(prev => {
      const copy = [...prev];
      newStudents.forEach(s => {
        const idx = copy.findIndex(x => x.username.toLowerCase() === s.username.toLowerCase());
        if (idx !== -1) {
          copy[idx] = { ...copy[idx], ...s };
          countUpdated++;
        } else {
          copy.push(s);
          countNew++;
        }
      });
      return copy;
    });

    showToast(`Impor berhasil: ${countNew} baru, ${countUpdated} diperbarui!`, 'success');
  };

  // ZIP ALL CARDS
  const handleDownloadAllCardsZip = async () => {
    showToast('Membuat berkas ZIP seluruh kartu...', 'info');
    const zip = new JSZip();
    const folder = zip.folder('Kartu_Siswa_BIMBEL_BA');

    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      try {
        JsBarcode(svg, s.username, {
          format: 'CODE128',
          width: 2,
          height: 40,
          displayValue: true
        });
        const svgData = new XMLSerializer().serializeToString(svg);
        folder?.file(`${s.username}_${s.nama.replace(/\s+/g, '_')}.svg`, svgData);
      } catch (e) {
        console.warn('Barcode zip error:', e);
      }
    }

    const content = await zip.generateAsync({ type: 'blob' });
    safeFileDownload(content, 'Semua_Kartu_Barcode_BIMBEL_BA.zip');
    showToast('Berkas ZIP berhasil diunduh!', 'success');
  };

  // SAVE USER (Admin/Petugas)
  const handleSaveUser = (u: UserAccount) => {
    const isEdit = !!userFormState.user;
    if (isEdit) {
      setUsers(prev => prev.map(item => (item.username === u.username ? u : item)));
      showToast('Data pengguna berhasil diperbarui', 'success');
    } else {
      if (users.some(item => item.username.toLowerCase() === u.username.toLowerCase())) {
        showToast(`Username "${u.username}" sudah digunakan!`, 'error');
        return;
      }
      setUsers(prev => [...prev, u]);
      showToast('Pengguna baru berhasil ditambahkan', 'success');
    }
    setUserFormState({ isOpen: false, user: null });

    sendPayloadToGoogleAppsScript(settings.apiUrl, {
      action: isEdit ? 'updateUser' : 'simpanUser',
      ...u
    });
  };

  // DELETE USER
  const handleDeleteUser = (username: string) => {
    if (username === 'admin') {
      showToast('Akun admin utama tidak boleh dihapus!', 'warning');
      return;
    }
    setConfirmConfig({
      isOpen: true,
      title: 'Hapus Pengguna',
      message: `Apakah Anda yakin ingin menghapus akun pengguna "${username}"?`,
      isDestructive: true,
      onConfirm: () => {
        setUsers(prev => prev.filter(x => x.username !== username));
        showToast('Pengguna berhasil dihapus', 'success');
        sendPayloadToGoogleAppsScript(settings.apiUrl, {
          action: 'hapusUser',
          username
        });
      }
    });
  };

  // CSV DOWNLOAD FOR PRESENCE REPORT
  const handleDownloadPresenceCsv = () => {
    let csv = 'ID Presensi,Tanggal,Waktu,Username,Nama Siswa,Kelas,Status,Keterangan\n';
    presensiList.forEach(p => {
      csv += `"${p.id}","${formatTanggalIndo(p.tanggal)}","${p.waktu}","${p.nis}","${p.nama}","${p.kelas || '-'}","${p.status}","${p.keterangan || '-'}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    safeFileDownload(blob, `Rekap_Kehadiran_BIMBEL_BA_${getTodayDdMmYyyy().replace(/\//g, '-')}.csv`);
    showToast('Laporan kehadiran diekspor ke CSV!', 'success');
  };

  // CSV DOWNLOAD FOR SPP REPORT
  const handleDownloadSppCsv = () => {
    let csv = 'No Kuitansi,Tanggal Bayar,Username,Nama Siswa,Kelas,Bulan,Tahun,Nominal,Metode,Status,Petugas\n';
    sppList.forEach(s => {
      csv += `"${s.id}","${formatTanggalIndo(s.tanggal)}","${s.nis}","${s.nama}","${s.kelas || '-'}","${s.bulan}","${s.tahun}",${s.nominal},"${s.metode}","${s.status}","${s.petugas || 'Admin'}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    safeFileDownload(blob, `Rekap_SPP_BIMBEL_BA_${getTodayDdMmYyyy().replace(/\//g, '-')}.csv`);
    showToast('Rekap SPP diekspor ke CSV!', 'success');
  };

  const handlePrintPdf = () => {
    window.print();
  };

  // Student portal object
  const loggedInStudent =
    currentUser && currentUser.role === 'siswa'
      ? students.find(s => s.username.toLowerCase() === currentUser.username.toLowerCase()) || {
          username: currentUser.username,
          nama: currentUser.nama,
          kelas: '4 SD',
          kategori_bimbingan: 'BIMBEL'
        }
      : null;

  return (
    <div className="bg-slate-50 text-slate-800 min-h-screen flex flex-col font-sans">
      {/* HEADER */}
      <Header
        currentUser={currentUser}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onLogout={handleLogout}
        syncStatus={syncStatus}
      />

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* If student is logged in, show student portal */}
        {currentUser && currentUser.role === 'siswa' && loggedInStudent ? (
          <PortalSiswa
            student={loggedInStudent}
            presensiList={presensiList}
            sppList={sppList}
            onLogout={handleLogout}
            onViewReceipt={setReceiptRecord}
          />
        ) : (
          /* Admin / Petugas View */
          <>
            {activeTab === 'scanner' && (
              <ScannerTab
                students={students}
                presensiList={presensiList}
                onProcessPresensi={handleProcessPresensi}
              />
            )}

            {activeTab === 'siswa' && (
              <SiswaTab
                students={students}
                onOpenAddModal={() => setStudentFormState({ isOpen: true, student: null })}
                onOpenEditModal={s => setStudentFormState({ isOpen: true, student: s })}
                onOpenDeleteConfirm={handleDeleteStudent}
                onOpenCardPreview={setBarcodeCardStudent}
                onOpenExportImport={() => setIsExportImportOpen(true)}
                onDownloadAllCardsZip={handleDownloadAllCardsZip}
                onOpenPrintAllCardsA4={() => setIsPrintAllA4Open(true)}
                onRefreshFromSheets={() => syncFromSheets(true)}
              />
            )}

            {activeTab === 'spp' && (
              <SppTab
                students={students}
                sppList={sppList}
                currentUser={currentUser}
                onSubmitSpp={handleSubmitSpp}
                onViewReceipt={setReceiptRecord}
                onDeleteSpp={handleDeleteSpp}
              />
            )}

            {activeTab === 'laporan' && (
              <LaporanKehadiranTab
                students={students}
                presensiList={presensiList}
                onOpenEditPresensi={setEditPresenceRecord}
                onDeletePresensi={handleDeletePresensi}
                onPrintPdf={handlePrintPdf}
                onDownloadCsv={handleDownloadPresenceCsv}
              />
            )}

            {activeTab === 'rekapSPP' && (
              <RekapSppTab
                sppList={sppList}
                onPrintPdf={handlePrintPdf}
                onDownloadCsv={handleDownloadSppCsv}
              />
            )}

            {activeTab === 'users' && (
              <UsersTab
                users={users}
                onOpenAddUser={() => setUserFormState({ isOpen: true, user: null })}
                onOpenEditUser={u => setUserFormState({ isOpen: true, user: u })}
                onDeleteUser={handleDeleteUser}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsTab
                settings={settings}
                stats={{
                  siswaCount: students.length,
                  presensiCount: presensiList.length,
                  sppCount: sppList.length,
                  usersCount: users.length
                }}
                syncLogs={syncLogs}
                onSaveSettings={newSettings => {
                  setSettings(newSettings);
                  showToast('Konfigurasi berhasil disimpan dan TERKUNCI secara aman!', 'success');
                  addSyncLog('Konfigurasi Sheet GID disimpan & dikunci.', 'success');
                  syncFromSheets(true);
                }}
                onTestConnection={() => {
                  showToast('Koneksi sinkronisasi Google Sheets aktif!', 'success');
                  syncFromSheets(true);
                }}
                onOpenScriptModal={() => setIsScriptModalOpen(true)}
              />
            )}
          </>
        )}
      </main>

      {/* MODALS */}
      <LoginModal isOpen={isLoginOpen} onLogin={handleLogin} />

      <SuccessPresenceModal
        data={successPresenceData}
        onClose={() => setSuccessPresenceData(null)}
      />

      <AlreadyPresentModal
        data={alreadyPresentData}
        onClose={() => setAlreadyPresentData(null)}
      />

      <PackageCelebrationModal
        data={packageCelebrationData}
        onClose={() => setPackageCelebrationData(null)}
      />

      <ReceiptModal
        record={receiptRecord}
        onClose={() => setReceiptRecord(null)}
      />

      <StudentFormModal
        isOpen={studentFormState.isOpen}
        student={studentFormState.student}
        onClose={() => setStudentFormState({ isOpen: false, student: null })}
        onSave={handleSaveStudent}
      />

      <BarcodeCardModal
        student={barcodeCardStudent}
        onClose={() => setBarcodeCardStudent(null)}
      />

      <ExportImportCsvModal
        isOpen={isExportImportOpen}
        students={students}
        onClose={() => setIsExportImportOpen(false)}
        onImportStudents={handleImportStudents}
      />

      <UserFormModal
        isOpen={userFormState.isOpen}
        user={userFormState.user}
        onClose={() => setUserFormState({ isOpen: false, user: null })}
        onSave={handleSaveUser}
      />

      <EditPresenceModal
        record={editPresenceRecord}
        onClose={() => setEditPresenceRecord(null)}
        onSave={handleSaveEditPresensi}
      />

      {confirmConfig && (
        <CustomConfirmModal
          isOpen={confirmConfig.isOpen}
          title={confirmConfig.title}
          message={confirmConfig.message}
          isDestructive={confirmConfig.isDestructive}
          onConfirm={confirmConfig.onConfirm}
          onClose={() => setConfirmConfig(null)}
        />
      )}

      <ScriptCodeModal
        isOpen={isScriptModalOpen}
        onClose={() => setIsScriptModalOpen(false)}
        onCopyNotice={() => showToast('Kode Apps Script berhasil disalin!', 'success')}
      />

      <PrintAllCardsA4Modal
        isOpen={isPrintAllA4Open}
        students={students}
        onClose={() => setIsPrintAllA4Open(false)}
      />

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 transition-all duration-300 pointer-events-none">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold flex items-center gap-2.5 text-white ${
              toast.type === 'error'
                ? 'bg-rose-900 border border-rose-800'
                : toast.type === 'warning'
                ? 'bg-amber-900 border border-amber-800'
                : 'bg-slate-900 border border-slate-800'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                toast.type === 'error'
                  ? 'bg-rose-400'
                  : toast.type === 'warning'
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'
              }`}
            />
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
