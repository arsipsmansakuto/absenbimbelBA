import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import {
  Camera,
  Play,
  Square,
  Keyboard,
  Calendar,
  Search,
  X,
  CheckCircle2,
  Info,
  Clock,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { Student, PresensiRecord } from '../types';
import {
  getTodayDdMmYyyy,
  formatTanggalIndo,
  parseTanggalIndoKeIso,
  parseIsoKeTanggalIndo,
  normalizeDateToStandard
} from '../utils/helpers';

interface ScannerTabProps {
  students: Student[];
  presensiList: PresensiRecord[];
  onProcessPresensi: (
    targetQuery: string,
    customTanggal?: string,
    customKeterangan?: string,
    method?: 'Kamera Scanner Barcode' | 'Presensi Manual'
  ) => void;
}

export const ScannerTab: React.FC<ScannerTabProps> = ({
  students,
  presensiList,
  onProcessPresensi
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [scanTanggal, setScanTanggal] = useState<string>(getTodayDdMmYyyy());
  const [logFilterMode, setLogFilterMode] = useState<'selected' | 'today' | 'all'>('selected');
  const [manualQuery, setManualQuery] = useState<string>('');
  const [manualKeterangan, setManualKeterangan] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScannedCodeRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });

  // Ref untuk memastikan callback startScanner selalu memakai scanTanggal terbaru
  const scanTanggalRef = useRef<string>(scanTanggal);
  useEffect(() => {
    scanTanggalRef.current = scanTanggal;
  }, [scanTanggal]);

  // Filter students based on manual input query
  const filteredStudents = manualQuery.trim()
    ? students.filter(
        s =>
          (s.nama && s.nama.toLowerCase().includes(manualQuery.toLowerCase())) ||
          (s.username && s.username.toLowerCase().includes(manualQuery.toLowerCase()))
      )
    : [];

  const todayStr = getTodayDdMmYyyy();

  // Presensi yang cocok dengan tanggal presensi yang sedang diatur (scanTanggal)
  const activeDateNorm = normalizeDateToStandard(scanTanggal || todayStr);
  const activeDateIso = parseTanggalIndoKeIso(activeDateNorm);

  const recordsOnActiveDate = presensiList.filter(p => {
    const pNorm = normalizeDateToStandard(p.tanggal);
    const pIso = parseTanggalIndoKeIso(pNorm);
    return pNorm === activeDateNorm || (pIso && activeDateIso && pIso === activeDateIso);
  });

  const recordsOnToday = presensiList.filter(p => {
    const pNorm = normalizeDateToStandard(p.tanggal);
    return pNorm === todayStr;
  });

  // Tentukan data log yang ditampilkan sesuai mode filter
  const displayedLogPresensi =
    logFilterMode === 'selected'
      ? recordsOnActiveDate
      : logFilterMode === 'today'
      ? recordsOnToday
      : presensiList.slice(0, 50);

  // Load cameras
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then(devices => {
        if (devices && devices.length > 0) {
          const mapped = devices.map((d, i) => ({
            id: d.id,
            label: d.label || `Kamera ${i + 1}`
          }));
          setCameras(mapped);
          // Prefer back/rear camera
          const rear = mapped.find(c => /back|rear|belakang/i.test(c.label));
          setSelectedCameraId(rear ? rear.id : mapped[0].id);
        }
      })
      .catch(err => {
        console.warn('Camera device listing note:', err);
      });

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const getStudentAttendanceOnDate = (student: Student | null, tglInput: string) => {
    if (!student) return null;
    const tglStandard = normalizeDateToStandard(tglInput || getTodayDdMmYyyy());
    const tglIso = parseTanggalIndoKeIso(tglStandard);
    const sNamaNorm = (student.nama || '').trim().toLowerCase().replace(/\s+/g, ' ');
    const sUsername = (student.username || '').trim().toLowerCase();

    return presensiList.find(p => {
      const pTglStandard = normalizeDateToStandard(p.tanggal);
      const pTglIso = parseTanggalIndoKeIso(pTglStandard);
      const matchTgl = pTglStandard === tglStandard || (pTglIso && tglIso && pTglIso === tglIso);
      const pNamaNorm = (p.nama || '').trim().toLowerCase().replace(/\s+/g, ' ');
      const pNisNorm = (p.nis || '').trim().toLowerCase();
      return matchTgl && (pNamaNorm === sNamaNorm || pNisNorm === sUsername);
    });
  };

  const startScanner = async (camId?: string) => {
    const idToUse = camId || selectedCameraId || (cameras[0] && cameras[0].id);
    if (!idToUse) return;

    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode('cameraReaderBox', {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.EAN_13
          ],
          verbose: false
        });
      }

      await scannerRef.current.start(
        idToUse,
        {
          fps: 28,
          qrbox: { width: 280, height: 260 }
        },
        decodedText => {
          const now = Date.now();
          if (
            decodedText === lastScannedCodeRef.current.code &&
            now - lastScannedCodeRef.current.time < 3000
          ) {
            return;
          }
          lastScannedCodeRef.current = { code: decodedText, time: now };
          // Menggunakan scanTanggalRef.current agar tanggal presensi sesuai dengan Tanggal Presensi (dd/mm/yyyy) yang diatur!
          onProcessPresensi(decodedText, scanTanggalRef.current, undefined, 'Kamera Scanner Barcode');
        },
        () => {}
      );
      setIsScanning(true);
    } catch (err) {
      console.error('Start scanner error:', err);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (e) {
        console.warn('Stop scanner warn:', e);
      }
    }
    setIsScanning(false);
  };

  const toggleScanner = () => {
    if (isScanning) {
      stopScanner();
    } else {
      startScanner();
    }
  };

  const handleSelectStudent = (s: Student) => {
    setSelectedStudent(s);
    setManualQuery(`${s.nama} (${s.username})`);
    setIsDropdownOpen(false);
  };

  const handleClearSelectedStudent = () => {
    setSelectedStudent(null);
    setManualQuery('');
    setIsDropdownOpen(false);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = selectedStudent ? selectedStudent.username : manualQuery.trim();
    if (!query) return;

    onProcessPresensi(query, scanTanggal, manualKeterangan, 'Presensi Manual');
    handleClearSelectedStudent();
    setManualKeterangan('');
  };

  return (
    <div className="space-y-6">
      {/* PENGATURAN TANGGAL PRESENSI BERSAMA (UNTUK SCANNER BARCODE & PRESENSI MANUAL) */}
      <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-indigo-950 text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-indigo-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-8 h-8 rounded-xl bg-amber-400 text-indigo-950 flex items-center justify-center font-bold shadow-sm">
                <Calendar className="w-4 h-4" />
              </div>
              <h2 className="text-sm sm:text-base font-bold font-brand tracking-wide text-white">
                Pengaturan Tanggal Presensi (Barcode & Manual)
              </h2>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-400/30">
                Aktif: {scanTanggal}
              </span>
            </div>
            <p className="text-xs text-indigo-200 leading-relaxed max-w-2xl">
              Tanggal Presensi <b>(dd/mm/yyyy)</b> di bawah mengatur tanggal untuk <b>Kamera Scanner Barcode</b> dan <b>Presensi Manual</b>. Data presensi akan langsung tercatat di log terbaru hari ini, masuk di tab <b>Rekap Kehadiran (12x)</b>, dan dikirim ke <b>Google Spreadsheet</b>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
            <div className="relative flex items-center">
              <input
                type="text"
                value={scanTanggal}
                onChange={e => setScanTanggal(e.target.value)}
                className="bg-white/10 hover:bg-white/15 focus:bg-white text-white focus:text-slate-900 border border-indigo-400/40 focus:border-white rounded-xl pl-3.5 pr-10 py-2.5 text-xs font-bold font-mono tracking-wide focus:outline-none focus:ring-2 focus:ring-amber-400 transition w-full sm:w-44"
                placeholder="dd/mm/yyyy"
              />
              <input
                type="date"
                value={parseTanggalIndoKeIso(scanTanggal)}
                onChange={e => {
                  if (e.target.value) {
                    setScanTanggal(parseIsoKeTanggalIndo(e.target.value));
                  }
                }}
                className="absolute right-2 opacity-0 w-8 h-8 cursor-pointer z-10"
                title="Pilih tanggal di kalender"
              />
              <Calendar className="w-4 h-4 absolute right-3 text-indigo-200 pointer-events-none" />
            </div>

            <button
              type="button"
              onClick={() => setScanTanggal(todayStr)}
              className="px-3 py-2.5 bg-amber-400 hover:bg-amber-300 text-indigo-950 text-xs font-extrabold rounded-xl transition cursor-pointer shadow-sm flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <span>Setel Hari Ini</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* SCANNER KAMERA BARCODE */}
        <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 font-brand">
                <Camera className="w-5 h-5 text-indigo-600" />
                <span>Kamera Scanner Barcode</span>
              </h2>
              <p className="text-xs text-slate-500">Scan kartu barcode / QR code siswa secara cepat (28 FPS)</p>
            </div>
            <div className="flex items-center gap-2">
              {cameras.length > 1 && (
                <select
                  value={selectedCameraId}
                  onChange={e => {
                    setSelectedCameraId(e.target.value);
                    if (isScanning) {
                      stopScanner().then(() => startScanner(e.target.value));
                    }
                  }}
                  className="text-xs bg-slate-100 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {cameras.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              )}
              <button
                type="button"
                onClick={toggleScanner}
                className={`px-3.5 py-2 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer ${
                  isScanning ? 'bg-rose-600 hover:bg-rose-700' : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {isScanning ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Matikan Kamera</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Aktifkan Kamera</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* BINGKAI SCANNER */}
          <div className="relative w-full h-[360px] sm:h-[400px] bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-800 shadow-inner flex items-center justify-center">
            <div id="cameraReaderBox" className="w-full h-full" />

            {/* Laser Line Overlay & Corner Brackets */}
            {isScanning && (
              <div className="absolute inset-0 pointer-events-none z-20">
                <div className="laser-line-animated" />
                <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-rose-500 rounded-tl-lg" />
                <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-rose-500 rounded-tr-lg" />
                <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-rose-500 rounded-bl-lg" />
                <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-rose-500 rounded-br-lg" />
              </div>
            )}

            {!isScanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-2 pointer-events-none">
                <div className="w-14 h-14 rounded-2xl bg-indigo-900/60 border border-indigo-700/50 flex items-center justify-center text-indigo-400 shadow-inner mb-1">
                  <Camera className="w-7 h-7" />
                </div>
                <p className="text-xs font-semibold text-slate-200">Kamera Scanner Tidak Aktif</p>
                <p className="text-[11px] text-slate-400 max-w-xs">
                  Klik tombol <b>"Aktifkan Kamera"</b> di atas atau gunakan formulir <b>Presensi Manual</b> di sebelah kanan.
                </p>
              </div>
            )}
          </div>

          {/* Info Banner */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex items-start gap-3 text-xs text-indigo-900">
            <Info className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed space-y-1">
              <p>
                <b>Aturan 1 Hari 1x Presensi:</b> Siswa yang sudah presensi menggunakan <b>Kamera Scanner Barcode</b> otomatis terkunci dan tidak bisa presensi manual, begitu pula sebaliknya.
              </p>
              <p className="text-[11px] text-indigo-700">
                Data presensi tersinkron realtime dengan Google Sheets. Dilengkapi nada lonceng, audio sambutan, pelindung anti-presensi ganda hari ini, dan perayaan paket 12 pertemuan.
              </p>
            </div>
          </div>
        </div>

        {/* FORM INPUT PRESENSI MANUAL */}
        <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 font-brand">
              <Keyboard className="w-5 h-5 text-emerald-600" />
              <span>Presensi Manual</span>
            </h2>
            <p className="text-xs text-slate-500">Pilih nama siswa lalu klik tombol "Submit Presensi"</p>
          </div>

          <form onSubmit={handleManualSubmit} className="space-y-4">
            {/* Tanggal */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Presensi (dd/mm/yyyy)
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={scanTanggal}
                  onChange={e => setScanTanggal(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="dd/mm/yyyy"
                />
                <input
                  type="date"
                  value={parseTanggalIndoKeIso(scanTanggal)}
                  onChange={e => {
                    if (e.target.value) {
                      setScanTanggal(parseIsoKeTanggalIndo(e.target.value));
                    }
                  }}
                  className="absolute right-2 opacity-0 w-8 h-8 cursor-pointer z-10"
                  title="Pilih tanggal di kalender"
                />
                <Calendar className="w-4 h-4 absolute right-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Autocomplete Siswa */}
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cari / Ketik Nama Siswa atau Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={manualQuery}
                  onChange={e => {
                    setManualQuery(e.target.value);
                    setSelectedStudent(null);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  autoComplete="off"
                  placeholder="Ketik nama siswa atau username..."
                  className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-9 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                {manualQuery && (
                  <button
                    type="button"
                    onClick={handleClearSelectedStudent}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Autocomplete Dropdown */}
              {isDropdownOpen && manualQuery.trim() && (
                <div className="absolute left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl z-30 divide-y divide-slate-100">
                  {filteredStudents.length === 0 ? (
                    <div className="p-3 text-xs text-slate-400 text-center">Siswa tidak ditemukan</div>
                  ) : (
                    filteredStudents.slice(0, 7).map(s => {
                      const attended = getStudentAttendanceOnDate(s, scanTanggal);
                      return (
                        <div
                          key={s.username}
                          onClick={() => handleSelectStudent(s)}
                          className={`p-2.5 cursor-pointer flex items-center justify-between transition ${
                            attended ? 'bg-rose-50/80 hover:bg-rose-100/80' : 'hover:bg-indigo-50'
                          }`}
                        >
                          <div>
                            <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5 flex-wrap">
                              <span>{s.nama}</span>
                              {attended && (
                                <span className="text-[9px] bg-rose-100 text-rose-700 font-extrabold px-1.5 py-0.5 rounded border border-rose-200">
                                  Sudah Hadir ({attended.waktu} WIB)
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Username: {s.username} • Kelas: {s.kelas || '-'}
                            </div>
                          </div>
                          <span className="text-[9px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full uppercase">
                            {s.kategori_bimbingan || 'BIMBEL'}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Status Peringatan Jika Siswa Terpilih Sudah Presensi Pada Tanggal Ini */}
              {selectedStudent && (
                <div className="mt-2 space-y-2">
                  <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-indigo-950">{selectedStudent.nama}</div>
                      <div className="text-[10px] text-indigo-800">
                        Username: {selectedStudent.username} • Kelas: {selectedStudent.kelas || '-'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearSelectedStudent}
                      className="text-indigo-400 hover:text-indigo-700 p-1 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {(() => {
                    const attendedRecord = getStudentAttendanceOnDate(selectedStudent, scanTanggal);
                    if (attendedRecord) {
                      return (
                        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                          <div className="leading-tight">
                            <div className="font-bold text-rose-950">
                              Siswa Sudah Presensi Pada Tanggal Ini ({scanTanggal})!
                            </div>
                            <div className="text-[11px] text-rose-700 mt-0.5">
                              Tercatat pada {attendedRecord.waktu} WIB via <b>{attendedRecord.metode || 'Kamera Scanner Barcode'}</b>. Siswa hanya dapat absen 1x per hari.
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}
            </div>

            {/* Jenis Presensi */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Presensi</label>
              <select
                disabled
                className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-emerald-700 cursor-not-allowed"
              >
                <option value="Hadir">Hadir Masuk</option>
              </select>
            </div>

            {/* Catatan / Keterangan */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan / Keterangan (Opsional)
              </label>
              <input
                type="text"
                value={manualKeterangan}
                onChange={e => setManualKeterangan(e.target.value)}
                placeholder="Catatan singkat (opsional)"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Tombol Submit Presensi */}
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Submit Presensi ({scanTanggal})</span>
            </button>
          </form>
        </div>
      </div>

      {/* TABEL LOG PRESENSI TERBARU HARI INI SESUAI TANGGAL PRESENSI */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-sm font-bold text-slate-800 font-brand">
              {scanTanggal === todayStr
                ? `Log Presensi Terbaru Hari Ini (${scanTanggal})`
                : `Log Presensi Terbaru - Tanggal Presensi: ${scanTanggal}`}
            </h3>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center p-1 bg-slate-100 rounded-xl text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setLogFilterMode('selected')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  logFilterMode === 'selected'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tgl Terpilih ({recordsOnActiveDate.length})
              </button>
              {scanTanggal !== todayStr && (
                <button
                  type="button"
                  onClick={() => setLogFilterMode('today')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    logFilterMode === 'today'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Hari Ini ({recordsOnToday.length})
                </button>
              )}
              <button
                type="button"
                onClick={() => setLogFilterMode('all')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  logFilterMode === 'all'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua Log ({presensiList.length})
              </button>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Total Tercatat:{' '}
              <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                {displayedLogPresensi.length}
              </span>{' '}
              Siswa
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Waktu</th>
                <th className="py-2.5 px-3">Tanggal Presensi</th>
                <th className="py-2.5 px-3">Username / ID</th>
                <th className="py-2.5 px-3">Nama Siswa</th>
                <th className="py-2.5 px-3">Kelas</th>
                <th className="py-2.5 px-3">Metode</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Keterangan / Paket</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedLogPresensi.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Belum ada presensi yang tercatat untuk tanggal {scanTanggal}. Silakan scan barcode atau submit presensi manual di atas.
                  </td>
                </tr>
              ) : (
                displayedLogPresensi.map(p => {
                  const isManual = p.metode === 'Presensi Manual' || p.metode === 'Manual';
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3 font-mono text-slate-600 flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{p.waktu}</span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {formatTanggalIndo(p.tanggal)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">{p.nis}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-800">{p.nama}</td>
                      <td className="py-2.5 px-3 text-slate-600">{p.kelas || '-'}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${
                            isManual
                              ? 'bg-slate-100 text-slate-700 border border-slate-200'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          }`}
                        >
                          {p.metode || 'Kamera Barcode'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                          {p.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {p.keterangan && p.keterangan.includes('Paket') ? (
                          <span className="inline-flex items-center gap-1 text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            <Sparkles className="w-3 h-3 text-amber-500" />
                            <span>{p.keterangan}</span>
                          </span>
                        ) : (
                          p.keterangan || '-'
                        )}
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
