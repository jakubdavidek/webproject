# ⚡ PayOffchain — Crypto Invoice Platform

Webová aplikace pro správu faktur s podporou crypto plateb, inspirovaná PayOffchain.

## 🏗 Struktura projektu

```
lightning-app/
├── backend/
│   ├── server.js        # Express API server
│   ├── package.json
│   └── .env
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── App.js               # Hlavní aplikace + routing + sidebar
    │   ├── index.js
    │   └── components/
    │       ├── Login.js          # Přihlášení & registrace
    │       ├── Dashboard.js      # Přehled, statistiky, přehled
    │       ├── InvoiceGenerator.js  # Správa & tvorba faktur
    │       └── WalletList.js     # Správa crypto peněženek
    ├── package.json
    └── package-lock.json
```

## 🚀 Spuštění

### 1. Backend

```bash
cd backend
npm install
npm start
# Server běží na http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
npm install
npm start
# Aplikace běží na http://localhost:3000
```

## 🔑 Demo přihlášení

| Email | Heslo |
|-------|-------|
| demo@payoffchain.io | demo1234 |

## ✨ Funkce

### 🔐 Autentizace
- Přihlášení a registrace s JWT tokenem
- Bezpečné bcrypt hashování hesel
- Automatické přihlášení při návratu

### 📊 Dashboard
- Celkové statistiky (příjmy, čekající platby, po splatnosti)
- Hodnota crypto portfolia v USD
- Přehled posledních faktur
- Přehled peněženek

### 📄 Faktury
- Vytvoření faktury s více položkami
- Automatické generování čísla faktury
- Podpora DPH (0%, 12%, 21%)
- Přiřazení crypto měny (ETH, BTC, USDC)
- **Potvrzení platby s TX hashem**
- Filtrace dle stavu (vše, čeká, zaplaceno, po splatnosti)
- Vyhledávání dle klienta / čísla faktury
- Detail faktury s crypto platebními informacemi

### ⬡ Peněženky
- Přidání crypto peněženky (ETH, BTC, USDC, SOL, MATIC)
- Přehled zůstatků a USD hodnot
- Kopírování adresy peněženky
- Přehled celkového portfolia

## 🛠 Technologie

**Backend:** Node.js, Express, JWT, bcryptjs  
**Frontend:** React 18, vlastní CSS-in-JS  
**Fonty:** Syne (UI), Space Mono (čísla/kód)

## 📡 API Endpoints

| Metoda | Endpoint | Popis |
|--------|---------|-------|
| POST | /api/auth/register | Registrace |
| POST | /api/auth/login | Přihlášení |
| GET | /api/auth/me | Aktuální uživatel |
| GET | /api/dashboard/stats | Statistiky dashboardu |
| GET | /api/invoices | Seznam faktur |
| POST | /api/invoices | Nová faktura |
| GET | /api/invoices/:id | Detail faktury |
| PATCH | /api/invoices/:id/status | Změna stavu / potvrzení platby |
| DELETE | /api/invoices/:id | Smazání faktury |
| GET | /api/wallets | Seznam peněženek |
| POST | /api/wallets | Nová peněženka |
| DELETE | /api/wallets/:id | Smazání peněženky |

> **Poznámka:** Data jsou uložena v paměti (in-memory). Po restartu serveru se obnoví demo data. Pro produkci přidejte databázi (MongoDB, PostgreSQL).
