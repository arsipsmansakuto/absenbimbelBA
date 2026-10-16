import { saveAs } from 'file-saver';

export function getTodayDdMmYyyy(): string {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, '0');
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const y = now.getFullYear();
  return `${d}/${m}/${y}`;
}

export function getCurrentTimeHhMm(): string {
  const now = new Date();
  return now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');
}

export function formatTanggalIndo(input: string | Date | undefined | null): string {
  if (!input) return getTodayDdMmYyyy();
  if (typeof input === 'string') {
    const str = input.trim();
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return str;
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      const parts = str.split('-');
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    const dObj = new Date(str);
    if (!isNaN(dObj.getTime())) {
      const d = String(dObj.getDate()).padStart(2, '0');
      const m = String(dObj.getMonth() + 1).padStart(2, '0');
      const y = dObj.getFullYear();
      return `${d}/${m}/${y}`;
    }
    return str;
  }
  if (input instanceof Date && !isNaN(input.getTime())) {
    const d = String(input.getDate()).padStart(2, '0');
    const m = String(input.getMonth() + 1).padStart(2, '0');
    const y = input.getFullYear();
    return `${d}/${m}/${y}`;
  }
  return getTodayDdMmYyyy();
}

export function parseTanggalIndoKeIso(tglStr: string): string {
  if (!tglStr) return '';
  const parts = String(tglStr).trim().split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return tglStr;
}

export function parseIsoKeTanggalIndo(isoStr: string): string {
  if (!isoStr) return '';
  const parts = String(isoStr).trim().split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoStr;
}

export function normalizeDateToStandard(input: string | Date | undefined | null): string {
  if (!input) return getTodayDdMmYyyy();
  if (input instanceof Date && !isNaN(input.getTime())) {
    const d = String(input.getDate()).padStart(2, '0');
    const m = String(input.getMonth() + 1).padStart(2, '0');
    const y = input.getFullYear();
    return `${d}/${m}/${y}`;
  }
  const s = String(input).trim();
  // Match dd/mm/yyyy or d/m/yyyy or dd-mm-yyyy
  const slashMatch = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (slashMatch) {
    const d = slashMatch[1].padStart(2, '0');
    const m = slashMatch[2].padStart(2, '0');
    const y = slashMatch[3];
    return `${d}/${m}/${y}`;
  }
  // Match yyyy-mm-dd or yyyy/mm/dd
  const isoMatch = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = isoMatch[2].padStart(2, '0');
    const d = isoMatch[3].padStart(2, '0');
    return `${d}/${m}/${y}`;
  }
  return formatTanggalIndo(s);
}

export function parseNominalAngka(val: unknown): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') {
    if (isNaN(val)) return 0;
    if (val > 10000000 && String(val).endsWith('2026')) return 0;
    return val;
  }
  let s = String(val).trim();
  if (!s) return 0;
  if (s.includes('/') || (s.includes('-') && s.length >= 8)) return 0;

  s = s.replace(/^[Rr][Pp]\.?\s*/i, '').trim();

  if (s.includes('.') && !s.includes(',')) {
    if (/\.\d{3}$/.test(s)) {
      s = s.replace(/\./g, '');
    }
  } else if (s.includes(',') && s.includes('.')) {
    s = s.split(',')[0].replace(/\./g, '');
  } else if (s.includes(',')) {
    s = s.split(',')[0];
  }

  const num = Number(s.replace(/[^0-9]/g, ''));
  if (isNaN(num)) return 0;
  if (num > 10000000 && String(num).endsWith('2026')) return 0;
  return num;
}

export function formatRupiah(val: number | string): string {
  const n = typeof val === 'number' ? val : parseNominalAngka(val);
  return `Rp ${n.toLocaleString('id-ID')}`;
}

export function formatSingleNoTelp(singleVal: string): string {
  if (!singleVal) return '-';
  let clean = String(singleVal).trim().replace(/[^0-9]/g, '');
  if (!clean) return '-';
  if (clean.startsWith('62')) {
    clean = '0' + clean.slice(2);
  } else if (!clean.startsWith('0')) {
    clean = '0' + clean;
  }
  return clean;
}

export function formatNoTelp(val: unknown): string {
  if (val === null || val === undefined) return '-';
  let str = String(val).trim();
  if (!str || str === '-' || str === '0') return '-';
  str = str.replace(/^['"]+|['"]+$/g, '').trim();

  if (/e\+/i.test(str)) {
    try {
      const num = Number(str.replace(',', '.'));
      if (!isNaN(num)) {
        str = num.toLocaleString('fullwide', { useGrouping: false });
      }
    } catch {}
  }

  if (str.includes('/') || str.includes(',')) {
    const parts = str.split(/[/,]/);
    const formattedParts = parts.map(p => formatSingleNoTelp(p)).filter(p => p !== '-');
    return formattedParts.length > 0 ? formattedParts.join(' / ') : '-';
  }

  return formatSingleNoTelp(str);
}

export function getWaUrl(noTelp: string | undefined): string | null {
  if (!noTelp || noTelp === '-') return null;
  let clean = String(noTelp).trim().replace(/[^0-9]/g, '');
  if (!clean) return null;
  if (clean.startsWith('0')) {
    clean = '62' + clean.slice(1);
  }
  return `https://wa.me/${clean}`;
}

export function safeFileDownload(blob: Blob, filename: string) {
  try {
    saveAs(blob, filename);
  } catch (err) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 200);
  }
}
