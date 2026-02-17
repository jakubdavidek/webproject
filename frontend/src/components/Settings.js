import React, { useState, useEffect } from 'react';

export default function Settings({ API, token, user, onUpdate, currency, setCurrency, theme, setTheme }) {
  const [form, setForm] = useState({ name: user?.name || '', company: user?.company || '' });
  const [pwdForm, setPwdForm] = useState({ current: '', newPwd: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const H = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  useEffect(() => {
    if (user) setForm({ name: user.name || '', company: user.company || '' });
  }, [user]);

  const flash = (ok, text) => {
    if (ok) { setMsg(text); setErr(''); setTimeout(() => setMsg(''), 3500); }
    else { setErr(text); setMsg(''); }
  };

  const saveProfile = async () => {
    setSaving(true); setErr('');
    try {
      const res = await fetch(`${API}/auth/profile`, {
        method: 'PATCH', headers: H,
        body: JSON.stringify({ name: form.name, company: form.company })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onUpdate(data);
      flash(true, '✓ Profil uložen');
    } catch (e) { flash(false, e.message); }
    finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (pwdForm.newPwd !== pwdForm.confirm) return flash(false, 'Nová hesla se neshodují');
    if (pwdForm.newPwd.length < 6) return flash(false, 'Heslo musí mít alespoň 6 znaků');
    setChangingPwd(true); setErr('');
    try {
      const res = await fetch(`${API}/auth/change-password`, {
        method: 'POST', headers: H,
        body: JSON.stringify({ currentPassword: pwdForm.current, newPassword: pwdForm.newPwd })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      flash(true, '✓ Heslo bylo změněno');
      setPwdForm({ current: '', newPwd: '', confirm: '' });
    } catch (e) { flash(false, e.message); }
    finally { setChangingPwd(false); }
  };

  const Input = ({ label, value, onChange, type = 'text', placeholder = '' }) => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.07em', display: 'block', marginBottom: 7 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', padding: '11px 14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', fontFamily: 'DM Sans', fontSize: 14, outline: 'none', transition: 'border 0.2s' }}
        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'} />
    </div>
  );

  const Card = ({ title, subtitle, children }) => (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, marginBottom: 20 }}>
      <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>{title}</h3>
      <p style={{ color: 'var(--text3)', fontSize: 13, marginBottom: 24 }}>{subtitle}</p>
      {children}
    </div>
  );

  return (
    <div style={{ padding: '36px', animation: 'fadeIn 0.3s ease', maxWidth: 720 }}>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>Nastavení</h2>
        <p style={{ color: 'var(--text3)', fontSize: 14, marginTop: 4 }}>Správa účtu a předvoleb</p>
      </div>

      {msg && <div style={{ background: 'var(--green-dim)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, padding: '12px 16px', color: 'var(--green)', fontSize: 14, marginBottom: 20, animation: 'fadeIn 0.2s' }}>{msg}</div>}
      {err && <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 16px', color: 'var(--red)', fontSize: 14, marginBottom: 20, animation: 'fadeIn 0.2s' }}>{err}</div>}

      {/* Appearance */}
      <Card title="Vzhled" subtitle="Přizpůsobte vizuální styl aplikace">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 0 }}>
          {['dark', 'light'].map(t => (
            <button key={t} onClick={() => setTheme(t)} style={{
              padding: '16px', borderRadius: 12, cursor: 'pointer', fontFamily: 'DM Sans',
              border: `2px solid ${theme === t ? 'var(--accent)' : 'var(--border)'}`,
              background: theme === t ? 'rgba(123,92,240,0.1)' : 'var(--bg3)',
              color: theme === t ? 'var(--accent2)' : 'var(--text2)',
              transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600
            }}>
              <span style={{ fontSize: 20 }}>{t === 'dark' ? '🌙' : '☀️'}</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{t === 'dark' ? 'Tmavý' : 'Světlý'}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 400 }}>{t === 'dark' ? 'Výchozí tmavé rozhraní' : 'Světlé rozhraní'}</div>
              </div>
              {theme === t && <span style={{ marginLeft: 'auto', color: 'var(--accent)', fontSize: 16 }}>✓</span>}
            </button>
          ))}
        </div>
      </Card>

      {/* Currency */}
      <Card title="Měna" subtitle="Výchozí měna pro zobrazení hodnot a portfolia">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[
            { code: 'CZK', label: 'Česká koruna', symbol: 'Kč', flag: '🇨🇿' },
            { code: 'USD', label: 'Americký dolar', symbol: '$', flag: '🇺🇸' },
            { code: 'EUR', label: 'Euro', symbol: '€', flag: '🇪🇺' },
          ].map(c => (
            <button key={c.code} onClick={() => setCurrency(c.code)} style={{
              padding: '16px 12px', borderRadius: 12, cursor: 'pointer', fontFamily: 'DM Sans',
              border: `2px solid ${currency === c.code ? 'var(--accent)' : 'var(--border)'}`,
              background: currency === c.code ? 'rgba(123,92,240,0.1)' : 'var(--bg3)',
              color: currency === c.code ? 'var(--accent2)' : 'var(--text2)',
              transition: 'all 0.2s', textAlign: 'center'
            }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{c.flag}</div>
              <div style={{ fontWeight: 800, fontSize: 18, fontFamily: 'JetBrains Mono', marginBottom: 2 }}>{c.symbol}</div>
              <div style={{ fontSize: 12, fontWeight: 700 }}>{c.code}</div>
              <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{c.label}</div>
              {currency === c.code && <div style={{ marginTop: 6, fontSize: 12, color: 'var(--accent)' }}>✓ Aktivní</div>}
            </button>
          ))}
        </div>
        <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 14 }}>
          Změna měny ovlivní zobrazení portfolia, hodnot peněženek a statistik na dashboardu.
          Faktury jsou vždy vystavovány v CZK.
        </p>
      </Card>

      {/* Profile */}
      <Card title="Profil" subtitle="Základní informace zobrazené na fakturách">
        <Input label="JMÉNO" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="Vaše celé jméno" />
        <Input label="FIRMA" value={form.company} onChange={v => setForm(f => ({ ...f, company: v }))} placeholder="Název firmy (volitelné)" />
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.07em', display: 'block', marginBottom: 7 }}>EMAIL</label>
          <div style={{ padding: '11px 14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text3)', fontSize: 14, display: 'flex', justifyContent: 'space-between' }}>
            <span>{user?.email}</span>
            <span style={{ fontSize: 11, color: 'var(--text3)', opacity: 0.6 }}>nelze změnit</span>
          </div>
        </div>
        <button onClick={saveProfile} disabled={saving} style={{ padding: '11px 22px', background: 'linear-gradient(135deg, var(--accent), var(--accent2))', border: 'none', borderRadius: 10, color: '#fff', fontFamily: 'DM Sans', fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Ukládám…' : 'Uložit profil'}
        </button>
      </Card>

      {/* Password */}
      <Card title="Změna hesla" subtitle="Aktualizujte přihlašovací heslo">
        <Input label="SOUČASNÉ HESLO" type="password" value={pwdForm.current} onChange={v => setPwdForm(f => ({ ...f, current: v }))} placeholder="Zadejte aktuální heslo" />
        <Input label="NOVÉ HESLO" type="password" value={pwdForm.newPwd} onChange={v => setPwdForm(f => ({ ...f, newPwd: v }))} placeholder="Alespoň 6 znaků" />
        <Input label="POTVRDIT NOVÉ HESLO" type="password" value={pwdForm.confirm} onChange={v => setPwdForm(f => ({ ...f, confirm: v }))} placeholder="Zopakujte nové heslo" />
        <button onClick={changePassword} disabled={changingPwd || !pwdForm.current || !pwdForm.newPwd || !pwdForm.confirm}
          style={{ padding: '11px 22px', background: 'linear-gradient(135deg, var(--accent), var(--accent2))', border: 'none', borderRadius: 10, color: '#fff', fontFamily: 'DM Sans', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: changingPwd || !pwdForm.current || !pwdForm.newPwd || !pwdForm.confirm ? 0.55 : 1 }}>
          {changingPwd ? 'Měním…' : 'Změnit heslo'}
        </button>
      </Card>
    </div>
  );
}
