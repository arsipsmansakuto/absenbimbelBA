import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import JsBarcode from 'jsbarcode';
import {
  GraduationCap,
  X,
  CheckCircle2,
  AlertTriangle,
  Trophy,
  Receipt,
  Printer,
  Download,
  Copy,
  PenSquare,
  FileSpreadsheet,
  Upload,
  UserCheck,
  Code2,
  Layers,
  LayoutGrid
} from 'lucide-react';
import { Student, PresensiRecord, SppRecord, UserAccount } from '../types';
import {
  formatTanggalIndo,
  formatRupiah,
  formatNoTelp,
  safeFileDownload,
  getTodayDdMmYyyy
} from '../utils/helpers';
import { APPS_SCRIPT_CODE_TEMPLATE, parseSiswaCSV } from '../utils/sheetsSync';

/* 1. LOGIN MODAL */
interface LoginModalProps {
  isOpen: boolean;
  onLogin: (u: string, p: string) => boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const success = onLogin(username.trim(), password.trim());
    if (!success) {
      setErrorMsg('Username atau password salah!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-5 border border-slate-100">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-2xl mx-auto shadow-md">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 font-brand">
            Masuk SIM BIMBEL BA <span className="text-xs bg-amber-400 text-slate-900 font-bold px-2 py-0.5 rounded-full">v3.2</span>
          </h2>
          <p className="text-xs text-slate-500">Gunakan akun admin, petugas, atau username siswa</p>
        </div>

        {errorMsg && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Username</label>
            <input
              type="text"
              required
              autoComplete="off"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="admin / username siswa"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              autoComplete="off"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••"
            />
          </div>

          <div className="text-[11px] text-slate-400 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span className="font-semibold block text-slate-600 mb-0.5">Akun Bawaan Sistem:</span>
            <span>• Admin: <b>admin</b> / sandi: <b>123</b></span>
            <br />
            <span>• Petugas: <b>petugas</b> / sandi: <b>123</b></span>
            <br />
            <span>• Siswa: <b>202601</b> / sandi: <b>123</b></span>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
          >
            Masuk Sekarang
          </button>
        </form>
      </div>
    </div>
  );
};

/* 2. SUCCESS PRESENCE MODAL */
interface SuccessPresenceModalProps {
  data: {
    nama: string;
    nis: string;
    kelas: string;
    tanggal: string;
    waktu: string;
  } | null;
  onClose: () => void;
}

export const SuccessPresenceModal: React.FC<SuccessPresenceModalProps> = ({ data, onClose }) => {
  if (!data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4 border-2 border-emerald-500">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl mx-auto shadow-md ring-8 ring-emerald-50">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <div>
          <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-extrabold rounded-full uppercase tracking-wider mb-1">
            SUKSES TERCATAT
          </span>
          <h3 className="text-xl font-black text-slate-800 font-brand">Presensi Anda Tercatat</h3>
          <p className="text-xs text-slate-500">Terima kasih telah melakukan presensi tepat waktu!</p>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4 text-left text-xs space-y-1.5">
          <div className="flex justify-between">
            <span className="text-slate-500">Nama Siswa:</span>
            <span className="font-bold text-emerald-950">{data.nama}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Username:</span>
            <span className="font-semibold text-emerald-800 font-mono">{data.nis}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Kelas:</span>
            <span className="font-semibold text-slate-700">{data.kelas || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Tanggal:</span>
            <span className="font-bold text-slate-800">{formatTanggalIndo(data.tanggal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Jam:</span>
            <span className="font-bold text-emerald-700">{data.waktu} WIB</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
        >
          Tutup (Selesai)
        </button>
      </div>
    </div>
  );
};

/* 3. ALREADY PRESENT WARNING MODAL */
interface AlreadyPresentModalProps {
  data: {
    nama: string;
    tanggal: string;
    waktu: string;
    status: string;
  } | null;
  onClose: () => void;
}

export const AlreadyPresentModal: React.FC<AlreadyPresentModalProps> = ({ data, onClose }) => {
  if (!data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4 border-2 border-rose-500">
        <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-3xl mx-auto ring-8 ring-rose-50">
          <AlertTriangle className="w-9 h-9" />
        </div>
        <div>
          <span className="inline-block px-3 py-1 bg-rose-100 text-rose-800 text-xs font-extrabold rounded-full uppercase tracking-wider mb-1">
            SUDAH PRESENSI
          </span>
          <h3 className="text-lg font-black text-slate-800 font-brand">Anda Sudah Presensi Hari Ini</h3>
          <p className="text-xs text-slate-500">Siswa tersebut telah terdaftar di database hari ini.</p>
        </div>

        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-left text-xs space-y-1.5">
          <div className="flex justify-between">
            <span className="text-slate-500">Nama Siswa:</span>
            <span className="font-bold text-rose-950">{data.nama}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Tanggal:</span>
            <span className="font-bold text-slate-800">{formatTanggalIndo(data.tanggal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Tercatat Pada:</span>
            <span className="font-bold text-rose-700">{data.waktu} WIB ({data.status})</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
        >
          Mengerti
        </button>
      </div>
    </div>
  );
};

/* 4. PACKAGE CELEBRATION MODAL */
interface PackageCelebrationModalProps {
  data: {
    nama: string;
    paketKe: number;
    totalHadir: number;
  } | null;
  onClose: () => void;
}

export const PackageCelebrationModal: React.FC<PackageCelebrationModalProps> = ({ data, onClose }) => {
  useEffect(() => {
    if (data) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {}
    }
  }, [data]);

  if (!data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4 border-2 border-amber-400">
        <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-3xl mx-auto shadow-md">
          <Trophy className="w-9 h-9" />
        </div>
        <div>
          <h3 className="text-lg font-black text-slate-800 font-brand">
            🎉 Paket ke-{data.paketKe} Selesai!
          </h3>
          <p className="text-xs text-slate-500">
            Siswa telah genap menyelesaikan 12 kali bimbingan belajar.
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left text-xs space-y-1.5">
          <div className="flex justify-between">
            <span className="text-slate-500">Nama Siswa:</span>
            <span className="font-bold text-slate-800">{data.nama}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Total Hadir:</span>
            <span className="font-extrabold text-amber-700">
              {data.totalHadir}x Hadir ({data.paketKe} Paket Selesai)
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
        >
          Alhamdulillah, Lanjutkan
        </button>
      </div>
    </div>
  );
};

/* 5. RECEIPT MODAL */
interface ReceiptModalProps {
  record: SppRecord | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ record, onClose }) => {
  if (!record) return null;

  const isLunas = String(record.status || '').toLowerCase() === 'lunas';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-100">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-sm">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 font-brand">Kuitansi Pembayaran SPP</h3>
              <p className="text-[10px] text-slate-500">BIMBEL BA - Bukti Transaksi Resmi</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div id="printArea" className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-3 font-mono">
          <div className="text-center border-b border-dashed border-slate-300 pb-2">
            <div className="font-bold text-sm text-slate-900">BIMBEL BA</div>
            <div className="text-[10px] text-slate-500">Sistem Informasi Presensi & SPP Terpadu</div>
            <div className="text-[10px] text-slate-600 font-bold mt-1">NO: {record.id}</div>
            <div className="text-[9px] text-slate-400">Tgl: {formatTanggalIndo(record.tanggal)}</div>
          </div>

          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">Nama Siswa:</span>
              <span className="font-bold text-slate-800">{record.nama}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Username:</span>
              <span className="text-slate-700">{record.nis}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Kelas:</span>
              <span className="text-slate-700">{record.kelas || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Untuk Pembayaran:</span>
              <span className="font-bold text-amber-700">
                SPP Bulan {record.bulan} {record.tahun}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Metode Bayar:</span>
              <span className="text-slate-700">{record.metode || 'Tunai'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status Transaksi:</span>
              <span className={`font-bold uppercase ${isLunas ? 'text-emerald-600' : 'text-rose-600'}`}>
                {record.status}
              </span>
            </div>
          </div>

          <div className="border-t border-dashed border-slate-300 pt-2 flex justify-between items-center text-sm">
            <span className="font-bold text-slate-800">TOTAL BAYAR:</span>
            <span className="font-black text-amber-600 text-base">{formatRupiah(record.nominal)}</span>
          </div>

          <div className="text-[9px] text-center text-slate-400 pt-1 border-t border-slate-200">
            Petugas: {record.petugas || 'Admin'} | Terima kasih atas pembayarannya.
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Kuitansi / Struk</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

/* 6. STUDENT FORM MODAL */
interface StudentFormModalProps {
  isOpen: boolean;
  student: Student | null; // null = add, else edit
  onClose: () => void;
  onSave: (student: Student) => void;
}

export const StudentFormModal: React.FC<StudentFormModalProps> = ({
  isOpen,
  student,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<Student>({
    username: '',
    password: '123',
    nama: '',
    kelas: '',
    kategori_bimbingan: 'BIMBEL',
    alamat: '',
    sekolah_asal: '',
    hobi: '',
    nama_ortu: '',
    no_telp: '',
    status_akun: 'Aktif'
  });

  useEffect(() => {
    if (student) {
      setFormData({ ...student });
    } else {
      setFormData({
        username: '',
        password: '123',
        nama: '',
        kelas: '',
        kategori_bimbingan: 'BIMBEL',
        alamat: '',
        sekolah_asal: '',
        hobi: '',
        nama_ortu: '',
        no_telp: '',
        status_akun: 'Aktif'
      });
    }
  }, [student, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.nama.trim()) return;
    onSave({
      ...formData,
      username: formData.username.trim(),
      nama: formData.nama.trim(),
      no_telp: formatNoTelp(formData.no_telp)
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-800 font-brand">
            {student ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Username / NIS</label>
            <input
              type="text"
              required
              readOnly={!!student}
              value={formData.username}
              onChange={e => setFormData({ ...formData, username: e.target.value })}
              className={`w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none ${
                student ? 'bg-slate-100 cursor-not-allowed' : 'bg-slate-50 focus:ring-1 focus:ring-indigo-500'
              }`}
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Password</label>
            <input
              type="text"
              required
              value={formData.password || '123'}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Nama Lengkap</label>
            <input
              type="text"
              required
              value={formData.nama}
              onChange={e => setFormData({ ...formData, nama: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Kelas</label>
              <input
                type="text"
                placeholder="Contoh: 4 SD"
                value={formData.kelas}
                onChange={e => setFormData({ ...formData, kelas: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Kategori Bimbingan</label>
              <select
                value={formData.kategori_bimbingan}
                onChange={e => setFormData({ ...formData, kategori_bimbingan: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs text-slate-800 focus:outline-none"
              >
                <option value="BIMBEL">BIMBEL</option>
                <option value="BIMBA">BIMBA</option>
                <option value="PRIVAT">PRIVAT</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Alamat</label>
            <textarea
              rows={2}
              placeholder="Alamat tempat tinggal siswa..."
              value={formData.alamat || ''}
              onChange={e => setFormData({ ...formData, alamat: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Sekolah Asal</label>
              <input
                type="text"
                placeholder="Contoh: SDN 1"
                value={formData.sekolah_asal || ''}
                onChange={e => setFormData({ ...formData, sekolah_asal: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Hobi</label>
              <input
                type="text"
                placeholder="Contoh: Menggambar"
                value={formData.hobi || ''}
                onChange={e => setFormData({ ...formData, hobi: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Nama Ortu</label>
              <input
                type="text"
                placeholder="Nama wali/ortu"
                value={formData.nama_ortu || ''}
                onChange={e => setFormData({ ...formData, nama_ortu: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">No Telp / WhatsApp</label>
              <input
                type="text"
                placeholder="Contoh: 08123456789"
                value={formData.no_telp || ''}
                onChange={e => setFormData({ ...formData, no_telp: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Simpan Data
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* 7. BARCODE CARD MODAL */
interface BarcodeCardModalProps {
  student: Student | null;
  onClose: () => void;
}

export const BarcodeCardModal: React.FC<BarcodeCardModalProps> = ({ student, onClose }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (student && svgRef.current) {
      try {
        JsBarcode(svgRef.current, student.username, {
          format: 'CODE128',
          lineColor: '#0f172a',
          width: 2,
          height: 48,
          displayValue: false
        });
      } catch (e) {
        console.warn('JsBarcode render error:', e);
      }
    }
  }, [student]);

  if (!student) return null;

  const handleDownloadSvg = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    safeFileDownload(blob, `Kartu_Barcode_${student.username}_${student.nama.replace(/\s+/g, '_')}.svg`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="text-sm font-bold text-slate-800 font-brand">Kartu Pelajar Barcode</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Kartu Container */}
        <div id="printArea" className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-950 text-white p-5 rounded-2xl shadow-lg border border-indigo-700 space-y-3">
          <div className="flex items-center justify-between border-b border-indigo-700/60 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-400 text-indigo-950 flex items-center justify-center font-bold text-sm">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-black tracking-wider uppercase font-brand">BIMBEL BA</div>
                <div className="text-[8px] text-indigo-200">Kartu Presensi Siswa</div>
              </div>
            </div>
            <span className="text-[9px] bg-amber-400 text-indigo-950 font-bold px-2 py-0.5 rounded-full uppercase">
              {student.kategori_bimbingan || 'BIMBEL'}
            </span>
          </div>

          <div>
            <div className="text-sm font-extrabold font-brand tracking-wide">{student.nama}</div>
            <div className="text-[10px] text-indigo-200 flex gap-2">
              <span>Username: <b className="text-white font-mono">{student.username}</b></span>
              <span>•</span>
              <span>Kelas: <b className="text-white">{student.kelas || '-'}</b></span>
            </div>
          </div>

          <div className="bg-white p-2 rounded-xl flex flex-col items-center justify-center">
            <svg ref={svgRef} className="w-full max-h-16" />
            <span className="text-[9px] font-mono text-slate-700 font-bold mt-0.5">
              {student.username}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleDownloadSvg}
            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download SVG</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak</span>
          </button>
        </div>
      </div>
    </div>
  );
};

/* 8. EXPORT / IMPORT CSV MODAL */
interface ExportImportCsvModalProps {
  isOpen: boolean;
  students: Student[];
  onClose: () => void;
  onImportStudents: (students: Student[]) => void;
}

export const ExportImportCsvModal: React.FC<ExportImportCsvModalProps> = ({
  isOpen,
  students,
  onClose,
  onImportStudents
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');

  if (!isOpen) return null;

  const handleExportCsv = () => {
    let csv = 'Username,Password,Nama Lengkap,Kelas,Alamat,Sekolah Asal,Hobi,Kategori Bimbingan,Nama Ortu,No Telp,Status Akun\n';
    students.forEach(s => {
      csv += `"${s.username || ''}","${s.password || '123'}","${s.nama || ''}","${s.kelas || '-'}","${s.alamat || '-'}","${s.sekolah_asal || '-'}","${s.hobi || '-'}","${s.kategori_bimbingan || 'BIMBEL'}","${s.nama_ortu || '-'}","${formatNoTelp(s.no_telp || '-')}","${s.status_akun || 'Aktif'}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    safeFileDownload(blob, `Master_Data_Siswa_BIMBEL_BA_${getTodayDdMmYyyy().replace(/\//g, '-')}.csv`);
  };

  const handleDownloadTemplate = () => {
    const header = 'Username,Password,Nama Lengkap,Kelas,Alamat,Sekolah Asal,Hobi,Kategori Bimbingan,Nama Ortu,No Telp,Status Akun\n';
    const sample = '202601,123,Ahmad Faiz,4 SD,Jl. Melati No. 5,SDN 1,Membaca,BIMBEL,Bpk. Hendra,08123456789,Aktif\n';
    const blob = new Blob([header + sample], { type: 'text/csv;charset=utf-8;' });
    safeFileDownload(blob, 'Template_Master_Data_Siswa_BIMBEL_BA.csv');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = ev => {
        setFileContent(ev.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const handleExecuteImport = () => {
    if (!fileContent) return;
    const parsed = parseSiswaCSV(fileContent);
    if (parsed.length > 0) {
      onImportStudents(parsed);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-800 font-brand">Impor & Ekspor Data Siswa</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl space-y-2">
            <div className="font-bold text-xs text-indigo-950 flex items-center gap-1.5">
              <Download className="w-4 h-4 text-indigo-600" />
              <span>Ekspor Data / Unduh Format</span>
            </div>
            <p className="text-[11px] text-slate-600">
              Unduh data siswa saat ini ke dalam CSV atau unduh template kosong.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleExportCsv}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Ekspor Data CSV
              </button>
              <button
                onClick={handleDownloadTemplate}
                className="flex-1 py-2 bg-white hover:bg-slate-100 text-indigo-700 border border-indigo-300 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Unduh Template
              </button>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-emerald-600" />
              <span>Impor Berkas CSV Lokal</span>
            </div>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="w-full text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
            />
            {selectedFile && (
              <div className="text-[11px] font-mono text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB) siap diimpor
              </div>
            )}
            <button
              onClick={handleExecuteImport}
              disabled={!selectedFile}
              className={`w-full py-2 text-white text-xs font-bold rounded-xl transition ${
                selectedFile
                  ? 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer'
                  : 'bg-slate-300 cursor-not-allowed'
              }`}
            >
              Mulai Impor Siswa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* 9. USER FORM MODAL */
interface UserFormModalProps {
  isOpen: boolean;
  user: UserAccount | null;
  onClose: () => void;
  onSave: (user: UserAccount) => void;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, user, onClose, onSave }) => {
  const [nama, setNama] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('123');
  const [role, setRole] = useState<'admin' | 'petugas'>('petugas');
  const [status, setStatus] = useState<'Aktif' | 'Nonaktif'>('Aktif');

  useEffect(() => {
    if (user) {
      setNama(user.nama);
      setUsername(user.username);
      setPassword(user.password || '123');
      setRole(user.role);
      setStatus(user.status);
    } else {
      setNama('');
      setUsername('');
      setPassword('123');
      setRole('petugas');
      setStatus('Aktif');
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim() || !username.trim()) return;
    onSave({
      nama: nama.trim(),
      username: username.trim(),
      password: password.trim(),
      role,
      status
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-800 font-brand">
            {user ? 'Edit Akun Pengguna' : 'Tambah Pengguna Baru'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Nama Lengkap</label>
            <input
              type="text"
              required
              value={nama}
              onChange={e => setNama(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Username</label>
            <input
              type="text"
              required
              readOnly={user?.username === 'admin'}
              value={username}
              onChange={e => setUsername(e.target.value)}
              className={`w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none ${
                user?.username === 'admin' ? 'bg-slate-100 cursor-not-allowed' : 'bg-slate-50'
              }`}
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Password</label>
            <input
              type="text"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Peran (Role)</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as 'admin' | 'petugas')}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs text-slate-800 focus:outline-none"
              >
                <option value="petugas">Petugas</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as 'Aktif' | 'Nonaktif')}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs text-slate-800 focus:outline-none"
              >
                <option value="Aktif">Aktif</option>
                <option value="Nonaktif">Nonaktif</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Simpan
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* 10. EDIT PRESENCE MODAL */
interface EditPresenceModalProps {
  record: PresensiRecord | null;
  onClose: () => void;
  onSave: (updated: PresensiRecord) => void;
}

export const EditPresenceModal: React.FC<EditPresenceModalProps> = ({ record, onClose, onSave }) => {
  const [formData, setFormData] = useState<PresensiRecord | null>(null);

  useEffect(() => {
    setFormData(record ? { ...record } : null);
  }, [record]);

  if (!formData) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-800 font-brand flex items-center gap-2">
            <PenSquare className="w-4 h-4 text-amber-500" />
            <span>Edit Data Presensi Kehadiran</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-500">Nama Siswa / Username</div>
            <div className="font-bold text-slate-800 text-xs">{formData.nama}</div>
            <div className="text-[10px] font-mono text-indigo-700 font-semibold">
              NIS/Username: {formData.nis}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                Tanggal Presensi
              </label>
              <input
                type="text"
                value={formData.tanggal}
                onChange={e => setFormData({ ...formData, tanggal: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Waktu / Jam</label>
              <input
                type="text"
                placeholder="14:30"
                value={formData.waktu}
                onChange={e => setFormData({ ...formData, waktu: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Kelas</label>
              <input
                type="text"
                value={formData.kelas}
                onChange={e => setFormData({ ...formData, kelas: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                Status Kehadiran
              </label>
              <select
                value={formData.status}
                onChange={e =>
                  setFormData({
                    ...formData,
                    status: e.target.value as 'Hadir' | 'Izin' | 'Sakit' | 'Alpa'
                  })
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs text-slate-800 font-semibold focus:outline-none"
              >
                <option value="Hadir">Hadir</option>
                <option value="Izin">Izin</option>
                <option value="Sakit">Sakit</option>
                <option value="Alpa">Alpa</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
              Keterangan / Paket
            </label>
            <input
              type="text"
              value={formData.keterangan || ''}
              onChange={e => setFormData({ ...formData, keterangan: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Simpan Perubahan
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* 11. CUSTOM CONFIRM MODAL */
interface CustomConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const CustomConfirmModal: React.FC<CustomConfirmModalProps> = ({
  isOpen,
  title,
  message,
  isDestructive = true,
  onConfirm,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4 border border-slate-100">
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto shadow-sm ${
            isDestructive ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'
          }`}
        >
          <AlertTriangle className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-800 font-brand">{title}</h3>
          <p className="text-xs text-slate-500 mt-1">{message}</p>
        </div>
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 py-2.5 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer ${
              isDestructive ? 'bg-rose-600 hover:bg-rose-700' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            Ya, Lanjutkan
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
};

/* 12. SCRIPT CODE MODAL */
interface ScriptCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCopyNotice: () => void;
}

export const ScriptCodeModal: React.FC<ScriptCodeModalProps> = ({
  isOpen,
  onClose,
  onCopyNotice
}) => {
  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE_TEMPLATE);
    onCopyNotice();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 space-y-4 border border-slate-100 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800 font-brand flex items-center gap-2">
              <Code2 className="w-4 h-4 text-indigo-600" />
              <span>Kode Google Apps Script (Code.gs)</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Salin dan tempel ke Apps Script spreadsheet Anda untuk otomatisasi 4 sheet
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-900 rounded-2xl p-4 text-slate-200 font-mono text-[11px] leading-relaxed relative">
          <textarea
            readOnly
            value={APPS_SCRIPT_CODE_TEMPLATE}
            className="w-full h-80 bg-transparent text-emerald-400 focus:outline-none resize-none font-mono text-[10px]"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Salin Kode Script</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

/* 13. SINGLE A4 CARD COMPONENT */
export const SingleA4Card: React.FC<{ student: Student; compact?: boolean }> = ({ student, compact }) => {
  const barcodeRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (barcodeRef.current && student.username) {
      try {
        JsBarcode(barcodeRef.current, student.username, {
          format: 'CODE128',
          lineColor: '#0f172a',
          width: compact ? 1.4 : 1.7,
          height: compact ? 30 : 36,
          displayValue: false,
          margin: 0
        });
      } catch (err) {
        console.warn('JsBarcode error:', err);
      }
    }
  }, [student, compact]);

  return (
    <div className="card-print-item relative border-2 border-dashed border-slate-300 rounded-xl p-3 bg-white text-slate-900 flex flex-col justify-between shadow-xs overflow-hidden h-[54mm] box-border print:border-slate-400 print:shadow-none">
      {/* Header Kartu */}
      <div className="flex items-center justify-between border-b border-indigo-100 pb-1.5">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-md bg-indigo-900 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
            <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div>
            <div className="text-[10px] font-black tracking-wider uppercase font-brand text-indigo-950 leading-tight">
              BIMBEL BA
            </div>
            <div className="text-[7.5px] text-slate-500 font-medium leading-none">
              KARTU PRESENSI SISWA
            </div>
          </div>
        </div>
        <span className="text-[8px] bg-amber-400 text-indigo-950 font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
          {student.kategori_bimbingan || 'BIMBEL'}
        </span>
      </div>

      {/* Info Siswa */}
      <div className="my-1">
        <div className="text-xs font-black text-slate-900 truncate font-brand leading-snug">
          {student.nama}
        </div>
        <div className="text-[9.5px] text-slate-600 font-semibold flex items-center gap-2">
          <span>
            Username: <b className="text-indigo-950 font-mono">{student.username}</b>
          </span>
          <span>•</span>
          <span>
            Kelas: <b className="text-slate-800">{student.kelas || '-'}</b>
          </span>
        </div>
      </div>

      {/* Barcode Container */}
      <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200 flex flex-col items-center justify-center print:bg-white print:border-slate-300">
        <svg ref={barcodeRef} className="w-full max-h-9" />
        <span className="text-[8.5px] font-mono font-bold text-slate-700 tracking-wider mt-0.5">
          {student.username}
        </span>
      </div>
    </div>
  );
};

/* 14. PRINT ALL CARDS A4 MODAL */
interface PrintAllCardsA4ModalProps {
  isOpen: boolean;
  students: Student[];
  onClose: () => void;
}

export const PrintAllCardsA4Modal: React.FC<PrintAllCardsA4ModalProps> = ({
  isOpen,
  students,
  onClose
}) => {
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [cardsPerPage, setCardsPerPage] = useState<number>(8); // 8 or 10

  if (!isOpen) return null;

  // Extract unique classes
  const classes = Array.from(new Set(students.map(s => s.kelas).filter(Boolean)));

  const filteredStudents = selectedClass === 'ALL'
    ? students
    : students.filter(s => s.kelas === selectedClass);

  // Chunk students into pages of cardsPerPage
  const pages: Student[][] = [];
  for (let i = 0; i < filteredStudents.length; i += cardsPerPage) {
    pages.push(filteredStudents.slice(i, i + cardsPerPage));
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-100 rounded-3xl shadow-2xl max-w-4xl w-full p-4 sm:p-6 space-y-4 my-auto border border-slate-200 max-h-[92vh] flex flex-col">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3 bg-white p-4 rounded-2xl shadow-xs">
          <div>
            <h3 className="text-base font-bold text-slate-800 font-brand flex items-center gap-2">
              <Printer className="w-5 h-5 text-indigo-600" />
              <span>Cetak Kartu Siswa Format Lembar A4 (Siap Cetak & Potong)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Format A4 terstandar dengan barcode CODE128 jernih dan garis panduan potong
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Sekarang (Print / PDF)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter & Layout Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">Filter Kelas:</span>
              <select
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:outline-none"
              >
                <option value="ALL">Semua Kelas ({students.length} Siswa)</option>
                {classes.map(c => (
                  <option key={c} value={c}>
                    Kelas {c} ({students.filter(s => s.kelas === c).length} Siswa)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">Tata Letak:</span>
              <div className="inline-flex rounded-lg border border-slate-300 p-0.5 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setCardsPerPage(8)}
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                    cardsPerPage === 8 ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  8 Kartu / Lembar (2x4)
                </button>
                <button
                  type="button"
                  onClick={() => setCardsPerPage(10)}
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                    cardsPerPage === 10 ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  10 Kartu / Lembar (2x5)
                </button>
              </div>
            </div>
          </div>

          <div className="text-slate-500 font-medium">
            Total: <b className="text-indigo-900">{filteredStudents.length}</b> Kartu ({pages.length} Lembar A4)
          </div>
        </div>

        {/* Scrollable A4 Pages Preview / Print Container */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
          {pages.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl text-slate-400">
              Tidak ada siswa yang dipilih untuk dicetak.
            </div>
          ) : (
            <div id="printArea" className="space-y-6 print:space-y-0">
              {pages.map((pageStudents, pageIdx) => (
                <div
                  key={pageIdx}
                  className="bg-white mx-auto shadow-md rounded-2xl p-6 border border-slate-200 print:shadow-none print:border-none print:p-0 print:m-0 print-page-break"
                  style={{
                    maxWidth: '210mm',
                    minHeight: '290mm',
                    boxSizing: 'border-box'
                  }}
                >
                  {/* Sheet Header (only visual on screen) */}
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-4 text-[11px] text-slate-500 print:hidden">
                    <span className="font-bold text-slate-700">
                      LEMBAR CETAK A4 #{pageIdx + 1} ({pageStudents.length} Kartu)
                    </span>
                    <span>Format Kartu Siswa BIMBEL BA</span>
                  </div>

                  {/* 2-Column Grid of Cards */}
                  <div className={`grid grid-cols-2 gap-3.5 ${cardsPerPage === 10 ? 'gap-y-2.5' : 'gap-y-3.5'}`}>
                    {pageStudents.map(student => (
                      <SingleA4Card
                        key={student.username}
                        student={student}
                        compact={cardsPerPage === 10}
                      />
                    ))}
                  </div>

                  {/* Sheet Footer Guide */}
                  <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400 print:hidden">
                    <span>Garis putus-putus abu-abu adalah panduan potong kartu.</span>
                    <span>Halaman {pageIdx + 1} dari {pages.length}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 bg-white p-3 rounded-2xl border border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
          >
            Tutup
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Lembar A4 (Print / PDF)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

