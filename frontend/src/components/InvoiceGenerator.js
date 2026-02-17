import React, { useState, useEffect, useCallback } from 'react';

const fmt = (n) => {
  if (!n && n !== 0) return '0 Kč';
  const num = Math.round(Number(n));
  const s = num.toString();
  const formatted = s.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
  return formatted + '\u00a0Kč';
};
const fmtDate = (d) => new Date(d).toLocaleDateString('cs-CZ', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtDateInput = (d) => new Date(d).toISOString().split('T')[0];

const STATUS = {
  paid:      { label: 'Zaplaceno',     color: 'var(--green)',  bg: 'var(--green-dim)' },
  pending:   { label: 'Čeká',          color: 'var(--yellow)', bg: 'var(--yellow-dim)' },
  overdue:   { label: 'Po splatnosti', color: 'var(--red)',    bg: 'var(--red-dim)' },
  cancelled: { label: 'Zrušeno',       color: 'var(--text3)',  bg: 'rgba(255,255,255,0.05)' },
};

export default function InvoiceGenerator({ API, token }) {
  const [invoices, setInvoices] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState(null);
  const [payModal, setPayModal] = useState(null);
  const [txHash, setTxHash] = useState('');

  const H = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (filter !== 'all') params.set('status', filter);
    if (search) params.set('search', search);
    const res = await fetch(`${API}/invoices?${params}`, { headers: H });
    setInvoices(await res.json());
    setLoading(false);
  }, [filter, search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    fetch(`${API}/wallets`, { headers: H }).then(r => r.json()).then(setWallets);
  }, []);

  const confirmPayment = async (verifiedInvoice) => {
    if (!payModal) return;
    if (verifiedInvoice?.status === 'paid') {
      setPayModal(null); setTxHash('');
      load();
      if (selected?.id === verifiedInvoice.id) setSelected(verifiedInvoice);
      return;
    }
    await fetch(`${API}/invoices/${payModal.id}/status`, {
      method: 'PATCH', headers: H,
      body: JSON.stringify({ status: 'paid', txHash })
    });
    setPayModal(null); setTxHash(''); load();
    if (selected?.id === payModal.id) {
      const r = await fetch(`${API}/invoices/${payModal.id}`, { headers: H });
      setSelected(await r.json());
    }
  };

  const deleteInvoice = async (id) => {
    if (!window.confirm('Opravdu smazat tuto fakturu?')) return;
    await fetch(`${API}/invoices/${id}`, { method: 'DELETE', headers: H });
    load();
    if (selected?.id === id) setSelected(null);
  };

  const downloadPDF = (inv) => {
    const a = document.createElement('a');
    a.href = `${API}/invoices/${inv.id}/pdf`;
    a.download = `faktura-${inv.invoiceNumber}.pdf`;
    // Include auth header via fetch + blob
    fetch(`${API}/invoices/${inv.id}/pdf`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `faktura-${inv.invoiceNumber}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      });
  };

  if (selected) return (
    <InvoiceDetail
      invoice={selected} API={API} token={token}
      onBack={() => setSelected(null)}
      onPay={() => setPayModal(selected)}
      onDelete={() => deleteInvoice(selected.id)}
      onDownload={() => downloadPDF(selected)}
      payModal={payModal} setPayModal={setPayModal}
      txHash={txHash} setTxHash={setTxHash}
      onConfirmPayment={confirmPayment}
    />
  );

  return (
    <div style={{ padding: '36px', animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>Faktury</h2>
          <p style={{ color: 'var(--text3)', fontSize: 14, marginTop: 4 }}>{invoices.length} faktur</p>
        </div>
        <button onClick={() => setShowCreate(true)} style={{
          padding: '12px 22px', background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
          border: 'none', borderRadius: 10, color: '#fff', fontFamily: 'DM Sans',
          fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 16px rgba(123,92,240,0.35)'
        }}>+ Nová faktura</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          {['all', 'pending', 'paid', 'overdue'].map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{
              padding: '9px 16px', border: 'none', cursor: 'pointer',
              background: filter === s ? 'var(--accent)' : 'transparent',
              color: filter === s ? '#fff' : 'var(--text2)',
              fontFamily: 'DM Sans', fontWeight: 600, fontSize: 13, transition: 'all 0.15s'
            }}>
              {s === 'all' ? 'Vše' : STATUS[s]?.label}
            </button>
          ))}
        </div>
        <input placeholder="Hledat klienta, číslo..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: '10px 16px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', fontFamily: 'DM Sans', fontSize: 13, outline: 'none' }}
          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'} />
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.3fr 0.9fr 0.9fr 0.7fr 0.8fr', padding: '12px 20px', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {['Číslo', 'Klient', 'Částka', 'Splatnost', 'Stav', 'Akce'].map(h => <span key={h}>{h}</span>)}
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>Načítám...</div>
        ) : !invoices.length ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
            <div style={{ color: 'var(--text3)', fontSize: 15, marginBottom: 16 }}>
              {search || filter !== 'all' ? 'Žádné faktury neodpovídají filtru' : 'Zatím žádné faktury'}
            </div>
            {!search && filter === 'all' && (
              <button onClick={() => setShowCreate(true)} style={{ padding: '10px 20px', background: 'var(--accent)', border: 'none', borderRadius: 10, color: '#fff', fontFamily: 'DM Sans', fontWeight: 700, cursor: 'pointer' }}>+ Vytvořit první fakturu</button>
            )}
          </div>
        ) : invoices.map((inv, i) => {
          const sc = STATUS[inv.status] || STATUS.pending;
          return (
            <div key={inv.id} style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.3fr 0.9fr 0.9fr 0.7fr 0.8fr', padding: '15px 20px', borderBottom: i < invoices.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'center', cursor: 'pointer', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              onClick={() => setSelected(inv)}>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: 'var(--accent2)' }}>{inv.invoiceNumber}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{inv.clientName}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{inv.clientEmail}</div>
              </div>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12, fontWeight: 700 }}>{fmt(inv.total)}</span>
              <span style={{ fontSize: 12, color: new Date(inv.dueDate) < new Date() && inv.status !== 'paid' ? 'var(--red)' : 'var(--text2)' }}>{fmtDate(inv.dueDate)}</span>
              <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, color: sc.color, background: sc.bg }}>{sc.label}</span>
              <div style={{ display: 'flex', gap: 5 }} onClick={e => e.stopPropagation()}>
                <button onClick={() => downloadPDF(inv)} title="Stáhnout PDF" style={{ padding: '5px 8px', background: 'rgba(123,92,240,0.12)', border: '1px solid rgba(123,92,240,0.25)', borderRadius: 7, color: 'var(--accent2)', fontSize: 11, cursor: 'pointer' }}>PDF</button>
                {inv.status === 'pending' && (
                  <button onClick={() => setPayModal(inv)} style={{ padding: '5px 9px', background: 'var(--green-dim)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 7, color: 'var(--green)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>✓</button>
                )}
                <button onClick={() => deleteInvoice(inv.id)} style={{ padding: '5px 8px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text3)', fontSize: 11, cursor: 'pointer' }}>🗑</button>
              </div>
            </div>
          );
        })}
      </div>

      {payModal && <PayModal invoice={payModal} txHash={txHash} setTxHash={setTxHash} onConfirm={confirmPayment} onClose={() => { setPayModal(null); setTxHash(''); }} API={API} token={token} />}
      {showCreate && <CreateModal API={API} token={token} wallets={wallets} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(); }} />}
    </div>
  );
}

// ── INVOICE DETAIL ────────────────────────────────────────────────────────────
function InvoiceDetail({ invoice, API, token, onBack, onPay, onDelete, onDownload, payModal, setPayModal, txHash, setTxHash, onConfirmPayment }) {
  const sc = STATUS[invoice.status] || STATUS.pending;
  return (
    <div style={{ padding: '36px', animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <button onClick={onBack} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', padding: '8px 14px', cursor: 'pointer', fontFamily: 'DM Sans', fontSize: 13 }}>← Zpět</button>
        <h2 style={{ fontSize: 22, fontWeight: 800 }}>{invoice.invoiceNumber}</h2>
        <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, color: sc.color, background: sc.bg }}>{sc.label}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          <button onClick={onDownload} style={{ padding: '10px 18px', background: 'rgba(123,92,240,0.12)', border: '1px solid rgba(123,92,240,0.25)', borderRadius: 10, color: 'var(--accent2)', fontFamily: 'DM Sans', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>⬇ Stáhnout PDF</button>
          {invoice.status === 'pending' && (
            <button onClick={onPay} style={{ padding: '10px 20px', background: 'linear-gradient(135deg, var(--green), #16A34A)', border: 'none', borderRadius: 10, color: '#fff', fontFamily: 'DM Sans', fontWeight: 700, cursor: 'pointer' }}>✓ Potvrdit platbu</button>
          )}
          <button onClick={onDelete} style={{ padding: '10px 16px', background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, color: 'var(--red)', fontFamily: 'DM Sans', fontWeight: 600, cursor: 'pointer' }}>Smazat</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20 }}>
        {/* Left — invoice body */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 28 }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 6 }}>OD</div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{invoice.issuerCompany || invoice.issuerName}</div>
              <div style={{ color: 'var(--text3)', fontSize: 13, marginTop: 2 }}>{invoice.issuerEmail}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 6 }}>PRO</div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{invoice.clientName}</div>
              <div style={{ color: 'var(--text3)', fontSize: 13, marginTop: 2 }}>{invoice.clientEmail}</div>
              {invoice.clientAddress && <div style={{ color: 'var(--text3)', fontSize: 13 }}>{invoice.clientAddress}</div>}
              {invoice.clientIco && <div style={{ color: 'var(--text3)', fontSize: 12 }}>IČO: {invoice.clientIco}</div>}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, padding: 14, background: 'var(--bg3)', borderRadius: 10, marginBottom: 24, flexWrap: 'wrap' }}>
            {[
              { label: 'Vystaveno', value: fmtDate(invoice.createdAt) },
              { label: 'Splatnost', value: fmtDate(invoice.dueDate) },
              ...(invoice.paidAt ? [{ label: 'Zaplaceno', value: fmtDate(invoice.paidAt) }] : []),
            ].map((f, i, arr) => (
              <React.Fragment key={f.label}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: 4 }}>{f.label.toUpperCase()}</div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{f.value}</div>
                </div>
                {i < arr.length - 1 && <div style={{ width: 1, background: 'var(--border)', alignSelf: 'stretch' }} />}
              </React.Fragment>
            ))}
          </div>

          {/* Items */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                {['Popis', 'Množ.', 'Cena/j.', 'Celkem'].map(h => (
                  <th key={h} style={{ textAlign: h === 'Popis' ? 'left' : 'right', padding: '8px 0', fontSize: 10, color: 'var(--text3)', fontWeight: 700, letterSpacing: '0.07em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 0', fontWeight: 500, fontSize: 14 }}>{item.description}</td>
                  <td style={{ padding: '12px 0', textAlign: 'right', color: 'var(--text3)', fontFamily: 'JetBrains Mono', fontSize: 12 }}>{item.quantity}</td>
                  <td style={{ padding: '12px 0', textAlign: 'right', fontFamily: 'JetBrains Mono', fontSize: 12 }}>{fmt(item.unitPrice)}</td>
                  <td style={{ padding: '12px 0', textAlign: 'right', fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: 13 }}>{fmt(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
            {[['Mezisoučet', fmt(invoice.subtotal)], ...(invoice.taxRate > 0 ? [[`DPH (${invoice.taxRate}%)`, fmt(invoice.tax)]] : [])].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', gap: 40 }}>
                <span style={{ color: 'var(--text3)' }}>{l}</span>
                <span style={{ fontFamily: 'JetBrains Mono' }}>{v}</span>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 40, borderTop: '2px solid var(--border)', paddingTop: 10, marginTop: 4 }}>
              <span style={{ fontWeight: 800, fontSize: 16 }}>Celkem</span>
              <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 800, fontSize: 18, color: 'var(--accent2)' }}>{fmt(invoice.total)}</span>
            </div>
          </div>

          {invoice.note && (
            <div style={{ marginTop: 20, padding: 14, background: 'var(--bg3)', borderRadius: 10, fontSize: 13, color: 'var(--text3)', fontStyle: 'italic' }}>{invoice.note}</div>
          )}
        </div>

        {/* Right — crypto + tx */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {invoice.cryptoCurrency && (
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 22 }}>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.07em', marginBottom: 14 }}>CRYPTO PLATBA</h4>
              <div style={{ background: 'linear-gradient(135deg, rgba(123,92,240,0.1), rgba(59,130,246,0.07))', border: '1px solid rgba(123,92,240,0.2)', borderRadius: 10, padding: 18, textAlign: 'center', marginBottom: 14 }}>
                <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'JetBrains Mono', color: 'var(--accent2)' }}>{invoice.cryptoAmount}</div>
                <div style={{ color: 'var(--text3)', fontSize: 14, marginTop: 4 }}>{invoice.cryptoCurrency}</div>
              </div>
              {invoice.walletAddress && (
                <>
                  <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 700, letterSpacing: '0.07em', marginBottom: 6 }}>ADRESA PENĚŽENKY</div>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, padding: '8px 10px', background: 'var(--bg3)', borderRadius: 7, wordBreak: 'break-all', color: 'var(--text2)' }}>{invoice.walletAddress}</div>
                </>
              )}
            </div>
          )}

          {invoice.txHash && (
            <div style={{ background: 'var(--bg2)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 16, padding: 22 }}>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)', letterSpacing: '0.07em', marginBottom: 10 }}>✓ TX HASH</h4>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, padding: '8px 10px', background: 'var(--bg3)', borderRadius: 7, wordBreak: 'break-all', color: 'var(--text2)' }}>{invoice.txHash}</div>
              {invoice.verificationDetails?.confirmations !== undefined && (
                <div style={{ marginTop: 10, fontSize: 12, color: 'var(--green)' }}>
                  ✓ {invoice.verificationDetails.confirmations} potvrzení on-chain
                </div>
              )}
            </div>
          )}

          <button onClick={onDownload} style={{ padding: '14px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text2)', fontFamily: 'DM Sans', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent2)'; e.currentTarget.style.color = 'var(--accent2)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text2)'; }}>
            ⬇ Stáhnout PDF fakturu
          </button>
        </div>
      </div>

      {payModal && <PayModal invoice={payModal} txHash={txHash} setTxHash={setTxHash} onConfirm={onConfirmPayment} onClose={() => { setPayModal(null); setTxHash(''); }} API={API} token={token} />}
    </div>
  );
}

// ── PAY MODAL with on-chain verify ────────────────────────────────────────────
function PayModal({ invoice, txHash, setTxHash, onConfirm, onClose, API, token }) {
  const [verifying, setVerifying] = React.useState(false);
  const [result, setResult] = React.useState(null);

  const canVerify = invoice.cryptoCurrency && invoice.walletAddress && ['ETH', 'BTC', 'USDC'].includes(invoice.cryptoCurrency);

  const verify = async () => {
    if (!txHash.trim()) return;
    setVerifying(true); setResult(null);
    try {
      const res = await fetch(`${API}/invoices/${invoice.id}/verify-payment`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ txHash })
      });
      const data = await res.json();
      if (res.ok && data.verified) {
        setResult({ ok: true, message: data.message, details: data.details });
        setTimeout(() => onConfirm(data.invoice), 1500);
      } else {
        setResult({ ok: false, message: data.error });
      }
    } catch (e) { setResult({ ok: false, message: 'Chyba sítě: ' + e.message }); }
    finally { setVerifying(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }} onClick={onClose}>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 20, padding: 32, maxWidth: 500, width: '100%', animation: 'fadeIn 0.2s ease' }} onClick={e => e.stopPropagation()}>
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', margin: '0 auto 12px', background: result?.ok ? 'var(--green-dim)' : 'rgba(123,92,240,0.12)', border: `1px solid ${result?.ok ? 'rgba(34,197,94,0.3)' : 'rgba(123,92,240,0.3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, transition: 'all 0.3s' }}>
            {result?.ok ? '✓' : '⛓'}
          </div>
          <h3 style={{ fontSize: 19, fontWeight: 800 }}>Potvrdit platbu</h3>
          <p style={{ color: 'var(--text3)', fontSize: 13, marginTop: 5 }}>{invoice.clientName} — {invoice.invoiceNumber}</p>
        </div>

        <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: 14, marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: invoice.cryptoAmount ? 7 : 0 }}>
            <span style={{ color: 'var(--text3)', fontSize: 13 }}>Částka</span>
            <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 700 }}>{fmt(invoice.total)}</span>
          </div>
          {invoice.cryptoAmount && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text3)', fontSize: 13 }}>Crypto</span>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: 'var(--accent2)' }}>{invoice.cryptoAmount} {invoice.cryptoCurrency}</span>
            </div>
          )}
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.06em', display: 'block', marginBottom: 7 }}>
            HASH TRANSAKCE {canVerify ? '*' : '(volitelné)'}
          </label>
          <input placeholder={invoice.cryptoCurrency === 'BTC' ? 'abc123...' : '0xabc123...'} value={txHash}
            onChange={e => { setTxHash(e.target.value); setResult(null); }}
            style={{ width: '100%', padding: '11px 14px', background: 'var(--bg3)', border: `1px solid ${result ? (result.ok ? 'rgba(34,197,94,0.5)' : 'rgba(239,68,68,0.5)') : 'var(--border)'}`, borderRadius: 10, color: 'var(--text)', fontFamily: 'JetBrains Mono', fontSize: 12, outline: 'none', transition: 'border 0.2s' }} />
        </div>

        {result && (
          <div style={{ borderRadius: 10, padding: '12px 14px', marginBottom: 14, background: result.ok ? 'var(--green-dim)' : 'var(--red-dim)', border: `1px solid ${result.ok ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`, animation: 'fadeIn 0.2s ease' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: result.ok ? 'var(--green)' : 'var(--red)' }}>
              {result.ok ? '✓' : '✕'} {result.message}
            </div>
            {result.ok && result.details?.confirmations !== undefined && (
              <div style={{ fontSize: 11, color: 'var(--text2)', fontFamily: 'JetBrains Mono', marginTop: 4 }}>
                Potvrzení: {result.details.confirmations} · Přijato: {result.details.valueEth || result.details.valueReceived} {invoice.cryptoCurrency}
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text2)', fontFamily: 'DM Sans', fontWeight: 600, cursor: 'pointer' }}>Zrušit</button>
          {canVerify ? (
            <button onClick={verify} disabled={verifying || !txHash.trim() || result?.ok} style={{ flex: 2, padding: '12px', border: 'none', borderRadius: 10, fontFamily: 'DM Sans', fontWeight: 700, fontSize: 13, cursor: verifying || !txHash.trim() ? 'not-allowed' : 'pointer', background: result?.ok ? 'linear-gradient(135deg, var(--green), #16A34A)' : 'linear-gradient(135deg, #3B82F6, #1D4ED8)', color: '#fff', opacity: verifying || !txHash.trim() ? 0.65 : 1, transition: 'all 0.3s' }}>
              {verifying ? '⏳ Ověřuji...' : result?.ok ? '✓ Ověřeno!' : `⛓ Ověřit ${invoice.cryptoCurrency} on-chain`}
            </button>
          ) : (
            <button onClick={() => onConfirm()} style={{ flex: 2, padding: '12px', background: 'linear-gradient(135deg, var(--green), #16A34A)', border: 'none', borderRadius: 10, color: '#fff', fontFamily: 'DM Sans', fontWeight: 700, cursor: 'pointer' }}>✓ Potvrdit manuálně</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── CREATE INVOICE MODAL ──────────────────────────────────────────────────────
function CreateModal({ API, token, wallets, onClose, onCreated }) {
  const [form, setForm] = useState({
    clientName: '', clientEmail: '', clientAddress: '', clientIco: '',
    items: [{ description: '', quantity: '1', unitPrice: '' }],
    cryptoCurrency: 'ETH', walletAddress: wallets[0]?.address || '',
    dueDate: fmtDateInput(Date.now() + 14 * 86400000),
    tax: '21', note: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));
  const setItem = (idx, field, val) => {
    const items = [...form.items];
    items[idx] = { ...items[idx], [field]: val };
    setForm(f => ({ ...f, items }));
  };

  const subtotal = form.items.reduce((s, i) => s + ((parseFloat(i.quantity) || 0) * (parseFloat(i.unitPrice) || 0)), 0);
  const taxAmt = Math.round(subtotal * ((parseFloat(form.tax) || 0) / 100));
  const total = subtotal + taxAmt;

  const submit = async () => {
    if (!form.clientName || !form.clientEmail) return setError('Vyplňte klienta a email');
    if (form.items.some(i => !i.description)) return setError('Vyplňte popis u všech položek');
    setError(''); setSaving(true);
    try {
      const res = await fetch(`${API}/invoices`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, tax: parseFloat(form.tax) || 0 })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onCreated();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const inp = (label, field, type = 'text', placeholder = '', required = false) => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>{label}{required ? ' *' : ''}</label>
      <input type={type} placeholder={placeholder} value={form[field]}
        onChange={e => set(field, e.target.value)}
        style={{ width: '100%', padding: '11px 14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', fontFamily: type === 'date' ? 'JetBrains Mono' : 'DM Sans', fontSize: 14, outline: 'none' }}
        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'} />
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', zIndex: 1000 }}>
      <div style={{ width: '100%', maxWidth: 560, height: '100vh', background: 'var(--bg2)', borderLeft: '1px solid var(--border)', overflow: 'auto', padding: 32, animation: 'slideIn 0.25s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 26 }}>
          <h3 style={{ fontSize: 20, fontWeight: 800 }}>Nová faktura</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>

        {inp('KLIENT', 'clientName', 'text', 'Název klienta', true)}
        {inp('EMAIL KLIENTA', 'clientEmail', 'email', 'email@klient.cz', true)}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {inp('ADRESA', 'clientAddress', 'text', 'Ulice, Město')}
          {inp('IČO', 'clientIco', 'text', '12345678')}
        </div>

        {/* Items */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.06em' }}>POLOŽKY *</label>
            <button onClick={() => setForm(f => ({ ...f, items: [...f.items, { description: '', quantity: '1', unitPrice: '' }] }))}
              style={{ fontSize: 12, color: 'var(--accent2)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>+ Přidat</button>
          </div>

          {/* Header row */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 0.55fr 1.1fr auto', gap: 6, marginBottom: 4 }}>
            {['Popis', 'Množ.', 'Cena / ks', ''].map(h => (
              <div key={h} style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.06em', paddingLeft: 4 }}>{h}</div>
            ))}
          </div>

          {form.items.map((item, idx) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 0.55fr 1.1fr auto', gap: 6, marginBottom: 6 }}>
              <input placeholder="Název služby/zboží" value={item.description}
                onChange={e => setItem(idx, 'description', e.target.value)}
                style={{ padding: '10px 12px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontFamily: 'DM Sans', fontSize: 13, outline: 'none' }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
              <input type="number" placeholder="1" min="0.01" step="0.01" value={item.quantity}
                onChange={e => setItem(idx, 'quantity', e.target.value)}
                style={{ padding: '10px 10px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontFamily: 'JetBrains Mono', fontSize: 13, outline: 'none', textAlign: 'center', width: '100%' }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
              {/* Price input with Kč suffix */}
              <div style={{ position: 'relative' }}>
                <input type="number" placeholder="0" min="0" step="1" value={item.unitPrice}
                  onChange={e => setItem(idx, 'unitPrice', e.target.value)}
                  style={{ width: '100%', padding: '10px 40px 10px 12px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontFamily: 'JetBrains Mono', fontSize: 13, outline: 'none', textAlign: 'right' }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--text3)', fontWeight: 600, pointerEvents: 'none', userSelect: 'none' }}>Kč</span>
              </div>
              <button onClick={() => form.items.length > 1 && setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))}
                style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, color: form.items.length > 1 ? 'var(--text3)' : 'transparent', padding: '0 10px', cursor: form.items.length > 1 ? 'pointer' : 'default' }}>✕</button>

              {/* Live total for row */}
              {(parseFloat(item.quantity) > 0 && parseFloat(item.unitPrice) > 0) && (
                <div style={{ gridColumn: '2 / 5', textAlign: 'right', fontSize: 11, color: 'var(--accent2)', fontFamily: 'JetBrains Mono', fontWeight: 700, marginTop: -2 }}>
                  = {fmt((parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>DPH (%)</label>
            <select value={form.tax} onChange={e => set('tax', e.target.value)}
              style={{ width: '100%', padding: '11px 14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', fontFamily: 'DM Sans', fontSize: 14, outline: 'none' }}>
              <option value="0">0% (osvobozeno / reverse charge)</option>
              <option value="12">12%</option>
              <option value="21">21%</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>SPLATNOST</label>
            <input type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)}
              style={{ width: '100%', padding: '11px 14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', fontFamily: 'JetBrains Mono', fontSize: 13, outline: 'none' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>CRYPTO MĚNA</label>
            <select value={form.cryptoCurrency} onChange={e => set('cryptoCurrency', e.target.value)}
              style={{ width: '100%', padding: '11px 14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', fontFamily: 'DM Sans', fontSize: 14, outline: 'none' }}>
              <option value="">Bez crypto</option>
              <option value="ETH">ETH — Ethereum</option>
              <option value="BTC">BTC — Bitcoin</option>
              <option value="USDC">USDC — USD Coin</option>
              <option value="SOL">SOL — Solana</option>
              <option value="LN">LN — Lightning Network</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>PENĚŽENKA</label>
            <select value={form.walletAddress} onChange={e => set('walletAddress', e.target.value)}
              style={{ width: '100%', padding: '11px 14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', fontFamily: 'DM Sans', fontSize: 14, outline: 'none' }}>
              <option value="">Žádná</option>
              {wallets.map(w => <option key={w.id} value={w.address}>{w.name} ({w.currency})</option>)}
            </select>
          </div>
        </div>

        {inp('POZNÁMKA', 'note', 'text', 'Volitelná poznámka...')}

        {/* Total preview */}
        <div style={{ background: 'var(--bg3)', borderRadius: 12, padding: 16, marginBottom: 18 }}>
          {[['Mezisoučet', fmt(subtotal)], ...(parseFloat(form.tax) > 0 ? [[`DPH (${form.tax}%)`, fmt(taxAmt)]] : [])].map(([l, v]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
              <span style={{ color: 'var(--text3)', fontSize: 13 }}>{l}</span>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 13 }}>{v}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 4 }}>
            <span style={{ fontWeight: 800 }}>Celkem</span>
            <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 800, fontSize: 17, color: 'var(--accent2)' }}>{fmt(total)}</span>
          </div>
        </div>

        {error && <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', color: 'var(--red)', fontSize: 13, marginBottom: 14 }}>{error}</div>}

        <button onClick={submit} disabled={saving} style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, var(--accent), var(--accent2))', border: 'none', borderRadius: 12, color: '#fff', fontFamily: 'DM Sans', fontWeight: 700, fontSize: 15, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 4px 20px rgba(123,92,240,0.4)', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Vytvářím...' : '⚡ Vytvořit fakturu'}
        </button>
      </div>
      <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
    </div>
  );
}
