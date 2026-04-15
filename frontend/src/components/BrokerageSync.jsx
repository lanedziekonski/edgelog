import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

// ── Constants ─────────────────────────────────────────────────────────────

// Futures point values ($ per point per contract). Everything else defaults to 1 (stocks/ETFs).
const POINT_VALUES = {
  ES: 50, MES: 5,
  NQ: 20, MNQ: 2,
  YM: 5,  MYM: 0.5,
  RTY: 50, M2K: 10,
  CL: 1000, GC: 100, SI: 5000,
  ZB: 1000, ZN: 1000, ZF: 1000,
};

// Strip futures contract month+year suffix: ESM6 → ES, NQH25 → NQ
const CONTRACT_SUFFIX = /[FGHJKMNQUVXZ]\d{1,2}$/;

const BROKER_LABELS = {
  tradovate:    'Tradovate',
  ibkr:         'Interactive Brokers',
  thinkorswim:  'TD Ameritrade / ThinkorSwim',
  tdameritrade: 'TD Ameritrade',
  tradestation: 'TradeStation',
  webull:       'Webull',
  generic:      'Auto-detected',
};

// ── CSV utilities ─────────────────────────────────────────────────────────

// Handle quoted fields (e.g. "AAPL, Inc." won't split mid-field)
function splitCSVLine(line) {
  const result = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') { inQ = !inQ; }
    else if (line[i] === ',' && !inQ) { result.push(cur.trim()); cur = ''; }
    else { cur += line[i]; }
  }
  result.push(cur.trim());
  return result;
}

function parseDate(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  // ISO: 2024-01-15 or 2024-01-15T09:30
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  // M/D/YYYY or MM/DD/YYYY (with optional time after space)
  const mdy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (mdy) return `${mdy[3]}-${mdy[1].padStart(2, '0')}-${mdy[2].padStart(2, '0')}`;
  // M/D/YY (ThinkorSwim: 01/15/24)
  const mdy2 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
  if (mdy2) {
    const yr = parseInt(mdy2[3]) > 50 ? `19${mdy2[3]}` : `20${mdy2[3]}`;
    return `${yr}-${mdy2[1].padStart(2, '0')}-${mdy2[2].padStart(2, '0')}`;
  }
  return null;
}

function parseTime(raw) {
  if (!raw) return '';
  const m = String(raw).match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?/i);
  if (!m) return '';
  let h = parseInt(m[1], 10);
  const min = m[2];
  const ap = m[3];
  if (ap?.toUpperCase() === 'PM' && h < 12) h += 12;
  if (ap?.toUpperCase() === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${min}`;
}

// Parse a string that may contain both date and time ("2024-01-15 09:30:22")
function parseDatetime(raw) {
  if (!raw) return { date: null, time: '' };
  const s = String(raw).trim();
  // Split on space, T, or comma
  const parts = s.split(/[\sT,]+/);
  return { date: parseDate(parts[0]), time: parts[1] ? parseTime(parts[1]) : '' };
}

// Clean a futures symbol: strip leading slash, strip month+year suffix
function cleanSymbol(raw) {
  if (!raw) return 'UNKNOWN';
  const s = String(raw).trim().toUpperCase().replace(/^\//, '');
  return s.replace(CONTRACT_SUFFIX, '') || s;
}

// Normalize B/S text → 'Buy' | 'Sell' | null
function normalizeSide(raw) {
  if (!raw) return null;
  const s = String(raw).trim().toUpperCase();
  if (s === 'BUY' || s === 'B' || s === 'BOT' || s.includes('BUY') || s === 'LONG') return 'Buy';
  if (s === 'SELL' || s === 'S' || s === 'SLD' || s.includes('SELL') || s === 'SHORT') return 'Sell';
  return null;
}

// Build a column-index lookup from a headers array
function makeColFinder(headers) {
  const idx = {};
  headers.forEach((h, i) => { idx[h.toLowerCase().trim()] = i; });
  return (...names) => {
    for (const n of names) {
      const v = idx[n.toLowerCase()];
      if (v !== undefined) return v;
    }
    return -1;
  };
}

const getVal = (vals, i) => (i !== -1 && vals[i] != null ? String(vals[i]).trim() : '');

// ── Format detection ──────────────────────────────────────────────────────

function detectBroker(headers) {
  const lower = new Set(headers.map(h => h.toLowerCase().trim()));
  const has = (...terms) => terms.some(t => lower.has(t) || [...lower].some(h => h.includes(t)));

  // Tradovate: B/S + (avgprice or avg fill price) + (filledqty or filled qty)
  if (has('b/s') && has('avgprice', 'avg fill price', 'avg price') && has('filledqty', 'filled qty')) return 'tradovate';
  if (has('b/s') && has('filledqty', 'filled qty')) return 'tradovate';

  // Interactive Brokers: "t. price" is very distinctive
  if (has('t. price') || has('t.price')) return 'ibkr';
  if (has('realized p/l') && has('buy/sell')) return 'ibkr';

  // ThinkorSwim: "exec time" + "pos effect"
  if (has('exec time') && has('pos effect')) return 'thinkorswim';
  if (has('exec time') && has('spread')) return 'thinkorswim';

  // TD Ameritrade account statement: "transaction id" + "description" + no symbol column
  if (has('transaction id') && has('description') && !lower.has('symbol')) return 'tdameritrade';

  // TradeStation: "shares" column + buy/sell type
  if ((has('buy/sell') || lower.has('type')) && has('shares')) return 'tradestation';

  // Webull: "filled price" or "avg price" + "side" + some qty variant
  if ((has('filled price') || has('avg price')) && lower.has('side')) return 'webull';

  return 'generic';
}

// ── Fill extractors ───────────────────────────────────────────────────────
// Each returns [{ symbol, side: 'Buy'|'Sell', price, qty, date, time }]

function extractFillsTradovate(lines) {
  const col = makeColFinder(splitCSVLine(lines[0]));
  const contractIdx = col('contract');
  const productIdx  = col('product');
  const bsIdx       = col('b/s');
  const priceIdx    = col('avg fill price', 'avgprice', 'avg price');
  const fillTimeIdx = col('fill time', 'filltime');
  const dateIdx     = col('date');
  const qtyIdx      = col('filled qty', 'filledqty', 'filled_qty');
  const statusIdx   = col('status');

  if (bsIdx === -1 || priceIdx === -1 || qtyIdx === -1) {
    throw new Error('Tradovate CSV missing required columns (B/S, avgPrice, filledQty)');
  }

  const fills = [];
  lines.slice(1).forEach(line => {
    if (!line.trim()) return;
    const v = splitCSVLine(line);
    const status = getVal(v, statusIdx);
    if (status && status !== 'Filled') return;

    const side = normalizeSide(getVal(v, bsIdx));
    const price = parseFloat(getVal(v, priceIdx).replace(/,/g, ''));
    const qty   = parseInt(getVal(v, qtyIdx), 10);
    if (!side || isNaN(price) || isNaN(qty) || qty <= 0) return;

    let product = getVal(v, productIdx);
    const contractRaw = getVal(v, contractIdx);
    if (!product && contractRaw) product = contractRaw.replace(CONTRACT_SUFFIX, '').toUpperCase();
    product = cleanSymbol(product || contractRaw || 'UNKNOWN');

    const fillRaw = getVal(v, fillTimeIdx);
    const dateRaw = getVal(v, dateIdx);
    const { date: dtDate, time } = fillRaw ? parseDatetime(fillRaw) : { date: null, time: '' };
    const date = dtDate || parseDate(dateRaw);

    fills.push({ symbol: product, side, price, qty, date, time });
  });
  return fills;
}

function extractFillsIBKR(lines) {
  // IBKR activity statement has multiple sections; find the Trades header row
  let headerLine = lines[0];
  let dataStart = 1;
  for (let i = 0; i < Math.min(20, lines.length); i++) {
    const l = lines[i].toLowerCase();
    if (l.includes('symbol') && (l.includes('t. price') || l.includes('t.price') || l.includes('quantity'))) {
      headerLine = lines[i];
      dataStart = i + 1;
      break;
    }
  }

  const col = makeColFinder(splitCSVLine(headerLine));
  const symbolIdx = col('symbol');
  const dtIdx     = col('date/time', 'datetime', 'date');
  const qtyIdx    = col('quantity');
  const priceIdx  = col('t. price', 't.price', 'price');
  const pnlIdx    = col('realized p/l', 'realized p&l');

  const fills = [];
  lines.slice(dataStart).forEach(line => {
    if (!line.trim()) return;
    const v = splitCSVLine(line);
    const symbol = getVal(v, symbolIdx).toUpperCase();
    if (!symbol || symbol === 'SYMBOL') return; // skip repeated headers or empty

    // IBKR multi-section files: skip rows that are clearly section markers
    if (v.length < 4) return;

    // If there's a realized P/L column and this row has it, it's a closed trade — use directly
    if (pnlIdx !== -1 && getVal(v, pnlIdx) !== '') {
      const pnl = parseFloat(getVal(v, pnlIdx).replace(/,/g, ''));
      const { date, time } = parseDatetime(getVal(v, dtIdx));
      if (!isNaN(pnl) && date) {
        fills.push({ symbol: cleanSymbol(symbol), side: '_direct_', price: 0, qty: 0, date, time, directPnl: pnl });
        return;
      }
    }

    // Otherwise treat as fills: positive qty = Buy, negative = Sell
    const qty = parseFloat(getVal(v, qtyIdx).replace(/,/g, ''));
    const price = parseFloat(getVal(v, priceIdx).replace(/,/g, ''));
    if (isNaN(qty) || isNaN(price) || qty === 0) return;

    const { date, time } = parseDatetime(getVal(v, dtIdx));
    fills.push({
      symbol: cleanSymbol(symbol),
      side: qty > 0 ? 'Buy' : 'Sell',
      price,
      qty: Math.abs(qty),
      date,
      time,
    });
  });
  return fills;
}

function extractFillsTOS(lines) {
  // TOS files sometimes start with account info lines before the real header
  let startIdx = 0;
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const l = lines[i].toLowerCase();
    if (l.includes('exec time') || (l.includes('side') && l.includes('symbol') && l.includes('price'))) {
      startIdx = i;
      break;
    }
  }

  const col = makeColFinder(splitCSVLine(lines[startIdx]));
  const execIdx   = col('exec time', 'time', 'date');
  const sideIdx   = col('side', 'action', 'type');
  const qtyIdx    = col('qty', 'quantity');
  const symbolIdx = col('symbol');
  const priceIdx  = col('price', 'net price', 'fill price');
  const posIdx    = col('pos effect', 'position effect');

  const fills = [];
  lines.slice(startIdx + 1).forEach(line => {
    if (!line.trim()) return;
    const v = splitCSVLine(line);
    if (getVal(v, symbolIdx) === 'Symbol') return; // repeated header

    const side = normalizeSide(getVal(v, sideIdx));
    if (!side) return;

    const qtyRaw = getVal(v, qtyIdx).replace(/[+\-,]/g, '');
    const qty   = parseInt(qtyRaw, 10);
    const price = parseFloat(getVal(v, priceIdx).replace(/[,$]/g, ''));
    const symbol = cleanSymbol(getVal(v, symbolIdx));

    if (!symbol || isNaN(qty) || isNaN(price) || qty <= 0) return;

    const { date, time } = parseDatetime(getVal(v, execIdx));
    fills.push({ symbol, side, price, qty, date, time });
  });
  return fills;
}

function extractFillsTradeStation(lines) {
  const col = makeColFinder(splitCSVLine(lines[0]));
  const symbolIdx = col('symbol');
  const typeIdx   = col('type', 'side', 'action', 'buy/sell');
  const dateIdx   = col('date');
  const timeIdx   = col('time');
  const priceIdx  = col('price', 'fill price', 'avg price');
  const qtyIdx    = col('shares', 'quantity', 'qty');

  const fills = [];
  lines.slice(1).forEach(line => {
    if (!line.trim()) return;
    const v = splitCSVLine(line);
    const side = normalizeSide(getVal(v, typeIdx));
    if (!side) return;

    const symbol = cleanSymbol(getVal(v, symbolIdx));
    const qty    = parseFloat(getVal(v, qtyIdx).replace(/,/g, ''));
    const price  = parseFloat(getVal(v, priceIdx).replace(/[,$]/g, ''));
    if (!symbol || isNaN(qty) || isNaN(price) || qty <= 0) return;

    const date = parseDate(getVal(v, dateIdx));
    const time = parseTime(getVal(v, timeIdx));
    fills.push({ symbol, side, price, qty, date, time });
  });
  return fills;
}

function extractFillsWebull(lines) {
  const col = makeColFinder(splitCSVLine(lines[0]));
  const symbolIdx = col('symbol', 'ticker');
  const sideIdx   = col('side', 'action');
  const priceIdx  = col('avg price', 'filled price', 'average price', 'price');
  const qtyIdx    = col('filled', 'filled qty', 'quantity', 'qty', 'shares');
  const timeIdx   = col('create time', 'filled time', 'time', 'date');
  const statusIdx = col('status');

  const fills = [];
  lines.slice(1).forEach(line => {
    if (!line.trim()) return;
    const v = splitCSVLine(line);
    const status = getVal(v, statusIdx).toLowerCase();
    if (status && !status.includes('fill') && !status.includes('complete') && !status.includes('executed')) return;

    const side   = normalizeSide(getVal(v, sideIdx));
    const symbol = cleanSymbol(getVal(v, symbolIdx));
    const qty    = parseFloat(getVal(v, qtyIdx).replace(/,/g, ''));
    const price  = parseFloat(getVal(v, priceIdx).replace(/[,$]/g, ''));
    if (!side || !symbol || isNaN(qty) || isNaN(price) || qty <= 0) return;

    const { date, time } = parseDatetime(getVal(v, timeIdx));
    fills.push({ symbol, side, price, qty, date, time });
  });
  return fills;
}

function extractFillsGeneric(lines) {
  const col = makeColFinder(splitCSVLine(lines[0]));
  const symbolIdx = col('symbol', 'ticker', 'instrument', 'contract', 'security');
  const sideIdx   = col('side', 'action', 'type', 'buy/sell', 'b/s', 'direction', 'order type');
  const priceIdx  = col('price', 'avg price', 'fill price', 'executed price', 'average price', 'execution price');
  const qtyIdx    = col('qty', 'quantity', 'shares', 'filled', 'size', 'amount', 'volume');
  const dateIdx   = col('date', 'date/time', 'datetime', 'time', 'fill time', 'execution date', 'exec time');
  const statusIdx = col('status', 'state', 'order status');

  if (symbolIdx === -1 || sideIdx === -1 || priceIdx === -1 || qtyIdx === -1) {
    throw new Error(
      'Could not auto-detect CSV format. Columns found: ' +
      splitCSVLine(lines[0]).join(', ') +
      '. Required: symbol, side/action, price, qty.'
    );
  }

  const SKIP_STATUSES = ['cancel', 'reject', 'pending', 'expired', 'partial'];

  const fills = [];
  lines.slice(1).forEach(line => {
    if (!line.trim()) return;
    const v = splitCSVLine(line);
    const status = getVal(v, statusIdx).toLowerCase();
    if (status && SKIP_STATUSES.some(s => status.includes(s))) return;

    const side   = normalizeSide(getVal(v, sideIdx));
    const symbol = cleanSymbol(getVal(v, symbolIdx));
    const qty    = parseFloat(getVal(v, qtyIdx).replace(/,/g, ''));
    const price  = parseFloat(getVal(v, priceIdx).replace(/[,$]/g, ''));
    if (!side || !symbol || isNaN(qty) || isNaN(price) || qty <= 0) return;

    const { date, time } = parseDatetime(getVal(v, dateIdx));
    fills.push({ symbol, side, price, qty, date, time });
  });
  return fills;
}

// ── FIFO round-trip matching ──────────────────────────────────────────────

function fifoMatchToTrades(fills, account) {
  // Handle IBKR direct P/L rows separately
  const directRows = [];
  const matchFills = [];
  fills.forEach(f => {
    if (f.side === '_direct_') {
      directRows.push({
        date:          f.date || '',
        symbol:        f.symbol,
        pnl:           Math.round(f.directPnl * 100) / 100,
        setup:         '',
        account,
        entryTime:     '',
        exitTime:      f.time || '',
        emotionBefore: '',
        emotionAfter:  '',
        followedPlan:  true,
        notes:         'Auto-imported from IBKR',
        side:          null,
        quantity:      null,
        entryPrice:    null,
        exitPrice:     null,
      });
    } else {
      matchFills.push(f);
    }
  });

  // Group by symbol
  const bySymbol = {};
  matchFills.forEach(f => {
    if (!bySymbol[f.symbol]) bySymbol[f.symbol] = [];
    bySymbol[f.symbol].push({ ...f });
  });

  const rows = [], errors = [];

  Object.entries(bySymbol).forEach(([symbol, sFills]) => {
    const pointValue = POINT_VALUES[symbol] || 1;
    const isFutures  = pointValue !== 1;

    sFills.sort((a, b) => ((a.date || '') + (a.time || '')).localeCompare((b.date || '') + (b.time || '')));

    const openBuys  = [];
    const openSells = [];

    const createTrade = (entry, exit, side, matchQty) => {
      const rawPnl = side === 'Long'
        ? (exit.price - entry.price) * pointValue * matchQty
        : (entry.price - exit.price) * pointValue * matchQty;
      const pnl = Math.round(rawPnl * 100) / 100;
      const unit = isFutures ? `${matchQty}ct` : `${matchQty}sh`;
      rows.push({
        date:          exit.date || entry.date || '',
        symbol,
        pnl,
        setup:         '',
        account,
        entryTime:     entry.time || '',
        exitTime:      exit.time || '',
        emotionBefore: '',
        emotionAfter:  '',
        followedPlan:  true,
        notes:         `${side} ${unit} · entry ${entry.price} → exit ${exit.price}`,
        side,
        quantity:      matchQty,
        entryPrice:    entry.price,
        exitPrice:     exit.price,
      });
    };

    sFills.forEach(fill => {
      if (fill.side === 'Buy') {
        if (openSells.length > 0) {
          // Closing a short
          let rem = fill.qty;
          while (rem > 0 && openSells.length > 0) {
            const entry = openSells[0];
            const mq = Math.min(rem, entry.qty);
            createTrade(entry, fill, 'Short', mq);
            entry.qty -= mq; rem -= mq;
            if (entry.qty === 0) openSells.shift();
          }
          if (rem > 0) openBuys.push({ ...fill, qty: rem });
        } else {
          openBuys.push({ ...fill });
        }
      } else {
        if (openBuys.length > 0) {
          // Closing a long
          let rem = fill.qty;
          while (rem > 0 && openBuys.length > 0) {
            const entry = openBuys[0];
            const mq = Math.min(rem, entry.qty);
            createTrade(entry, fill, 'Long', mq);
            entry.qty -= mq; rem -= mq;
            if (entry.qty === 0) openBuys.shift();
          }
          if (rem > 0) openSells.push({ ...fill, qty: rem });
        } else {
          openSells.push({ ...fill });
        }
      }
    });

    const unclosed = [...openBuys, ...openSells].reduce((s, f) => s + f.qty, 0);
    if (unclosed > 0) errors.push(`${symbol}: ${unclosed} unclosed position(s) not imported`);
  });

  return { rows: [...directRows, ...rows], errors };
}

// ── Main dispatcher ───────────────────────────────────────────────────────

function parseCSV(text, account) {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row');

  const headers = splitCSVLine(lines[0]);
  const format  = detectBroker(headers);

  let fills;
  switch (format) {
    case 'tradovate':    fills = extractFillsTradovate(lines);    break;
    case 'ibkr':         fills = extractFillsIBKR(lines);         break;
    case 'thinkorswim':  fills = extractFillsTOS(lines);          break;
    case 'tdameritrade': fills = extractFillsTOS(lines);          break; // similar structure
    case 'tradestation': fills = extractFillsTradeStation(lines); break;
    case 'webull':       fills = extractFillsWebull(lines);       break;
    default:             fills = extractFillsGeneric(lines);      break;
  }

  if (fills.length === 0) {
    return { rows: [], errors: ['No filled orders found. Check that Status = "Filled" and B/S columns have data.'], format };
  }

  const { rows, errors } = fifoMatchToTrades(fills, account);
  return { rows, errors, format };
}

// ── CSV template ──────────────────────────────────────────────────────────

const CSV_TEMPLATE = `date,symbol,pnl,setup,account,entry_time,exit_time,emotion_before,emotion_after,followed_plan,notes
`;

// ── Main component ────────────────────────────────────────────────────────

// ── Guided import broker definitions ──────────────────────────────────────

const BROKER_OPTIONS = [
  { id: 'tradovate',           label: 'Tradovate',           icon: '📊' },
  { id: 'apex',                label: 'Apex Trader Funding', icon: '🔺' },
  { id: 'topstep',             label: 'TopStep',             icon: '📈' },
  { id: 'interactive_brokers', label: 'Interactive Brokers', icon: '🏦' },
  { id: 'thinkorswim',         label: 'ThinkorSwim',         icon: '💹' },
  { id: 'tradestation',        label: 'TradeStation',        icon: '📉' },
  { id: 'webull',              label: 'Webull',              icon: '🐂' },
  { id: 'ninjatrader',         label: 'NinjaTrader',         icon: '🥷' },
  { id: 'generic',             label: 'Other / Generic CSV', icon: '📄' },
];

const BROKER_INSTRUCTIONS = {
  tradovate: {
    title: 'Export your trades from Tradovate',
    steps: [
      'Log in to Tradovate (desktop app or tradovate.com)',
      'Click the dropdown with your account name at the top',
      'Click the small gear icon ⚙️ to open "Account Reports"',
      'Click the "Orders" tab — do NOT use the Performance tab',
      'Select your date range and click "Go"',
      'Click "Download Report" to save the CSV to your device',
      'Upload that file here',
    ],
    warning: 'Important: Make sure to select the Orders tab, not Performance. Using the wrong tab will cause import errors.',
  },
  apex: {
    title: 'Export your trades from Apex Trader Funding',
    steps: [
      'Log in to your Apex dashboard at apextraderfunding.com',
      'Click "Accounts" and select your funded account',
      'Navigate to the "Trade History" tab',
      'Set the desired date range',
      'Click "Export to CSV" and save the file to your device',
    ],
  },
  topstep: {
    title: 'Export your trades from TopStep',
    steps: [
      'Log in at app.topstep.com',
      'Go to "Account" → "Trade History"',
      'Select the date range for the trades you want',
      'Click the CSV export button in the top-right',
      'Save the file to your device',
    ],
  },
  interactive_brokers: {
    title: 'Export your trades from Interactive Brokers',
    steps: [
      'Log in to Client Portal at clientportal.ibkr.com',
      'Go to Reports → Activity (or use Flex Queries for custom exports)',
      'Select "Trade Confirmation" as the report type',
      'Set the date range and choose CSV as the output format',
      'Run the report and download the file',
    ],
  },
  thinkorswim: {
    title: 'Export your trades from ThinkorSwim',
    steps: [
      'Open thinkorswim desktop and go to the "Monitor" tab',
      'Click "Account Statement" in the sub-menu',
      'Set the date range using the calendar controls at the top',
      'Right-click anywhere in the Trades section',
      'Select "Export to File…" and choose CSV format',
    ],
  },
  tradestation: {
    title: 'Export your trades from TradeStation',
    steps: [
      'Log in to your TradeStation account',
      'Open "Reports" from the top menu and select "Activity & Orders"',
      'Choose the "Trade History" report type',
      'Set the desired date range',
      'Click Export → Download as CSV and save the file',
    ],
  },
  webull: {
    title: 'Export your trades from Webull',
    steps: [
      'Log in at webull.com (use the desktop/web version)',
      'Click your account icon → "Orders" or "Trade History"',
      'Use the date filter to select your range',
      'Click the export/download icon in the top-right',
      'Select CSV format and save the file to your device',
    ],
  },
  ninjatrader: {
    title: 'Export your trades from NinjaTrader',
    steps: [
      'Open NinjaTrader and go to Control Center',
      'Click "Account Performance" from the menu',
      'Set the start and end dates for your export',
      'Right-click inside the trade history table',
      'Select "Export" → choose CSV format and save the file',
    ],
  },
  generic: {
    title: 'Upload a generic CSV file',
    steps: [
      'Export trades from your broker as a CSV file',
      'Ensure your file includes columns for: symbol, date/time, quantity, price, and side (buy/sell)',
      'Alternatively, download our CSV template below and fill it in manually',
      'Upload the CSV file in the next step',
    ],
    showTemplate: true,
  },
};

export default function BrokerageSync({ onTradesImported, preselectedAccountId = null, preselectedAccountName = '' }) {
  const { token } = useAuth();
  const fileRef   = useRef(null);

  const [csvRows, setCsvRows]           = useState(null);
  const [csvFormat, setCsvFormat]       = useState('generic');
  const [csvErrors, setCsvErrors]       = useState([]);
  const [importing, setImporting]       = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [error, setError]               = useState('');
  const [showAllTrades, setShowAllTrades] = useState(false);
  const [importAccount, setImportAccount] = useState(preselectedAccountId || '');
  // Store raw text so we can re-parse when account changes
  const [rawCsvText, setRawCsvText] = useState('');

  // Guided import flow
  const [importStep, setImportStep]         = useState(1);
  const [selectedBroker, setSelectedBroker] = useState(null);
  const [isDragging, setIsDragging]         = useState(false);

  const doParse = (text, account) => {
    try {
      const { rows, errors, format } = parseCSV(text, account);
      setCsvRows(rows);
      setCsvErrors(errors);
      setCsvFormat(format);
      setShowAllTrades(false);
      setImportResult(null);
      setError('');
    } catch (err) {
      setError(err.message);
      setCsvRows(null);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setRawCsvText(ev.target.result);
      doParse(ev.target.result, importAccount);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleFileDrop = (e) => {
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setRawCsvText(ev.target.result);
      doParse(ev.target.result, importAccount);
    };
    reader.readAsText(file);
  };

  const handleAccountChange = (newAccount) => {
    setImportAccount(newAccount);
    if (rawCsvText) doParse(rawCsvText, newAccount);
  };

  const confirmImport = async () => {
    if (!csvRows?.length) return;
    if (!importAccount) { setError('Select an account before importing.'); return; }
    setImporting(true);
    setError('');
    try {
      const data = await api.importCsv(token, csvRows, importAccount);
      setImportResult(data);
      setCsvRows(null);
      setRawCsvText('');
      setImportStep(1);
      setSelectedBroker(null);
      onTradesImported && onTradesImported();
    } catch (e) {
      setError(e.message);
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'tradeascend-import-template.csv';
    a.click();
  };

  const cancelImport = () => { setCsvRows(null); setCsvErrors([]); setRawCsvText(''); setShowAllTrades(false); setImportStep(3); };

  const previewRows = showAllTrades ? csvRows : csvRows?.slice(0, 3);

  return (
    <div>
      {error && (
        <div style={{ background: 'var(--red-dim)', border: '1px solid var(--red)', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: 'var(--red)', marginBottom: 12, lineHeight: 1.5 }}>
          {error}
        </div>
      )}

      {importResult && (
        <div style={{ background: 'var(--green-dim)', border: '1px solid rgba(0,240,122,0.25)', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: 'var(--green)', marginBottom: 12 }}>
          ✓ {importResult.imported} trade{importResult.imported !== 1 ? 's' : ''} imported
          {importResult.skipped > 0 ? `, ${importResult.skipped} duplicate${importResult.skipped !== 1 ? 's' : ''} skipped` : ''}
        </div>
      )}

      {/* CSV Preview (shown after a file is parsed) */}
      {csvRows && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 14, marginBottom: 16 }}>

          {/* Header row: detected format badge + count */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>
              {csvRows.length} trade{csvRows.length !== 1 ? 's' : ''} ready to import
            </div>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
              background: '#00f07a22', color: 'var(--green)', border: '1px solid rgba(0,240,122,0.3)',
              textTransform: 'uppercase', letterSpacing: '0.4px',
            }}>
              {BROKER_LABELS[csvFormat] || csvFormat}
            </span>
          </div>

          {/* Account display */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 5 }}>
              Importing into
            </label>
            {preselectedAccountId ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 7 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: 'var(--text)', fontFamily: 'Barlow', fontWeight: 600 }}>{preselectedAccountName}</span>
              </div>
            ) : (
              <input
                placeholder="e.g. Tradeify, My Apex Account…"
                value={importAccount}
                onChange={e => handleAccountChange(e.target.value)}
                style={{ width: '100%', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 7, padding: '8px 10px', fontSize: 13, color: 'var(--text)', fontFamily: 'Barlow', boxSizing: 'border-box' }}
              />
            )}
          </div>

          {/* Errors / warnings */}
          {csvErrors.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              {csvErrors.map((e, i) => (
                <div key={i} style={{ fontSize: 11, color: 'var(--red)', marginBottom: 2 }}>⚠ {e}</div>
              ))}
            </div>
          )}

          {/* Trade preview rows */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
              Preview {showAllTrades ? `(all ${csvRows.length})` : `(first ${Math.min(3, csvRows.length)} of ${csvRows.length})`}
            </div>
            {previewRows.map((row, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 10px', borderRadius: 7, marginBottom: 4,
                background: 'var(--card)', border: '1px solid var(--border)',
              }}>
                <div>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 15 }}>{row.symbol}</span>
                  {row.entryTime && (
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginLeft: 8 }}>
                      {row.entryTime}{row.exitTime ? ` → ${row.exitTime}` : ''}
                    </span>
                  )}
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                    {row.date}{row.notes ? ` · ${row.notes}` : ''}
                  </div>
                </div>
                <span style={{
                  fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 16,
                  color: row.pnl >= 0 ? 'var(--green)' : 'var(--red)',
                }}>
                  {row.pnl >= 0 ? '+' : ''}${row.pnl.toFixed(2)}
                </span>
              </div>
            ))}
            {csvRows.length > 3 && (
              <button
                onClick={() => setShowAllTrades(v => !v)}
                style={{ width: '100%', padding: '6px', borderRadius: 7, border: '1px dashed var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', fontFamily: 'Barlow', marginTop: 2 }}
              >
                {showAllTrades ? 'Show less' : `Show all ${csvRows.length} trades`}
              </button>
            )}
          </div>

          {/* Confirm / Cancel */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={confirmImport}
              disabled={importing}
              style={{ flex: 1, padding: '10px', borderRadius: 8, background: 'var(--green)', color: '#000', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', fontFamily: 'Barlow', opacity: importing ? 0.6 : 1 }}
            >
              {importing ? 'Importing…' : `Import ${csvRows.length} Trade${csvRows.length !== 1 ? 's' : ''}`}
            </button>
            <button
              onClick={cancelImport}
              style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', fontFamily: 'Barlow' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Guided import flow (steps 1–3) */}
      {!csvRows && (
        <div style={{ marginBottom: 16 }}>

          {/* Step indicator */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                  background: s <= importStep ? '#00ff41' : 'transparent',
                  border: `1.5px solid ${s <= importStep ? '#00ff41' : 'var(--border)'}`,
                  color: s <= importStep ? '#000' : 'var(--text-muted)',
                  fontSize: 11, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{s}</div>
                {s < 3 && (
                  <div style={{ flex: 1, height: 1, background: s < importStep ? '#00ff41' : 'var(--border)', margin: '0 6px' }} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Step 1: Broker selector */}
          {importStep === 1 && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Select your broker</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>
                Choose your platform for step-by-step export instructions.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {BROKER_OPTIONS.map((broker) => (
                  <button
                    key={broker.id}
                    onClick={() => { setSelectedBroker(broker.id); setImportStep(2); }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#00ff41'; e.currentTarget.style.color = '#00ff41'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text)'; }}
                    style={{
                      padding: '12px 8px', borderRadius: 8, textAlign: 'center',
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      color: 'var(--text)', cursor: 'pointer', fontFamily: 'Barlow',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                      transition: 'border-color 0.15s, color 0.15s',
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{broker.icon}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, lineHeight: 1.3 }}>{broker.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Export instructions */}
          {importStep === 2 && selectedBroker && (
            <div>
              <button
                onClick={() => setImportStep(1)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', fontFamily: 'Barlow', padding: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                ← Back
              </button>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>
                {BROKER_INSTRUCTIONS[selectedBroker].title}
              </div>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 16px', marginBottom: 14 }}>
                {BROKER_INSTRUCTIONS[selectedBroker].steps.map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: i < BROKER_INSTRUCTIONS[selectedBroker].steps.length - 1 ? 12 : 0 }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%',
                      background: 'rgba(0,255,65,0.1)', border: '1px solid rgba(0,255,65,0.25)',
                      color: '#00ff41', fontSize: 11, fontWeight: 700, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>{i + 1}</div>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, paddingTop: 2 }}>{step}</span>
                  </div>
                ))}
              </div>
              {BROKER_INSTRUCTIONS[selectedBroker].warning && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: 'rgba(240,165,0,0.08)', border: '1px solid rgba(240,165,0,0.3)', borderRadius: 8, padding: '10px 12px', marginBottom: 14 }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>⚠️</span>
                  <span style={{ fontSize: 12, color: '#f0a500', lineHeight: 1.5 }}>{BROKER_INSTRUCTIONS[selectedBroker].warning}</span>
                </div>
              )}
              {BROKER_INSTRUCTIONS[selectedBroker].showTemplate && (
                <button
                  onClick={downloadTemplate}
                  style={{ width: '100%', padding: '9px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', fontFamily: 'Barlow', marginBottom: 10 }}
                >
                  Download CSV Template
                </button>
              )}
              <button
                onClick={() => setImportStep(3)}
                style={{ width: '100%', padding: '11px', borderRadius: 8, background: '#00ff41', color: '#000', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', fontFamily: 'Barlow' }}
              >
                I'm ready — Upload my CSV →
              </button>
            </div>
          )}

          {/* Step 3: Drag-and-drop upload */}
          {importStep === 3 && (
            <div>
              <button
                onClick={() => setImportStep(2)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', fontFamily: 'Barlow', padding: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                ← Back
              </button>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Upload your CSV</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>
                Drag and drop your exported file here, or click to browse.
              </div>
              <div
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={e => { e.preventDefault(); setIsDragging(false); handleFileDrop(e); }}
                onClick={() => fileRef.current?.click()}
                style={{
                  border: `2px dashed ${isDragging ? '#00ff41' : 'var(--border)'}`,
                  borderRadius: 10,
                  padding: '40px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: isDragging ? 'rgba(0,255,65,0.04)' : 'var(--surface)',
                  transition: 'border-color 0.15s, background 0.15s',
                  marginBottom: 10,
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 10 }}>📂</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: isDragging ? '#00ff41' : 'var(--text)', marginBottom: 4, transition: 'color 0.15s' }}>
                  {isDragging ? 'Drop it here!' : 'Drop CSV here or click to browse'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Supports .csv files</div>
              </div>
              <input ref={fileRef} type="file" accept=".csv" onChange={handleFileUpload} style={{ display: 'none' }} />
            </div>
          )}
        </div>
      )}

      {/* Live Brokerage Sync — Coming Soon */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginBottom: 16 }}>
        <div style={{ border: '1px solid rgba(0,255,65,0.2)', borderRadius: '8px', padding: '16px', marginTop: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '20px', marginBottom: '8px' }}>🔗</div>
          <div style={{ color: '#00ff41', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>Live Brokerage Sync</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginBottom: '12px' }}>
            Connect your live brokerage account for automatic trade sync. Currently in development.
          </div>
          <div style={{ backgroundColor: 'rgba(0,255,65,0.1)', border: '1px solid rgba(0,255,65,0.3)', borderRadius: '20px', padding: '4px 12px', display: 'inline-block', color: '#00ff41', fontSize: '11px', letterSpacing: '1px', fontWeight: '700' }}>COMING SOON</div>
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', marginTop: '8px' }}>
            Tradovate · Interactive Brokers · TD Ameritrade · Schwab
          </div>
        </div>
      </div>
    </div>
  );
}
