// CSV parsing utilities — ported from frontend/src/components/BrokerageSync.jsx
// Produces identical output shape so the backend's /api/trades/import-csv accepts it.

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

export function parseCSV(text, account) {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row');

  const headers = splitCSVLine(lines[0]);
  const format  = detectBroker(headers);

  let fills;
  switch (format) {
    case 'tradovate':    fills = extractFillsTradovate(lines);    break;
    case 'ibkr':         fills = extractFillsIBKR(lines);         break;
    case 'thinkorswim':  fills = extractFillsTOS(lines);          break;
    case 'tdameritrade': fills = extractFillsTOS(lines);          break;
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

export const CSV_TEMPLATE = `date,symbol,pnl,setup,account,entry_time,exit_time,emotion_before,emotion_after,followed_plan,notes
`;

// ── Broker options (9 brokers) ────────────────────────────────────────────

export const BROKER_OPTIONS = [
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

// ── Broker-specific export instructions ──────────────────────────────────

export const BROKER_INSTRUCTIONS = {
  tradovate: {
    title: 'Export your trades from Tradovate',
    steps: [
      'Log in to Tradovate (desktop app or tradovate.com)',
      'Click the dropdown with your account name at the top',
      'Click the small gear icon ⚙️ to open "Account Reports"',
      'Click the "Orders" tab — do NOT use the Performance tab',
      'Select your date range and click "Go"',
      'Click "Download Report" to save the CSV',
      'Upload that file here',
    ],
    warning: 'Must use the Orders tab — not Performance. Wrong tab will cause import errors.',
  },
  apex: {
    title: 'Export from Apex Trader Funding',
    info: 'Apex uses Tradovate or NinjaTrader as its trading platform. Export from whichever platform you trade on.',
    steps: [
      'If you trade on Tradovate → select Tradovate from the broker list and follow those instructions',
      'If you trade on NinjaTrader → select NinjaTrader from the broker list and follow those instructions',
      'Upload your exported CSV file here',
    ],
  },
  topstep: {
    title: 'Export your trades from TopStep (TopstepX)',
    steps: [
      'Log in to your TopstepX account at topstepx.com',
      'Click the "Trades" tab at the bottom of the page',
      'Click the "Export" button at the bottom right corner',
      'Select your date range and click "Export"',
      'Save the CSV file to your device',
      'Upload that file here',
    ],
    warning: 'Use the Trades tab — NOT the Orders tab. Wrong tab will cause import errors.',
  },
  interactive_brokers: {
    title: 'Export your trades from Interactive Brokers',
    steps: [
      'Log in to Client Portal at ibkr.com',
      'Go to "Performance & Reports" → "Flex Queries"',
      'Click the "+" icon next to "Activity Flex Query"',
      'Name it (e.g. "TraderAscend Export")',
      'Click "Trades" in the Sections list → click "Select All" → Save',
      'Set format to CSV → click "Continue" → "Create"',
      'Find your saved query → click the Run arrow button',
      'Select your date range → set format to CSV → click "Run"',
      'Download the file and upload it here',
    ],
    note: 'IBKR limits exports to 1 year per file. Run multiple exports for longer history.',
  },
  thinkorswim: {
    title: 'Export your trades from ThinkorSwim',
    steps: [
      'Open the ThinkorSwim desktop platform',
      'Click the "Monitor" tab at the top',
      'Select "Account Statement"',
      'Set your date range (up to 370 days at a time)',
      'Click the hamburger menu icon (three lines) in the top right of the statement',
      'Click "Export to File"',
      'Save the file as CSV (the file will end in AccountStatement.csv)',
      'Upload that file here',
    ],
    note: 'Do not open or re-save the file in Excel — it may change the format.',
  },
  tradestation: {
    title: 'Export your trades from TradeStation',
    steps: [
      'Log in to TradeStation',
      'Go to "Reports" in the main menu',
      'Select "Trade History"',
      'Set your date range',
      'Click "Export" → select CSV format',
      'Save and upload the file here',
    ],
  },
  webull: {
    title: 'Export your trades from Webull',
    steps: [
      'Open Webull desktop app or webull.com',
      'Go to "Orders" in the top menu',
      'Click "History"',
      'Set your date range',
      'Click the export/download icon',
      'Select CSV format',
      'Upload that file here',
    ],
  },
  ninjatrader: {
    title: 'Export your trades from NinjaTrader',
    sections: [
      {
        label: 'Desktop version',
        steps: [
          'Open NinjaTrader Control Center',
          'Go to "Account Performance" tab',
          'Switch to the "Executions" tab',
          'Right-click anywhere in the list',
          'Select "Export" or "Save As" → save as CSV',
          'Upload that file here',
        ],
      },
      {
        label: 'Web version',
        steps: [
          'Log in to your NinjaTrader account online',
          'Click the profile icon top right → "Statements"',
          'Select date range → choose "Fills" as report type',
          'Click "Download CSV"',
          'Upload that file here',
        ],
      },
    ],
  },
  generic: {
    title: 'Upload a generic CSV file',
    steps: [
      'Export your trades from your platform as a CSV file',
      'Make sure the file includes: Date, Symbol, Side (Buy/Sell), Quantity, Entry Price, Exit Price, and P&L',
      'Alternatively, download our CSV template below and fill it in manually',
      'Upload that file here',
    ],
    showTemplate: true,
  },
};
