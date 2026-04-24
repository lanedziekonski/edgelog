import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Plus, Trophy, Flame, AlertTriangle } from 'lucide-react';
import { useTrades, fmtPnl } from '../hooks/useTrades';
import { useAccounts } from '../hooks/useAccounts';
import { useAccountFilter } from '../context/AccountFilterContext';

const G = '#00ff41';
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function AppCalendar() {
  const { trades: allTrades, loading } = useTrades();
  const { accounts } = useAccounts();
  const { selectedAccountId } = useAccountFilter();
  const trades = useMemo(() => {
    if (!selectedAccountId) return allTrades;
    const acct = accounts.find(a => String(a.id) === String(selectedAccountId));
    if (!acct) return allTrades;
    return allTrades.filter(t => t.account === acct.name);
  }, [allTrades, accounts, selectedAccountId]);

  const now = new Date();
  const [year, setYear]           = useState(now.getFullYear());
  const [month, setMonth]         = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState(null);
  const [hoveredIso, setHoveredIso]   = useState(null);
  const navigate = useNavigate();

  // ── data aggregation (unchanged) ──────────────────────────────────────────
  const byDate = useMemo(() => {
    const map = {};
    trades.forEach(t => {
      if (!t.date) return;
      if (!map[t.date]) map[t.date] = { pnl: 0, count: 0, trades: [] };
      map[t.date].pnl   += t.pnl;
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

  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;

  const monthStats = useMemo(() => {
    let totalPnl = 0; let tradeDays = 0;
    Object.entries(byDate).forEach(([date, d]) => {
      if (date.startsWith(monthPrefix)) { totalPnl += d.pnl; tradeDays++; }
    });
    return { totalPnl, tradeDays };
  }, [byDate, monthPrefix]);

  // ── month-level meta for heatmap + badges ─────────────────────────────────
  const monthMeta = useMemo(() => {
    // All trading days in the visible month, sorted ascending
    const entries = Object.entries(byDate)
      .filter(([date]) => date.startsWith(monthPrefix))
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Heatmap: max |pnl| across the month (floor at 1 to avoid div/0)
    const maxAbsPnl = Math.max(...entries.map(d => Math.abs(d.pnl)), 1);

    // Trophy: date with highest total pnl
    const trophyDate = entries
      .filter(d => d.pnl > 0)
      .sort((a, b) => b.pnl - a.pnl)[0]?.date ?? null;

    // Streak: consecutive TRADING days that are green.
    // Days with no trades don't break the streak — they just don't appear in
    // `entries` at all. Only a red/zero trading day resets the run.
    const streakDates = new Set();
    let run = [];
    for (const d of entries) {
      if (d.pnl > 0) {
        run.push(d.date);
        // Once run hits 3, keep adding each new date and back-fill earlier ones
        if (run.length >= 3) run.forEach(dt => streakDates.add(dt));
      } else {
        // Red or zero trading day → reset streak
        run = [];
      }
    }

    return { maxAbsPnl, trophyDate, streakDates };
  }, [byDate, monthPrefix]);

  const selectedIso  = selectedDay
    ? `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
    : null;
  const selectedData = selectedIso ? byDate[selectedIso] : null;
  const todayIso     = now.toISOString().split('T')[0];

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <p className="text-sm font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>Loading…</p>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* ── Header (unchanged) ───────────────────────────────────────────── */}
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

      {/* ── Calendar grid ────────────────────────────────────────────────── */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: 'rgba(10,10,10,0.85)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}
      >
        {/* Day-of-week headers (unchanged) */}
        <div className="grid grid-cols-7 border-b border-white/[0.06]">
          {DAYS.map(d => (
            <div key={d} className="py-3 text-center text-[10px] font-mono uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {calDays.map((day, i) => {
            // Empty leading cell
            if (!day) return (
              <div
                key={`empty-${i}`}
                className="border-b border-r"
                style={{ minHeight: 130, borderBottomColor: 'rgba(255,255,255,0.04)', borderRightColor: 'rgba(255,255,255,0.04)' }}
              />
            );

            const iso      = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const data     = byDate[iso];
            const isToday  = iso === todayIso;
            const isSelected = selectedDay === day;
            const isHovered  = hoveredIso === iso;

            // Only compute these when the day has trades
            const intensity = data ? Math.abs(data.pnl) / monthMeta.maxAbsPnl : 0;
            const isGreen   = data && data.pnl > 0;
            const isRed     = data && data.pnl < 0;

            // Badges — only on trading days
            const isTrophyDay  = !!data && iso === monthMeta.trophyDate;
            const isStreakDay   = !!data && monthMeta.streakDates.has(iso);
            // Rule-break: must have at least one trade where followedPlan is explicitly false
            const hasRuleBreak = !!data && data.trades.some(t => t.followedPlan === false);

            // Best single trade P&L of the day
            const bestTrade = data?.trades?.length
              ? Math.max(...data.trades.map(t => t.pnl ?? 0))
              : null;

            // ── Heatmap background ──────────────────────────────────────
            const hoverBoost = isHovered && data ? 0.05 : 0;
            let bg;
            if (isSelected) {
              bg = 'rgba(0,255,65,0.09)';
            } else if (!data) {
              bg = isHovered ? 'rgba(255,255,255,0.015)' : 'transparent';
            } else if (data.pnl === 0) {
              bg = isHovered ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.025)';
            } else if (isGreen) {
              bg = `rgba(0,255,65,${Math.min(0.26, 0.04 + intensity * 0.18 + hoverBoost).toFixed(3)})`;
            } else {
              bg = `rgba(255,77,77,${Math.min(0.20, 0.03 + intensity * 0.13 + hoverBoost).toFixed(3)})`;
            }

            // ── Border color ────────────────────────────────────────────
            let borderColor;
            if (isSelected) {
              borderColor = 'rgba(0,255,65,0.28)';
            } else if (!data) {
              borderColor = 'rgba(255,255,255,0.04)';
            } else if (isGreen) {
              borderColor = `rgba(0,255,65,${(0.07 + intensity * 0.28).toFixed(3)})`;
            } else if (isRed) {
              borderColor = `rgba(255,77,77,${(0.07 + intensity * 0.22).toFixed(3)})`;
            } else {
              borderColor = 'rgba(255,255,255,0.06)';
            }

            // ── Inset glow (high-intensity days + hover) ────────────────
            let boxShadow;
            if (data && data.pnl !== 0 && (isHovered || intensity > 0.55)) {
              const a = isHovered ? 0.07 : (intensity - 0.55) * 0.15;
              const capped = Math.min(0.09, a);
              boxShadow = isGreen
                ? `inset 0 0 22px rgba(0,255,65,${capped.toFixed(3)})`
                : `inset 0 0 22px rgba(255,77,77,${(Math.min(0.07, a)).toFixed(3)})`;
            }

            return (
              <div
                key={day}
                onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                onMouseEnter={() => setHoveredIso(iso)}
                onMouseLeave={() => setHoveredIso(null)}
                className="border-b border-r flex flex-col cursor-pointer"
                style={{
                  minHeight: 130,
                  padding: '8px 8px 8px 10px',
                  background: bg,
                  borderBottomColor: borderColor,
                  borderRightColor: borderColor,
                  boxShadow,
                  outline: isSelected ? '1px solid rgba(0,255,65,0.28)' : undefined,
                  transition: 'background 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
                }}
              >
                {/* ── Top row: day number (left) + badges + plus (right) ── */}
                <div className="flex items-start justify-between gap-1">

                  {/* Day number / today indicator */}
                  {isToday ? (
                    <motion.span
                      className="text-sm font-mono w-7 h-7 flex items-center justify-center rounded-full leading-none flex-shrink-0"
                      style={{ color: '#000', background: G, fontWeight: 700 }}
                      animate={{
                        boxShadow: [
                          '0 0 0 0px rgba(0,255,65,0.30)',
                          '0 0 0 4px rgba(0,255,65,0)',
                          '0 0 0 0px rgba(0,255,65,0)',
                        ],
                      }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut', repeatDelay: 0.8 }}
                    >
                      {day}
                    </motion.span>
                  ) : (
                    <span
                      className="text-sm font-mono w-7 h-7 flex items-center justify-center rounded-full leading-none flex-shrink-0"
                      style={{ color: 'rgba(255,255,255,0.45)' }}
                    >
                      {day}
                    </span>
                  )}

                  {/* Right column: badges stacked vertically, plus button below */}
                  <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                    {isTrophyDay && <Trophy className="w-3 h-3" style={{ color: '#fbbf24' }} />}
                    {isStreakDay  && <Flame className="w-3 h-3" style={{ color: '#f97316' }} />}
                    {hasRuleBreak && <AlertTriangle className="w-3 h-3" style={{ color: '#fb923c' }} />}
                    <button
                      onClick={e => { e.stopPropagation(); navigate(`/journal?addTrade=1&date=${iso}`); }}
                      className="w-5 h-5 rounded flex items-center justify-center"
                      style={{
                        color: G,
                        background: 'rgba(0,255,65,0.1)',
                        opacity: isHovered ? 1 : 0,
                        transition: 'opacity 0.15s',
                      }}
                      title="Add trade"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* ── Bottom content ─────────────────────────────────────── */}
                {data ? (
                  <div className="mt-auto pt-2 flex flex-col gap-0.5">
                    {/* P&L — large, intensity-glowed on big days */}
                    <p
                      className="font-mono font-bold leading-tight"
                      style={{
                        fontSize: 17,
                        color: isGreen ? G : isRed ? '#ff4d4d' : 'rgba(255,255,255,0.4)',
                        textShadow:
                          isGreen && intensity > 0.65
                            ? `0 0 10px rgba(0,255,65,${(intensity * 0.42).toFixed(2)})`
                            : isRed && intensity > 0.65
                            ? `0 0 10px rgba(255,77,77,${(intensity * 0.35).toFixed(2)})`
                            : undefined,
                      }}
                    >
                      {data.pnl >= 0 ? '+' : '-'}${Math.abs(data.pnl).toFixed(0)}
                    </p>

                    {/* Trade count + best trade on one line */}
                    <div className="flex items-center gap-1">
                      <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'rgba(255,255,255,0.25)' }}>
                        {data.count} trade{data.count !== 1 ? 's' : ''}
                      </span>
                      {bestTrade != null && bestTrade > 0 && (
                        <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'rgba(0,255,65,0.4)' }}>
                          · best +${bestTrade.toFixed(0)}
                        </span>
                      )}
                    </div>

                    {/* Win/loss dot row — sits at bottom with small top gap */}
                    <div className="flex items-center gap-[3px] pt-1">
                      {data.trades.slice(0, 8).map((t, idx) => (
                        <div
                          key={idx}
                          style={{
                            width: 4,
                            height: 4,
                            borderRadius: '50%',
                            flexShrink: 0,
                            background: (t.pnl ?? 0) > 0 ? 'rgba(0,255,65,0.65)' : 'rgba(255,77,77,0.65)',
                          }}
                        />
                      ))}
                      {data.trades.length > 8 && (
                        <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.25)', lineHeight: 1 }}>
                          +{data.trades.length - 8}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Empty day — show hint only on hover */
                  <div
                    className="mt-auto flex items-center justify-center pb-1"
                    style={{ opacity: isHovered ? 1 : 0, transition: 'opacity 0.15s' }}
                  >
                    <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'rgba(0,255,65,0.35)' }}>+ add trade</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Selected-day modal (unchanged) ───────────────────────────────── */}
      {selectedDay && selectedIso && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}>
          <div className="rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto" style={{ background: '#0d0d0d', border: '1px solid rgba(0,255,65,0.2)' }}>
            <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
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
                  onClick={() => navigate(`/journal?addTrade=1&date=${selectedIso}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors"
                  style={{ background: 'rgba(0,255,65,0.1)', color: G, border: '1px solid rgba(0,255,65,0.2)' }}
                >
                  <Plus className="w-3.5 h-3.5" /> Add Trade
                </button>
                <button onClick={() => setSelectedDay(null)} className="p-1.5 rounded-lg hover:bg-white/[0.06]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-5">
              {selectedData?.trades?.length > 0 ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-5 pb-2 border-b border-white/[0.06]" style={{ gap: 12 }}>
                    {['Symbol', 'Setup', 'Account', 'Side', 'P&L'].map(h => (
                      <p key={h} className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>{h}</p>
                    ))}
                  </div>
                  {selectedData.trades.map(t => (
                    <div key={t.id} className="grid grid-cols-5 py-3 border-b border-white/[0.04]" style={{ gap: 12 }}>
                      <p className="text-sm font-mono font-bold text-white">{t.symbol}</p>
                      <p className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.5)' }}>{t.setup || '—'}</p>
                      <p className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>{t.account || '—'}</p>
                      <p className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>{t.side || '—'}</p>
                      <p className="text-sm font-mono font-bold" style={{ color: t.pnl >= 0 ? G : '#ff4d4d' }}>
                        {t.pnl >= 0 ? '+' : ''}{fmtPnl(t.pnl)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-sm font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>No trades on this day</p>
                  <button
                    onClick={() => navigate(`/journal?addTrade=1&date=${selectedIso}`)}
                    className="mt-3 text-xs font-mono underline"
                    style={{ color: G }}
                  >
                    Add a trade
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Legend (polished with badge icons) ───────────────────────────── */}
      <div className="flex items-center gap-4 flex-wrap text-xs font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ background: 'rgba(0,255,65,0.22)' }} />
          Green day
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ background: 'rgba(255,77,77,0.18)' }} />
          Red day
        </div>
        <div className="flex items-center gap-1.5">
          <Trophy className="w-3 h-3 flex-shrink-0" style={{ color: '#fbbf24' }} />
          Best day
        </div>
        <div className="flex items-center gap-1.5">
          <Flame className="w-3 h-3 flex-shrink-0" style={{ color: '#f97316' }} />
          Win streak (3+)
        </div>
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="w-3 h-3 flex-shrink-0" style={{ color: '#fb923c' }} />
          Rule break
        </div>
        <div style={{ color: 'rgba(255,255,255,0.2)' }}>Click any day to see trades</div>
      </div>

    </div>
  );
}
