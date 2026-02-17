require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'payoffchain_secret';

app.use(cors());
app.use(express.json());

let users = [];
let wallets = [];
let invoices = [];

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Chybí autentizační token' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Neplatný nebo expirovaný token' });
  }
};

const fmtCZK = (n) => {
  const num = Math.round(n);
  return num.toLocaleString('cs-CZ') + ' Kc';
};
const fmtDate = (d) =>
  new Date(d).toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric' });

// Fallback rates (CZK) — aktualizují se z CoinGecko každých 5 minut
let CRYPTO_RATES_CZK = { ETH: 85000, BTC: 1550000, USDC: 23, SOL: 3200, LN: 1550000 };
let ratesLastFetched = 0;

async function refreshCryptoRates() {
  const now = Date.now();
  if (now - ratesLastFetched < 5 * 60 * 1000) return;
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin,usd-coin,solana&vs_currencies=czk');
    if (!res.ok) return;
    const data = await res.json();
    CRYPTO_RATES_CZK.ETH  = data.ethereum?.czk    || CRYPTO_RATES_CZK.ETH;
    CRYPTO_RATES_CZK.BTC  = data.bitcoin?.czk      || CRYPTO_RATES_CZK.BTC;
    CRYPTO_RATES_CZK.USDC = data['usd-coin']?.czk  || CRYPTO_RATES_CZK.USDC;
    CRYPTO_RATES_CZK.SOL  = data.solana?.czk       || CRYPTO_RATES_CZK.SOL;
    CRYPTO_RATES_CZK.LN   = CRYPTO_RATES_CZK.BTC;
    ratesLastFetched = now;
    console.log('[CoinGecko] Kurzy updated — SOL: ' + CRYPTO_RATES_CZK.SOL + ' CZK');
  } catch (e) {
    console.warn('[CoinGecko] Fallback kurzy:', e.message);
  }
}
// Načti kurzy při startu serveru
refreshCryptoRates();

// AUTH
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name, company } = req.body;
  if (!email || !password || !name)
    return res.status(400).json({ error: 'Vyplňte jméno, email a heslo' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Heslo musí mít alespoň 6 znaků' });
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase()))
    return res.status(400).json({ error: 'Tento email je již registrován' });

  const user = {
    id: uuidv4(),
    email: email.toLowerCase().trim(),
    password: await bcrypt.hash(password, 12),
    name: name.trim(),
    company: company?.trim() || '',
    createdAt: new Date().toISOString()
  };
  users.push(user);
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
  res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name, company: user.company } });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Zadejte email a heslo' });
  const user = users.find(u => u.email === email.toLowerCase().trim());
  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ error: 'Nesprávný email nebo heslo' });
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name, company: user.company } });
});

app.get('/api/auth/me', authenticate, (req, res) => {
  const user = users.find(u => u.id === req.userId);
  if (!user) return res.status(404).json({ error: 'Uživatel nenalezen' });
  res.json({ id: user.id, email: user.email, name: user.name, company: user.company });
});

app.post('/api/auth/change-password', authenticate, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = users.find(u => u.id === req.userId);
  if (!user) return res.status(404).json({ error: 'Uživatel nenalezen' });
  if (!await bcrypt.compare(currentPassword, user.password))
    return res.status(401).json({ error: 'Současné heslo je nesprávné' });
  if (!newPassword || newPassword.length < 6)
    return res.status(400).json({ error: 'Nové heslo musí mít alespoň 6 znaků' });
  user.password = await bcrypt.hash(newPassword, 12);
  res.json({ message: 'Heslo změněno' });
});

// DASHBOARD
app.get('/api/dashboard/stats', authenticate, (req, res) => {
  const userInvoices = invoices.filter(i => i.userId === req.userId);
  const userWallets = wallets.filter(w => w.userId === req.userId);
  const now = new Date();
  userInvoices.forEach(inv => {
    if (inv.status === 'pending' && new Date(inv.dueDate) < now) inv.status = 'overdue';
  });
  const paid = userInvoices.filter(i => i.status === 'paid');
  const pending = userInvoices.filter(i => i.status === 'pending');
  const overdue = userInvoices.filter(i => i.status === 'overdue');

  const monthlyData = [];
  for (let m = 5; m >= 0; m--) {
    const d = new Date();
    d.setMonth(d.getMonth() - m);
    const monthNum = d.getMonth();
    const yearNum = d.getFullYear();
    const monthLabel = d.toLocaleString('cs-CZ', { month: 'short' });
    const monthPaid = paid.filter(i => {
      const p = new Date(i.paidAt);
      return p.getMonth() === monthNum && p.getFullYear() === yearNum;
    });
    const monthCreated = userInvoices.filter(i => {
      const c = new Date(i.createdAt);
      return c.getMonth() === monthNum && c.getFullYear() === yearNum;
    });
    monthlyData.push({ month: monthLabel, prijmy: monthPaid.reduce((s, i) => s + i.total, 0), faktury: monthCreated.length });
  }

  const statusBreakdown = [
    { name: 'Zaplaceno', value: paid.length, color: '#22C55E' },
    { name: 'Čeká', value: pending.length, color: '#F59E0B' },
    { name: 'Po splatnosti', value: overdue.length, color: '#EF4444' },
  ].filter(s => s.value > 0);

  res.json({
    stats: {
      totalRevenue: paid.reduce((s, i) => s + i.total, 0),
      pendingAmount: pending.reduce((s, i) => s + i.total, 0),
      overdueAmount: overdue.reduce((s, i) => s + i.total, 0),
      totalWalletValue: userWallets.reduce((s, w) => s + ((w.czkValue || w.usdValue * 23) || 0), 0),
      invoiceCount: userInvoices.length,
      paidCount: paid.length, pendingCount: pending.length, overdueCount: overdue.length
    },
    recentInvoices: [...userInvoices].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5),
    wallets: userWallets,
    monthlyData,
    statusBreakdown
  });
});

// INVOICES
app.get('/api/invoices', authenticate, (req, res) => {
  const { status, search } = req.query;
  let result = invoices.filter(i => i.userId === req.userId);
  const now = new Date();
  result.forEach(inv => { if (inv.status === 'pending' && new Date(inv.dueDate) < now) inv.status = 'overdue'; });
  if (status && status !== 'all') result = result.filter(i => i.status === status);
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(i => i.clientName.toLowerCase().includes(q) || i.invoiceNumber.toLowerCase().includes(q) || i.clientEmail.toLowerCase().includes(q));
  }
  res.json(result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

app.get('/api/invoices/:id', authenticate, (req, res) => {
  const invoice = invoices.find(i => i.id === req.params.id && i.userId === req.userId);
  if (!invoice) return res.status(404).json({ error: 'Faktura nenalezena' });
  res.json(invoice);
});

app.post('/api/invoices', authenticate, async (req, res) => {
  await refreshCryptoRates(); // vždy aktuální kurzy
  const { clientName, clientEmail, clientAddress, clientIco, items, currency, cryptoCurrency, walletAddress, dueDate, tax, note } = req.body;
  if (!clientName || !clientEmail || !items || items.length === 0)
    return res.status(400).json({ error: 'Vyplňte klienta, email a alespoň jednu položku' });

  const user = users.find(u => u.id === req.userId);
  const userInvoiceCount = invoices.filter(i => i.userId === req.userId).length + 1;
  const invoiceNumber = `${new Date().getFullYear()}-${String(userInvoiceCount).padStart(4, '0')}`;

  const processedItems = items.map(item => ({
    description: item.description || '',
    quantity: parseFloat(item.quantity) || 1,
    unitPrice: parseFloat(item.unitPrice) || 0,
    total: (parseFloat(item.quantity) || 1) * (parseFloat(item.unitPrice) || 0)
  }));

  const subtotal = processedItems.reduce((s, i) => s + i.total, 0);
  const taxRate = parseFloat(tax) || 0;
  const taxAmount = Math.round(subtotal * (taxRate / 100));
  const total = subtotal + taxAmount;

  let cryptoAmount = null;
  if (cryptoCurrency && CRYPTO_RATES_CZK[cryptoCurrency]) {
    cryptoAmount = parseFloat((total / CRYPTO_RATES_CZK[cryptoCurrency]).toFixed(8));
  }

  const invoice = {
    id: uuidv4(), userId: req.userId, invoiceNumber,
    issuerName: user.name, issuerCompany: user.company || '', issuerEmail: user.email,
    clientName: clientName.trim(), clientEmail: clientEmail.trim(),
    clientAddress: clientAddress?.trim() || '', clientIco: clientIco?.trim() || '',
    items: processedItems, subtotal, taxRate, tax: taxAmount, total,
    currency: currency || 'CZK', cryptoCurrency: cryptoCurrency || null,
    cryptoAmount, walletAddress: walletAddress || null,
    status: 'pending',
    dueDate: dueDate ? new Date(dueDate).toISOString() : new Date(Date.now() + 14 * 86400000).toISOString(),
    paidAt: null, txHash: null, verificationDetails: null,
    note: note?.trim() || '', createdAt: new Date().toISOString()
  };
  invoices.push(invoice);
  res.status(201).json(invoice);
});

app.patch('/api/invoices/:id/status', authenticate, (req, res) => {
  const { status, txHash } = req.body;
  const invoice = invoices.find(i => i.id === req.params.id && i.userId === req.userId);
  if (!invoice) return res.status(404).json({ error: 'Faktura nenalezena' });
  const validStatuses = ['pending', 'paid', 'overdue', 'cancelled'];
  if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Neplatný stav' });
  invoice.status = status;
  if (status === 'paid') { invoice.paidAt = new Date().toISOString(); invoice.txHash = txHash || null; }
  res.json(invoice);
});

app.delete('/api/invoices/:id', authenticate, (req, res) => {
  const index = invoices.findIndex(i => i.id === req.params.id && i.userId === req.userId);
  if (index === -1) return res.status(404).json({ error: 'Faktura nenalezena' });
  invoices.splice(index, 1);
  res.json({ message: 'Faktura smazána' });
});

// PDF GENEROVÁNÍ
app.get('/api/invoices/:id/pdf', authenticate, async (req, res) => {
  const invoice = invoices.find(i => i.id === req.params.id && i.userId === req.userId);
  if (!invoice) return res.status(404).json({ error: 'Faktura nenalezena' });

  try {
    let qrDataUrl = null;
    if (invoice.walletAddress) {
      const qrText = invoice.cryptoCurrency === 'BTC'
        ? `bitcoin:${invoice.walletAddress}?amount=${invoice.cryptoAmount}`
        : `ethereum:${invoice.walletAddress}?value=${invoice.cryptoAmount}`;
      qrDataUrl = await QRCode.toDataURL(qrText, { width: 140, margin: 1, color: { dark: '#1a1a2e', light: '#ffffff' } });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="faktura-${invoice.invoiceNumber}.pdf"`);

    const doc = new PDFDocument({ size: 'A4', margin: 0, info: { Title: `Faktura ${invoice.invoiceNumber}`, Author: invoice.issuerName } });
    doc.pipe(res);

    const W = 595.28; const H = 841.89; const MARGIN = 48; const CONTENT_W = W - MARGIN * 2;

    // Header
    doc.rect(0, 0, W, 110).fill('#0F0F1A');
    doc.fontSize(22).font('Helvetica-Bold').fillColor('#A78BFA').text('cryptofund.cz', MARGIN, 32);
    doc.fontSize(9).font('Helvetica').fillColor('#6B7280').text('CRYPTO INVOICE PLATFORM', MARGIN, 58);
    doc.fontSize(11).font('Helvetica').fillColor('#9CA3AF').text('FAKTURA', W - MARGIN - 160, 28, { width: 160, align: 'right' });
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#ffffff').text(`#${invoice.invoiceNumber}`, W - MARGIN - 160, 44, { width: 160, align: 'right' });
    const statusColors = { paid: '#22C55E', pending: '#F59E0B', overdue: '#EF4444', cancelled: '#6B7280' };
    const statusLabels = { paid: 'ZAPLACENO', pending: 'CEKA NA PLATBU', overdue: 'PO SPLATNOSTI', cancelled: 'ZRUSENO' };
    const sc = statusColors[invoice.status] || '#6B7280';
    doc.roundedRect(W - MARGIN - 120, 76, 120, 20, 10).fill(sc + '33');
    doc.fontSize(8).font('Helvetica-Bold').fillColor(sc).text(statusLabels[invoice.status] || invoice.status.toUpperCase(), W - MARGIN - 120, 82, { width: 120, align: 'center' });

    let y = 130;

    // Vystavovatel + klient
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#9CA3AF').text('VYSTAVOVATEL', MARGIN, y);
    y += 14;
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#111827').text(invoice.issuerCompany || invoice.issuerName, MARGIN, y);
    y += 16;
    doc.fontSize(9).font('Helvetica').fillColor('#6B7280').text(invoice.issuerName, MARGIN, y);
    y += 13;
    doc.text(invoice.issuerEmail, MARGIN, y);

    const rightX = W / 2 + 20; let ry = 130;
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#9CA3AF').text('KLIENT', rightX, ry); ry += 14;
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#111827').text(invoice.clientName, rightX, ry); ry += 16;
    doc.fontSize(9).font('Helvetica').fillColor('#6B7280').text(invoice.clientEmail, rightX, ry); ry += 13;
    if (invoice.clientAddress) { doc.text(invoice.clientAddress, rightX, ry); ry += 13; }
    if (invoice.clientIco) { doc.text(`ICO: ${invoice.clientIco}`, rightX, ry); }

    y = Math.max(y + 13, ry) + 30;

    // Daty
    doc.rect(MARGIN, y, CONTENT_W, 44).fill('#F9FAFB').stroke('#E5E7EB');
    const dateFields = [
      { label: 'DATUM VYSTAVENI', value: fmtDate(invoice.createdAt) },
      { label: 'DATUM SPLATNOSTI', value: fmtDate(invoice.dueDate) },
      ...(invoice.paidAt ? [{ label: 'DATUM UHRADY', value: fmtDate(invoice.paidAt) }] : []),
      { label: 'ZPUSOB PLATBY', value: invoice.cryptoCurrency ? `Crypto (${invoice.cryptoCurrency})` : 'Bankovni prevod' },
    ];
    const colW = CONTENT_W / dateFields.length;
    dateFields.forEach((f, i) => {
      const fx = MARGIN + i * colW + 12;
      doc.fontSize(7).font('Helvetica-Bold').fillColor('#9CA3AF').text(f.label, fx, y + 8, { width: colW - 12 });
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#111827').text(f.value, fx, y + 22, { width: colW - 12 });
    });
    y += 60;

    // Tabulka
    doc.rect(MARGIN, y, CONTENT_W, 26).fill('#0F0F1A');
    const cols = { desc: MARGIN + 10, qty: MARGIN + CONTENT_W * 0.52, price: MARGIN + CONTENT_W * 0.68, total: MARGIN + CONTENT_W * 0.84 };
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#9CA3AF');
    doc.text('POPIS POLOZKY', cols.desc, y + 9, { width: 200 });
    doc.text('MNOZSTVI', cols.qty, y + 9, { width: 80, align: 'right' });
    doc.text('CENA/KS', cols.price, y + 9, { width: 80, align: 'right' });
    doc.text('CELKEM', cols.total, y + 9, { width: MARGIN + CONTENT_W - cols.total - 10, align: 'right' });
    y += 26;

    invoice.items.forEach((item, idx) => {
      const rowH = 32;
      doc.rect(MARGIN, y, CONTENT_W, rowH).fill(idx % 2 === 0 ? '#FAFAFA' : '#FFFFFF').stroke('#F3F4F6');
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#111827').text(item.description, cols.desc, y + 10, { width: CONTENT_W * 0.5 });
      doc.fontSize(9).font('Helvetica').fillColor('#6B7280').text(item.quantity.toString(), cols.qty, y + 10, { width: 80, align: 'right' });
      doc.text(fmtCZK(item.unitPrice), cols.price, y + 10, { width: 80, align: 'right' });
      doc.font('Helvetica-Bold').fillColor('#111827').text(fmtCZK(item.total), cols.total, y + 10, { width: MARGIN + CONTENT_W - cols.total - 10, align: 'right' });
      y += rowH;
    });
    y += 16;

    // Součty
    const totalsX = W - MARGIN - 200; const totalsW = 200;
    const drawTotal = (label, value, bold = false, accent = false) => {
      if (bold) doc.rect(totalsX - 10, y - 4, totalsW + 10, 28).fill(accent ? '#0F0F1A' : '#F3F4F6');
      doc.fontSize(bold ? 10 : 9).font(bold ? 'Helvetica-Bold' : 'Helvetica').fillColor(accent ? '#A78BFA' : bold ? '#111827' : '#6B7280').text(label, totalsX, y, { width: 100 });
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fillColor(accent ? '#ffffff' : bold ? '#111827' : '#6B7280').text(value, totalsX + 100, y, { width: 100, align: 'right' });
      y += bold ? 28 : 18;
    };
    drawTotal('Mezisoucket:', fmtCZK(invoice.subtotal));
    if (invoice.taxRate > 0) drawTotal(`DPH (${invoice.taxRate}%):`, fmtCZK(invoice.tax));
    drawTotal('CELKEM K UHRADE:', fmtCZK(invoice.total), true, true);
    y += 20;

    // Crypto + QR
    if (invoice.cryptoCurrency && invoice.walletAddress) {
      doc.roundedRect(MARGIN, y, CONTENT_W, qrDataUrl ? 150 : 90, 8).fill('#F5F3FF').stroke('#DDD6FE');
      const cryptoY = y + 14;
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#7C3AED').text(`CRYPTO PLATBA - ${invoice.cryptoCurrency}`, MARGIN + 16, cryptoY);
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#0F0F1A').text(`${invoice.cryptoAmount} ${invoice.cryptoCurrency}`, MARGIN + 16, cryptoY + 18);
      doc.fontSize(8).font('Helvetica').fillColor('#6B7280').text(`= ${fmtCZK(invoice.total)} po aktualnim kurzu`, MARGIN + 16, cryptoY + 36);
      doc.fontSize(7).font('Helvetica-Bold').fillColor('#9CA3AF').text('ADRESA PENEZENKY', MARGIN + 16, cryptoY + 54);
      doc.fontSize(8).font('Courier').fillColor('#374151').text(invoice.walletAddress, MARGIN + 16, cryptoY + 66, { width: CONTENT_W - 170 });
      if (qrDataUrl) {
        const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');
        doc.image(qrBuffer, W - MARGIN - 130, y + 8, { width: 120, height: 120 });
        doc.fontSize(7).font('Helvetica').fillColor('#9CA3AF').text('Naskenuj pro platbu', W - MARGIN - 130, y + 132, { width: 120, align: 'center' });
      }
      y += qrDataUrl ? 160 : 100;
    }

    // TX Hash
    if (invoice.txHash) {
      y += 10;
      doc.roundedRect(MARGIN, y, CONTENT_W, 50, 6).fill('#F0FDF4').stroke('#BBF7D0');
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#16A34A').text('PLATBA OVERENA - HASH TRANSAKCE', MARGIN + 12, y + 12);
      doc.fontSize(7).font('Courier').fillColor('#374151').text(invoice.txHash, MARGIN + 12, y + 28, { width: CONTENT_W - 24 });
      y += 60;
    }

    // Poznámka
    if (invoice.note) {
      y += 10;
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#9CA3AF').text('POZNAMKA', MARGIN, y); y += 14;
      doc.fontSize(9).font('Helvetica').fillColor('#6B7280').text(invoice.note, MARGIN, y, { width: CONTENT_W });
      y += 30;
    }

    // Patička
    const footerY = H - 50;
    doc.rect(0, footerY, W, 50).fill('#0F0F1A');
    doc.fontSize(8).font('Helvetica').fillColor('#4B5563').text('Vygenerovano platformou cryptofund.cz', MARGIN, footerY + 18, { width: CONTENT_W, align: 'center' });
    doc.fontSize(7).fillColor('#374151').text(`Faktura vystavena: ${fmtDate(invoice.createdAt)}`, MARGIN, footerY + 32, { width: CONTENT_W, align: 'center' });

    doc.end();
  } catch (err) {
    console.error('PDF error:', err);
    if (!res.headersSent) res.status(500).json({ error: 'Chyba pri generovani PDF: ' + err.message });
  }
});

// ON-CHAIN VERIFY
async function verifyEthTransaction(txHash, expectedAddress, expectedAmountEth) {
  const apiKey = process.env.ETHERSCAN_API_KEY;
  if (!apiKey || apiKey === 'YourEtherscanApiKeyHere')
    return { verified: false, error: 'Etherscan API klic neni nastaven v .env' };
  try {
    const r1 = await fetch(`https://api.etherscan.io/api?module=proxy&action=eth_getTransactionByHash&txhash=${txHash}&apikey=${apiKey}`);
    const d1 = await r1.json();
    if (!d1.result) return { verified: false, error: 'Transakce nenalezena' };
    const tx = d1.result;
    if (expectedAddress && tx.to?.toLowerCase() !== expectedAddress.toLowerCase())
      return { verified: false, error: `Transakce jde jinam: ${tx.to}` };
    const valueEth = Number(BigInt(tx.value)) / 1e18;
    if (expectedAmountEth && Math.abs(valueEth - expectedAmountEth) > 0.0001)
      return { verified: false, error: `Spatna castka: prijato ${valueEth.toFixed(6)} ETH` };
    const r2 = await fetch(`https://api.etherscan.io/api?module=proxy&action=eth_getTransactionReceipt&txhash=${txHash}&apikey=${apiKey}`);
    const d2 = await r2.json();
    if (!d2.result) return { verified: false, error: 'Transakce ceka na potvrzeni' };
    if (d2.result.status === '0x0') return { verified: false, error: 'Transakce selhala' };
    const r3 = await fetch(`https://api.etherscan.io/api?module=proxy&action=eth_blockNumber&apikey=${apiKey}`);
    const d3 = await r3.json();
    const confirmations = parseInt(d3.result, 16) - parseInt(d2.result.blockNumber, 16);
    return { verified: true, confirmations, fromAddress: tx.from, toAddress: tx.to, valueEth: valueEth.toFixed(6), txHash };
  } catch (e) { return { verified: false, error: `Etherscan chyba: ${e.message}` }; }
}

async function verifyBtcTransaction(txHash, expectedAddress, expectedAmountBtc) {
  try {
    const r = await fetch(`https://blockstream.info/api/tx/${txHash}`);
    if (!r.ok) return { verified: false, error: 'BTC transakce nenalezena' };
    const tx = await r.json();
    const out = tx.vout?.find(o => o.scriptpubkey_address?.toLowerCase() === expectedAddress?.toLowerCase());
    if (expectedAddress && !out) return { verified: false, error: `BTC nejde na adresu ${expectedAddress}` };
    if (!tx.status?.confirmed) return { verified: false, error: 'BTC transakce neni potvrzena' };
    return { verified: true, blockHeight: tx.status.block_height, valueReceived: out ? (out.value / 1e8).toFixed(8) : null, txHash };
  } catch (e) { return { verified: false, error: `Blockstream chyba: ${e.message}` }; }
}

app.post('/api/invoices/:id/verify-payment', authenticate, async (req, res) => {
  const { txHash } = req.body;
  const invoice = invoices.find(i => i.id === req.params.id && i.userId === req.userId);
  if (!invoice) return res.status(404).json({ error: 'Faktura nenalezena' });
  if (!txHash?.trim()) return res.status(400).json({ error: 'TX hash je povinny' });
  if (invoice.status === 'paid') return res.status(400).json({ error: 'Faktura je uz zaplacena' });
  const currency = invoice.cryptoCurrency;
  let result;
  if (currency === 'BTC') result = await verifyBtcTransaction(txHash, invoice.walletAddress, invoice.cryptoAmount);
  else if (['ETH', 'USDC'].includes(currency)) result = await verifyEthTransaction(txHash, invoice.walletAddress, invoice.cryptoAmount);
  else return res.status(400).json({ error: `Overeni pro ${currency} neni podporovano` });
  if (result.verified) {
    invoice.status = 'paid'; invoice.paidAt = new Date().toISOString();
    invoice.txHash = txHash; invoice.verificationDetails = result;
    return res.json({ verified: true, message: 'Platba overena on-chain', invoice, details: result });
  }
  res.status(422).json({ verified: false, error: result.error, details: result });
});

// WALLETS
app.get('/api/wallets', authenticate, (req, res) => res.json(wallets.filter(w => w.userId === req.userId)));

app.post('/api/wallets', authenticate, (req, res) => {
  const { name, address, currency, color } = req.body;
  if (!name || !address || !currency) return res.status(400).json({ error: 'Vyplnte nazev, adresu a menu' });
  if (wallets.find(w => w.address === address)) return res.status(400).json({ error: 'Adresa jiz existuje' });
  const wallet = { id: uuidv4(), userId: req.userId, name: name.trim(), address: address.trim(), currency, balance: 0, usdValue: 0, color: color || '#6C63FF', createdAt: new Date().toISOString() };
  wallets.push(wallet);
  res.status(201).json(wallet);
});

app.patch('/api/wallets/:id', authenticate, (req, res) => {
  const wallet = wallets.find(w => w.id === req.params.id && w.userId === req.userId);
  if (!wallet) return res.status(404).json({ error: 'Penezenka nenalezena' });
  ['name', 'color', 'balance', 'usdValue'].forEach(f => { if (req.body[f] !== undefined) wallet[f] = req.body[f]; });
  res.json(wallet);
});

app.delete('/api/wallets/:id', authenticate, (req, res) => {
  const index = wallets.findIndex(w => w.id === req.params.id && w.userId === req.userId);
  if (index === -1) return res.status(404).json({ error: 'Penezenka nenalezena' });
  wallets.splice(index, 1);
  res.json({ message: 'Smazano' });
});

app.get('/api/health', (req, res) => res.json({ status: 'ok', users: users.length, invoices: invoices.length, wallets: wallets.length }));

app.listen(PORT, () => {
  console.log(`\n🚀 cryptofund.cz Server na portu ${PORT}`);
  console.log(`📋 Prazdna databaze — zadna mock data\n`);
});
