import dotenv from 'dotenv';
import express from 'express';
import session from 'express-session';
import bcrypt from 'bcryptjs';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', 'clockit.env') });

const app = express();
const PORT = process.env.PORT || 3000;

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' }
});

console.log('SESSION_SECRET loaded:', Boolean(process.env.SESSION_SECRET));

// ── Middleware ────────────────────────────────────────────────────────
app.use(helmet());
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, maxAge: 8 * 60 * 60 * 1000 }  // 8 hours
}));

// ── Protect static pages that require a login first ────────────────────
app.get('/dashboard.html', (req, res, next) => {
  if (!req.session.userId) return res.redirect('/index.html');
  next();
});

app.get('/admin.html', (req, res, next) => {
  if (!req.session.userId) return res.redirect('/index.html');
  if (req.session.role !== 'admin') return res.redirect('/index.html');
  next();
});

app.use(express.static(path.join(__dirname, '..')));

// ── Auth middleware ───────────────────────────────────────────────────
function requireLogin(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
  next();
}

function requireAdmin(req, res, next) {
  if (req.session.role !== 'admin') return res.status(403).json({ error: 'Admins only' });
  next();
}

// ── POST /api/login ───────────────────────────────────────────────────
app.post('/api/login', loginLimiter, (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  req.session.userId = user.id;
  req.session.role   = user.role;
  res.json({ role: user.role });
});

// ── POST /api/logout ──────────────────────────────────────────────────
app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

// ── GET /api/me  (session guard for frontend pages) ───────────────────
app.get('/api/me', requireLogin, (req, res) => {
  const user = db.prepare('SELECT id, name, role, department FROM users WHERE id = ?')
    .get(req.session.userId);
  res.json({ user });
});

// ── GET /api/status ──────────────────────────────────────────────────
app.get('/api/status', requireLogin, (req, res) => {
  const today  = new Date().toISOString().slice(0, 10);
  const record = db.prepare(
    'SELECT * FROM clock_records WHERE user_id = ? AND date = ? ORDER BY id DESC LIMIT 1'
  ).get(req.session.userId, today);

  const isClockedIn = record && record.clock_in && !record.clock_out;
  res.json({ isClockedIn, clockInTime: record?.clock_in || null });
});

// ── POST /api/clock  (toggle clock in / out) ──────────────────────────
app.post('/api/clock', requireLogin, (req, res) => {
  const now   = new Date().toISOString();
  const today = now.slice(0, 10);
  const uid   = req.session.userId;

  const open = db.prepare(
    'SELECT * FROM clock_records WHERE user_id = ? AND date = ? AND clock_out IS NULL'
  ).get(uid, today);

  if (open) {
    db.prepare('UPDATE clock_records SET clock_out = ? WHERE id = ?').run(now, open.id);
    res.json({ action: 'clocked_out' });
  } else {
    db.prepare('INSERT INTO clock_records (user_id, clock_in, date) VALUES (?, ?, ?)').run(uid, now, today);
    res.json({ action: 'clocked_in' });
  }
});

// ── GET /api/history ──────────────────────────────────────────────────
app.get('/api/history', requireLogin, (req, res) => {
  const records = db.prepare(
    'SELECT * FROM clock_records WHERE user_id = ? ORDER BY date DESC LIMIT 30'
  ).all(req.session.userId);

  const withHours = records.map(r => ({
    ...r,
    hours: r.clock_in && r.clock_out
      ? ((new Date(r.clock_out) - new Date(r.clock_in)) / 3600000).toFixed(2)
      : null
  }));

  res.json(withHours);
});

// ── GET /api/admin/today ──────────────────────────────────────────────
app.get('/api/admin/today', requireLogin, requireAdmin, (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const rows = db.prepare(`
    SELECT u.name, u.department,
           CASE WHEN cr.clock_out IS NULL AND cr.clock_in IS NOT NULL THEN 'In' ELSE 'Out' END AS status,
           cr.clock_in, cr.clock_out
    FROM users u
    LEFT JOIN clock_records cr ON u.id = cr.user_id AND cr.date = ?
    WHERE u.role = 'teacher'
    GROUP BY u.id
  `).all(today);
  res.json(rows);
});

// ── GET /api/admin/export  (CSV download) ─────────────────────────────
app.get('/api/admin/export', requireLogin, requireAdmin, (req, res) => {
  const records = db.prepare(`
    SELECT u.name, u.department, cr.date, cr.clock_in, cr.clock_out
    FROM clock_records cr JOIN users u ON cr.user_id = u.id
    ORDER BY cr.date DESC
  `).all();

  const csv = [
    'Name,Department,Date,Clock In,Clock Out',
    ...records.map(r => `${r.name},${r.department},${r.date},${r.clock_in || ''},${r.clock_out || ''}`)
  ].join('\n');

  res.setHeader('Content-Disposition', 'attachment; filename=attendance.csv');
  res.setHeader('Content-Type', 'text/csv');
  res.send(csv);
});

// ── Start server ──────────────────────────────────────────────────
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
