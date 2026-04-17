import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTrades, fmtPnl } from '../hooks/useTrades';

const G = '#00ff41';
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function AppCalendar() {
  const { trades, loading } = useTrades();
  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const byDate = useMemo(() => {
    const map = {};
    trades.forEach(t => {
      if (!t.date) return;
      if (!map[t.date]) map[t.date] = { pnl: 0, count: 0 };
      map[t.date].pnl   += t.pnl;
      map[t.date].count += 1;
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
      if (date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)) {
        totalPnl += d.pnl; tradeDays++;
      }
    });
    return { totalPnl, tradeDays };
  }, [byDate, year, month]);

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
              <p className="font-mono font-bold" style={{ color: monthStats.totalPnl >= 0 ? G : '#ff4d4d' }}>{fmtPnl(monthStats.totalPnl)}</p>
            </div>
          )}
          <div className="flex items-center gap-1">
            <button onClick={prevMonth} className="p-2 rounded-lg transition-colors hover:bg-white/[0.06]" style={{ color: 'rgba(255,255,255,0.5)' }}><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={nextMonth} className="p-2 rounded-lg transition-colors hover:bg-white/[0.06]" style={{ color: 'rgba(255,255,255,0.5)' }}><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="rounded-xl overflow-hidden" style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-white/[0.06]">
          {DAYS.map(d => (
            <div key={d} className="py-3 text-center text-[10px] font-mono uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>{d}</div>
          ))}
        </div>

        {/* Cells */}
        <div className="grid grid-cols-7">
          {calDays.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} className="aspect-square border-b border-r border-white/[0.04]" />;
            const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const data = byDate[iso];
            const isToday = iso === new Date().toISOString().split('T')[0];
            const green = data?.pnl > 0; const red = data?.pnl < 0;

            return (
              <div
                key={day}
                className="aspect-square p-2 border-b border-r border-white/[0.04] flex flex-col"
                style={{
                  background: data ? (green ? `${G}08` : 'rgba(255,77,77,0.06)') : 'transparent',
                }}
              >
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
                {data && (
                  <div className="mt-auto">
                    <p className="text-[10px] font-mono font-bold leading-none" style={{ color: green ? G : '#ff4d4d' }}>
                      {data.pnl >= 0 ? '+' : ''}{data.pnl < 0 ? '-' : ''}${Math.abs(data.pnl).toFixed(0)}
                    </p>
                    <p className="text-[9px] font-mono mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>{data.count}t</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ background: `${G}20` }} /> Green day
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ background: 'rgba(255,77,77,0.2)' }} /> Red day
        </div>
      </div>
    </div>
  );
}
