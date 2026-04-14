import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fmtPnl } from '../hooks/useTrades';
import { useAuth } from '../context/AuthContext';
import { useAccountFilter } from '../context/AccountFilterContext';
import AccountSelector from '../components/AccountSelector';
import { api } from '../services/api';

const MOODS  = ['Focused', 'Calm', 'Confident', 'Anxious', 'Frustrated', 'Distracted'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const YEARS  = Array.from({ length: 11 }, (_, i) => 2020 + i); // 2020–2030

const G = '#00ff41';
const R = '#ff2d2d';

// ── Symbol helpers ─────────────────────────────────────────────────────────
const FUTURES_ROOTS = new Set(['ES','MES','NQ','MNQ','YM','MYM','RTY','M2K','CL','GC','SI','ZB','ZN','ZF']);
const CONTRACT_MONTH_RE = /[FGHJKMNQUVXZ]\d{1,2}$/;

function fmtSymbol(raw) {
  if (!raw) return '';
  const s = raw.toUpperCase().replace(/^\//, '');
  const base = s.replace(CONTRACT_MONTH_RE, '') || s;
  return FUTURES_ROOTS.has(base) ? `${base}1!` : base;
}

// Small pen SVG for journal indicator
function PenIcon({ size = 6, color = G, opacity = 0.75 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ opacity, flexShrink: 0 }}
    >
      <path d="M12 20h9"/>
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
    </svg>
  );
}

export default function Calendar({ trades, accounts = [], onNavigate, onLogTrade }) {
  const { token } = useAuth();
  const { selectedAccountId } = useAccountFilter();
  const now = new Date();
  const [viewDate, setViewDate]       = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [pickerMonth, setPickerMonth]   = useState(now.getMonth());
  const [pickerYear,  setPickerYear]    = useState(now.getFullYear());

  // Filter trades by selected account
  const filteredTrades = selectedAccountId
    ? trades.filter(t => t.accountId === selectedAccountId || (!t.accountId && accounts.find(a => a.id === selectedAccountId)?.name === t.account))
    : trades;

  // Daily journal state
  const [journalDates, setJournalDates]     = useState({}); // date → entry summary
  const [journalEntry, setJournalEntry]     = useState(null);
  const [journalEditing, setJournalEditing] = useState(false);
  const [journalDraft, setJournalDraft]     = useState({ preMarket: '', postMarket: '', mood: '' });
  const [journalSaving, setJournalSaving]   = useState(false);

  // Load all journal dates on mount
  useEffect(() => {
    if (!token) return;
    api.getDailyJournalDates(token).then(rows => {
      const map = {};
      (rows || []).forEach(r => { map[r.date] = r; });
      setJournalDates(map);
    }).catch(() => {});
  }, [token]);

  // Load journal entry for selected date
  useEffect(() => {
    if (!selectedDate || !token) { setJournalEntry(null); setJournalEditing(false); return; }
    api.getDailyJournal(token, selectedDate).then(entry => {
      setJournalEntry(entry);
      setJournalDraft(entry
        ? { preMarket: entry.preMarket, postMarket: entry.postMarket, mood: entry.mood }
        : { preMarket: '', postMarket: '', mood: '' }
      );
      setJournalEditing(false);
    }).catch(() => {});
  }, [selectedDate, token]);

  const saveJournal = useCallback(async () => {
    if (!selectedDate || !token) return;
    setJournalSaving(true);
    try {
      const saved = await api.saveDailyJournal(token, { date: selectedDate, ...journalDraft });
      setJournalEntry(saved);
      setJournalDates(prev => ({ ...prev, [selectedDate]: saved }));
      setJournalEditing(false);
    } catch (e) {
      console.error(e);
    } finally {
      setJournalSaving(false);
    }
  }, [selectedDate, token, journalDraft]);

  const { year, month } = viewDate;
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const dailyMap = {};
  filteredTrades.forEach(t => {
    if (!dailyMap[t.date]) dailyMap[t.date] = { pnl: 0, count: 0, trades: [] };
    dailyMap[t.date].pnl    += t.pnl;
    dailyMap[t.date].count  += 1;
    dailyMap[t.date].trades.push(t);
  });

  const monthStr  = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const prevMonth = () => setViewDate(v => v.month === 0  ? { year: v.year - 1, month: 11 } : { year: v.year, month: v.month - 1 });
  const nextMonth = () => setViewDate(v => v.month === 11 ? { year: v.year + 1, month: 0  } : { year: v.year, month: v.month + 1 });
  const prevYear  = () => setViewDate(v => ({ ...v, year: v.year - 1 }));
  const nextYear  = () => setViewDate(v => ({ ...v, year: v.year + 1 }));

  const openDropdown = () => {
    setPickerMonth(month);
    setPickerYear(year);
    setShowDropdown(true);
  };
  const applyDropdown = () => {
    setViewDate({ year: pickerYear, month: pickerMonth });
    setShowDropdown(false);
  };

  const monthTrades  = filteredTrades.filter(t => { const [ty, tm] = t.date.split('-').map(Number); return ty === year && tm - 1 === month; });
  const monthPnl     = monthTrades.reduce((s, t) => s + t.pnl, 0);
  const tradingDays  = new Set(monthTrades.map(t => t.date)).size;
  const winDays      = Object.entries(dailyMap).filter(([d, v]) => { const [ty, tm] = d.split('-').map(Number); return ty === year && tm - 1 === month && v.pnl > 0; }).length;

  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const selectedData = selectedDate ? dailyMap[selectedDate] : null;

  const handleDayTap = (dateKey) => {
    setSelectedDate(prev => prev === dateKey ? null : dateKey);
  };

  const handleLogTrade = () => {
    const date = selectedDate;
    setSelectedDate(null);
    if (onLogTrade) onLogTrade(date);
  };

  return (
    <div style={{ background: '#080c08', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ padding: '20px 16px 0', position: 'relative', overflow: 'hidden' }}>
        <motion.div
          animate={{ opacity: [0.04, 0.09, 0.04] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', top: 4, right: 12,
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 52, fontWeight: 900, color: G,
            letterSpacing: 4, userSelect: 'none', pointerEvents: 'none', lineHeight: 1,
          }}
        >
          CALENDAR
        </motion.div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 800, letterSpacing: 1, color: '#fff', lineHeight: 1 }}>
              Calendar
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 3, marginBottom: 16 }}>
              Trading performance by day
            </div>
          </div>
          <AccountSelector accounts={accounts} />
        </div>
      </div>

      <div style={{ padding: '0 16px 80px' }}>
        {/* Month/Year nav — « ‹ April 2026 ⌄ › » */}
        <div style={{ position: 'relative', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <NavBtn onClick={prevYear}  label="«" />
            <NavBtn onClick={prevMonth} label="‹" />

            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={openDropdown}
              style={{
                background: showDropdown ? 'rgba(0,255,65,0.08)' : '#111811',
                border: showDropdown ? `1px solid ${G}50` : '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, padding: '6px 14px',
                color: '#fff', cursor: 'pointer',
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 17, fontWeight: 700,
                letterSpacing: '1.5px', textTransform: 'uppercase',
                display: 'flex', alignItems: 'center', gap: 6,
                transition: 'border-color 0.15s, background 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {monthStr}
              <span style={{ fontSize: 10, color: showDropdown ? G : 'rgba(255,255,255,0.4)', transition: 'transform 0.15s, color 0.15s', display: 'inline-block', transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
            </motion.button>

            <NavBtn onClick={nextMonth} label="›" />
            <NavBtn onClick={nextYear}  label="»" />
          </div>

          {/* Dropdown picker */}
          <AnimatePresence>
            {showDropdown && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 199 }} onClick={() => setShowDropdown(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  onClick={e => e.stopPropagation()}
                  style={{
                    position: 'absolute', top: 'calc(100% + 8px)', left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 200, width: 272,
                    background: '#0a0f0a',
                    border: `1px solid ${G}25`,
                    borderRadius: 14, padding: '14px 14px 12px',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.8)',
                  }}
                >
                  <div style={{ display: 'flex', gap: 10 }}>
                    {/* Month grid */}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8, fontFamily: "'Barlow Condensed', sans-serif" }}>Month</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
                        {MONTHS.map((m, i) => (
                          <button key={m} onClick={() => setPickerMonth(i)} style={{
                            padding: '5px 2px', borderRadius: 6, border: 'none', cursor: 'pointer',
                            background: pickerMonth === i ? G : 'rgba(255,255,255,0.05)',
                            color: pickerMonth === i ? '#000' : 'rgba(255,255,255,0.6)',
                            fontSize: 11, fontWeight: 700,
                            fontFamily: "'Barlow Condensed', sans-serif",
                            transition: 'background 0.1s',
                          }}>{m}</button>
                        ))}
                      </div>
                    </div>

                    {/* Year column */}
                    <div style={{ width: 58 }}>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8, fontFamily: "'Barlow Condensed', sans-serif" }}>Year</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 168, overflowY: 'auto', scrollbarWidth: 'none' }}>
                        {YEARS.map(y => (
                          <button key={y} onClick={() => setPickerYear(y)} style={{
                            padding: '5px 0', borderRadius: 6, border: 'none', cursor: 'pointer',
                            background: pickerYear === y ? G : 'rgba(255,255,255,0.05)',
                            color: pickerYear === y ? '#000' : 'rgba(255,255,255,0.6)',
                            fontSize: 12, fontWeight: 700,
                            fontFamily: "'Barlow Condensed', sans-serif",
                            textAlign: 'center', transition: 'background 0.1s',
                          }}>{y}</button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={applyDropdown}
                    style={{
                      width: '100%', padding: '9px 0', marginTop: 10,
                      background: G, color: '#000', border: 'none', borderRadius: 8,
                      fontSize: 13, fontWeight: 800,
                      fontFamily: "'Barlow Condensed', sans-serif",
                      letterSpacing: '1.5px', cursor: 'pointer',
                      boxShadow: `0 0 14px ${G}40`,
                    }}
                  >
                    GO
                  </motion.button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Month summary */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
          {[
            { label: 'Month P&L',    value: fmtPnl(monthPnl),           color: monthPnl >= 0 ? G : R },
            { label: 'Trading Days', value: String(tradingDays),         color: 'rgba(255,255,255,0.85)' },
            { label: 'Win Days',     value: `${winDays}/${tradingDays}`, color: G },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06, duration: 0.25 }}
              style={{ background: '#111811', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, textAlign: 'center', padding: '10px 6px' }}
            >
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 17, fontWeight: 700, color: s.color }}>{s.value}</div>
            </motion.div>
          ))}
        </div>

        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
          {['S','M','T','W','T','F','S'].map((d, i) => (
            <div key={i} style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.25)', fontWeight: 600, padding: '4px 0' }}>{d}</div>
          ))}
        </div>

        {/* Calendar grid — every cell is tappable */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {cells.map((day, i) => {
            if (day === null) return <div key={`e-${i}`} />;

            const col        = i % 7; // 0 = Sun, 6 = Sat
            const isWeekend  = col === 0 || col === 6;
            const dateKey    = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayData    = dailyMap[dateKey];
            const hasJournal = !!journalDates[dateKey];
            const isToday    = dateKey === todayKey;
            const isWin      = dayData && dayData.pnl > 0;
            const isLoss     = dayData && dayData.pnl < 0;
            const isSelected = selectedDate === dateKey;

            return (
              <motion.div
                key={day}
                whileTap={{ scale: 0.88 }}
                onClick={() => handleDayTap(dateKey)}
                style={{
                  aspectRatio: '1',
                  borderRadius: 8,
                  background: isSelected
                    ? (isWin ? `${G}30` : isLoss ? `${R}28` : 'rgba(255,255,255,0.1)')
                    : isWin  ? `${G}14`
                    : isLoss ? `${R}12`
                    : '#111811',
                  border: isSelected
                    ? `1.5px solid ${isWin ? G : isLoss ? R : 'rgba(255,255,255,0.3)'}`
                    : isToday
                    ? `2px solid ${G}80`
                    : '1px solid rgba(255,255,255,0.06)',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: 1, padding: '4px 2px',
                  cursor: 'pointer',
                  opacity: isWeekend && !dayData && !hasJournal ? 0.5 : 1,
                  transition: 'background 0.15s, border 0.15s',
                }}
              >
                {/* Day number */}
                <div style={{
                  fontSize: 13, lineHeight: 1,
                  fontWeight: isToday ? 800 : 500,
                  color: isToday ? G
                    : isWin  ? G
                    : isLoss ? R
                    : isWeekend ? 'rgba(255,255,255,0.3)'
                    : 'rgba(255,255,255,0.5)',
                }}>
                  {day}
                </div>

                {/* P&L text */}
                {dayData && (
                  <div style={{ fontSize: 8, color: isWin ? G : R, fontWeight: 600, lineHeight: 1 }}>
                    {fmtPnl(Math.round(dayData.pnl)).replace('+', '')}
                  </div>
                )}

                {/* Indicators: trade dot and/or journal pen */}
                {(dayData || hasJournal) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginTop: 1 }}>
                    {dayData && hasJournal && (
                      <div style={{ width: 3, height: 3, borderRadius: '50%', background: isWin ? G : R, opacity: 0.9 }} />
                    )}
                    {hasJournal && <PenIcon size={6} color={G} opacity={0.75} />}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 12, marginTop: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <LegendItem color={`${G}14`} border="transparent" label="Profit day" />
          <LegendItem color={`${R}12`} border="transparent" label="Loss day" />
          <LegendItem color="#111811" border="rgba(255,255,255,0.08)" label="No trades" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <PenIcon size={9} color={G} opacity={0.7} />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Journal</span>
          </div>
        </div>
      </div>

      {/* Day detail panel — opens for every tapped day */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="modal-overlay" onClick={() => setSelectedDate(null)}
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="modal-sheet" onClick={e => e.stopPropagation()}
              style={{ background: '#0d1a0d', border: '1px solid rgba(0,255,65,0.12)' }}
            >
              <div className="modal-handle" />

              {/* Inner content animates when switching days */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedDate}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.16, ease: 'easeOut' }}
                >
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <div>
                      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 700, letterSpacing: '0.5px', color: '#fff' }}>
                        {formatDayLabel(selectedDate)}
                      </div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                        {selectedData
                          ? `${selectedData.count} trade${selectedData.count !== 1 ? 's' : ''}`
                          : 'No trades taken'}
                      </div>
                    </div>
                    {selectedData && (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 700, color: selectedData.pnl >= 0 ? G : R, lineHeight: 1 }}>
                          {fmtPnl(selectedData.pnl)}
                        </div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>daily P&L</div>
                      </div>
                    )}
                  </div>

                  {/* Trade list (only if trades exist) */}
                  {selectedData ? (
                    <div style={{ maxHeight: 220, overflowY: 'auto', scrollbarWidth: 'none', marginBottom: 12 }}>
                      {selectedData.trades
                        .slice()
                        .sort((a, b) => (a.entryTime || '').localeCompare(b.entryTime || ''))
                        .map((t, i) => (
                          <motion.div
                            key={t.id}
                            whileTap={onNavigate ? { scale: 0.98 } : {}}
                            onClick={() => { if (onNavigate) { setSelectedDate(null); onNavigate('journal', t.id); } }}
                            style={{
                              padding: '11px 0',
                              borderBottom: i < selectedData.trades.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none',
                              cursor: onNavigate ? 'pointer' : 'default',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 700, letterSpacing: '0.5px', color: '#fff' }}>
                                    {fmtSymbol(t.symbol)}
                                  </span>
                                  {t.side && (
                                    <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: t.side === 'Long' ? `${G}20` : `${R}20`, color: t.side === 'Long' ? G : R, border: `1px solid ${t.side === 'Long' ? G : R}40` }}>
                                      {t.side.toUpperCase()}
                                    </span>
                                  )}
                                  {!t.followedPlan && (
                                    <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: `${R}20`, color: R, border: `1px solid ${R}40` }}>RULES</span>
                                  )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                  {t.quantity != null && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{t.quantity}ct</span>}
                                  {t.entryPrice != null && t.exitPrice != null && (
                                    <>
                                      {t.quantity != null && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>·</span>}
                                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
                                        {Math.round(t.entryPrice).toLocaleString()} → {Math.round(t.exitPrice).toLocaleString()}
                                      </span>
                                    </>
                                  )}
                                  {t.setup && (
                                    <>
                                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>·</span>
                                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{t.setup}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 12 }}>
                                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700, color: t.pnl >= 0 ? G : R }}>
                                  {fmtPnl(t.pnl)}
                                </div>
                                {onNavigate && <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.2)', lineHeight: 1 }}>›</span>}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                    </div>
                  ) : (
                    /* No trades state */
                    <div style={{ textAlign: 'center', padding: '14px 0 16px' }}>
                      <div style={{ fontSize: 28, opacity: 0.25, marginBottom: 6 }}>📋</div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>
                        No trades taken this day
                      </div>
                    </div>
                  )}

                  {/* + Log Trade */}
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={handleLogTrade}
                    style={{
                      width: '100%', padding: '11px 0', borderRadius: 10,
                      background: `${G}18`, border: `1px solid ${G}50`,
                      color: G, fontFamily: "'Barlow', sans-serif",
                      fontWeight: 700, fontSize: 14, cursor: 'pointer',
                      marginBottom: 12, letterSpacing: '0.3px',
                    }}
                  >
                    + Log Trade
                  </motion.button>

                  {/* Daily Journal Section */}
                  <div style={{ paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                          Daily Journal
                        </div>
                        {journalDates[selectedDate] && !journalEditing && (
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: G }} />
                        )}
                      </div>
                      {!journalEditing ? (
                        <button
                          onClick={() => setJournalEditing(true)}
                          style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6, background: `${G}14`, color: G, border: `1px solid ${G}40`, cursor: 'pointer', fontFamily: 'Barlow' }}
                        >
                          {journalEntry ? 'Edit' : '+ Add'}
                        </button>
                      ) : (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={saveJournal} disabled={journalSaving}
                            style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6, background: G, color: '#000', border: 'none', cursor: journalSaving ? 'default' : 'pointer', fontFamily: 'Barlow', opacity: journalSaving ? 0.6 : 1 }}
                          >
                            {journalSaving ? 'Saving…' : 'Save'}
                          </button>
                          <button
                            onClick={() => { setJournalEditing(false); if (journalEntry) setJournalDraft({ preMarket: journalEntry.preMarket, postMarket: journalEntry.postMarket, mood: journalEntry.mood }); }}
                            style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, background: 'transparent', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', fontFamily: 'Barlow' }}
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>

                    {journalEditing ? (
                      <div>
                        {/* Mood */}
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Mood</div>
                          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                            {MOODS.map(m => (
                              <button key={m} onClick={() => setJournalDraft(d => ({ ...d, mood: d.mood === m ? '' : m }))}
                                style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontFamily: 'Barlow', fontWeight: journalDraft.mood === m ? 700 : 500, cursor: 'pointer', background: journalDraft.mood === m ? G : 'rgba(255,255,255,0.05)', color: journalDraft.mood === m ? '#000' : 'rgba(255,255,255,0.55)', border: journalDraft.mood === m ? `1px solid ${G}` : '1px solid rgba(255,255,255,0.1)', transition: 'all 0.12s' }}
                              >{m}</button>
                            ))}
                          </div>
                        </div>
                        {/* Pre-market */}
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>Pre-Market Thoughts</div>
                          <textarea value={journalDraft.preMarket} onChange={e => setJournalDraft(d => ({ ...d, preMarket: e.target.value }))} placeholder="What's your plan for today? Key levels, bias, focus..." rows={3}
                            style={{ width: '100%', boxSizing: 'border-box', background: '#111811', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '9px 11px', fontSize: 12, color: '#fff', fontFamily: 'Barlow', lineHeight: 1.5, resize: 'vertical', outline: 'none' }}
                            onFocus={e => { e.target.style.borderColor = `${G}60`; }}
                            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                          />
                        </div>
                        {/* Post-market */}
                        <div>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>Post-Market Reflection</div>
                          <textarea value={journalDraft.postMarket} onChange={e => setJournalDraft(d => ({ ...d, postMarket: e.target.value }))} placeholder="How did the session go? What worked, what didn't?" rows={3}
                            style={{ width: '100%', boxSizing: 'border-box', background: '#111811', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '9px 11px', fontSize: 12, color: '#fff', fontFamily: 'Barlow', lineHeight: 1.5, resize: 'vertical', outline: 'none' }}
                            onFocus={e => { e.target.style.borderColor = `${G}60`; }}
                            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                          />
                        </div>
                      </div>
                    ) : journalEntry ? (
                      <div>
                        {journalEntry.mood && (
                          <div style={{ marginBottom: 8 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20, background: `${G}14`, color: G, border: `1px solid ${G}30` }}>
                              {journalEntry.mood}
                            </span>
                          </div>
                        )}
                        {journalEntry.preMarket && (
                          <div style={{ marginBottom: 8 }}>
                            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>Pre-Market</div>
                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{journalEntry.preMarket}</div>
                          </div>
                        )}
                        {journalEntry.postMarket && (
                          <div>
                            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>Post-Market</div>
                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{journalEntry.postMarket}</div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>
                        No journal entry for this day yet.
                      </div>
                    )}
                  </div>

                  <button onClick={() => setSelectedDate(null)} className="btn-ghost" style={{ width: '100%', textAlign: 'center', marginTop: 16 }}>
                    Close
                  </button>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function NavBtn({ onClick, label }) {
  return (
    <motion.button
      whileTap={{ scale: 0.85 }}
      whileHover={{ color: G, borderColor: `${G}60` }}
      onClick={onClick}
      style={{
        background: '#111811', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 8, padding: '6px 10px',
        color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
        fontFamily: 'Barlow', fontSize: 16, lineHeight: 1,
        flexShrink: 0,
      }}
    >
      {label}
    </motion.button>
  );
}

function LegendItem({ color, border, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 14, height: 14, borderRadius: 3, background: color, border: `1px solid ${border}` }} />
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{label}</span>
    </div>
  );
}

function formatDayLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}
