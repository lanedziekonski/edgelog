import React, { useState, useEffect, useRef } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

// ── CSV format detection ──────────────────────────────────────────────────

function detectFormat(headers) {
  const lower = headers.map(h => h.toLowerCase().trim());
  if (
    lower.some(h => h === 'b/s') ||
    lower.some(h => h === 'avg fill price') ||
    lower.some(h => h === 'filled qty')
  ) return 'tradovate';
  return 'generic';
}

// ── Tradovate parser ──────────────────────────────────────────────────────

// Futures point values ($ per point per contract)
const POINT_VALUES = {
  ES: 50, MES: 5,
  NQ: 20, MNQ: 2,
  YM: 5,  MYM: 0.5,
  RTY: 50, M2K: 10,
  CL: 1000, GC: 100, SI: 5000,
};

// Strip futures month+year suffix: ESM6 → ES, NQH25 → NQ
const CONTRACT_SUFFIX = /[FGHJKMNQUVXZ]\d{1,2}$/;

function parseFillDatetime(raw) {
  if (!raw) return { date: null, time: '' };
  // "1/15/2024 9:35:22 AM" or "01/15/2024 09:35:22"
  const m = raw.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?/i);
  if (m) {
    const [, mo, d, y, h, min, , ampm] = m;
    let hour = parseInt(h, 10);
    if (ampm?.toUpperCase() === 'PM' && hour < 12) hour += 12;
    if (ampm?.toUpperCase() === 'AM' && hour === 12) hour = 0;
    return {
      date: `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`,
      time: `${String(hour).padStart(2, '0')}:${min}`,
    };
  }
  return { date: null, time: raw };
}

function parseTradovateCSV(text, account) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row');

  const rawHeaders = lines[0].split(',').map(h => h.trim());
  const hIdx = {};
  rawHeaders.forEach((h, i) => { hIdx[h.toLowerCase().trim()] = i; });

  const col = (...names) => {
    for (const n of names) {
      const idx = hIdx[n.toLowerCase()];
      if (idx !== undefined) return idx;
    }
    return -1;
  };

  const contractIdx = col('contract');
  const productIdx  = col('product');
  const bsIdx       = col('b/s');
  const priceIdx    = col('avg fill price');
  const fillTimeIdx = col('fill time');
  const dateIdx     = col('date');
  const qtyIdx      = col('filled qty');
  const statusIdx   = col('status');

  if (bsIdx === -1 || priceIdx === -1 || qtyIdx === -1) {
    throw new Error('Not a Tradovate CSV — expected columns: B/S, Avg Fill Price, Filled Qty');
  }

  const get = (vals, idx) => idx !== -1 ? (vals[idx] ?? '').trim() : '';

  // Parse fills
  const fills = [];
  lines.slice(1).forEach(line => {
    if (!line.trim()) return;
    const vals = line.split(',').map(v => v.trim());

    const status = get(vals, statusIdx);
    if (status && status !== 'Filled') return;

    const bs    = get(vals, bsIdx);
    const price = parseFloat(get(vals, priceIdx).replace(/,/g, ''));
    const qty   = parseInt(get(vals, qtyIdx), 10);
    if (!bs || isNaN(price) || isNaN(qty) || qty <= 0) return;

    const contractRaw = get(vals, contractIdx);
    let product = get(vals, productIdx);
    if (!product && contractRaw) {
      product = contractRaw.replace(CONTRACT_SUFFIX, '').toUpperCase();
    }
    product = (product || contractRaw || 'UNKNOWN').toUpperCase();

    const fillTimeRaw = get(vals, fillTimeIdx);
    const dateRaw     = get(vals, dateIdx);

    let fillDate = null, fillTime = '';
    if (fillTimeRaw) {
      const parsed = parseFillDatetime(fillTimeRaw);
      fillDate = parsed.date;
      fillTime = parsed.time;
    }
    if (!fillDate && dateRaw) fillDate = normalizeDate(dateRaw);

    fills.push({ product, bs, price, qty, fillDate, fillTime });
  });

  if (fills.length === 0) return { rows: [], errors: ['No filled orders found in this CSV'] };

  // Group by product
  const byProduct = {};
  fills.forEach(f => {
    if (!byProduct[f.product]) byProduct[f.product] = [];
    byProduct[f.product].push(f);
  });

  const rows = [], errors = [];

  Object.entries(byProduct).forEach(([product, pFills]) => {
    const pointValue = POINT_VALUES[product] || 50;

    // Sort by fill time
    pFills.sort((a, b) => (a.fillTime || '').localeCompare(b.fillTime || ''));

    // FIFO round-trip matching
    const openBuys  = [];
    const openSells = [];

    const createTrade = (entry, exit, side) => {
      const matchQty = exit.matchQty;
      const pnl = side === 'Long'
        ? Math.round((exit.price - entry.price) * pointValue * matchQty * 100) / 100
        : Math.round((entry.price - exit.price) * pointValue * matchQty * 100) / 100;

      rows.push({
        date:         exit.fillDate || entry.fillDate || '',
        symbol:       product,
        pnl,
        setup:        'ORB',
        account,
        entryTime:    entry.fillTime,
        exitTime:     exit.fillTime,
        emotionBefore: 'Calm',
        emotionAfter:  'Neutral',
        followedPlan:  true,
        notes:        `${side} ${matchQty}ct · entry ${entry.price} → exit ${exit.price}`,
      });
    };

    pFills.forEach(fill => {
      if (fill.bs === 'Buy') {
        if (openSells.length > 0) {
          // Closing a short
          let rem = fill.qty;
          while (rem > 0 && openSells.length > 0) {
            const entry = openSells[0];
            const matchQty = Math.min(rem, entry.qty);
            createTrade(entry, { ...fill, matchQty }, 'Short');
            entry.qty -= matchQty;
            rem -= matchQty;
            if (entry.qty === 0) openSells.shift();
          }
          if (rem > 0) openBuys.push({ ...fill, qty: rem });
        } else {
          openBuys.push({ ...fill });
        }
      } else if (fill.bs === 'Sell') {
        if (openBuys.length > 0) {
          // Closing a long
          let rem = fill.qty;
          while (rem > 0 && openBuys.length > 0) {
            const entry = openBuys[0];
            const matchQty = Math.min(rem, entry.qty);
            createTrade(entry, { ...fill, matchQty }, 'Long');
            entry.qty -= matchQty;
            rem -= matchQty;
            if (entry.qty === 0) openBuys.shift();
          }
          if (rem > 0) openSells.push({ ...fill, qty: rem });
        } else {
          openSells.push({ ...fill });
        }
      }
    });

    const unclosed = openBuys.reduce((s, f) => s + f.qty, 0) + openSells.reduce((s, f) => s + f.qty, 0);
    if (unclosed > 0) {
      errors.push(`${product}: ${unclosed} unclosed position(s) skipped`);
    }
  });

  return { rows, errors };
}

// ── Generic EdgeLog CSV parser ────────────────────────────────────────────

const VALID_SETUPS   = ['ORB', 'VWAP Reclaim', 'Bull Flag', 'Gap Fill', 'Fade High'];
const VALID_ACCOUNTS = ['Apex Funded', 'FTMO', 'tastytrade'];

function parseGenericCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row');

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z_]/g, ''));
  const rows = [], errors = [];

  lines.slice(1).forEach((line, i) => {
    if (!line.trim()) return;
    const vals = line.split(',').map(v => v.trim());
    const row  = {};
    headers.forEach((h, j) => { row[h] = vals[j] ?? ''; });

    const get = (...keys) => { for (const k of keys) if (row[k] !== undefined && row[k] !== '') return row[k]; return ''; };

    const symbol = get('symbol', 'ticker').toUpperCase();
    const pnl    = parseFloat(get('pnl', 'pl', 'profit', 'profitloss', 'net'));
    const date   = normalizeDate(get('date'));

    if (!symbol) { errors.push(`Row ${i + 2}: missing symbol`);  return; }
    if (isNaN(pnl)) { errors.push(`Row ${i + 2}: invalid P&L`); return; }
    if (!date)   { errors.push(`Row ${i + 2}: invalid date`);    return; }

    const rawSetup   = get('setup');
    const rawAccount = get('account');
    const followedRaw = get('followedplan', 'followed_plan', 'followed');
    const followed = followedRaw === '' || followedRaw.toLowerCase() === 'true' || followedRaw === '1';

    rows.push({
      date,
      symbol,
      pnl,
      setup:         VALID_SETUPS.find(s => s.toLowerCase() === rawSetup.toLowerCase()) || 'ORB',
      account:       VALID_ACCOUNTS.find(a => a.toLowerCase() === rawAccount.toLowerCase()) || 'tastytrade',
      entryTime:     get('entry_time', 'entrytime', 'entry'),
      exitTime:      get('exit_time',  'exittime',  'exit'),
      emotionBefore: get('emotion_before', 'emotionbefore') || 'Calm',
      emotionAfter:  get('emotion_after',  'emotionafter')  || 'Neutral',
      followedPlan:  followed,
      notes:         get('notes', 'note', 'comment'),
    });
  });

  return { rows, errors };
}

// ── Date normalizer ───────────────────────────────────────────────────────

function normalizeDate(raw) {
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const mdy = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdy) return `${mdy[3]}-${mdy[1].padStart(2, '0')}-${mdy[2].padStart(2, '0')}`;
  const mdyd = raw.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (mdyd) return `${mdyd[3]}-${mdyd[1].padStart(2, '0')}-${mdyd[2].padStart(2, '0')}`;
  return null;
}

// ── Top-level parse dispatcher ────────────────────────────────────────────

function parseCSV(text, account) {
  const firstLine = text.trim().split(/\r?\n/)[0] || '';
  const headers   = firstLine.split(',').map(h => h.trim());
  const format    = detectFormat(headers);
  if (format === 'tradovate') {
    return { ...parseTradovateCSV(text, account), format: 'tradovate' };
  }
  return { ...parseGenericCSV(text), format: 'generic' };
}

// ── CSV template (no sample data) ────────────────────────────────────────

const CSV_TEMPLATE = `date,symbol,pnl,setup,account,entry_time,exit_time,emotion_before,emotion_after,followed_plan,notes
`;

// ── Plaid Link wrapper ────────────────────────────────────────────────────

function PlaidLinkButton({ onSuccess, onError }) {
  const { token: authToken } = useAuth();
  const [linkToken, setLinkToken] = useState(null);
  const [loading, setLoading]     = useState(false);
  const [err, setErr]             = useState('');

  const fetchLinkToken = async () => {
    setLoading(true); setErr('');
    try {
      const res = await api.createLinkToken(authToken);
      setLinkToken(res.link_token);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const { open, ready } = usePlaidLink({
    token: linkToken || '',
    onSuccess: async (publicToken, metadata) => {
      try {
        const data = await api.exchangePlaidToken(authToken, publicToken, metadata.institution, metadata.accounts);
        onSuccess(data);
      } catch (e) { onError(e.message); }
    },
    onExit: () => setLinkToken(null),
  });

  useEffect(() => {
    if (linkToken && ready) open();
  }, [linkToken, ready, open]);

  if (err) return (
    <div style={{ fontSize: 12, color: 'var(--red)', padding: '8px 0', lineHeight: 1.5 }}>
      {err}
      <button onClick={() => setErr('')} style={{ marginLeft: 8, color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontFamily: 'Barlow' }}>Dismiss</button>
    </div>
  );

  return (
    <button
      onClick={fetchLinkToken}
      disabled={loading}
      style={{
        padding: '10px 16px', borderRadius: 8, border: '1px solid var(--border)',
        background: 'transparent', color: 'var(--text)', fontSize: 13, fontWeight: 600,
        cursor: 'pointer', fontFamily: 'Barlow', opacity: loading ? 0.6 : 1,
        display: 'flex', alignItems: 'center', gap: 8,
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="14" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
      {loading ? 'Connecting…' : 'Connect via Plaid'}
    </button>
  );
}

// ── Main Component ────────────────────────────────────────────────────────

export default function BrokerageSync({ onTradesImported }) {
  const { token } = useAuth();
  const fileRef   = useRef(null);

  const [linkedAccounts, setLinkedAccounts] = useState([]);
  const [syncing, setSyncing]       = useState(null);
  const [csvRows, setCsvRows]       = useState(null);
  const [csvFormat, setCsvFormat]   = useState('generic');
  const [csvErrors, setCsvErrors]   = useState([]);
  const [importing, setImporting]   = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [error, setError]           = useState('');
  // For Tradovate imports: let user pick which account the trades belong to
  const [importAccount, setImportAccount] = useState('tastytrade');

  useEffect(() => {
    api.getLinkedAccounts(token)
      .then(data => { if (Array.isArray(data)) setLinkedAccounts(data); })
      .catch(() => {});
  }, [token]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const { rows, errors, format } = parseCSV(ev.target.result, importAccount);
        setCsvRows(rows);
        setCsvErrors(errors);
        setCsvFormat(format);
        setImportResult(null);
        setError('');
      } catch (err) {
        setError(err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Re-parse when account selection changes (Tradovate only)
  const handleAccountChange = (newAccount) => {
    setImportAccount(newAccount);
    if (csvRows && csvFormat === 'tradovate') {
      // Re-run Tradovate parser with new account
      // We don't have the raw text anymore so just update existing rows
      setCsvRows(prev => prev.map(r => ({ ...r, account: newAccount })));
    }
  };

  const confirmImport = async () => {
    if (!csvRows?.length) return;
    setImporting(true);
    setError('');
    try {
      const data = await api.importCsv(token, csvRows);
      setImportResult(data);
      setCsvRows(null);
      onTradesImported && onTradesImported();
    } catch (e) {
      setError(e.message);
    } finally {
      setImporting(false);
    }
  };

  const handleSync = async (accountId) => {
    setSyncing(accountId);
    setError('');
    try {
      const data = await api.syncLinkedAccount(token, accountId);
      setImportResult({ imported: data.imported });
      if (data.imported > 0) onTradesImported && onTradesImported();
      setLinkedAccounts(prev => prev.map(a => a.id === accountId ? { ...a, last_synced: new Date().toISOString() } : a));
    } catch (e) {
      setError(e.message);
    } finally {
      setSyncing(null);
    }
  };

  const handleDisconnect = async (accountId) => {
    try {
      await api.deleteLinkedAccount(token, accountId);
    } catch (_) { /* best-effort */ }
    setLinkedAccounts(prev => prev.filter(a => a.id !== accountId));
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'edgelog-import-template.csv';
    a.click();
  };

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
          {importResult.skipped > 0 ? ` (${importResult.skipped} skipped as duplicates)` : ''}
        </div>
      )}

      {/* CSV Import */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>CSV Import</div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.5 }}>
          Upload a Tradovate export or any EdgeLog-format CSV. Tradovate trades are matched into round-trip P&amp;L automatically.
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => fileRef.current?.click()}
            style={{
              padding: '9px 14px', borderRadius: 8,
              background: 'var(--green)', color: '#000',
              fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer',
              fontFamily: 'Barlow', display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Upload CSV
          </button>
          <button
            onClick={downloadTemplate}
            style={{ padding: '9px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', fontFamily: 'Barlow' }}
          >
            Template
          </button>
        </div>
        <input ref={fileRef} type="file" accept=".csv" onChange={handleFileUpload} style={{ display: 'none' }} />
      </div>

      {/* CSV Preview */}
      {csvRows && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 14, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>
              {csvRows.length} trade{csvRows.length !== 1 ? 's' : ''} found
            </div>
            {csvFormat === 'tradovate' && (
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#00f07a22', color: 'var(--green)', border: '1px solid rgba(0,240,122,0.3)' }}>
                TRADOVATE
              </span>
            )}
          </div>

          {/* Account selector for Tradovate imports */}
          {csvFormat === 'tradovate' && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 5 }}>
                Assign to account
              </label>
              <select
                value={importAccount}
                onChange={e => handleAccountChange(e.target.value)}
                style={{ width: '100%', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 7, padding: '8px 10px', fontSize: 13, color: 'var(--text)', fontFamily: 'Barlow' }}
              >
                {['Apex Funded', 'FTMO', 'tastytrade'].map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
          )}

          {csvErrors.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              {csvErrors.map((e, i) => (
                <div key={i} style={{ fontSize: 11, color: 'var(--red)', marginBottom: 2 }}>⚠ {e}</div>
              ))}
            </div>
          )}

          <div style={{ maxHeight: 200, overflowY: 'auto', scrollbarWidth: 'none', marginBottom: 12 }}>
            {csvRows.slice(0, 10).map((row, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: i < Math.min(csvRows.length, 10) - 1 ? '1px solid var(--border)' : 'none', fontSize: 12 }}>
                <div>
                  <span style={{ fontWeight: 700 }}>{row.symbol}</span>
                  <span style={{ color: 'var(--text-secondary)', marginLeft: 6 }}>{row.setup}</span>
                  <span style={{ color: 'var(--text-muted)', marginLeft: 6, fontSize: 11 }}>{row.date}</span>
                  {row.entryTime && <span style={{ color: 'var(--text-muted)', marginLeft: 4, fontSize: 10 }}>{row.entryTime}</span>}
                </div>
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 14, color: row.pnl >= 0 ? 'var(--green)' : 'var(--red)' }}>
                  {row.pnl >= 0 ? '+' : ''}${row.pnl.toFixed(0)}
                </span>
              </div>
            ))}
            {csvRows.length > 10 && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', paddingTop: 6 }}>
                + {csvRows.length - 10} more…
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={confirmImport}
              disabled={importing}
              style={{ flex: 1, padding: '10px', borderRadius: 8, background: 'var(--green)', color: '#000', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', fontFamily: 'Barlow', opacity: importing ? 0.6 : 1 }}
            >
              {importing ? 'Importing…' : `Import ${csvRows.length} Trade${csvRows.length !== 1 ? 's' : ''}`}
            </button>
            <button
              onClick={() => { setCsvRows(null); setCsvErrors([]); }}
              style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', fontFamily: 'Barlow' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Plaid Link */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
          Live Brokerage Sync
          <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: '#6c63ff22', color: '#6c63ff', border: '1px solid #6c63ff44' }}>
            PLAID
          </span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>
          Connect a live brokerage for automatic trade sync. Requires Plaid API keys in backend/.env.
        </div>
        <PlaidLinkButton
          onSuccess={(data) => {
            setLinkedAccounts(data.accounts || []);
            setImportResult({ imported: data.imported || 0 });
            if (data.imported > 0) onTradesImported && onTradesImported();
          }}
          onError={(msg) => setError(msg)}
        />
      </div>

      {/* Connected Accounts */}
      {linkedAccounts.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 8 }}>
            Connected Accounts
          </div>
          {linkedAccounts.map(acct => (
            <div key={acct.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{acct.institution_name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{acct.account_name || acct.account_type || 'Investment account'}</div>
                {acct.last_synced && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    Last synced: {new Date(acct.last_synced).toLocaleDateString()}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => handleSync(acct.id)}
                  disabled={syncing === acct.id}
                  style={{ padding: '6px 11px', borderRadius: 7, border: '1px solid var(--green)', background: 'var(--green-dim)', color: 'var(--green)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Barlow', opacity: syncing === acct.id ? 0.6 : 1 }}
                >
                  {syncing === acct.id ? '⟳' : 'Sync'}
                </button>
                <button
                  onClick={() => handleDisconnect(acct.id)}
                  style={{ padding: '6px 11px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', fontFamily: 'Barlow' }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
