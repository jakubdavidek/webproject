import React, { useState, useEffect } from 'react';

const DARK_VARS = {
  '--bg': '#0A0B0F', '--bg2': '#111218', '--bg3': '#18191F',
  '--border': 'rgba(255,255,255,0.07)', '--border-bright': 'rgba(255,255,255,0.14)',
  '--text': '#F0F0F5', '--text2': '#8B8C9B', '--text3': '#5A5B6A',
  '--accent': '#7B5CF0', '--accent2': '#9B7BFF',
};

export default function Login({ API, onLogin, defaultMode = 'login', onBack }) {
  // Always force dark theme on login page
  useEffect(() => {
    const root = document.documentElement;
    const prev = {};
    Object.entries(DARK_VARS).forEach(([k, v]) => {
      prev[k] = root.style.getPropertyValue(k);
      root.style.setProperty(k, v);
    });
    return () => {
      Object.entries(prev).forEach(([k, v]) => root.style.setProperty(k, v));
    };
  }, []);
  const [mode, setMode] = useState(defaultMode);
  const [form, setForm] = useState({ email: '', password: '', name: '', company: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const body = mode === 'login'
        ? { email: form.email, password: form.password }
        : { email: form.email, password: form.password, name: form.name, company: form.company };

      const res = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Chyba serveru');
      onLogin(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inp = (field, placeholder, type = 'text') => (
    <div style={{ marginBottom: 14 }}>
      <input
        type={type}
        placeholder={placeholder}
        value={form[field]}
        onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
        required={field !== 'company'}
        style={{
          width: '100%', padding: '13px 16px', background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#F0F0F5',
          fontFamily: 'DM Sans', fontSize: 14, outline: 'none', transition: 'border 0.2s'
        }}
        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
      />
    </div>
  );

  // Force dark theme on login page regardless of user setting
  const darkVars = {
    '--bg': '#0A0B0F', '--bg2': '#111218', '--bg3': '#18191F',
    '--border': 'rgba(255,255,255,0.07)', '--border-bright': 'rgba(255,255,255,0.14)',
    '--text': '#F0F0F5', '--text2': '#8B8C9B', '--text3': '#5A5B6A',
    '--accent': '#7B5CF0', '--accent2': '#9B7BFF',
  };
  const darkStyle = Object.entries(darkVars).reduce((s, [k, v]) => ({ ...s, [k]: v }), {});

  return (
    <div style={{
      minHeight: '100vh', background: '#0A0B0F', display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden'
    }}>
      {/* Background effects */}
      <div style={{
        position: 'absolute', top: '15%', left: '20%', width: 500, height: 500,
        background: 'radial-gradient(circle, rgba(123,92,240,0.12) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: '10%', right: '15%', width: 400, height: 400,
        background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{ width: '100%', maxWidth: 440, padding: '0 20px', animation: 'fadeIn 0.4s ease' }}>
        {/* Back to landing */}
        {onBack && (
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'DM Sans', padding: 0, transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}>
            ← Zpět na úvod
          </button>
        )}
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, boxShadow: '0 0 40px rgba(123,92,240,0.4)'
          }}>⚡</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em' }}>cryptofund.cz</h1>
          <p style={{ color: 'var(--text3)', fontSize: 13, fontFamily: 'JetBrains Mono', marginTop: 4, letterSpacing: '0.05em' }}>
            CRYPTO INVOICE PLATFORM
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 20, padding: '36px 32px', boxShadow: '0 24px 80px rgba(0,0,0,0.4)'
        }}>
          {/* Tab switcher */}
          <div style={{
            display: 'flex', background: 'var(--bg3)', borderRadius: 10, padding: 4, marginBottom: 28
          }}>
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); }} style={{
                flex: 1, padding: '9px', border: 'none', borderRadius: 8, cursor: 'pointer',
                background: mode === m ? 'var(--accent)' : 'transparent',
                color: mode === m ? '#fff' : 'var(--text2)',
                fontFamily: 'DM Sans', fontWeight: 600, fontSize: 13, transition: 'all 0.2s'
              }}>
                {m === 'login' ? 'Přihlásit se' : 'Registrovat'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {mode === 'register' && inp('name', 'Celé jméno *')}
            {mode === 'register' && inp('company', 'Firma (volitelné)')}
            {inp('email', 'Email *', 'email')}
            {inp('password', 'Heslo *', 'password')}

            {error && (
              <div style={{
                background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 8, padding: '10px 14px', color: 'var(--red)',
                fontSize: 13, marginBottom: 16
              }}>{error}</div>
            )}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '14px', background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
              border: 'none', borderRadius: 10, color: '#fff', fontFamily: 'DM Sans',
              fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1, transition: 'opacity 0.2s',
              boxShadow: '0 4px 20px rgba(123,92,240,0.4)'
            }}>
              {loading ? 'Načítám...' : mode === 'login' ? 'Přihlásit se →' : 'Vytvořit účet →'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
