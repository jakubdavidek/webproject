import React, { useState, useEffect, useContext } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { CurrencyContext } from '../App';

// ─── FORMATTING ───────────────────────────────────────────────────────────────
const CURRENCY_CONFIG = {
  CZK: { locale: 'cs-CZ', code: 'CZK', symbol: 'Kč' },
  USD: { locale: 'en-US', code: 'USD', symbol: '$' },
  EUR: { locale: 'de-DE', code: 'EUR', symbol: '€' },
};

// Conversion rates from CZK
const TO_CZK = 1;
const CZK_TO = { CZK: 1, USD: 1/23, EUR: 1/25.5 };

function fmtVal(val, currency) {
  const num = Math.round(val * 100) / 100;
  if (currency === 'CZK') {
    const s = Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
    return s + '\u00a0Kč';
  }
  if (currency === 'USD') return '$' + num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  if (currency === 'EUR') return '\u20ac' + num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return num.toString();
}

function useFmt() {
  const currency = useContext(CurrencyContext);
  return (czk) => fmtVal(czk * (CZK_TO[currency] || 1), currency);
}

const fmtDate = (d) => new Date(d).toLocaleDateString('cs-CZ', { day: '2-digit', month: 'short' });

const STATUS = {
  paid:      { label: 'Zaplaceno', color: 'var(--green)',  bg: 'var(--green-dim)' },
  pending:   { label: 'Čeká',      color: 'var(--yellow)', bg: 'var(--yellow-dim)' },
  overdue:   { label: 'Po splatnosti', color: 'var(--red)', bg: 'var(--red-dim)' },
  cancelled: { label: 'Zrušeno',   color: 'var(--text3)',  bg: 'rgba(128,128,128,0.1)' },
};

// ─── COINGECKO LIVE PRICES ────────────────────────────────────────────────────
const COINGECKO_IDS = { SOL: 'solana', ETH: 'ethereum', BTC: 'bitcoin', USDC: 'usd-coin' };

async function fetchLivePricesCZK() {
  const ids = Object.values(COINGECKO_IDS).join(',');
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=czk&include_24hr_change=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('CoinGecko API error');
  const data = await res.json();
  return {
    SOL:  { price: data['solana']?.czk || 3200,    change: data['solana']?.czk_24h_change || 0 },
    ETH:  { price: data['ethereum']?.czk || 85000,  change: data['ethereum']?.czk_24h_change || 0 },
    BTC:  { price: data['bitcoin']?.czk || 1550000, change: data['bitcoin']?.czk_24h_change || 0 },
    USDC: { price: data['usd-coin']?.czk || 23,     change: data['usd-coin']?.czk_24h_change || 0 },
  };
}

async function fetchSparklines() {
  const ids = 'solana,ethereum,bitcoin,usd-coin';
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=czk&ids=${ids}&sparkline=true`;
  try {
    const res = await fetch(url);
    if (!res.ok) return {};
    const data = await res.json();
    const out = {};
    data.forEach(coin => {
      const keyMap = { solana: 'SOL', ethereum: 'ETH', bitcoin: 'BTC', 'usd-coin': 'USDC' };
      const k = keyMap[coin.id];
      if (k && coin.sparkline_in_7d?.price) {
        // Sample last 24 points from 7-day data (168 points) for a clean chart
        const prices = coin.sparkline_in_7d.price;
        const step = Math.floor(prices.length / 24);
        out[k] = prices.filter((_, i) => i % step === 0).slice(-24).map((p, i) => ({ i, v: p }));
      }
    });
    return out;
  } catch { return {}; }
}

// ─── PRICE CARD COMPONENT ─────────────────────────────────────────────────────
const COIN_COLORS = { ETH: '#627EEA', BTC: '#F7931A', SOL: '#9945FF', USDC: '#2775CA' };
const COIN_NAMES  = { ETH: 'Ethereum', BTC: 'Bitcoin', SOL: 'Solana', USDC: 'USD Coin' };

function PriceCard({ coin, priceData, sparkline, currency }) {
  if (!priceData) return null;
  const color = COIN_COLORS[coin];
  const change = priceData.change || 0;
  const isUp = change >= 0;

  const displayPrice = (() => {
    const val = priceData.price * (CZK_TO[currency] || 1);
    const cfg = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.CZK;
    const decimals = val < 10 ? 4 : val < 1000 ? 2 : 0;
    return new Intl.NumberFormat(cfg.locale, { style: 'currency', currency: cfg.code, maximumFractionDigits: decimals }).format(val);
  })();

  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px', transition: 'border-color 0.2s, transform 0.15s', overflow: 'hidden' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = color + '66'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: color + '22', border: `1px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color }}>
            {coin[0]}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{coin}</div>
            <div style={{ fontSize: 10, color: 'var(--text3)' }}>{COIN_NAMES[coin]}</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: isUp ? 'var(--green)' : 'var(--red)', background: isUp ? 'var(--green-dim)' : 'var(--red-dim)', padding: '2px 7px', borderRadius: 6 }}>
            {isUp ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
          </div>
          <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 2 }}>24h</div>
        </div>
      </div>

      {/* Price */}
      <div style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: 16, marginBottom: 10 }}>
        {displayPrice}
      </div>

      {/* Sparkline */}
      {sparkline?.length > 0 ? (
        <div style={{ margin: '0 -20px -18px', height: 52 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkline} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`sg-${coin}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#sg-${coin})`} dot={false} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div style={{ height: 34, background: 'var(--bg3)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--text3)' }}>
          Načítám data…
        </div>
      )}
    </div>
  );
}

// ─── CUSTOM CHART TOOLTIP ─────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, fmt }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px' }}>
      <div style={{ color: 'var(--text3)', fontSize: 11, fontFamily: 'DM Sans', marginBottom: 4 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ fontSize: 12, fontFamily: 'JetBrains Mono', color: 'var(--text)', fontWeight: 700 }}>
          {p.name === 'prijmy' ? fmt(p.value) : `${p.value} faktur`}
        </div>
      ))}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function Dashboard({ API, token, setView }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [livePrices, setLivePrices] = useState(null);
  const [pricesLoading, setPricesLoading] = useState(true);
  const [priceError, setPriceError] = useState(false);
  const [sparklines, setSparklines] = useState({});
  const currency = useContext(CurrencyContext);
  const fmt = useFmt();

  // Load dashboard data
  useEffect(() => {
    fetch(`${API}/dashboard/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  // Load live prices from CoinGecko
  useEffect(() => {
    setPricesLoading(true);
    fetchLivePricesCZK()
      .then(prices => { setLivePrices(prices); setPriceError(false); })
      .catch(() => setPriceError(true))
      .finally(() => setPricesLoading(false));

    // Load 7-day sparklines separately (larger request, non-blocking)
    fetchSparklines().then(setSparklines);
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  const { stats, recentInvoices, wallets, monthlyData, statusBreakdown } = data || {};
  const isEmpty = !stats?.invoiceCount;

  // Calculate portfolio value in CZK using live prices
  const portfolioCZK = livePrices && wallets?.length
    ? wallets.reduce((sum, w) => {
        const rate = livePrices[w.currency]?.price || 0;
        return sum + (w.balance * rate);
      }, 0)
    : (stats?.totalWalletValue || 0);

  // Convert portfolio to selected currency
  const portfolioDisplay = (() => {
    const val = portfolioCZK * (CZK_TO[currency] || 1);
    const cfg = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.CZK;
    return new Intl.NumberFormat(cfg.locale, { style: 'currency', currency: cfg.code, maximumFractionDigits: currency === 'CZK' ? 0 : 2 }).format(val);
  })();

  return (
    <div style={{ padding: '36px', animation: 'fadeIn 0.3s ease' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>Dashboard</h2>
        <p style={{ color: 'var(--text3)', fontSize: 14, marginTop: 4 }}>
          {new Date().toLocaleDateString('cs-CZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          {livePrices && !priceError && (
            <span style={{ marginLeft: 12, fontSize: 11, color: 'var(--green)', fontFamily: 'JetBrains Mono' }}>
              ● live kurzy
            </span>
          )}
          {priceError && (
            <span style={{ marginLeft: 12, fontSize: 11, color: 'var(--yellow)', fontFamily: 'JetBrains Mono' }}>
              ⚠ offline kurzy
            </span>
          )}
        </p>
      </div>

      {/* Welcome banner */}
      {isEmpty && (
        <div style={{ background: 'linear-gradient(135deg, rgba(123,92,240,0.1), rgba(59,130,246,0.06))', border: '1px solid rgba(123,92,240,0.18)', borderRadius: 20, padding: '40px 32px', textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 44, marginBottom: 14 }}>₿</div>
          <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Vítejte v cryptofund.cz!</h3>
          <p style={{ color: 'var(--text3)', fontSize: 14, maxWidth: 420, margin: '0 auto 24px' }}>
            Přidejte peněženku a vytvořte první fakturu. Statistiky a grafy se zobrazí automaticky.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={() => setView('wallets')} style={{ padding: '11px 22px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', fontFamily: 'DM Sans', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>⬡ Přidat peněženku</button>
            <button onClick={() => setView('invoices')} style={{ padding: '11px 22px', background: 'linear-gradient(135deg, var(--accent), var(--accent2))', border: 'none', borderRadius: 10, color: '#fff', fontFamily: 'DM Sans', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>+ Vytvořit fakturu</button>
          </div>
        </div>
      )}

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Celkové příjmy', value: fmt(stats?.totalRevenue || 0), icon: '↗', color: 'var(--green)', sub: `${stats?.paidCount || 0} zaplaceno` },
          { label: 'Čeká na platbu', value: fmt(stats?.pendingAmount || 0), icon: '◷', color: 'var(--yellow)', sub: `${stats?.pendingCount || 0} čeká` },
          { label: 'Po splatnosti', value: fmt(stats?.overdueAmount || 0), icon: '⚠', color: 'var(--red)', sub: `${stats?.overdueCount || 0} po splatnosti` },
          {
            label: 'Crypto portfolio',
            value: pricesLoading ? '…' : portfolioDisplay,
            icon: '⬡',
            color: 'var(--accent2)',
            sub: priceError ? 'offline kurzy' : `${wallets?.length || 0} peněženek · live`,
            subColor: priceError ? 'var(--yellow)' : 'var(--green)'
          },
        ].map((s, i) => (
          <div key={i} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: '22px', transition: 'border-color 0.2s, transform 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-bright)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{s.label}</span>
              <span style={{ fontSize: 18, color: s.color }}>{s.icon}</span>
            </div>
            <div style={{ fontSize: 21, fontWeight: 800, fontFamily: 'JetBrains Mono', marginBottom: 6 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: s.subColor || 'var(--text3)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Live prices strip */}
      {/* Charts */}
      {!isEmpty && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 20, marginBottom: 24 }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px 24px 16px' }}>
            <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>Měsíční příjmy</h3>
            <p style={{ color: 'var(--text3)', fontSize: 12, marginBottom: 20 }}>Posledních 6 měsíců</p>
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={monthlyData} barCategoryGap="40%">
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7B5CF0" />
                    <stop offset="100%" stopColor="#4F35B3" />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fill: 'var(--text3)', fontSize: 11, fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text3)', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${Math.round(v/1000)}k` : v} width={40} />
                <Tooltip content={<ChartTooltip fmt={fmt} />} cursor={{ fill: 'rgba(123,92,240,0.06)', radius: 6 }} />
                <Bar dataKey="prijmy" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px' }}>
            <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>Stav faktur</h3>
            <p style={{ color: 'var(--text3)', fontSize: 12, marginBottom: 8 }}>Aktuální rozložení</p>
            {statusBreakdown?.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={155}>
                  <PieChart>
                    <Pie data={statusBreakdown} cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={4} dataKey="value">
                      {statusBreakdown.map((entry, i) => <Cell key={i} fill={entry.color} strokeWidth={0} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, fontFamily: 'DM Sans', fontSize: 12, color: 'var(--text)' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {statusBreakdown.map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 9, height: 9, borderRadius: '50%', background: s.color }} />
                      <span style={{ fontSize: 12, color: 'var(--text2)', flex: 1 }}>{s.name}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'JetBrains Mono' }}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)' }}>Žádná data</div>
            )}
          </div>
        </div>
      )}

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20 }}>
        {/* Recent invoices */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontWeight: 700, fontSize: 15 }}>Poslední faktury</h3>
            <button onClick={() => setView('invoices')} style={{ background: 'none', border: 'none', color: 'var(--accent2)', fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans', fontWeight: 600 }}>Zobrazit vše →</button>
          </div>
          {!recentInvoices?.length ? (
            <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text3)' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>Žádné faktury
            </div>
          ) : recentInvoices.map((inv, i) => {
            const sc = STATUS[inv.status] || STATUS.pending;
            return (
              <div key={inv.id} style={{ padding: '13px 24px', borderBottom: i < recentInvoices.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'background 0.15s', cursor: 'default' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--card-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{inv.clientName}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'JetBrains Mono' }}>{inv.invoiceNumber}</div>
                </div>
                <div style={{ textAlign: 'right', marginLeft: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, fontFamily: 'JetBrains Mono' }}>{fmt(inv.total)}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{fmtDate(inv.dueDate)}</div>
                </div>
                <div style={{ marginLeft: 12, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, color: sc.color, background: sc.bg, whiteSpace: 'nowrap' }}>{sc.label}</div>
              </div>
            );
          })}
        </div>

        {/* Wallets with live prices */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontWeight: 700, fontSize: 15 }}>Peněženky</h3>
            <button onClick={() => setView('wallets')} style={{ background: 'none', border: 'none', color: 'var(--accent2)', fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans', fontWeight: 600 }}>Spravovat →</button>
          </div>
          {!wallets?.length ? (
            <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text3)' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>⬡</div>Žádné peněženky
            </div>
          ) : wallets.map((w, i) => {
            const priceCZK = livePrices?.[w.currency]?.price || 0;
            const valueCZK = w.balance * priceCZK;
            const valueDisplay = (() => {
              const val = valueCZK * (CZK_TO[currency] || 1);
              const cfg = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.CZK;
              return new Intl.NumberFormat(cfg.locale, { style: 'currency', currency: cfg.code, maximumFractionDigits: currency === 'CZK' ? 0 : 2 }).format(val);
            })();
            return (
              <div key={w.id} style={{ padding: '13px 24px', borderBottom: i < wallets.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: `${w.color}22`, border: `1px solid ${w.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: w.color, fontWeight: 800 }}>{w.currency[0]}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{w.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{w.currency}</div>
                  </div>
                  <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 12, fontWeight: 700 }}>{w.balance} {w.currency}</div>
                    <div style={{ fontSize: 11, color: priceCZK ? 'var(--green)' : 'var(--text3)' }}>
                      {priceCZK ? valueDisplay : '—'}
                    </div>
                  </div>
                </div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text3)', background: 'var(--bg3)', padding: '4px 8px', borderRadius: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.address}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Price Cards with Sparklines */}
      <div style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 style={{ fontWeight: 700, fontSize: 15 }}>Aktuální kurzy</h3>
          <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: priceError ? 'var(--yellow)' : 'var(--green)' }}>
            {priceError ? '⚠ offline · záložní kurzy' : '● živá data · CoinGecko · 7d graf'}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {['ETH', 'BTC', 'SOL', 'USDC'].map(coin => (
            <PriceCard
              key={coin}
              coin={coin}
              priceData={livePrices?.[coin]}
              sparkline={sparklines[coin]}
              currency={currency}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
