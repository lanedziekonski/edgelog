import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X, Plus } from 'lucide-react';
import { useTrades, fmtPnl } from '../hooks/useTrades';

const G = '#00ff41';
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function AppCalendar() {
  const { trades, loading } = useTrades();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState(null);
  const [showAddTrade, setShowAddTrade] = useState(false);

  const byDate = useMemo(() => {
    const map = {};
    trades.forEach(t => {
      if (!t.date) return;
      if (!map[t.date]) map[t.date] = { pnl: 0, count: 0, trades: [] };
      map[t.date].pnl += t.pnl;
      map[t.date].count += 1;
      map[t.date].trades.push(t);
    });
    return map;
  }, [trades]);

  const calDays = useMemo(() => {
    const first = new Date(year, month, 1).getDay();
    const total = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < first; i++) cells.push(null);
    for (let d = 1; d <= total; d++) cells.push(d);
    return cells;
  }, [year, month]);

  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); };

  const monthStats = useMemo(() => {
    let totalPnl = 0; let tradeDays = 0;
    Object.entries(byDate).forEach(([date, d]) => {
      if (date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)) { totalPnl += d.pnl; tradeDays++; }
    });
    return { totalPnl, tradeDays };
  }, [byDate, year, month]);

  const selectedIso = selectedDay ? `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}` : null;
  const selectedData = selectedIso ? byDate[selectedIso] : null;

  if (loading) return <div className="flex items-center justify-center h-48"><p className="text-sm font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>Loading…</p></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: G }}>Calendar</p>
          <h1 className="text-3xl font-bold tracking-tight">{MONTHS[month]} {year}</h1>
        </div>
        <div className="flex items-center gap-4">
          {monthStats.tradeDays > 0 && (
            <div className="text-right">
              <p className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.35)' }}>{monthStats.tradeDays} trading days</p>
              <p className="text-xl font-mono font-bold" style={{ color: monthStats.totalPnl >= 0 ? G : '#ff4d4d' }}>{fmtPnl(monthStats.totalPnl)}</p>
            </div>
          )}
          <div className="flex items-center gap-1">
            <button onClick={prevMonth} className="p-2 rounded-lg transition-colors hover:bg-white/[0.06]" style={{ color: 'rgba(255,255,255,0.5)' }}><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={nextMonth} className="p-2 rounded-lg transition-colors hover:bg-white/[0.06]" style={{ color: 'rgba(255,255,255,0.5)' }}><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(10,10,10,0.85)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}>
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-white/[0.06]">
          {DAYS.map(d => (
            <div key={d} className="py-3 text-center text-[10px] font-mono uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>{d}</div>
          ))}
        </div>
        {/* Cells */}
        <div className="grid grid-cols-7">
          {calDays.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} className="border-b border-r border-white/[0.04]" style={{ minHeight: 100 }} />;
            const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const data = byDate[iso];
            const isToday = iso === new Date().toISOString().split('T')[0];
            const isSelected = selectedDay === day;
            const green = data?.pnl > 0;

            return (
              <div
                key={day}
                onClick={() => { setSelectedDay(day === selectedDay ? null : day); }}
                className="border-b border-r border-white/[0.04] flex flex-col cursor-pointer transition-all hover:bg-white/[0.04]"
                style={{
                  minHeight: 100,
                  padding: '10px',
                  background: isSelected
                    ? `rgba(0,255,65,0.08)`
                    : data
                      ? (green ? 'rgba(0,255,65,0.05)' : 'rgba(255,77,77,0.04)')
                      : 'transparent',
                  outline: isSelected ? `1px solid rgba(0,255,65,0.3)` : undefined,
                }}
              >
                <div className="flex items-start justify-between">
                  <span
                    className="text-xs font-mono w-6 h-6 flex items-center justify-center rounded-full leading-none"
                    style={{
                      color: isToday ? '#000' : 'rgba(255,255,255,0.5)',
                      background: isToday ? G : 'transparent',
                      fontWeight: isToday ? 700 : 400,
                    }}
                  >
                    {day}
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); setSelectedDay(day); setShowAddTrade(true); }}
                    className="opacity-0 hover:opacity-100 w-5 h-5 rounded flex items-center justify-center transition-opacity"
                    style={{ color: G, background: 'rgba(0,255,65,0.1)' }}
                    title="Add trade"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                {data && (
                  <div className="mt-auto pt-2">
                    <p className="font-mono font-bold leading-none" style={{ fontSize: 16, color: green ? G : '#ff4d4d' }}>
                      {data.pnl >= 0 ? '+' : '-'}${Math.abs(data.pnl).toFixed(0)}
                    </p>
                    <p className="text-[9px] font-mono mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>{data.count} trade{data.count !== 1 ? 's' : ''}</p>
                  </div>
                )}
                {!data && (
                  <div className="mt-auto flex items-center justify-center pb-2 opacity-0 hover:opacity-100 transition-opacity">
                    <span className="text-[9px] font-mono" style={{ color: 'rgba(0,255,65,0.4)' }}>+ add trade</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected day panel */}
      {selectedDay && selectedIso && (
        <div className="rounded-xl p-5" style={{ background: 'rgba(10,10,10,0.9)', border: '1px solid rgba(0,255,65,0.15)', backdropFilter: 'blur(12px)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest" style={{ color: G }}>
                {MONTHS[month]} {selectedDay}, {year}
              </p>
              {selectedData && (
                <p className="text-2xl font-mono font-bold mt-1" style={{ color: selectedData.pnl >= 0 ? G : '#ff4d4d' }}>
                  {selectedData.pnl >= 0 ? '+' : '-'}${Math.abs(selectedData.pnl).toFixed(2)}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddTrade(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors"
                style={{ background: 'rgba(0,255,65,0.1)', color: G, border: '1px solid rgba(0,255,65,0.2)' }}
              >
                <Plus className="w-3.5 h-3.5" /> Add Trade
              </button>
              <button onClick={() => setSelectedDay(null)} style={{ color: 'rgba(255,255,255,0.3)' }}>
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {selectedData?.trades?.length > 0 ? (
            <div className="space-y-2">
              <div className="grid grid-cols-5 pb-2 border-b border-white/[0.06]" style={{ gap: 12 }}>
                {['Symbol', 'Setup', 'Account', 'Side', 'P&L'].map(h => (
                  <p key={h} className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>{h}</p>
                ))}
              </div>
              {selectedData.trades.map(t => (
                <div key={t.id} className="grid grid-cols-5 py-2 border-b border-white/[0.04]" style={{ gap: 12 }}>
                  <p className="text-sm font-mono font-bold text-white">{t.symbol}</p>
                  <p className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.5)' }}>{t.setup || '—'}</p>
                  <p className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>{t.account || '—'}</p>
                  <p className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>{t.direction || '—'}</p>
                  <p className="text-sm font-mono font-bold" style={{ color: t.pnl >= 0 ? G : '#ff4d4d' }}>
                    {fmtPnl(t.pnl)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>No trades on this day</p>
              <button
                onClick={() => setShowAddTrade(true)}
                className="mt-3 text-xs font-mono underline"
                style={{ color: G }}
              >
                Add a trade
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add Trade modal - redirects to journal */}
      {showAddTrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="rounded-2xl p-6 w-full max-w-sm mx-4" style={{ background: '#111', border: '1px solid rgba(0,255,65,0.2)' }}>
            <div className="flex items-center justify-between mb-4">
              <p className="font-mono font-bold" style={{ color: G }}>Add Trade</p>
              <button onClick={() => setShowAddTrade(false)} style={{ color: 'rgba(255,255,255,0.4)' }}><X className="w-4 h-4" /></button>
            </div>
            <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
              To add a trade for {selectedIso ? `${MONTHS[month]} ${selectedDay}` : 'this day'}, go to the Journal and log it with this date.
            </p>
            <a
              href="/journal"
              className="block w-full text-center py-2.5 rounded-lg font-mono font-bold text-sm transition-colors"
              style={{ background: G, color: '#000' }}
            >
              Go to Journal
            </a>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded" style={{ background: 'rgba(0,255,65,0.2)' }} />Green day</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded" style={{ background: 'rgba(255,77,77,0.2)' }} />Red day</div>
        <div className="flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.2)' }}>Click any day to see trades</div>
      </div>
    </div>
  );
}
