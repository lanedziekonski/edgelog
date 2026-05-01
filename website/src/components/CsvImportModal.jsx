import { useState, useEffect, useRef } from 'react';
import { parseCSV, CSV_TEMPLATE, BROKER_OPTIONS, BROKER_INSTRUCTIONS } from '../utils/csvParsers';

const G = '#00ff41';
const R = '#ff4d4d';

const API_BASE = (import.meta.env.VITE_API_URL || 'https://edgelog.onrender.com') + '/api';

function downloadTemplate() {
  const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'traderascend-import-template.csv';
  a.click();
}

// Render a numbered step list
function StepList({ steps }) {
  return steps.map((step, i) => (
    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: i < steps.length - 1 ? 12 : 0 }}>
      <div style={{
        width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
        background: 'rgba(0,255,65,0.1)', border: '1px solid rgba(0,255,65,0.25)',
        color: G, fontSize: 11, fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{i + 1}</div>
      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5, paddingTop: 2 }}>{step}</span>
    </div>
  ));
}

export default function CsvImportModal({ accountId, accountName, onClose, onImported }) {
  const fileRef = useRef(null);

  // Flow state
  const [importStep, setImportStep]         = useState(1);
  const [selectedBroker, setSelectedBroker] = useState(null);
  const [isDragging, setIsDragging]         = useState(false);

  // Parse/upload state
  const [csvRows, setCsvRows]           = useState(null);
  const [csvErrors, setCsvErrors]       = useState([]);
  const [importing, setImporting]       = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [error, setError]               = useState('');
  const [showAllTrades, setShowAllTrades] = useState(false);

  // Dismiss on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const doParse = (text) => {
    try {
      const { rows, errors } = parseCSV(text, accountName);
      setCsvRows(rows);
      setCsvErrors(errors);
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
    reader.onload = (ev) => doParse(ev.target.result);
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleFileDrop = (e) => {
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => doParse(ev.target.result);
    reader.readAsText(file);
  };

  const confirmImport = async () => {
    if (!csvRows?.length) return;
    if (csvRows.length === 0) {
      setError('No trades parsed from this CSV. Check the file and try again.');
      return;
    }
    setImporting(true);
    setError('');
    try {
      const token = localStorage.getItem('traderascend_token');
      const res = await fetch(`${API_BASE}/trades/import-csv`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rows: csvRows, accountId }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Server error ${res.status}`);
      }
      const data = await res.json();
      setImportResult(data);
      setCsvRows(null);
      // Notify parent after a brief moment so user sees the success banner
      setTimeout(() => {
        onImported && onImported();
      }, 1200);
    } catch (e) {
      setError(e.message);
    } finally {
      setImporting(false);
    }
  };

  const cancelPreview = () => {
    setCsvRows(null);
    setCsvErrors([]);
    setShowAllTrades(false);
    setImportStep(3);
  };

  const previewRows = showAllTrades ? csvRows : csvRows?.slice(0, 3);

  return (
    /* Backdrop — click outside to close */
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, background: 'rgba(0,0,0,0.85)',
      }}
    >
      <div
        style={{
          width: '100%', maxWidth: 500,
          maxHeight: '90vh', overflowY: 'auto',
          borderRadius: 20, padding: 24,
          background: '#0d0d0d',
          border: '1px solid rgba(0,255,65,0.2)',
        }}
      >
        {/* Modal header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Import Trades</h2>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 4, fontFamily: 'monospace' }}>
              → {accountName}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: 20, lineHeight: 1, padding: 4 }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{
            background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.35)',
            borderRadius: 8, padding: '10px 12px', fontSize: 13, color: R,
            marginBottom: 14, lineHeight: 1.5,
          }}>
            {error}
          </div>
        )}

        {/* Success banner */}
        {importResult && (
          <div style={{
            background: 'rgba(0,255,65,0.08)', border: '1px solid rgba(0,255,65,0.25)',
            borderRadius: 8, padding: '10px 12px', fontSize: 13, color: G,
            marginBottom: 14,
          }}>
            ✓ {importResult.imported} trade{importResult.imported !== 1 ? 's' : ''} imported
            {importResult.skipped > 0
              ? `, ${importResult.skipped} duplicate${importResult.skipped !== 1 ? 's' : ''} skipped`
              : ''}
          </div>
        )}

        {/* CSV preview (after file is parsed) */}
        {csvRows && (
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10, padding: 14, marginBottom: 16,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>
                {csvRows.length} trade{csvRows.length !== 1 ? 's' : ''} ready to import
              </div>
            </div>

            {/* Warn if zero trades parsed */}
            {csvRows.length === 0 && (
              <div style={{ fontSize: 13, color: '#ffaa33', marginBottom: 10 }}>
                ⚠ No trades could be parsed from this file. Check that it's the correct export format.
              </div>
            )}

            {/* Parse warnings (unclosed positions, etc.) */}
            {csvErrors.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                {csvErrors.map((e, i) => (
                  <div key={i} style={{ fontSize: 11, color: '#ffaa33', marginBottom: 2 }}>⚠ {e}</div>
                ))}
              </div>
            )}

            {/* Trade preview rows */}
            {csvRows.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6, fontFamily: 'monospace' }}>
                  Preview ({showAllTrades ? `all ${csvRows.length}` : `first ${Math.min(3, csvRows.length)} of ${csvRows.length}`})
                </div>
                {previewRows.map((row, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 10px', borderRadius: 7, marginBottom: 4,
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                  }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{row.symbol}</span>
                      {row.entryTime && (
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginLeft: 8 }}>
                          {row.entryTime}{row.exitTime ? ` → ${row.exitTime}` : ''}
                        </span>
                      )}
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2, fontFamily: 'monospace' }}>
                        {row.date}{row.notes ? ` · ${row.notes}` : ''}
                      </div>
                    </div>
                    <span style={{
                      fontWeight: 700, fontSize: 15, fontFamily: 'monospace',
                      color: row.pnl >= 0 ? G : R,
                    }}>
                      {row.pnl >= 0 ? '+' : ''}${row.pnl.toFixed(2)}
                    </span>
                  </div>
                ))}
                {csvRows.length > 3 && (
                  <button
                    onClick={() => setShowAllTrades(v => !v)}
                    style={{
                      width: '100%', padding: '6px', borderRadius: 7,
                      border: '1px dashed rgba(255,255,255,0.12)', background: 'transparent',
                      color: 'rgba(255,255,255,0.4)', fontSize: 12, cursor: 'pointer',
                      fontFamily: 'inherit', marginTop: 2,
                    }}
                  >
                    {showAllTrades ? 'Show less' : `Show all ${csvRows.length} trades`}
                  </button>
                )}
              </div>
            )}

            {/* Confirm / Cancel */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={confirmImport}
                disabled={importing || csvRows.length === 0}
                style={{
                  flex: 1, padding: '10px', borderRadius: 8,
                  background: importing || csvRows.length === 0 ? 'rgba(0,255,65,0.4)' : G,
                  color: '#000', fontWeight: 700, fontSize: 13, border: 'none',
                  cursor: importing || csvRows.length === 0 ? 'default' : 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {importing ? 'Importing…' : `Import ${csvRows.length} Trade${csvRows.length !== 1 ? 's' : ''}`}
              </button>
              <button
                onClick={cancelPreview}
                disabled={importing}
                style={{
                  padding: '10px 16px', borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.12)', background: 'transparent',
                  color: 'rgba(255,255,255,0.5)', fontSize: 13, cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* Guided import flow (steps 1–3) — hidden once CSV preview is shown */}
        {!csvRows && !importResult && (
          <div style={{ marginBottom: 16 }}>

            {/* Step indicator */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
              {[1, 2, 3].map((s) => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', flex: s < 3 ? 1 : 'none' }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                    background: s <= importStep ? G : 'transparent',
                    border: `1.5px solid ${s <= importStep ? G : 'rgba(255,255,255,0.15)'}`,
                    color: s <= importStep ? '#000' : 'rgba(255,255,255,0.3)',
                    fontSize: 11, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{s}</div>
                  {s < 3 && (
                    <div style={{ flex: 1, height: 1, background: s < importStep ? G : 'rgba(255,255,255,0.1)', margin: '0 6px' }} />
                  )}
                </div>
              ))}
            </div>

            {/* Step 1: Broker selector */}
            {importStep === 1 && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Select your broker</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 14, lineHeight: 1.5 }}>
                  Choose your platform for step-by-step export instructions.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {BROKER_OPTIONS.map((broker) => (
                    <button
                      key={broker.id}
                      onClick={() => { setSelectedBroker(broker.id); setImportStep(2); }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = G; e.currentTarget.style.color = G; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
                      style={{
                        padding: '12px 8px', borderRadius: 8, textAlign: 'center',
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                        color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
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
            {importStep === 2 && selectedBroker && (() => {
              const instr = BROKER_INSTRUCTIONS[selectedBroker];
              return (
                <div>
                  <button
                    onClick={() => setImportStep(1)}
                    style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', padding: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    ← Back
                  </button>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 12 }}>
                    {instr.title}
                  </div>
                  {instr.info && (
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 12 }}>
                      {instr.info}
                    </div>
                  )}
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '14px 16px', marginBottom: 14 }}>
                    {instr.sections ? (
                      instr.sections.map((section, si) => (
                        <div key={si} style={{ marginBottom: si < instr.sections.length - 1 ? 18 : 0 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: G, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
                            {section.label}
                          </div>
                          <StepList steps={section.steps} />
                          {si < instr.sections.length - 1 && (
                            <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '18px 0 0 0' }} />
                          )}
                        </div>
                      ))
                    ) : (
                      <StepList steps={instr.steps} />
                    )}
                  </div>
                  {instr.warning && (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: 'rgba(240,165,0,0.08)', border: '1px solid rgba(240,165,0,0.3)', borderRadius: 8, padding: '10px 12px', marginBottom: 14 }}>
                      <span style={{ fontSize: 14, flexShrink: 0 }}>⚠️</span>
                      <span style={{ fontSize: 12, color: '#f0a500', lineHeight: 1.5 }}>{instr.warning}</span>
                    </div>
                  )}
                  {instr.note && (
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', lineHeight: 1.5, marginBottom: 14, paddingLeft: 4 }}>
                      ℹ️ {instr.note}
                    </div>
                  )}
                  {instr.showTemplate && (
                    <button
                      onClick={downloadTemplate}
                      style={{ width: '100%', padding: '9px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 10 }}
                    >
                      Download CSV Template
                    </button>
                  )}
                  <button
                    onClick={() => setImportStep(3)}
                    style={{ width: '100%', padding: '11px', borderRadius: 8, background: G, color: '#000', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    I'm ready — Upload my CSV →
                  </button>
                </div>
              );
            })()}

            {/* Step 3: Drag-and-drop upload */}
            {importStep === 3 && (
              <div>
                <button
                  onClick={() => setImportStep(2)}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', padding: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  ← Back
                </button>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Upload your CSV</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 14, lineHeight: 1.5 }}>
                  Drag and drop your exported file here, or click to browse.
                </div>
                <div
                  onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={e => { e.preventDefault(); setIsDragging(false); handleFileDrop(e); }}
                  onClick={() => fileRef.current?.click()}
                  style={{
                    border: `2px dashed ${isDragging ? G : 'rgba(255,255,255,0.15)'}`,
                    borderRadius: 10, padding: '40px 20px', textAlign: 'center',
                    cursor: 'pointer',
                    background: isDragging ? 'rgba(0,255,65,0.04)' : 'rgba(255,255,255,0.02)',
                    transition: 'border-color 0.15s, background 0.15s',
                    marginBottom: 10,
                  }}
                >
                  <div style={{ fontSize: 32, marginBottom: 10 }}>📂</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: isDragging ? G : '#fff', marginBottom: 4, transition: 'color 0.15s' }}>
                    {isDragging ? 'Drop it here!' : 'Drop CSV here or click to browse'}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Supports .csv files</div>
                </div>
                <input ref={fileRef} type="file" accept=".csv" onChange={handleFileUpload} style={{ display: 'none' }} />
              </div>
            )}
          </div>
        )}

        {/* Live Brokerage Sync — Coming Soon teaser */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 16 }}>
          <div style={{ border: '1px solid rgba(0,255,65,0.2)', borderRadius: 8, padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>🔗</div>
            <div style={{ color: G, fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Live Brokerage Sync</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 12 }}>
              Connect your live brokerage account for automatic trade sync. Currently in development.
            </div>
            <div style={{ background: 'rgba(0,255,65,0.1)', border: '1px solid rgba(0,255,65,0.3)', borderRadius: 20, padding: '4px 12px', display: 'inline-block', color: G, fontSize: 11, letterSpacing: '1px', fontWeight: 700 }}>COMING SOON</div>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 8 }}>
              Tradovate · Interactive Brokers · TD Ameritrade · Schwab
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
