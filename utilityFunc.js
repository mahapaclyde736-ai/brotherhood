// ── API helper ────────────────────────────────────────────────────────
async function api(path, method = 'GET', body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  };
  if (body) opts.body = JSON.stringify(body);

  try {                                         // FIX: catch network errors
    const res = await fetch(path, opts);
    return res.json();
  } catch (err) {
    console.error('API error:', err);
    return { error: 'Could not reach server. Please try again.' };
  }
}

// ── Helper: format timestamp to HH:MM ────────────────────────────────
function formatTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

// ── Page guard (redirects to login if not logged in) ──────────────────
async function guardPage(requiredRole = null) {
  const data = await api('/api/me');

  if (data.error || !data.user) {
    window.location.href = 'index.html';
    return;
  }

  if (requiredRole && data.user.role !== requiredRole) {
    window.location.href = 'index.html';
  }
}

// ── Populate user name in navbar ──────────────────────────────────────
async function loadUserName() {
  const data = await api('/api/me');
  const nameEl = document.getElementById('user-name');
  if (nameEl && data.user) {
    nameEl.textContent = data.user.name;
  }
}

// ── Login page ───────────────────────────────────────────────────────
async function login(email, password) {
  return api('/api/login', 'POST', { email, password });
}

function showLoginError(message) {
  const errorDiv = document.getElementById('error-msg');
  if (!errorDiv) return;
  errorDiv.textContent = message;
  errorDiv.classList.remove('hidden');
}

function hideLoginError() {
  const errorDiv = document.getElementById('error-msg');
  if (!errorDiv) return;
  errorDiv.classList.add('hidden');
}

async function signIn() {
  const emailInput    = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const loginBtn      = document.getElementById('login-btn');   // FIX: loading state
  const email         = emailInput?.value.trim() || '';
  const password      = passwordInput?.value || '';

  hideLoginError();

  if (!email || !password) {
    showLoginError('Please enter both email and password.');
    return;
  }

  if (loginBtn) {
    loginBtn.disabled     = true;
    loginBtn.textContent  = 'Signing in...';
  }

  const data = await login(email, password);

  if (data.error) {
    showLoginError(data.error);
    if (loginBtn) {
      loginBtn.disabled    = false;
      loginBtn.textContent = 'Sign In';
    }
  } else {
    window.location.href = data.role === 'admin' ? 'admin.html' : 'dashboard.html';
  }
}

const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', event => {
    event.preventDefault();
    signIn();
  });
}

// ── Live clock display ────────────────────────────────────────────────
const clockDisplay = document.getElementById('current-time');
if (clockDisplay) {
  function updateClock() {
    const now = new Date();
    clockDisplay.textContent = now.toLocaleTimeString('en-GB');
  }
  updateClock();
  setInterval(updateClock, 1000);
}

// ── Dashboard: guard + user name ─────────────────────────────────────
const clockBtn = document.getElementById('clock-btn');
if (clockBtn) {
  guardPage('teacher');   // FIX: redirect if not logged in as teacher
  loadUserName();         // FIX: fill in the name in the navbar

  // Load current clock status
  async function loadStatus() {
    const data = await api('/api/status');
    if (data.isClockedIn) {
      clockBtn.textContent = 'Clock Out';
      clockBtn.classList.add('clocked-in');
      document.getElementById('clock-status').innerHTML =
        `You are currently: <strong>Clocked In</strong> since ${formatTime(data.clockInTime)}`;
    } else {
      clockBtn.textContent = 'Clock In';
      clockBtn.classList.remove('clocked-in');
      document.getElementById('clock-status').innerHTML =
        'You are currently: <strong>Clocked Out</strong>';
    }
  }
  loadStatus();

  // Toggle clock in/out on button click
  clockBtn.addEventListener('click', async () => {
    clockBtn.disabled = true;
    const data = await api('/api/clock', 'POST');
    clockBtn.disabled = false;
    if (!data.error) {
      loadStatus();
      loadHistory();
    }
  });
}

// ── History table ─────────────────────────────────────────────────
async function loadHistory() {
  const tbody = document.getElementById('history-body');
  if (!tbody) return;

  const records = await api('/api/history');

  // FIX: show a message when there are no records yet
  if (!records.length) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:16px;color:var(--color-text-secondary)">No records yet</td></tr>`;
    return;
  }

  tbody.innerHTML = records.map(r => `
    <tr>
      <td>${r.date}</td>
      <td>${formatTime(r.clock_in)}</td>
      <td>${formatTime(r.clock_out)}</td>
      <td>${r.hours || '—'}</td>
    </tr>
  `).join('');
}
loadHistory();

// ── Admin: guard + load all staff records ─────────────────────────────
async function loadAdmin() {
  const tbody = document.getElementById('admin-body');
  if (!tbody) return;

  await guardPage('admin');   // FIX: redirect if not logged in as admin

  const data = await api('/api/admin/today');

  document.getElementById('stat-in').textContent    = data.filter(r => r.status === 'In').length;
  document.getElementById('stat-out').textContent   = data.filter(r => r.status === 'Out').length;
  document.getElementById('stat-total').textContent = data.length;

  // FIX: show a message when no staff records exist yet
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:16px;color:var(--color-text-secondary)">No records today</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(r => `
    <tr>
      <td>${r.name}</td>
      <td>${r.department}</td>
      <td class="status-${r.status === 'In' ? 'in' : 'out'}">${r.status}</td>
      <td>${formatTime(r.clock_in)}</td>
      <td>${formatTime(r.clock_out)}</td>
    </tr>
  `).join('');
}
loadAdmin();

// ── Export CSV ────────────────────────────────────────────────────────
const exportBtn = document.getElementById('export-btn');
if (exportBtn) {
  exportBtn.addEventListener('click', () => {
    window.location.href = '/api/admin/export';
  });
}

// ── Logout (all pages) ───────────────────────────────────────────────
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    await api('/api/logout', 'POST');
    window.location.href = 'index.html';
  });
}

