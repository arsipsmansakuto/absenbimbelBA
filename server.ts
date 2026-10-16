import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Data storage directory
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

const DEFAULT_SERVER_SETTINGS = {
  apiUrl: '',
  spreadsheetId: '1oQMV5G7fiLOxTXlENGAEHEBEs2TaC5tqA8P7b-rdmjo',
  sheetGidSiswa: '1709630193',
  sheetGidPresensi: '',
  sheetGidSPP: '',
  sheetGidUsers: '',
  isConfigLocked: true
};

function readSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const content = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      return { ...DEFAULT_SERVER_SETTINGS, ...JSON.parse(content) };
    }
  } catch (err) {
    console.warn('Error reading settings file:', err);
  }
  return DEFAULT_SERVER_SETTINGS;
}

function writeSettings(data: any) {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing settings file:', err);
  }
}

// API: Get global settings (shared across all devices)
app.get('/api/settings', (_req, res) => {
  const settings = readSettings();
  res.json({ success: true, settings });
});

// API: Save settings (locks permanently across all devices)
app.post('/api/settings', (req, res) => {
  const newSettings = { ...readSettings(), ...req.body, isConfigLocked: req.body.isConfigLocked ?? true };
  writeSettings(newSettings);
  res.json({ success: true, settings: newSettings });
});

// API: Fetch Siswa CSV directly from Google Sheet (gid=1709630193)
app.get('/api/sheets/siswa', async (req, res) => {
  try {
    const settings = readSettings();
    const spreadsheetId = (req.query.spreadsheetId as string) || settings.spreadsheetId || '1oQMV5G7fiLOxTXlENGAEHEBEs2TaC5tqA8P7b-rdmjo';
    const gid = (req.query.gid as string) || settings.sheetGidSiswa || '1709630193';

    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
    const response = await fetch(url);
    if (!response.ok) {
      // Try gviz format as alternative
      const gvizUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;
      const gvizResp = await fetch(gvizUrl);
      if (!gvizResp.ok) {
        return res.status(gvizResp.status).send(`Failed to fetch sheet: ${gvizResp.statusText}`);
      }
      const csv = await gvizResp.text();
      res.setHeader('Content-Type', 'text/csv');
      return res.send(csv);
    }
    const csv = await response.text();
    res.setHeader('Content-Type', 'text/csv');
    res.send(csv);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error fetching spreadsheet' });
  }
});

// API: Forward data sync payload to Google Apps Script
app.post('/api/sync-proxy', async (req, res) => {
  try {
    const settings = readSettings();
    const targetUrl = req.body.apiUrl || settings.apiUrl;
    if (!targetUrl) {
      return res.status(400).json({ error: 'Web App URL belum dikonfigurasi' });
    }

    const payload = req.body.payload || req.body;
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const text = await response.text();
    res.send(text);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Sync error' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
