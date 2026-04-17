import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Target } from 'lucide-react';
import SectionEyebrow from '../../ui/SectionEyebrow';
import Modal from '../../ui/Modal';
import { CALENDAR_DAYS, JOURNAL_TRADES } from '../../../data/mockDashboard';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export default function CalendarScreen() {
  const { year: seedYear, month: seedMonth, days: dayData } = CALENDAR_DAYS;
  const [cursor, setCursor] = useState({ year: seedYear, month: seedMonth });
  const [selectedDay, setSelectedDay] = useState(null);

  const firstDay = new Date(cursor.year, cursor.month, 1).getDay();
  const lastDate = new Date(cursor.year, cursor.month + 1, 0).getDate();

  const onSeedMonth = cursor.year === seedYear && cursor.month === seedMonth;
  const activeDayData = onSeedMonth ? dayData : {};

  // date-string → trades map, e.g. "Apr 16" → [...]
  const tradesByDate = useMemo(() => {
    const map = {};
    JOURNAL_TRADES.forEach((t) => {
      if (!map[t.date]) map[t.date] = [];
      map[t.date].push(t);
    });
    return map;
  }, []);

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= lastDate; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const monthTotal = Object.values(activeDayData).reduce((a, d) => a + d.pl, 0);
  const tradingDays = Object.keys(activeDayData).length;
  const greenDays = Object.values(activeDayData).filter((d) => d.pl > 0).length;
  const redDays = Object.values(activeDayData).filter((d) => d.pl < 0).length;

  const goPrev = () => {
    setCursor((c) => {
      const m = c.month - 1;
      return m < 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: m };
    });
  };
  const goNext = () => {
    setCursor((c) => {
      const m = c.month + 1;
      return m > 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: m };
    });
  };
  const goToday = () => setCursor({ year: seedYear, month: seedMonth });

  const selectedInfo = selectedDay !== null ? activeDayData[selectedDay] : null;
  const selectedDateStr = selectedDay !== null ? `${MONTHS_SHORT[cursor.month]} ${selectedDay}` : '';
  const selectedTrades = selectedDay !== null ? tradesByDate[selectedDateStr] ?? [] : [];

  const weekdayName = (day) => {
    const d = new Date(cursor.year, cursor.month, day);
    return d.toLocaleDateString('en-US', { weekday: 'long' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <SectionEyebrow>Calendar</SectionEyebrow>
          <motion.h1
            key={`${cursor.year}-${cursor.month}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-3 text-3xl md:text-5xl font-bold tracking-tight"
          >
            {MONTHS[cursor.month]} {cursor.year}
          </motion.h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goPrev}
            className="p-2.5 rounded-lg border border-border bg-panel/60 hover:border-neon/40 hover:text-neon transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={goToday}
            className={`px-4 py-2 rounded-lg border text-sm font-mono transition-colors ${
              onSeedMonth
                ? 'border-neon/40 text-neon bg-neon/10'
                : 'border-border bg-panel/60 hover:border-neon/40 hover:text-neon'
            }`}
          >
            Today
          </button>
          <button
            onClick={goNext}
            className="p-2.5 rounded-lg border border-border bg-panel/60 hover:border-neon/40 hover:text-neon transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Month summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryTile
          label="Month P&L"
          value={`${monthTotal >= 0 ? '+' : '-'}$${Math.abs(monthTotal).toLocaleString('en-US')}`}
          tone={monthTotal >= 0 ? 'neon' : 'red'}
        />
        <SummaryTile label="Trading Days" value={tradingDays} />
        <SummaryTile label="Green Days" value={greenDays} tone="neon" />
        <SummaryTile label="Red Days" value={redDays} tone={redDays > 0 ? 'red' : 'muted'} />
      </div>

      {/* Calendar grid */}
      <div className="rounded-2xl border border-border bg-panel/50 backdrop-blur-sm p-3 md:p-5">
        <div className="grid grid-cols-7 gap-2 mb-2">
          {DAY_LABELS.map((d) => (
            <div
              key={d}
              className="text-center text-[10px] font-mono uppercase tracking-[0.2em] text-muted py-2"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {cells.map((d, i) => {
            if (d === null) return <div key={i} className="aspect-square" />;
            const data = activeDayData[d];
            return (
              <DayCell
                key={`${cursor.year}-${cursor.month}-${d}`}
                day={d}
                data={data}
                index={i}
                onClick={() => data && setSelectedDay(d)}
              />
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] font-mono uppercase tracking-[0.18em] text-muted">
        <span className="inline-flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-neon/40 border border-neon/60" /> Green day
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-red-500/40 border border-red-500/60" /> Red day
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="w-3 h-3 rounded border border-border" /> No trades
        </span>
        <span className="ml-auto text-neon/90">Click any day to drill in →</span>
      </div>

      <Modal
        open={selectedDay !== null}
        onClose={() => setSelectedDay(null)}
        subtitle={selectedDay !== null ? weekdayName(selectedDay) : ''}
        title={selectedDay !== null ? `${MONTHS[cursor.month]} ${selectedDay}, ${cursor.year}` : ''}
        size="md"
      >
        <DayDetail info={selectedInfo} trades={selectedTrades} />
      </Modal>
    </div>
  );
}

function SummaryTile({ label, value, tone = 'muted' }) {
  const color = tone === 'red' ? 'text-red-400' : tone === 'neon' ? 'text-neon' : 'text-ink';
  return (
    <div className="rounded-xl border border-border bg-panel/50 backdrop-blur-sm px-4 py-4">
      <div className="text-[10px] text-muted font-mono uppercase tracking-[0.2em]">{label}</div>
      <div className={`mt-1.5 text-xl md:text-2xl font-bold tabular-nums ${color}`}>{value}</div>
    </div>
  );
}

function DayCell({ day, data, index, onClick }) {
  const hasData = !!data;
  const positive = hasData && data.pl >= 0;
  const intensity = hasData ? Math.min(1, Math.abs(data.pl) / 1200) : 0;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.01 * index }}
      whileHover={hasData ? { scale: 1.05, y: -1 } : undefined}
      whileTap={hasData ? { scale: 0.97 } : undefined}
      onClick={onClick}
      disabled={!hasData}
      className={`
        aspect-square rounded-lg border relative flex flex-col justify-between p-1.5 md:p-2 text-left
        transition-all overflow-hidden
        ${hasData
          ? 'border-border hover:border-neon/50 cursor-pointer'
          : 'border-border/40 cursor-default'}
      `}
      style={{
        background: hasData
          ? positive
            ? `rgba(0, 255, 65, ${0.1 + intensity * 0.22})`
            : `rgba(239, 68, 68, ${0.1 + intensity * 0.22})`
          : 'transparent',
        boxShadow: hasData && positive ? `0 0 ${intensity * 18}px rgba(0,255,65,${intensity * 0.25})` : undefined,
      }}
    >
      <span className={`text-[10px] md:text-xs font-mono ${hasData ? 'text-ink' : 'text-muted/60'}`}>
        {day}
      </span>
      {hasData && (
        <div className="flex flex-col gap-0.5">
          <span
            className={`text-[9px] md:text-[11px] font-mono font-bold tabular-nums leading-tight ${
              positive ? 'text-neon' : 'text-red-400'
            }`}
          >
            {positive ? '+' : '-'}${Math.abs(data.pl)}
          </span>
          <span className="text-[8px] md:text-[9px] font-mono text-muted leading-none hidden md:block">
            {data.trades}T
          </span>
        </div>
      )}
    </motion.button>
  );
}

function DayDetail({ info, trades }) {
  if (!info) {
    return <p className="text-muted text-sm font-mono">No trades recorded for this day.</p>;
  }

  const positive = info.pl >= 0;
  const wins = trades.filter((t) => t.pl >= 0).length;
  const losses = trades.length - wins;
  const bestTrade = trades.reduce((b, t) => (b && b.pl > t.pl ? b : t), null);
  const worstTrade = trades.reduce((w, t) => (w && w.pl < t.pl ? w : t), null);

  return (
    <div className="space-y-5">
      {/* P&L big number */}
      <div className="rounded-xl border border-border bg-bg/60 p-5 flex items-end justify-between gap-4">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-muted">
            Net P&L
          </div>
          <div
            className={`mt-1 text-4xl md:text-5xl font-bold tabular-nums ${
              positive ? 'text-neon glow-text' : 'text-red-400'
            }`}
          >
            {positive ? '+' : '-'}${Math.abs(info.pl).toLocaleString('en-US')}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-muted">Trades</div>
          <div className="mt-1 text-3xl md:text-4xl font-bold tabular-nums">{info.trades}</div>
        </div>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-3 gap-2">
        <MiniStat label="Wins" value={wins} tone="neon" />
        <MiniStat label="Losses" value={losses} tone={losses > 0 ? 'red' : 'muted'} />
        <MiniStat
          label="Win Rate"
          value={`${trades.length ? Math.round((wins / trades.length) * 100) : 0}%`}
          tone="neon"
        />
      </div>

      {/* Best / worst */}
      {(bestTrade || worstTrade) && trades.length > 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {bestTrade && bestTrade.pl >= 0 && (
            <HighlightCard Icon={TrendingUp} label="Best" trade={bestTrade} tone="neon" />
          )}
          {worstTrade && worstTrade.pl < 0 && (
            <HighlightCard Icon={TrendingDown} label="Worst" trade={worstTrade} tone="red" />
          )}
        </div>
      )}

      {/* Trade list */}
      {trades.length > 0 ? (
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-muted mb-2.5 inline-flex items-center gap-2">
            <Target className="w-3.5 h-3.5" />
            All Trades
          </div>
          <ul className="space-y-2">
            {trades.map((t, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.04 * i, duration: 0.3 }}
              >
                <TradeLine trade={t} />
              </motion.li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-6 text-center text-muted font-mono text-xs">
          Day has P&L logged but no individual trade records.
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value, tone = 'muted' }) {
  const color = tone === 'red' ? 'text-red-400' : tone === 'neon' ? 'text-neon' : 'text-ink';
  return (
    <div className="rounded-lg border border-border bg-bg/40 px-3 py-2.5">
      <div className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted">{label}</div>
      <div className={`mt-0.5 text-lg font-bold tabular-nums ${color}`}>{value}</div>
    </div>
  );
}

function HighlightCard({ Icon, label, trade, tone }) {
  const color = tone === 'red' ? 'text-red-400' : 'text-neon';
  const border = tone === 'red' ? 'border-red-500/40' : 'border-neon/30';
  return (
    <div className={`rounded-lg border ${border} bg-bg/40 px-3 py-2.5 flex items-center gap-3`}>
      <Icon className={`w-4 h-4 ${color}`} />
      <div className="flex-1 min-w-0">
        <div className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted">{label}</div>
        <div className="text-xs font-mono truncate">
          {trade.symbol} · {trade.setup}
        </div>
      </div>
      <div className={`text-sm font-mono font-bold ${color}`}>
        {trade.pl >= 0 ? '+' : '-'}${Math.abs(trade.pl)}
      </div>
    </div>
  );
}

function TradeLine({ trade }) {
  const win = trade.pl >= 0;
  const sideColor =
    trade.side === 'LONG'
      ? 'text-neon border-neon/40 bg-neon/10'
      : 'text-red-400 border-red-500/40 bg-red-500/10';

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border border-l-[3px] ${
        win ? 'border-l-neon' : 'border-l-red-500'
      } border-border bg-bg/50`}
    >
      <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
        <span className="font-mono font-bold text-sm">{trade.symbol}</span>
        <span
          className={`text-[9px] px-1.5 py-0.5 rounded border font-mono uppercase tracking-wider ${sideColor}`}
        >
          {trade.side}
        </span>
        <span className="text-xs text-muted font-mono truncate">
          {trade.setup} · {trade.qty}
        </span>
      </div>
      <span className={`font-mono font-bold text-sm ${win ? 'text-neon' : 'text-red-400'}`}>
        {win ? '+' : '-'}${Math.abs(trade.pl).toLocaleString('en-US')}
      </span>
    </div>
  );
}
