import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fmtPnl } from '../hooks/useTrades';

const G = '#00ff41';
const R = '#ff2d2d';

export default function Calendar({ trades }) {
  const now = new Date();
  const [viewDate, setViewDate]     = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [selectedDate, setSelectedDate] = useState(null);

  const { year, month } = viewDate;
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const dailyMap = {};
  trades.forEach(t => {
    if (!dailyMap[t.date]) dailyMap[t.date] = { pnl: 0, count: 0, trades: [] };
    dailyMap[t.date].pnl += t.pnl;
    dailyMap[t.date].count += 1;
    dailyMap[t.date].trades.push(t);
  });

  const monthStr = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const prevMonth = () => setViewDate(v => v.month === 0 ? { year: v.year - 1, month: 11 } : { year: v.year, month: v.month - 1 });
  const nextMonth = () => setViewDate(v => v.month === 11 ? { year: v.year + 1, month: 0 } : { year: v.year, month: v.month + 1 });

  const monthTrades = trades.filter(t => {
    const [ty, tm] = t.date.split('-').map(Number);
    return ty === year && tm - 1 === month;
  });
  const monthPnl   = monthTrades.reduce((s, t) => s + t.pnl, 0);
  const tradingDays = new Set(monthTrades.map(t => t.date)).size;
  const winDays     = Object.entries(dailyMap).filter(([date, v]) => {
    const [ty, tm] = date.split('-').map(Number);
    return ty === year && tm - 1 === month && v.pnl > 0;
  }).length;

  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const selectedData = selectedDate ? dailyMap[selectedDate] : null;

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
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 800, letterSpacing: 1, color: '#fff', lineHeight: 1 }}>
          Calendar
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 3, marginBottom: 16 }}>
          Trading performance by day
        </div>
      </div>

      <div style={{ padding: '0 16px 80px' }}>
        {/* Month nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={prevMonth}
            style={{
              background: '#111811', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, padding: '6px 14px', color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer', fontFamily: 'Barlow', fontSize: 16,
            }}
          >
            ‹
          </motion.button>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: '#fff' }}>
            {monthStr}
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={nextMonth}
            style={{
              background: '#111811', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, padding: '6px 14px', color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer', fontFamily: 'Barlow', fontSize: 16,
            }}
          >
            ›
          </motion.button>
        </div>

        {/* Month summary row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
          {[
            { label: 'Month P&L',    value: fmtPnl(monthPnl),             color: monthPnl >= 0 ? G : R },
            { label: 'Trading Days', value: String(tradingDays),           color: 'rgba(255,255,255,0.85)' },
            { label: 'Win Days',     value: `${winDays}/${tradingDays}`,   color: G },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.25 }}
              style={{
                background: '#111811', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 10, textAlign: 'center', padding: '10px 6px',
              }}
            >
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 17, fontWeight: 700, color: s.color }}>{s.value}</div>
            </motion.div>
          ))}
        </div>

        {/* Day of week headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.25)', fontWeight: 600, padding: '4px 0' }}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {cells.map((day, i) => {
            if (day === null) return <div key={`e-${i}`} />;
            const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayData  = dailyMap[dateKey];
            const isToday  = dateKey === todayKey;
            const isWin    = dayData && dayData.pnl > 0;
            const isLoss   = dayData && dayData.pnl < 0;
            const isSelected = selectedDate === dateKey;

            return (
              <motion.div
                key={day}
                whileTap={dayData ? { scale: 0.92 } : {}}
                onClick={() => dayData ? setSelectedDate(isSelected ? null : dateKey) : null}
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
                    : isToday  ? `1.5px solid ${G}`
                    : `1px solid ${dayData ? 'transparent' : 'rgba(255,255,255,0.06)'}`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', gap: 1, padding: '4px 2px',
                  cursor: dayData ? 'pointer' : 'default',
                  transition: 'background 0.15s, border 0.15s',
                }}
              >
                <div style={{
                  fontSize: 13,
                  fontWeight: isToday ? 700 : 500,
                  color: isToday ? G : isWin ? G : isLoss ? R : 'rgba(255,255,255,0.4)',
                  lineHeight: 1,
                }}>
                  {day}
                </div>
                {dayData && (
                  <div style={{ fontSize: 8, color: isWin ? G : R, fontWeight: 600, lineHeight: 1 }}>
                    {fmtPnl(Math.round(dayData.pnl)).replace('+', '')}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 16, marginTop: 14, justifyContent: 'center' }}>
          <LegendItem color={`${G}14`} border="transparent" label="Profit day" />
          <LegendItem color={`${R}12`} border="transparent" label="Loss day" />
          <LegendItem color="#111811" border="rgba(255,255,255,0.08)" label="No trades" />
        </div>
      </div>

      {/* Day detail panel */}
      <AnimatePresence>
        {selectedDate && selectedData && (
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 700, letterSpacing: '0.5px', color: '#fff' }}>
                    {formatDayLabel(selectedDate)}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                    {selectedData.count} trade{selectedData.count !== 1 ? 's' : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: 28, fontWeight: 700,
                    color: selectedData.pnl >= 0 ? G : R,
                    lineHeight: 1,
                  }}>
                    {fmtPnl(selectedData.pnl)}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>daily P&L</div>
                </div>
              </div>

              <div style={{ maxHeight: 380, overflowY: 'auto', scrollbarWidth: 'none' }}>
                {selectedData.trades
                  .slice()
                  .sort((a, b) => (a.entryTime || '').localeCompare(b.entryTime || ''))
                  .map((t, i) => (
                    <div
                      key={t.id}
                      style={{
                        padding: '12px 0',
                        borderBottom: i < selectedData.trades.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 17, fontWeight: 700, letterSpacing: '0.5px', color: '#fff' }}>
                              {t.symbol}
                            </span>
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{t.setup}</span>
                            {!t.followedPlan && (
                              <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 8, background: `${R}20`, color: R, border: `1px solid ${R}40` }}>
                                Broke Rules
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                            {t.account}
                            {t.entryTime && t.exitTime ? ` · ${t.entryTime} – ${t.exitTime}` : t.entryTime ? ` · ${t.entryTime}` : ''}
                          </div>
                          {t.notes && (
                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', marginTop: 5, lineHeight: 1.4 }}>
                              "{t.notes}"
                            </div>
                          )}
                        </div>
                        <div style={{
                          fontFamily: "'Barlow Condensed', sans-serif",
                          fontSize: 20, fontWeight: 700,
                          color: t.pnl >= 0 ? G : R,
                          flexShrink: 0, marginLeft: 12,
                        }}>
                          {fmtPnl(t.pnl)}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              <button
                onClick={() => setSelectedDate(null)}
                className="btn-ghost"
                style={{ width: '100%', textAlign: 'center', marginTop: 16 }}
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
