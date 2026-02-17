import React, { useState, useEffect, createContext, useContext } from 'react';
import Login from './components/Login';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import InvoiceGenerator from './components/InvoiceGenerator';
import WalletList from './components/WalletList';
import Settings from './components/Settings';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// ─── GLOBAL CONTEXTS ─────────────────────────────────────────────────────────
export const ThemeContext = createContext('dark');
export const CurrencyContext = createContext('CZK');

const DARK = {
  '--bg': '#0A0B0F',
  '--bg2': '#111218',
  '--bg3': '#18191F',
  '--border': 'rgba(255,255,255,0.07)',
  '--border-bright': 'rgba(255,255,255,0.14)',
  '--text': '#F0F0F5',
  '--text2': '#8B8C9B',
  '--text3': '#5A5B6A',
  '--shadow': '0 4px 24px rgba(0,0,0,0.4)',
  '--card-hover': 'rgba(255,255,255,0.02)',
};

const LIGHT = {
  '--bg': '#F4F5F9',
  '--bg2': '#FFFFFF',
  '--bg3': '#F0F1F6',
  '--border': 'rgba(0,0,0,0.08)',
  '--border-bright': 'rgba(0,0,0,0.16)',
  '--text': '#0F1117',
  '--text2': '#4A4B5A',
  '--text3': '#9A9BAA',
  '--shadow': '0 4px 24px rgba(0,0,0,0.08)',
  '--card-hover': 'rgba(0,0,0,0.015)',
};

const COMMON = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --accent: #7B5CF0;
    --accent2: #9B7BFF;
    --accent-glow: rgba(123,92,240,0.25);
    --green: #22C55E;
    --green-dim: rgba(34,197,94,0.15);
    --red: #EF4444;
    --red-dim: rgba(239,68,68,0.15);
    --yellow: #F59E0B;
    --yellow-dim: rgba(245,158,11,0.15);
    --orange: #F7931A;
  }
  html, body { height: 100%; }
  body { font-family: 'DM Sans', sans-serif; font-size: 15px; line-height: 1.6; -webkit-font-smoothing: antialiased; background: var(--bg); color: var(--text); transition: background 0.25s, color 0.25s; }
  #root { height: 100%; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: var(--border-bright); border-radius: 2px; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  select option { background: var(--bg2); color: var(--text); }
`;

function buildThemeCSS(vars) {
  return ':root {\n' + Object.entries(vars).map(([k, v]) => `  ${k}: ${v};`).join('\n') + '\n}';
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('poc_token'));
  const [user, setUser] = useState(null);
  const [view, setView] = useState('dashboard');
  const [landingView, setLandingView] = useState('landing'); // 'landing' | 'login' | 'register'
  const [loading, setLoading] = useState(!!localStorage.getItem('poc_token'));
  const [theme, setTheme] = useState(localStorage.getItem('poc_theme') || 'dark');
  const [currency, setCurrency] = useState(localStorage.getItem('poc_currency') || 'CZK');

  // Inject styles
  useEffect(() => {
    const common = document.createElement('style');
    common.id = 'cf-common';
    common.textContent = COMMON;
    document.head.appendChild(common);
    return () => common.remove();
  }, []);

  useEffect(() => {
    let el = document.getElementById('cf-theme');
    if (!el) { el = document.createElement('style'); el.id = 'cf-theme'; document.head.appendChild(el); }
    el.textContent = buildThemeCSS(theme === 'dark' ? DARK : LIGHT);
    localStorage.setItem('poc_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('poc_currency', currency);
  }, [currency]);

  useEffect(() => {
    if (token) {
      fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(data => {
          if (data.id) setUser(data);
          else { localStorage.removeItem('poc_token'); setToken(null); }
        })
        .catch(() => { localStorage.removeItem('poc_token'); setToken(null); })
        .finally(() => setLoading(false));
    }
  }, [token]);

  const handleLogin = (t, u) => { localStorage.setItem('poc_token', t); setToken(t); setUser(u); };
  const handleLogout = () => { localStorage.removeItem('poc_token'); setToken(null); setUser(null); setView('dashboard'); };
  const handleUserUpdate = (u) => setUser(u);

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0A0B0F' }}>
      <div style={{ width: 36, height: 36, border: '2px solid rgba(255,255,255,0.07)', borderTopColor: '#7B5CF0', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  if (!token) return (
    <ThemeContext.Provider value="dark">
      {landingView === 'landing'
        ? <LandingPage onLogin={() => setLandingView('login')} onRegister={() => setLandingView('register')} />
        : <Login API={API} onLogin={handleLogin} defaultMode={landingView === 'register' ? 'register' : 'login'} onBack={() => setLandingView('landing')} />
      }
    </ThemeContext.Provider>
  );

  return (
    <ThemeContext.Provider value={theme}>
      <CurrencyContext.Provider value={currency}>
        <AppShell user={user} view={view} setView={setView} onLogout={handleLogout} theme={theme} setTheme={setTheme}>
          {view === 'dashboard' && <Dashboard API={API} token={token} setView={setView} />}
          {view === 'invoices' && <InvoiceGenerator API={API} token={token} />}
          {view === 'wallets' && <WalletList API={API} token={token} />}
          {view === 'settings' && <Settings API={API} token={token} user={user} onUpdate={handleUserUpdate} currency={currency} setCurrency={setCurrency} theme={theme} setTheme={setTheme} />}
        </AppShell>
      </CurrencyContext.Provider>
    </ThemeContext.Provider>
  );
}

function AppShell({ user, view, setView, onLogout, theme, setTheme, children }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '◈' },
    { id: 'invoices', label: 'Faktury', icon: '◉' },
    { id: 'wallets', label: 'Peněženky', icon: '⬡' },
  ];

  const isLight = theme === 'light';

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <aside style={{ width: 240, background: 'var(--bg2)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        {/* Logo */}
        <div style={{ padding: '24px 22px 18px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, var(--accent), var(--accent2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, boxShadow: '0 0 20px var(--accent-glow)' }}>₿</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.02em' }}>cryptofund.cz</div>
              <div style={{ fontSize: 9, color: 'var(--text3)', fontFamily: 'JetBrains Mono', letterSpacing: '0.1em' }}>INVOICE PLATFORM</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '14px 10px' }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => setView(item.id)} style={{
              display: 'flex', alignItems: 'center', gap: 12, width: '100%',
              padding: '10px 13px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: view === item.id ? 'rgba(123,92,240,0.14)' : 'transparent',
              color: view === item.id ? 'var(--accent2)' : 'var(--text2)',
              fontFamily: 'DM Sans', fontWeight: view === item.id ? 600 : 500, fontSize: 14,
              marginBottom: 3, transition: 'all 0.15s',
              borderLeft: view === item.id ? '2px solid var(--accent)' : '2px solid transparent'
            }}>
              <span style={{ fontSize: 15 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Bottom: theme toggle + user + settings + logout */}
        <div style={{ padding: '14px 18px', borderTop: '1px solid var(--border)' }}>
          {/* Theme toggle */}
          <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 12px', background: 'var(--bg3)', border: '1px solid var(--border)',
            borderRadius: 10, color: 'var(--text2)', fontFamily: 'DM Sans', fontSize: 12,
            cursor: 'pointer', marginBottom: 12, transition: 'all 0.15s'
          }}>
            <span>{isLight ? '☀️ Světlý režim' : '🌙 Tmavý režim'}</span>
            <div style={{
              width: 32, height: 18, borderRadius: 9,
              background: isLight ? 'var(--accent)' : 'var(--border-bright)',
              position: 'relative', transition: 'background 0.2s'
            }}>
              <div style={{
                position: 'absolute', top: 3, left: isLight ? 15 : 3, width: 12, height: 12,
                borderRadius: '50%', background: '#fff', transition: 'left 0.2s'
              }} />
            </div>
          </button>

          {/* User info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), #3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
              <div style={{ fontSize: 10, color: 'var(--text3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.company || user?.email}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setView('settings')} style={{ flex: 1, padding: '7px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text3)', fontFamily: 'DM Sans', fontSize: 11, cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.color = 'var(--accent2)'; }}
              onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text3)'; }}>
              ⚙ Nastavení
            </button>
            <button onClick={onLogout} style={{ flex: 1, padding: '7px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text3)', fontFamily: 'DM Sans', fontSize: 11, cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.target.style.borderColor = 'var(--red)'; e.target.style.color = 'var(--red)'; }}
              onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text3)'; }}>
              Odhlásit
            </button>
          </div>
        </div>
      </aside>

      <main style={{ flex: 1, overflow: 'auto', background: 'var(--bg)' }}>
        {children}
      </main>
    </div>
  );
}
