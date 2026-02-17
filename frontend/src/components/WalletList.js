import React, { useState, useEffect } from 'react';

const fmtUSD = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

const CURRENCIES = [
  { value: 'ETH', label: 'Ethereum (ETH)', color: '#627EEA' },
  { value: 'BTC', label: 'Bitcoin (BTC)', color: '#F7931A' },
  { value: 'USDC', label: 'USD Coin (USDC)', color: '#2775CA' },
  { value: 'SOL', label: 'Solana (SOL)', color: '#9945FF' },
  { value: 'LN', label: 'Lightning Network (LN)', color: '#F7931A' },
];

const PALETTE = ['#6C63FF', '#F7931A', '#2775CA', '#22C55E', '#EF4444', '#9945FF', '#F59E0B', '#8247E5'];

export default function WalletList({ API, token }) {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', currency: 'ETH', color: '#6C63FF' });
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(null);

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchWallets = () => {
    fetch(`${API}/wallets`, { headers })
      .then(r => r.json())
      .then(data => { setWallets(data); setLoading(false); });
  };

  useEffect(fetchWallets, []);

  const totalUSD = wallets.reduce((s, w) => s + w.usdValue, 0);

  const copyAddress = (address, id) => {
    navigator.clipboard.writeText(address).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const createWallet = async () => {
    setError(''); setCreating(true);
    try {
      const res = await fetch(`${API}/wallets`, { method: 'POST', headers, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShowAdd(false);
      setForm({ name: '', address: '', currency: 'ETH', color: '#6C63FF' });
      fetchWallets();
    } catch (e) { setError(e.message); }
    finally { setCreating(false); }
  };

  const deleteWallet = async (id) => {
    if (!window.confirm('Smazat tuto peněženku?')) return;
    await fetch(`${API}/wallets/${id}`, { method: 'DELETE', headers });
    fetchWallets();
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  return (
    <div style={{ padding: '36px', animation: 'fadeIn 0.3s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>Peněženky</h2>
          <p style={{ color: 'var(--text3)', fontSize: 14, marginTop: 4 }}>{wallets.length} peněženek · portfolio {fmtUSD(totalUSD)}</p>
        </div>
        <button onClick={() => setShowAdd(true)} style={{
          padding: '12px 22px', background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
          border: 'none', borderRadius: 10, color: '#fff', fontFamily: 'DM Sans',
          fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 16px rgba(123,92,240,0.35)'
        }}>+ Přidat peněženku</button>
      </div>

      {/* Total portfolio card */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(123,92,240,0.15), rgba(59,130,246,0.08))',
        border: '1px solid rgba(123,92,240,0.2)', borderRadius: 20, padding: '28px 32px',
        marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.1em', marginBottom: 10 }}>CELKOVÁ HODNOTA PORTFOLIA</div>
          <div style={{ fontSize: 36, fontWeight: 800, fontFamily: 'JetBrains Mono', letterSpacing: '-0.03em' }}>{fmtUSD(totalUSD)}</div>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          {wallets.slice(0, 3).map(w => (
            <div key={w.id} style={{ textAlign: 'center' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, margin: '0 auto 8px',
                background: `${w.color}22`, border: `1px solid ${w.color}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 800, color: w.color
              }}>{w.currency[0]}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>{w.currency}</div>
              <div style={{ fontSize: 12, fontWeight: 700, fontFamily: 'JetBrains Mono' }}>{w.balance}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Wallet grid */}
      {wallets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 80 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⬡</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Žádné peněženky</h3>
          <p style={{ color: 'var(--text3)', marginBottom: 24 }}>Přidejte svou první crypto peněženku</p>
          <button onClick={() => setShowAdd(true)} style={{
            padding: '12px 24px', background: 'var(--accent)', border: 'none',
            borderRadius: 10, color: '#fff', fontFamily: 'DM Sans', fontWeight: 700, cursor: 'pointer'
          }}>+ Přidat peněženku</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {wallets.map(wallet => (
            <WalletCard key={wallet.id} wallet={wallet}
              onCopy={() => copyAddress(wallet.address, wallet.id)}
              copied={copied === wallet.id}
              onDelete={() => deleteWallet(wallet.id)}
            />
          ))}
        </div>
      )}

      {/* Add wallet modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
          onClick={() => setShowAdd(false)}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 20, padding: 32, maxWidth: 480, width: '100%', animation: 'fadeIn 0.2s ease' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontSize: 20, fontWeight: 800 }}>Přidat peněženku</h3>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>

            {[
              { label: 'NÁZEV PENĚŽENKY *', field: 'name', placeholder: 'Např. Hlavní ETH peněženka' },
              { label: 'ADRESA PENĚŽENKY *', field: 'address', placeholder: '0x... nebo bc1q...', mono: true },
            ].map(({ label, field, placeholder, mono }) => (
              <div key={field} style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>{label}</label>
                <input placeholder={placeholder} value={form[field]}
                  onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                  style={{
                    width: '100%', padding: '11px 14px', background: 'var(--bg3)',
                    border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)',
                    fontFamily: mono ? 'JetBrains Mono' : 'DM Sans', fontSize: mono ? 12 : 14, outline: 'none'
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
            ))}

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>MĚNA *</label>
              <select value={form.currency} onChange={e => {
                const curr = CURRENCIES.find(c => c.value === e.target.value);
                setForm(f => ({ ...f, currency: e.target.value, color: curr?.color || '#6C63FF' }));
              }} style={{
                width: '100%', padding: '11px 14px', background: 'var(--bg3)', border: '1px solid var(--border)',
                borderRadius: 10, color: 'var(--text)', fontFamily: 'DM Sans', fontSize: 14, outline: 'none'
              }}>
                {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.06em', display: 'block', marginBottom: 10 }}>BARVA</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {PALETTE.map(color => (
                  <button key={color} onClick={() => setForm(f => ({ ...f, color }))} style={{
                    width: 28, height: 28, borderRadius: '50%', background: color, border: 'none',
                    cursor: 'pointer', outline: form.color === color ? `3px solid ${color}` : 'none',
                    outlineOffset: 2, transform: form.color === color ? 'scale(1.15)' : 'scale(1)',
                    transition: 'all 0.15s'
                  }} />
                ))}
              </div>
            </div>

            {error && <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', color: 'var(--red)', fontSize: 13, marginBottom: 16 }}>{error}</div>}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text2)', fontFamily: 'DM Sans', fontWeight: 600, cursor: 'pointer' }}>Zrušit</button>
              <button onClick={createWallet} disabled={creating || !form.name || !form.address} style={{
                flex: 1, padding: '12px', background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                border: 'none', borderRadius: 10, color: '#fff', fontFamily: 'DM Sans', fontWeight: 700,
                cursor: 'pointer', opacity: creating || !form.name || !form.address ? 0.6 : 1
              }}>{creating ? 'Přidávám...' : '+ Přidat'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WalletCard({ wallet, onCopy, copied, onDelete }) {
  const shortAddr = wallet.address ? `${wallet.address.slice(0, 8)}...${wallet.address.slice(-6)}` : '';

  return (
    <div style={{
      background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16,
      overflow: 'hidden', transition: 'border-color 0.2s, transform 0.2s'
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = wallet.color + '66'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {/* Color stripe */}
      <div style={{ height: 4, background: `linear-gradient(90deg, ${wallet.color}, ${wallet.color}88)` }} />

      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: `${wallet.color}22`, border: `1px solid ${wallet.color}44`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 800, color: wallet.color, fontFamily: 'JetBrains Mono'
            }}>{wallet.currency[0]}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{wallet.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>{wallet.currency}</div>
            </div>
          </div>
          <button onClick={onDelete} style={{
            background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer',
            fontSize: 14, padding: '4px', borderRadius: 6, transition: 'color 0.15s'
          }}
            onMouseEnter={e => e.target.style.color = 'var(--red)'}
            onMouseLeave={e => e.target.style.color = 'var(--text3)'}
          >🗑</button>
        </div>

        {/* Balance */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'JetBrains Mono', letterSpacing: '-0.02em', marginBottom: 4 }}>
            {wallet.balance} <span style={{ fontSize: 14, color: 'var(--text3)' }}>{wallet.currency}</span>
          </div>
          <div style={{ fontSize: 14, color: 'var(--text3)' }}>{fmtUSD(wallet.usdValue)}</div>
        </div>

        {/* Address */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
          background: 'var(--bg3)', borderRadius: 8, cursor: 'pointer'
        }} onClick={onCopy}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--bg3)'}
        >
          <span style={{ flex: 1, fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--text3)' }}>{shortAddr}</span>
          <span style={{ fontSize: 11, color: copied ? 'var(--green)' : wallet.color, fontWeight: 700, transition: 'color 0.2s' }}>
            {copied ? '✓ Zkopírováno' : 'Kopírovat'}
          </span>
        </div>
      </div>
    </div>
  );
}
