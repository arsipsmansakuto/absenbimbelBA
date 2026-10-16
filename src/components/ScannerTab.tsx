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
  Sparkles
} from 'lucide-react';
import { Student, PresensiRecord } from '../types';
import { getTodayDdMmYyyy, formatTanggalIndo, parseTanggalIndoKeIso } from '../utils/helpers';

interface ScannerTabProps {
  students: Student[];
  presensiList: PresensiRecord[];
  onProcessPresensi: (targetQuery: string, customTanggal?: string, customKeterangan?: string) => void;
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
  const [manualQuery, setManualQuery] = useState<string>('');
  const [manualKeterangan, setManualKeterangan] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScannedCodeRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });

  // Filter students based on manual input query
  const filteredStudents = manualQuery.trim()
    ? students.filter(
        s =>
          (s.nama && s.nama.toLowerCase().includes(manualQuery.toLowerCase())) ||
          (s.username && s.username.toLowerCase().includes(manualQuery.toLowerCase()))
      )
    : [];

  // Filter today's presence records
  const todayStr = getTodayDdMmYyyy();
  const todayIso = parseTanggalIndoKeIso(todayStr);

  const todayPresensi = presensiList.filter(p => {
    const pIso = parseTanggalIndoKeIso(p.tanggal);
    return (pIso && todayIso && pIso === todayIso) || formatTanggalIndo(p.tanggal) === todayStr;
  });

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
          onProcessPresensi(decodedText, scanTanggal, manualKeterangan);
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

    onProcessPresensi(query, scanTanggal, manualKeterangan);
    handleClearSelectedStudent();
    setManualKeterangan('');
  };

  return (
    <div className="space-y-6">
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
            <div className="leading-relaxed">
              <span>Data presensi otomatis tersinkron realtime dengan Google Sheets di latar belakang. Dilengkapi nada lonceng, audio sambutan, pelindung anti-presensi ganda hari ini, dan perayaan paket 12 pertemuan.</span>
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
              <div className="relative">
                <input
                  type="text"
                  value={scanTanggal}
                  onChange={e => setScanTanggal(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="dd/mm/yyyy"
                />
                <Calendar className="w-4 h-4 absolute right-3.5 top-3 text-slate-400 pointer-events-none" />
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
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
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
                    filteredStudents.slice(0, 7).map(s => (
                      <div
                        key={s.username}
                        onClick={() => handleSelectStudent(s)}
                        className="p-2.5 hover:bg-indigo-50 cursor-pointer flex items-center justify-between transition"
                      >
                        <div>
                          <div className="font-bold text-slate-800 text-xs">{s.nama}</div>
                          <div className="text-[10px] text-slate-500">
                            Username: {s.username} • Kelas: {s.kelas || '-'}
                          </div>
                        </div>
                        <span className="text-[9px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full uppercase">
                          {s.kategori_bimbingan || 'BIMBEL'}
                        </span>
                      </div>
                    ))
                  )}
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
              <span>Submit Presensi</span>
            </button>
          </form>
        </div>
      </div>

      {/* TABEL LOG PRESENSI TERBARU HARI INI */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-sm font-bold text-slate-800 font-brand">Log Presensi Terbaru Hari Ini</h3>
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Total Tercatat Hari Ini:{' '}
            <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
              {todayPresensi.length}
            </span>{' '}
            Siswa
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Waktu</th>
                <th className="py-2.5 px-3">Tanggal</th>
                <th className="py-2.5 px-3">Username / ID</th>
                <th className="py-2.5 px-3">Nama Siswa</th>
                <th className="py-2.5 px-3">Kelas</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Keterangan / Paket</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {todayPresensi.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Belum ada presensi yang tercatat hari ini ({todayStr}).
                  </td>
                </tr>
              ) : (
                todayPresensi.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 font-mono text-slate-600 flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{p.waktu}</span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{formatTanggalIndo(p.tanggal)}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">{p.nis}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-800">{p.nama}</td>
                    <td className="py-2.5 px-3 text-slate-600">{p.kelas || '-'}</td>
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
