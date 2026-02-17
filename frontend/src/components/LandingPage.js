import React, { useState, useEffect } from 'react';

const DARK_VARS = {
  '--bg': '#0A0B0F', '--bg2': '#111218', '--bg3': '#18191F',
  '--border': 'rgba(255,255,255,0.07)', '--border-bright': 'rgba(255,255,255,0.14)',
  '--text': '#F0F0F5', '--text2': '#8B8C9B', '--text3': '#5A5B6A',
  '--accent': '#7B5CF0', '--accent2': '#9B7BFF',
};

const S = {
  // Nav
  nav: { position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', height: 64, background: 'rgba(10,11,15,0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.05)' },
  logo: { display: 'flex', alignItems: 'center', gap: 10 },
  logoIcon: { width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg, #7B5CF0, #9B7BFF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, boxShadow: '0 0 20px rgba(123,92,240,0.4)' },
  logoText: { fontWeight: 800, fontSize: 17, letterSpacing: '-0.02em', color: '#F0F0F5' },
  navLinks: { display: 'flex', alignItems: 'center', gap: 8 },
  navBtn: (primary) => ({ padding: primary ? '9px 22px' : '9px 18px', borderRadius: 9, border: primary ? 'none' : '1px solid rgba(255,255,255,0.1)', background: primary ? 'linear-gradient(135deg, #7B5CF0, #9B7BFF)' : 'transparent', color: primary ? '#fff' : 'rgba(255,255,255,0.7)', fontFamily: 'DM Sans', fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s' }),
};

// Animated number counter
function Counter({ target, suffix = '', duration = 2000 }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const steps = 60;
    const inc = target / steps;
    let cur = 0;
    const t = setInterval(() => {
      cur += inc;
      if (cur >= target) { setCount(target); clearInterval(t); }
      else setCount(Math.floor(cur));
    }, duration / steps);
    return () => clearInterval(t);
  }, [target]);
  return <>{count.toLocaleString('cs-CZ')}{suffix}</>;
}

export default function LandingPage({ onLogin, onRegister }) {
  const [hoveredFeature, setHoveredFeature] = useState(null);
  useEffect(() => {
    const root = document.documentElement;
    const prev = {};
    Object.entries(DARK_VARS).forEach(([k, v]) => { prev[k] = root.style.getPropertyValue(k); root.style.setProperty(k, v); });
    return () => { Object.entries(prev).forEach(([k, v]) => root.style.setProperty(k, v)); };
  }, []);

  const features = [
    { icon: '⚡', title: 'Lightning Network', desc: 'Platby v BTC přes Lightning Network — okamžité, s minimálním poplatkem.', color: '#F7931A' },
    { icon: '₿', title: 'Multi-crypto', desc: 'Vystavujte faktury v ETH, BTC, SOL, USDC nebo Lightning — vše na jednom místě.', color: '#627EEA' },
    { icon: '📄', title: 'PDF faktury', desc: 'Profesionální faktury s QR kódem ke stažení jedním klikem.', color: '#9945FF' },
    { icon: '🔍', title: 'On-chain verifikace', desc: 'Automatické ověření platby přes blockchain — bez ručního potvrzování.', color: '#22C55E' },
    { icon: '📊', title: 'Live kurzy', desc: 'Ceny z CoinGecko v reálném čase. Grafy za 7 dní pro každou minci.', color: '#F59E0B' },
    { icon: '🌙', title: 'Tmavý / světlý režim', desc: 'Plně přizpůsobitelné rozhraní — přepínejte mezi tmavým a světlým tématem.', color: '#9B7BFF' },
  ];

  const steps = [
    { num: '01', title: 'Registrujte se', desc: 'Vytvořte účet za 30 sekund. Žádná kreditní karta, žádné poplatky předem.' },
    { num: '02', title: 'Přidejte peněženku', desc: 'Vložte adresu vaší ETH, BTC nebo SOL peněženky. Podporujeme i Lightning.' },
    { num: '03', title: 'Vystavte fakturu', desc: 'Zadejte klienta, položky a vyberte crypto měnu. PDF se generuje automaticky.' },
    { num: '04', title: 'Přijměte platbu', desc: 'Klient zaplatí přes QR kód. Verifikace proběhne on-chain automaticky.' },
  ];

  const stats = [
    { value: 0, suffix: ' Kč', label: 'Skryté poplatky', prefix: '' },
    { value: 5, suffix: ' min', label: 'Do první faktury', prefix: '<' },
    { value: 3, suffix: '', label: 'Blockchains', prefix: '' },
    { value: 100, suffix: '%', label: 'Vlastní data', prefix: '' },
  ];

  return (
    <div style={{ background: '#0A0B0F', color: '#F0F0F5', fontFamily: 'DM Sans, sans-serif', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ── FIXED NAV ─────────────────────────────────────────────────── */}
      <nav style={S.nav}>
        <div style={S.logo}>
          <div style={S.logoIcon}>₿</div>
          <span style={S.logoText}>cryptofund.cz</span>
        </div>
        <div style={S.navLinks}>
          <button onClick={onLogin} style={S.navBtn(false)}>Přihlášení</button>
          <button onClick={onRegister} style={S.navBtn(true)}>Registrace zdarma</button>
        </div>
      </nav>

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '100px 40px 60px', maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
        {/* Background blobs */}
        <div style={{ position: 'absolute', top: '20%', right: '5%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(123,92,240,0.12) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '-5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(247,147,26,0.07) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ flex: 1, maxWidth: 600, animation: 'fadeInUp 0.7s ease both' }}>
          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: 'rgba(123,92,240,0.12)', border: '1px solid rgba(123,92,240,0.25)', borderRadius: 20, marginBottom: 28 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 6px #22C55E', display: 'inline-block' }} />
            <span style={{ fontSize: 13, color: '#9B7BFF', fontWeight: 600 }}>Fakturujte v kryptu — jednoduše</span>
          </div>

          <h1 style={{ fontSize: 58, fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.03em', marginBottom: 24 }}>
            Crypto faktury<br />
            <span style={{ background: 'linear-gradient(135deg, #7B5CF0, #9B7BFF, #3B82F6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>pro moderní</span><br />
            podnikatele
          </h1>

          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, marginBottom: 36, maxWidth: 480 }}>
            Vystavujte profesionální faktury s podporou ETH, BTC, SOL a Lightning Network.
            On-chain verifikace, live kurzy, PDF ke stažení.
          </p>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <button onClick={onRegister} style={{ padding: '15px 32px', background: 'linear-gradient(135deg, #7B5CF0, #9B7BFF)', border: 'none', borderRadius: 12, color: '#fff', fontFamily: 'DM Sans', fontWeight: 700, fontSize: 16, cursor: 'pointer', boxShadow: '0 8px 32px rgba(123,92,240,0.4)', transition: 'transform 0.2s, box-shadow 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(123,92,240,0.5)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(123,92,240,0.4)'; }}>
              Začít zdarma →
            </button>
            <button onClick={onLogin} style={{ padding: '15px 28px', background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, color: 'rgba(255,255,255,0.7)', fontFamily: 'DM Sans', fontWeight: 600, fontSize: 16, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.28)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}>
              Přihlásit se
            </button>
          </div>

          {/* Trust badges */}
          <div style={{ display: 'flex', gap: 24, marginTop: 44, flexWrap: 'wrap' }}>
            {['ETH', 'BTC', 'SOL', 'LN', 'USDC'].map(c => {
              const colors = { ETH: '#627EEA', BTC: '#F7931A', SOL: '#9945FF', LN: '#F7931A', USDC: '#2775CA' };
              return (
                <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 7, background: colors[c] + '22', border: `1px solid ${colors[c]}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: colors[c], fontFamily: 'JetBrains Mono' }}>{c[0]}</div>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: 'JetBrains Mono' }}>{c}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Hero visual — mock invoice card */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', paddingLeft: 40, animation: 'fadeInRight 0.8s ease 0.2s both' }}>
          <div style={{ width: 400, background: 'linear-gradient(135deg, #111218, #18191F)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 28, boxShadow: '0 40px 120px rgba(0,0,0,0.6), 0 0 0 1px rgba(123,92,240,0.1)', transform: 'perspective(1000px) rotateY(-8deg) rotateX(2deg)' }}>
            {/* Invoice header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
              <div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', marginBottom: 4 }}>FAKTURA</div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 16, fontWeight: 700, color: '#9B7BFF' }}>#2026-0001</div>
              </div>
              <div style={{ padding: '4px 10px', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 20, fontSize: 10, fontWeight: 700, color: '#22C55E' }}>✓ ZAPLACENO</div>
            </div>
            {/* Client */}
            <div style={{ marginBottom: 18, padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 10 }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>KLIENT</div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Acme s.r.o.</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>billing@acme.cz</div>
            </div>
            {/* Items */}
            {[['Web development', '35 000 Kc'], ['Design — UI/UX', '12 000 Kc']].map(([desc, price]) => (
              <div key={desc} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{desc}</span>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: '#F0F0F5' }}>{price}</span>
              </div>
            ))}
            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, padding: '12px 14px', background: 'linear-gradient(135deg, rgba(123,92,240,0.12), rgba(59,130,246,0.08))', border: '1px solid rgba(123,92,240,0.2)', borderRadius: 10 }}>
              <span style={{ fontWeight: 700 }}>Celkem</span>
              <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 800, color: '#9B7BFF', fontSize: 16 }}>56 700 Kc</span>
            </div>
            {/* Crypto */}
            <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(247,147,26,0.06)', border: '1px solid rgba(247,147,26,0.15)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(247,147,26,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#F7931A' }}>₿</div>
              <div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>CRYPTO PLATBA</div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 13, fontWeight: 700, color: '#F7931A' }}>0.0366 BTC</div>
              </div>
              <div style={{ marginLeft: 'auto', fontSize: 9, color: '#22C55E', fontFamily: 'JetBrains Mono' }}>✓ verified</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────────────────── */}
      <section style={{ borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '48px 40px', background: 'rgba(255,255,255,0.01)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 32 }}>
          {stats.map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 38, fontWeight: 800, background: 'linear-gradient(135deg, #fff, rgba(255,255,255,0.6))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {s.prefix}<Counter target={s.value} suffix={s.suffix} />
              </div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────────── */}
      <section style={{ padding: '96px 40px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#7B5CF0', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>Proč cryptofund.cz</div>
          <h2 style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 16 }}>Vše co potřebujete<br /><span style={{ color: 'rgba(255,255,255,0.35)' }}>pro crypto fakturaci</span></h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.45)', maxWidth: 500, margin: '0 auto' }}>Platforma navržená pro freelancery a firmy, které přijímají platby v kryptoměnách.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
          {features.map((f, i) => (
            <div key={i}
              onMouseEnter={() => setHoveredFeature(i)}
              onMouseLeave={() => setHoveredFeature(null)}
              style={{ padding: '28px', background: hoveredFeature === i ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)', border: `1px solid ${hoveredFeature === i ? f.color + '40' : 'rgba(255,255,255,0.06)'}`, borderRadius: 16, cursor: 'default', transition: 'all 0.25s' }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: f.color + '18', border: `1px solid ${f.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 18, transition: 'transform 0.2s', transform: hoveredFeature === i ? 'scale(1.08)' : 'scale(1)' }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────── */}
      <section style={{ padding: '80px 40px', background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#7B5CF0', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>Jak to funguje</div>
            <h2 style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.02em' }}>Čtyři kroky<br /><span style={{ color: 'rgba(255,255,255,0.35)' }}>a fakturujete v kryptu</span></h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24, position: 'relative' }}>
            {/* Connector line */}
            <div style={{ position: 'absolute', top: 28, left: '12.5%', right: '12.5%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(123,92,240,0.4), rgba(123,92,240,0.4), transparent)', pointerEvents: 'none' }} />

            {steps.map((s, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '0 16px' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, #7B5CF0, #9B7BFF)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 0 0 8px rgba(123,92,240,0.08)', fontFamily: 'JetBrains Mono', fontSize: 16, fontWeight: 700, color: '#fff' }}>
                  {s.num}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.65 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING / FEES ────────────────────────────────────────────── */}
      <section style={{ padding: '96px 40px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#7B5CF0', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>Jednoduché podmínky</div>
          <h2 style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.02em' }}>Transparentní poplatky</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20, maxWidth: 900, margin: '0 auto' }}>
          {[
            { icon: '✕', label: 'Žádné měsíční poplatky', desc: 'Platforma je zdarma. Vždy.', color: '#22C55E' },
            { icon: '0.5%', label: 'Za úspěšnou transakci', desc: 'Poplatek pouze z provedených plateb.', color: '#9B7BFF', mono: true },
            { icon: '⚡', label: 'Lightning Network', desc: 'Okamžité platby s poplatkem pod 1 sat.', color: '#F7931A' },
          ].map((p, i) => (
            <div key={i} style={{ padding: '32px 28px', background: i === 1 ? 'linear-gradient(135deg, rgba(123,92,240,0.1), rgba(59,130,246,0.06))' : 'rgba(255,255,255,0.02)', border: `1px solid ${i === 1 ? 'rgba(123,92,240,0.25)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 16, textAlign: 'center', position: 'relative' }}>
              {i === 1 && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', padding: '3px 12px', background: 'linear-gradient(135deg, #7B5CF0, #9B7BFF)', borderRadius: 20, fontSize: 10, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>NEJOBLÍBENĚJŠÍ</div>}
              <div style={{ fontSize: p.mono ? 32 : 36, fontWeight: 800, color: p.color, fontFamily: p.mono ? 'JetBrains Mono' : 'inherit', marginBottom: 14 }}>{p.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{p.label}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.55 }}>{p.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 40px', margin: '0 40px 80px', background: 'linear-gradient(135deg, rgba(123,92,240,0.12), rgba(59,130,246,0.07))', border: '1px solid rgba(123,92,240,0.2)', borderRadius: 24, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% -20%, rgba(123,92,240,0.15), transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <h2 style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 16 }}>Připraveni fakturovat<br />v kryptoměnách?</h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.5)', marginBottom: 36, maxWidth: 440, margin: '0 auto 36px' }}>
            Registrace trvá méně než minutu. Bez kreditní karty, bez poplatků předem.
          </p>
          <button onClick={onRegister} style={{ padding: '16px 40px', background: 'linear-gradient(135deg, #7B5CF0, #9B7BFF)', border: 'none', borderRadius: 12, color: '#fff', fontFamily: 'DM Sans', fontWeight: 700, fontSize: 17, cursor: 'pointer', boxShadow: '0 8px 32px rgba(123,92,240,0.4)', transition: 'transform 0.2s, box-shadow 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 14px 44px rgba(123,92,240,0.55)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(123,92,240,0.4)'; }}>
            Vytvořit účet zdarma →
          </button>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer style={{ padding: '32px 40px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: 'linear-gradient(135deg, #7B5CF0, #9B7BFF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>₿</div>
          <span style={{ fontWeight: 700, color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>cryptofund.cz</span>
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>
          © {new Date().getFullYear()} cryptofund.cz · Crypto Invoice Platform
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          {['Přihlášení', 'Registrace'].map(l => (
            <button key={l} onClick={l === 'Přihlášení' ? onLogin : onRegister} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans', transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}>
              {l}
            </button>
          ))}
        </div>
      </footer>

      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInRight { from { opacity: 0; transform: translateX(32px); } to { opacity: 1; transform: translateX(0); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0A0B0F; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>
    </div>
  );
}
