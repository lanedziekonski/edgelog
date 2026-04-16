import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import SectionEyebrow from '../../ui/SectionEyebrow';
import { CALENDAR_DAYS } from '../../../data/mockDashboard';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function CalendarScreen() {
  const [selected, setSelected] = useState(null);

  const { year, month, days: dayData } = CALENDAR_DAYS;
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();

  const cells = [];
  // empty leading cells
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= lastDate; d++) cells.push(d);
  // pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  const monthTotal = Object.values(dayData).reduce((a, d) => a + d.pl, 0);
  const tradingDays = Object.keys(dayData).length;
  const greenDays = Object.values(dayData).filter((d) => d.pl > 0).length;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <SectionEyebrow>Calendar</SectionEyebrow>
          <h1 className="mt-3 text-3xl md:text-5xl font-bold tracking-tight">
            {MONTHS[month]} {year}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2.5 rounded-lg border border-border bg-panel/60 hover:border-neon/40 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button className="px-4 py-2 rounded-lg border border-border bg-panel/60 hover:border-neon/40 text-sm font-mono transition-colors">
            Today
          </button>
          <button className="p-2.5 rounded-lg border border-border bg-panel/60 hover:border-neon/40 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Month summary */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryTile label="Month P&L" value={`${monthTotal >= 0 ? '+' : '-'}$${Math.abs(monthTotal).toLocaleString('en-US')}`} tone={monthTotal >= 0 ? 'neon' : 'red'} />
        <SummaryTile label="Trading Days" value={tradingDays} tone="muted" />
        <SummaryTile label="Green Days" value={`${greenDays}/${tradingDays}`} tone="neon" />
      </div>

      {/* Calendar grid */}
      <div className="rounded-2xl border border-border bg-panel/50 backdrop-blur-sm p-3 md:p-5">
        {/* Header */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {DAYS.map((d) => (
            <div
              key={d}
              className="text-center text-[10px] font-mono uppercase tracking-[0.2em] text-muted py-2"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Cells */}
        <div className="grid grid-cols-7 gap-2">
          {cells.map((d, i) => {
            if (d === null) return <div key={i} className="aspect-square" />;
            const data = dayData[d];
            const active = selected === d;
            return (
              <DayCell
                key={i}
                day={d}
                data={data}
                active={active}
                index={i}
                onClick={() => setSelected(active ? null : d)}
              />
            );
          })}
        </div>
      </div>

      {/* Selected day detail */}
      {selected && dayData[selected] && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-neon/30 bg-panel/60 backdrop-blur-sm p-5"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-mono uppercase tracking-[0.2em] text-neon">
                {MONTHS[month]} {selected}, {year}
              </div>
              <div className="mt-1.5 text-2xl font-bold tabular-nums">
                {dayData[selected].pl >= 0 ? '+' : '-'}${Math.abs(dayData[selected].pl).toLocaleString('en-US')}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-mono uppercase tracking-[0.2em] text-muted">Trades</div>
              <div className="mt-1.5 text-2xl font-bold">{dayData[selected].trades}</div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function SummaryTile({ label, value, tone }) {
  const color = tone === 'red' ? 'text-red-400' : tone === 'muted' ? 'text-ink' : 'text-neon';
  return (
    <div className="rounded-xl border border-border bg-panel/50 backdrop-blur-sm px-4 py-4">
      <div className="text-[10px] text-muted font-mono uppercase tracking-[0.2em]">{label}</div>
      <div className={`mt-1.5 text-xl md:text-2xl font-bold tabular-nums ${color}`}>{value}</div>
    </div>
  );
}

function DayCell({ day, data, active, index, onClick }) {
  const hasData = !!data;
  const positive = hasData && data.pl >= 0;
  const intensity = hasData ? Math.min(1, Math.abs(data.pl) / 1000) : 0;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.01 * index }}
      whileHover={{ scale: 1.03 }}
      onClick={onClick}
      className={`
        aspect-square rounded-lg border relative flex flex-col justify-between p-1.5 md:p-2 text-left
        transition-all
        ${active
          ? 'border-neon ring-2 ring-neon/30'
          : hasData
          ? 'border-border hover:border-neon/50'
          : 'border-border/50'}
      `}
      style={{
        background: hasData
          ? positive
            ? `rgba(0, 255, 65, ${0.08 + intensity * 0.18})`
            : `rgba(239, 68, 68, ${0.08 + intensity * 0.18})`
          : 'transparent',
      }}
    >
      <span className={`text-[10px] md:text-xs font-mono ${hasData ? 'text-ink' : 'text-muted'}`}>
        {day}
      </span>
      {hasData && (
        <span
          className={`text-[9px] md:text-[11px] font-mono font-bold tabular-nums leading-tight ${
            positive ? 'text-neon' : 'text-red-400'
          }`}
        >
          {positive ? '+' : '-'}${Math.abs(data.pl)}
        </span>
      )}
    </motion.button>
  );
}
