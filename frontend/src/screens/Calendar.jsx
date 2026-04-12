import React, { useState } from 'react';
import { fmtPnl } from '../hooks/useTrades';

export default function Calendar({ trades }) {
  const now = new Date();
  const [viewDate, setViewDate]     = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [selectedDate, setSelectedDate] = useState(null);

  const { year, month } = viewDate;
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Build daily P&L map
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

  // Monthly stats
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
    <div>
      <div className="screen-header">
        <div className="screen-title">Calendar</div>
        <div className="screen-subtitle">Trading performance by day</div>
      </div>

      <div className="section" style={{ paddingTop: 20 }}>
        {/* Month navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <button onClick={prevMonth} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', color: 'var(--text)', cursor: 'pointer', fontFamily: 'Barlow' }}>‹</button>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
            {monthStr}
          </div>
          <button onClick={nextMonth} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', color: 'var(--text)', cursor: 'pointer', fontFamily: 'Barlow' }}>›</button>
        </div>

        {/* Month summary row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
          {[
            { label: 'Month P&L',    value: fmtPnl(monthPnl),             color: monthPnl >= 0 ? 'var(--green)' : 'var(--red)' },
            { label: 'Trading Days', value: tradingDays,                   color: 'var(--text)' },
            { label: 'Win Days',     value: `${winDays}/${tradingDays}`,   color: 'var(--green)' },
          ].map(s => (
            <div key={s.label} className="card" style={{ textAlign: 'center', padding: '10px 6px' }}>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 17, fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Day of week headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, padding: '4px 0' }}>{d}</div>
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
              <div
                key={day}
                onClick={() => dayData ? setSelectedDate(isSelected ? null : dateKey) : null}
                style={{
                  aspectRatio: '1',
                  borderRadius: 8,
                  background: isSelected
                    ? (isWin ? 'rgba(0,240,122,0.35)' : isLoss ? 'rgba(255,68,68,0.28)' : 'var(--border)')
                    : isWin  ? 'rgba(0,240,122,0.15)'
                    : isLoss ? 'rgba(255,68,68,0.12)'
                    : 'var(--card)',
                  border: isSelected
                    ? `1.5px solid ${isWin ? 'var(--green)' : isLoss ? 'var(--red)' : 'var(--border)'}`
                    : isToday  ? '1.5px solid var(--green)'
                    : `1px solid ${dayData ? 'transparent' : 'var(--border)'}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  padding: '4px 2px',
                  cursor: dayData ? 'pointer' : 'default',
                  transition: 'background 0.15s, border 0.15s',
                }}
              >
                <div style={{
                  fontSize: 13,
                  fontWeight: isToday ? 700 : 500,
                  color: isToday ? 'var(--green)' : isWin ? 'var(--green)' : isLoss ? 'var(--red)' : 'var(--text-secondary)',
                  lineHeight: 1,
                }}>
                  {day}
                </div>
                {dayData && (
                  <div style={{ fontSize: 8, color: isWin ? 'var(--green)' : 'var(--red)', fontWeight: 600, lineHeight: 1 }}>
                    {fmtPnl(Math.round(dayData.pnl)).replace('+', '')}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 16, marginTop: 16, justifyContent: 'center' }}>
          <LegendItem color="rgba(0,240,122,0.15)" border="transparent" label="Profit day" />
          <LegendItem color="rgba(255,68,68,0.12)" border="transparent" label="Loss day" />
          <LegendItem color="var(--card)" border="var(--border)" label="No trades" />
        </div>
      </div>

      {/* Day detail panel */}
      {selectedDate && selectedData && (
        <div className="modal-overlay" onClick={() => setSelectedDate(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 700, letterSpacing: '0.5px' }}>
                  {formatDayLabel(selectedDate)}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {selectedData.count} trade{selectedData.count !== 1 ? 's' : ''}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 28,
                  fontWeight: 700,
                  color: selectedData.pnl >= 0 ? 'var(--green)' : 'var(--red)',
                  lineHeight: 1,
                }}>
                  {fmtPnl(selectedData.pnl)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>daily P&L</div>
              </div>
            </div>

            {/* Trade list */}
            <div style={{ maxHeight: 380, overflowY: 'auto', scrollbarWidth: 'none' }}>
              {selectedData.trades
                .slice()
                .sort((a, b) => (a.entryTime || '').localeCompare(b.entryTime || ''))
                .map((t, i) => (
                  <div
                    key={t.id}
                    style={{
                      padding: '12px 0',
                      borderBottom: i < selectedData.trades.length - 1 ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 17, fontWeight: 700, letterSpacing: '0.5px' }}>
                            {t.symbol}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{t.setup}</span>
                          {!t.followedPlan && (
                            <span className="badge badge-red" style={{ fontSize: 9 }}>Broke Rules</span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {t.account}
                          {t.entryTime && t.exitTime ? ` · ${t.entryTime} – ${t.exitTime}` : t.entryTime ? ` · ${t.entryTime}` : ''}
                        </div>
                        {t.notes && (
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: 5, lineHeight: 1.4 }}>
                            "{t.notes}"
                          </div>
                        )}
                      </div>
                      <div style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontSize: 20,
                        fontWeight: 700,
                        color: t.pnl >= 0 ? 'var(--green)' : 'var(--red)',
                        flexShrink: 0,
                        marginLeft: 12,
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
          </div>
        </div>
      )}
    </div>
  );
}

function LegendItem({ color, border, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 14, height: 14, borderRadius: 3, background: color, border: `1px solid ${border}` }} />
      <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{label}</span>
    </div>
  );
}

function formatDayLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}
