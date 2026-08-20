/**
 * server.js — Adventure Log upload/serve API
 * Runs on port 3001 behind nginx proxy at /api/
 *
 * POST /api/upload-log  { file: <.html>, type: 'scenario'|'city', entryId: <uuid> }
 * GET  /api/logs/:id    serves the HTML with dark theme overlay injected
 */

const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const crypto  = require('crypto');

const app     = express();
const PORT    = 3001;
const LOG_DIR = process.env.LOG_DIR || '/data/logs';

// Ensure log directory exists
fs.mkdirSync(LOG_DIR, { recursive: true });

// ── Multer storage ────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, LOG_DIR),
  filename: (_req, file, cb) => {
    // Store as UUID so URLs don't expose internal structure
    const id = crypto.randomUUID();
    const ext = path.extname(file.originalname).toLowerCase() || '.html';
    cb(null, `${id}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const isPdf = file.mimetype === 'application/pdf' || ext === '.pdf';
    const isHtml = file.mimetype === 'text/html' || ext === '.html';
    if (isPdf || isHtml) {
      cb(null, true);
    } else {
      cb(new Error('Only .html or .pdf files are accepted'));
    }
  },
});

// ── Dark theme CSS injected into served logs ──────────────────────────────────
const DARK_OVERLAY = `
<style id="cs-dark-override">
  /* Force dark mode on Evernote export */
  html, body { background: #1a1a2e !important; }
  body.darkMode en-note.peso,
  en-note.peso {
    background-color: #1e1e2e !important;
    color: #e0e0e0 !important;
  }
  /* Activate Evernote's built-in dark rules */
  body { /* adding darkMode class via JS below */ }

  /* Extra overrides for readability */
  en-note.peso h1, en-note.peso h2, en-note.peso h3,
  en-note.peso h4, en-note.peso h5, en-note.peso h6 {
    color: #c9a0dc !important;
  }
  en-note.peso a { color: #89b4fa !important; }
  en-note.peso table { border-collapse: collapse; }
  en-note.peso td, en-note.peso th {
    border: 1px solid #444 !important;
    padding: 6px 10px;
  }
  en-note.peso tr:nth-child(even) { background: #2a2a3e !important; }

  /* CS branding bar at top */
  #cs-log-header {
    background: linear-gradient(135deg, #8b1a1a, #2a1a4e);
    color: #e0e0e0;
    padding: 12px 48px;
    font-family: Inter, system-ui, sans-serif;
    font-size: 13px;
    border-bottom: 1px solid #444;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  #cs-log-header .cs-badge {
    background: #8b1a1a;
    border: 1px solid #c0392b;
    border-radius: 4px;
    padding: 2px 8px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
</style>
<script>
  // Activate Evernote's built-in darkMode styles
  document.addEventListener('DOMContentLoaded', function() {
    document.body.classList.add('darkMode');
  });
</script>
`;

const CS_HEADER = (label) => `
<div id="cs-log-header">
  <span class="cs-badge">Crimson Scales</span>
  <span>${label}</span>
</div>
`;

// ── Routes ────────────────────────────────────────────────────────────────────

// Health check
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Upload a log file
// Body: multipart/form-data with field "file" (.html), optional "label" string
app.post('/api/upload-log', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const id = path.basename(req.file.filename, path.extname(req.file.filename));
  const label = req.body.label || '';

  // Store metadata alongside the file
  const ext = path.extname(req.file.originalname).toLowerCase() || '.html';
  const meta = { id, label, ext, uploadedAt: new Date().toISOString() };
  fs.writeFileSync(path.join(LOG_DIR, `${id}.json`), JSON.stringify(meta));

  return res.json({ id, url: `/api/logs/${id}` });
});

// Serve a log file with dark theme injected
app.get('/api/logs/:id', (req, res) => {
  const id = req.params.id.replace(/[^a-f0-9-]/gi, ''); // sanitize
  const pdfPath = path.join(LOG_DIR, `${id}.pdf`);
  const htmlPath = path.join(LOG_DIR, `${id}.html`);
  const actualPath = fs.existsSync(pdfPath) ? pdfPath : fs.existsSync(htmlPath) ? htmlPath : null;

  if (!actualPath) {
    return res.status(404).send('Log not found');
  }

  // Serve PDF directly
  if (actualPath.endsWith('.pdf')) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${id}.pdf"`);
    return res.send(fs.readFileSync(actualPath));
  }

  let html = fs.readFileSync(actualPath, 'utf8');

  // Read label from metadata if available
  let label = id;
  const metaPath = path.join(LOG_DIR, `${id}.json`);
  if (fs.existsSync(metaPath)) {
    try { label = JSON.parse(fs.readFileSync(metaPath, 'utf8')).label || id; } catch (_) {}
  }

  // Inject dark override before </head>
  if (html.includes('</head>')) {
    html = html.replace('</head>', `${DARK_OVERLAY}</head>`);
  } else {
    html = DARK_OVERLAY + html;
  }

  // Inject CS header bar right after <body> (or en-note tag)
  const headerHtml = CS_HEADER(label);
  if (html.includes('<en-note')) {
    html = html.replace(/(<en-note[^>]*>)/, `$1${headerHtml}`);
  } else if (html.includes('<body')) {
    html = html.replace(/(<body[^>]*>)/, `$1${headerHtml}`);
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.send(html);
});

// Delete a log
app.delete('/api/logs/:id', (req, res) => {
  const id = req.params.id.replace(/[^a-f0-9-]/gi, '');
  const htmlPath2 = path.join(LOG_DIR, `${id}.html`);
  const pdfPath2 = path.join(LOG_DIR, `${id}.pdf`);
  const metaPath = path.join(LOG_DIR, `${id}.json`);
  const filePath = fs.existsSync(pdfPath2) ? pdfPath2 : fs.existsSync(htmlPath2) ? htmlPath2 : null;

  if (!filePath) return res.status(404).json({ error: 'Not found' });

  fs.unlinkSync(filePath);
  if (fs.existsSync(metaPath)) fs.unlinkSync(metaPath);

  res.json({ ok: true });
});

// Error handler for multer
app.use((err, _req, res, _next) => {
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'File too large (max 2 MB)' });
  res.status(400).json({ error: err.message });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`CS log server listening on 127.0.0.1:${PORT}`);
  console.log(`Log directory: ${LOG_DIR}`);
});
