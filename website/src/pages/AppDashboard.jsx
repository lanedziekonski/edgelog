import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  TrendingUp, TrendingDown, ArrowUpRight, Flame, Calendar,
  Trophy, Clock,
} from 'lucide-react';
import { useTrades, calcStats, buildEquityCurve } from '../hooks/useTrades';
import { useAccounts } from '../hooks/useAccounts';
import { useAccountFilter } from '../context/AccountFilterContext';
import { useAuth } from '../context/AuthContext';
import useCountUp from '../hooks/useCountUp';
import SectionEyebrow from '../components/ui/SectionEyebrow';

// ─── helpers ────────────────────────────────────────────────────────────────

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function mondayKey() {
  const d = new Date();
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day; // back to Monday
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function fmtDate(d) {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// ─── sub-components ─────────────────────────────────────────────────────────

// Hero stat card (used for section 2)
function HeroCard({ label, value, prefix = '', raw, positive, Icon, inView, delay }) {
  const numeric = typeof value === 'number' ? Math.abs(value) : 0;
  const count = useCountUp(numeric, { duration: 1200, start: inView });

  let display;
  if (value === '—') {
    display = '—';
  } else if (raw) {
    display = value;
  } else {
    // Reconstruct sign + prefix for money values
    const sign = typeof value === 'number' && value < 0 ? '-' : '';
    display = `${sign}${prefix}${count.toLocaleString('en-US')}`;
  }

  const tone = positive === null ? 'text-ink' : positive ? 'text-neon' : 'text-red-400';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
      className="group relative rounded-2xl border border-border bg-panel/60 backdrop-blur-sm p-5 md:p-6 overflow-hidden"
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{ background: 'radial-gradient(circle at 30% 0%, rgba(0,255,65,0.1) 0%, transparent 60%)' }}
      />
      <div className="relative flex items-start justify-between">
        <span className="text-[10px] md:text-[11px] text-muted font-mono uppercase tracking-[0.2em]">
          {label}
        </span>
        <Icon className="w-4 h-4 text-neon/50 group-hover:text-neon transition-colors" />
      </div>
      <div className={`relative mt-3 md:mt-4 text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight tabular-nums ${tone}`}>
        {display}
      </div>
    </motion.div>
  );
}

// Core metric cell (section 3)
function MetricCell({ label, value, prefix = '', suffix = '', sub, positive, raw, inView, delay }) {
  const numeric = typeof value === 'number' ? Math.abs(value) : 0;
  const count = useCountUp(numeric, { duration: 1200, start: inView });

  let display;
  if (value === '—') {
    display = '—';
  } else if (raw) {
    display = value;
  } else {
    const sign = typeof value === 'number' && value < 0 ? '-' : '';
    display = `${sign}${prefix}${count.toLocaleString('en-US')}${suffix}`;
  }

  const tone = positive === null ? 'text-ink' : positive ? 'text-neon' : 'text-red-400';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -2 }}
      className="rounded-xl border border-border bg-panel/50 px-4 py-4 backdrop-blur-sm hover:border-neon/30 transition-colors"
    >
      <div className="text-[10px] text-muted font-mono uppercase tracking-[0.2em]">{label}</div>
      <div className={`mt-2 text-2xl md:text-3xl font-bold tracking-tight tabular-nums ${tone}`}>
        {display}
      </div>
      {sub && <div className="mt-1 text-[11px] text-muted font-mono">{sub}</div>}
    </motion.div>
  );
}

// Cluster tile — Best Day / Worst Day / Green Days (section 5)
function ClusterTile({ Icon, label, display, tone, inView, delay }) {
  const color = tone === 'red' ? 'text-red-400' : 'text-neon';
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -2 }}
      className="rounded-xl border border-border bg-panel/50 backdrop-blur-sm px-4 py-4 text-center md:text-left"
    >
      <Icon className={`w-4 h-4 ${color} mb-2 mx-auto md:mx-0`} />
      <div className="text-[10px] text-muted font-mono uppercase tracking-[0.18em]">{label}</div>
      <div className={`mt-1.5 text-xl md:text-2xl font-bold tabular-nums ${color}`}>{display}</div>
    </motion.div>
  );
}

// Setup row (section 6)
function SetupRow({ setup, maxTrades, inView, index }) {
  const pct = maxTrades > 0 ? Math.min(100, (setup.trades / maxTrades) * 100) : 0;
  const isLoss = setup.pl < 0;
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5, delay: 0.15 + index * 0.08 }}
      whileHover={{ scale: 1.005 }}
      className="relative rounded-xl border border-border bg-panel/50 backdrop-blur-sm px-5 py-4 overflow-hidden"
    >
      <div className="relative flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5">
            <span className="font-mono font-bold text-ink">{setup.name}</span>
            <span className="text-[10px] text-muted font-mono">
              {setup.trades} trade{setup.trades !== 1 ? 's' : ''} · {setup.winRate}% win
            </span>
          </div>
          <div className="mt-2.5 h-1 rounded-full bg-border overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={inView ? { width: `${pct}%` } : {}}
              transition={{ duration: 1.2, delay: 0.4 + index * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className={`h-full rounded-full ${isLoss ? 'bg-red-500' : 'bg-neon'}`}
              style={{ boxShadow: isLoss ? '0 0 10px rgba(239,68,68,0.4)' : '0 0 10px rgba(0,255,65,0.4)' }}
            />
          </div>
        </div>
        <div className="text-right">
          <div className={`font-mono font-bold text-lg tabular-nums ${isLoss ? 'text-red-400' : 'text-neon'}`}>
            {isLoss ? '-' : '+'}${Math.abs(setup.pl).toLocaleString('en-US')}
          </div>
          <div className="text-[10px] text-muted font-mono">
            {Math.round(setup.trades * (setup.winRate / 100))}W / {setup.trades - Math.round(setup.trades * (setup.winRate / 100))}L
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Trade row (section 8)
const TRADE_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'wins', label: 'Wins' },
  { id: 'losses', label: 'Losses' },
];

function RecentTradesSection({ trades, onAdd }) {
  const [filter, setFilter] = useState('all');
  const visible = trades.filter(t => {
    if (filter === 'wins') return (t.pnl ?? 0) >= 0;
    if (filter === 'losses') return (t.pnl ?? 0) < 0;
    return true;
  });

  return (
    <section>
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <SectionEyebrow>Recent Trades</SectionEyebrow>
          <h2 className="mt-3 text-2xl md:text-3xl font-bold tracking-tight">Last 8 Trades</h2>
        </div>
        <div className="inline-flex gap-1.5 p-1 rounded-full border border-border bg-panel/60">
          {TRADE_FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`relative px-3.5 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors ${
                filter === f.id ? 'text-black' : 'text-muted hover:text-ink'
              }`}
            >
              {filter === f.id && (
                <motion.span
                  layoutId="trade-filter-pill-real"
                  className="absolute inset-0 rounded-full bg-neon"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                />
              )}
              <span className="relative z-10">{f.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-panel/40 backdrop-blur-sm overflow-hidden">
        {/* Headers */}
        <div className="hidden md:grid grid-cols-[90px_80px_1fr_100px_110px] gap-4 px-5 py-3 border-b border-border text-[10px] text-muted font-mono uppercase tracking-[0.2em]">
          <span>Date</span>
          <span>Symbol</span>
          <span>Setup</span>
          <span>Account</span>
          <span className="text-right">P&L</span>
        </div>

        <AnimatePresence initial={false}>
          {visible.map((t, i) => {
            const win = (t.pnl ?? 0) >= 0;
            return (
              <motion.div
                key={`${t.id ?? i}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.35, delay: i * 0.04 }}
                whileHover={{ x: 3, backgroundColor: 'rgba(255,255,255,0.02)' }}
                className="grid grid-cols-[1fr_auto] md:grid-cols-[90px_80px_1fr_100px_110px] gap-4 px-5 py-4 border-b border-border last:border-b-0 items-center"
              >
                {/* Mobile condensed */}
                <div className="md:hidden flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-ink">{t.symbol ?? '—'}</span>
                    {t.direction && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded border font-mono uppercase ${
                        t.direction === 'LONG'
                          ? 'text-neon border-neon/40 bg-neon/10'
                          : 'text-red-400 border-red-500/40 bg-red-500/10'
                      }`}>
                        {t.direction}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted font-mono truncate">
                    {t.date ?? '—'}{t.setup ? ` · ${t.setup}` : ''}
                  </span>
                </div>
                <div className="md:hidden text-right">
                  <span className={`font-mono font-bold ${win ? 'text-neon' : 'text-red-400'}`}>
                    {win ? '+' : ''}${Math.abs(t.pnl ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Desktop full row */}
                <span className="hidden md:block text-sm text-muted font-mono">{t.date ?? '—'}</span>
                <div className="hidden md:flex items-center gap-2">
                  <span className="font-mono font-bold text-ink">{t.symbol ?? '—'}</span>
                  {t.direction && (
                    <span className={`text-[9px] px-1 py-0.5 rounded border font-mono uppercase ${
                      t.direction === 'LONG'
                        ? 'text-neon border-neon/40 bg-neon/10'
                        : 'text-red-400 border-red-500/40 bg-red-500/10'
                    }`}>
                      {t.direction}
                    </span>
                  )}
                </div>
                <span className="hidden md:block text-sm text-muted font-mono truncate">{t.setup ?? '—'}</span>
                <span className="hidden md:block text-sm text-muted font-mono truncate">{t.account ?? '—'}</span>
                <span className={`hidden md:block text-right font-mono font-bold ${win ? 'text-neon' : 'text-red-400'}`}>
                  {win ? '+' : ''}${Math.abs(t.pnl ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {visible.length === 0 && trades.length > 0 && (
          <div className="px-5 py-10 text-center text-muted font-mono text-sm">
            No trades match this filter.
          </div>
        )}

        {trades.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <Clock className="w-8 h-8 text-muted/30" />
            <p className="text-sm text-muted">No trades yet</p>
            <button
              onClick={onAdd}
              className="text-xs font-semibold px-4 py-1.5 rounded-lg border border-neon/40 bg-neon/10 text-neon hover:bg-neon/20 transition-colors"
            >
              Log your first trade
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

// Equity curve (section 9)
const EC_W = 800;
const EC_H = 220;
const EC_PAD = 20;

function EquityCurveSection({ curve }) {
  const ref = useRef(null);
  const wrapRef = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [hover, setHover] = useState(null);

  const data = curve;
  const values = data.map(d => d.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  const points = data.map((d, i) => {
    const x = EC_PAD + (i / (data.length - 1)) * (EC_W - EC_PAD * 2);
    const y = EC_H - EC_PAD - ((d.value - min) / range) * (EC_H - EC_PAD * 2);
    return [x, y, d];
  });

  const path = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ');
  const area = `${path} L ${EC_W - EC_PAD} ${EC_H - EC_PAD} L ${EC_PAD} ${EC_H - EC_PAD} Z`;

  const last = values[values.length - 1];
  const first = values[0];
  const change = last - first;
  const positive = change >= 0;

  return (
    <section ref={ref}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <SectionEyebrow>Equity Curve</SectionEyebrow>
          <h2 className="mt-3 text-2xl md:text-3xl font-bold tracking-tight">
            {data.length} Trading Day{data.length !== 1 ? 's' : ''}
          </h2>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-muted font-mono uppercase tracking-[0.2em]">Net</div>
          <div className={`text-2xl md:text-3xl font-bold tabular-nums ${positive ? 'text-neon' : 'text-red-400'}`}>
            {positive ? '+' : '-'}${Math.abs(change).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      <div ref={wrapRef} className="mt-6 rounded-2xl border border-border bg-panel/50 backdrop-blur-sm p-5 md:p-6 relative">
        <svg
          viewBox={`0 0 ${EC_W} ${EC_H}`}
          className="w-full h-[220px]"
          preserveAspectRatio="none"
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id="ecFillReal" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#00ff41" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#00ff41" stopOpacity="0" />
            </linearGradient>
            <pattern id="ecGridReal" width="80" height="40" patternUnits="userSpaceOnUse">
              <path d="M 80 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.035)" strokeWidth="1" />
            </pattern>
          </defs>

          <rect width={EC_W} height={EC_H} fill="url(#ecGridReal)" />

          <motion.path
            d={area}
            fill="url(#ecFillReal)"
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 1.5, delay: 0.6 }}
          />

          <motion.path
            d={path}
            fill="none"
            stroke="#00ff41"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={inView ? { pathLength: 1 } : {}}
            transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
            style={{ filter: 'drop-shadow(0 0 6px rgba(0,255,65,0.6))' }}
          />

          <motion.circle
            cx={points[points.length - 1][0]}
            cy={points[points.length - 1][1]}
            r="5"
            fill="#00ff41"
            initial={{ opacity: 0, scale: 0 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 2.1, duration: 0.4 }}
          />
          <motion.circle
            cx={points[points.length - 1][0]}
            cy={points[points.length - 1][1]}
            r="10"
            fill="none"
            stroke="#00ff41"
            strokeWidth="2"
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: [0.8, 0], scale: [1, 2] } : {}}
            transition={{ delay: 2.3, duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
          />

          {/* Hover hitboxes */}
          {points.map(([x, , d], i) => (
            <rect
              key={i}
              x={x - (EC_W / data.length) / 2}
              y={0}
              width={EC_W / data.length}
              height={EC_H}
              fill="transparent"
              onMouseEnter={() => setHover({ x, y: points[i][1], d, i })}
            />
          ))}

          {hover && (
            <g>
              <line
                x1={hover.x} x2={hover.x} y1={EC_PAD} y2={EC_H - EC_PAD}
                stroke="rgba(0,255,65,0.35)" strokeWidth="1" strokeDasharray="2 3"
              />
              <circle cx={hover.x} cy={hover.y} r="6" fill="rgba(0,255,65,0.15)" />
              <circle cx={hover.x} cy={hover.y} r="4" fill="#00ff41" stroke="#000" strokeWidth="1.5" />
            </g>
          )}
        </svg>

        <AnimatePresence>
          {hover && (
            <motion.div
              key={hover.d.label}
              initial={{ opacity: 0, y: 4, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="pointer-events-none absolute top-4 rounded-lg border border-neon/40 bg-panel/95 backdrop-blur-md px-3 py-2 shadow-neon-soft min-w-[120px]"
              style={{ left: `calc(${(hover.x / EC_W) * 100}% - 60px)`, maxWidth: 160 }}
            >
              <div className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted">
                {hover.d.label}
              </div>
              <div className="mt-0.5 font-mono font-bold text-sm text-neon tabular-nums">
                {hover.d.value >= 0 ? '+' : '-'}${Math.abs(hover.d.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              {hover.i > 0 && (
                <div className="mt-0.5 text-[10px] font-mono text-muted">
                  {(() => {
                    const diff = hover.d.value - data[hover.i - 1].value;
                    const sign = diff >= 0 ? '+' : '-';
                    const cls = diff >= 0 ? 'text-neon/80' : 'text-red-400';
                    return (
                      <span className={cls}>
                        {sign}${Math.abs(diff).toLocaleString('en-US', { minimumFractionDigits: 2 })} vs prev
                      </span>
                    );
                  })()}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-2 flex justify-between px-5 text-[10px] font-mono text-muted uppercase tracking-wider">
          <span>{data[0]?.label}</span>
          <span>{data[Math.floor(data.length / 2)]?.label}</span>
          <span>{data[data.length - 1]?.label}</span>
        </div>
      </div>
    </section>
  );
}

// Loader
function Loader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-sm font-mono text-muted">Loading…</div>
    </div>
  );
}

// ─── main component ──────────────────────────────────────────────────────────

export default function AppDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { trades, loading } = useTrades();
  const { accounts } = useAccounts();
  const { selectedAccountId } = useAccountFilter();

  // Account filter
  const filteredTrades = useMemo(() => {
    if (!selectedAccountId) return trades;
    const acct = accounts.find(a => String(a.id) === String(selectedAccountId));
    if (!acct) return trades;
    return trades.filter(t => t.account === acct.name);
  }, [trades, accounts, selectedAccountId]);

  const hasTrades = filteredTrades.length > 0;

  // Core stats
  const stats = useMemo(() => calcStats(filteredTrades), [filteredTrades]);
  const curve  = useMemo(() => buildEquityCurve(filteredTrades), [filteredTrades]);

  // Today / this-week P&L
  const { todayPnl, weekPnl, todayCount } = useMemo(() => {
    const tk = todayKey();
    const mk = mondayKey();
    let tp = 0, wp = 0, tc = 0;
    for (const t of filteredTrades) {
      const d = t.date ?? '';
      if (d === tk) { tp += t.pnl ?? 0; tc++; }
      if (d >= mk)  { wp += t.pnl ?? 0; }
    }
    return { todayPnl: tp, weekPnl: wp, todayCount: tc };
  }, [filteredTrades]);

  // Monthly data (6 months) — extended with days + winRate
  const monthlyData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      const mTrades = filteredTrades.filter(t => (t.date ?? '').startsWith(key));
      const pl = mTrades.reduce((s, t) => s + (t.pnl ?? 0), 0);
      const wins = mTrades.filter(t => (t.pnl ?? 0) > 0).length;
      const days = new Set(mTrades.map(t => t.date)).size;
      const winRate = mTrades.length > 0 ? Math.round((wins / mTrades.length) * 100) : 0;
      return { month: label, pl, trades: mTrades.length, days, winRate };
    });
  }, [filteredTrades]);

  // Last 8 trades
  const recent = useMemo(() =>
    [...filteredTrades]
      .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '') || 0)
      .slice(0, 8),
  [filteredTrades]);

  // Setup rows for performance section
  const setupRows = useMemo(() => {
    const entries = Object.entries(stats.bySetup ?? {});
    if (entries.length === 0) return [];
    return entries
      .map(([name, v]) => ({
        name,
        trades: v.total ?? 0,
        winRate: (v.total ?? 0) > 0 ? Math.round(((v.wins ?? 0) / v.total) * 100) : 0,
        pl: v.pnl ?? 0,
      }))
      .sort((a, b) => b.pl - a.pl)
      .slice(0, 5);
  }, [stats]);

  // Day-of-week win breakdown
  const dayOfWeekStats = useMemo(() => {
    const DOW = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
    return DOW.map((day, idx) => {
      const dayTrades = filteredTrades.filter(t => {
        if (!t.date) return false;
        const dow = new Date(`${t.date}T12:00:00`).getDay(); // 1=Mon…5=Fri
        return dow === idx + 1;
      });
      const wins = dayTrades.filter(t => (t.pnl ?? 0) > 0).length;
      const losses = dayTrades.length - wins;
      const rate = dayTrades.length > 0 ? Math.round((wins / dayTrades.length) * 100) : 0;
      return { day, wins, losses, rate };
    });
  }, [filteredTrades]);

  // Streak display
  const streakDisplay = (stats.streak ?? 0) > 0
    ? `${stats.streak}${stats.streakType === 'win' ? 'W' : 'L'}`
    : '—';
  const streakPositive = (stats.streak ?? 0) > 0
    ? stats.streakType === 'win'
    : null;

  // User greeting
  const firstName = (() => {
    const name = user?.name ?? '';
    if (name) return name.split(' ')[0];
    const email = user?.email ?? '';
    return email.split('@')[0] || 'Trader';
  })();

  // R:R
  const avgRR = hasTrades && Math.abs(stats.avgLoss ?? 0) > 0
    ? `${(Math.abs(stats.avgWin ?? 0) / Math.abs(stats.avgLoss)).toFixed(1)}R`
    : '—';

  // Rule score sub-text
  const ruleScoreSub = hasTrades && (stats.totalTrades ?? 0) > 0
    ? `${Math.round(((stats.ruleScore ?? 0) / 100) * stats.totalTrades)}/${stats.totalTrades} clean`
    : undefined;

  if (loading) return <Loader />;

  return (
    <div className="space-y-10">
      {/* ── 1. Header row ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted mb-1">Dashboard</p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Welcome back, <span className="text-neon">{firstName}</span>
          </h1>
        </div>
        <div className="text-right flex flex-col items-end gap-2">
          <p className="text-sm text-muted font-mono">{fmtDate(new Date())}</p>
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-bold border"
            style={{
              background: todayCount >= 3 ? 'rgba(251,191,36,0.1)' : 'rgba(0,255,65,0.08)',
              borderColor: todayCount >= 3 ? 'rgba(251,191,36,0.35)' : 'rgba(0,255,65,0.3)',
              color: todayCount >= 3 ? '#fbbf24' : '#00ff41',
            }}
          >
            <span>{todayCount}</span>
            <span style={{ opacity: 0.5 }}>/</span>
            <span>3 TODAY</span>
          </div>
        </div>
      </div>

      {/* ── 2. Hero stat cards ────────────────────────────────────────────── */}
      <HeroSection
        hasTrades={hasTrades}
        totalPnl={stats.totalPnl ?? 0}
        todayPnl={todayPnl}
        weekPnl={weekPnl}
        streakDisplay={streakDisplay}
        streakPositive={streakPositive}
      />

      {/* ── 3. Core metrics ───────────────────────────────────────────────── */}
      <CoreMetricsSection
        hasTrades={hasTrades}
        stats={stats}
        avgRR={avgRR}
        ruleScoreSub={ruleScoreSub}
      />

      {/* ── 4. Day Win % ──────────────────────────────────────────────────── */}
      {hasTrades && <DayWinSection dayStats={dayOfWeekStats} />}

      {/* ── 5. StatCluster ────────────────────────────────────────────────── */}
      <StatClusterSection hasTrades={hasTrades} stats={stats} />

      {/* ── 6. Setup performance ──────────────────────────────────────────── */}
      {setupRows.length > 0 && <SetupSection setupRows={setupRows} />}

      {/* ── 7. Monthly P&L ────────────────────────────────────────────────── */}
      <MonthlySection monthlyData={monthlyData} />

      {/* ── 8. Recent trades ──────────────────────────────────────────────── */}
      <RecentTradesSection trades={recent} onAdd={() => navigate('/journal?addTrade=1')} />

      {/* ── 9. Equity curve ───────────────────────────────────────────────── */}
      {curve.length >= 2 && <EquityCurveSection curve={curve} />}
    </div>
  );
}

// ─── section components ─────────────────────────────────────────────────────

function HeroSection({ hasTrades, totalPnl, todayPnl, weekPnl, streakDisplay, streakPositive }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  const cards = [
    {
      label: 'Total P&L',
      value: hasTrades ? Math.abs(totalPnl) : '—',
      prefix: hasTrades ? (totalPnl < 0 ? '-$' : '+$') : '',
      raw: !hasTrades,
      positive: hasTrades ? totalPnl >= 0 : null,
      Icon: TrendingUp,
    },
    {
      label: 'Today',
      value: hasTrades ? Math.abs(todayPnl) : '—',
      prefix: hasTrades ? (todayPnl < 0 ? '-$' : '+$') : '',
      raw: !hasTrades,
      positive: hasTrades ? todayPnl >= 0 : null,
      Icon: ArrowUpRight,
    },
    {
      label: 'This Week',
      value: hasTrades ? Math.abs(weekPnl) : '—',
      prefix: hasTrades ? (weekPnl < 0 ? '-$' : '+$') : '',
      raw: !hasTrades,
      positive: hasTrades ? weekPnl >= 0 : null,
      Icon: Calendar,
    },
    {
      label: 'Streak',
      value: streakDisplay,
      raw: true,
      positive: streakPositive,
      Icon: Flame,
    },
  ];

  return (
    <div ref={ref} className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {cards.map((c, i) => (
        <HeroCard key={c.label} {...c} inView={inView} delay={i * 0.07} />
      ))}
    </div>
  );
}

function CoreMetricsSection({ hasTrades, stats, avgRR, ruleScoreSub }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  const winRate = stats.winRate ?? 0;
  const avgWin  = stats.avgWin ?? 0;
  const avgLoss = stats.avgLoss ?? 0;
  const pf      = stats.profitFactor ?? 0;
  const rs      = stats.ruleScore ?? 0;

  const cells = [
    {
      label: 'Win Rate',
      value: hasTrades ? winRate : '—',
      suffix: hasTrades ? '%' : '',
      raw: !hasTrades,
      sub: hasTrades ? `${stats.wins ?? 0}W / ${stats.losses ?? 0}L of ${stats.totalTrades ?? 0}` : undefined,
      positive: hasTrades ? winRate >= 50 : null,
    },
    {
      label: 'Avg Win',
      value: hasTrades ? avgWin : '—',
      prefix: hasTrades ? '+$' : '',
      raw: !hasTrades,
      sub: hasTrades && (stats.wins ?? 0) > 0
        ? `+$${(avgWin * (stats.wins ?? 0)).toLocaleString('en-US', { maximumFractionDigits: 0 })} total`
        : undefined,
      positive: hasTrades ? true : null,
    },
    {
      label: 'Avg Loss',
      value: hasTrades ? Math.abs(avgLoss) : '—',
      prefix: hasTrades ? '-$' : '',
      raw: !hasTrades,
      sub: hasTrades && (stats.losses ?? 0) > 0
        ? `-$${(Math.abs(avgLoss) * (stats.losses ?? 0)).toLocaleString('en-US', { maximumFractionDigits: 0 })} total`
        : undefined,
      positive: hasTrades ? false : null,
    },
    {
      label: 'Avg R:R',
      value: avgRR,
      raw: true,
      sub: 'target 2.0R',
      positive: hasTrades && avgRR !== '—' ? parseFloat(avgRR) >= 2.0 : null,
    },
    {
      label: 'Profit Factor',
      value: hasTrades ? (pf >= 99 ? '∞' : pf.toFixed(2)) : '—',
      raw: true,
      sub: 'wins ÷ losses',
      positive: hasTrades ? pf >= 1.5 : null,
    },
    {
      label: 'Rule Score',
      value: hasTrades ? rs : '—',
      suffix: hasTrades ? '%' : '',
      raw: !hasTrades,
      sub: ruleScoreSub,
      positive: hasTrades ? rs >= 80 : null,
    },
  ];

  return (
    <section ref={ref}>
      <SectionEyebrow>Performance</SectionEyebrow>
      <h2 className="mt-3 text-2xl md:text-3xl font-bold tracking-tight">Core Metrics</h2>
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {cells.map((c, i) => (
          <MetricCell key={c.label} {...c} inView={inView} delay={i * 0.05} />
        ))}
      </div>
    </section>
  );
}

function DayWinSection({ dayStats }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section ref={ref}>
      <SectionEyebrow>Day Win %</SectionEyebrow>
      <h2 className="mt-3 text-2xl md:text-3xl font-bold tracking-tight">By Day of Week</h2>
      <div className="mt-6 rounded-2xl border border-border bg-panel/50 backdrop-blur-sm p-5 md:p-6">
        <div className="flex items-end justify-between gap-3 h-44">
          {dayStats.map((d, i) => {
            const heightPct = d.rate; // 0–100
            return (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-2 h-full">
                <div className="flex-1 w-full flex items-end relative">
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={inView ? { height: `${heightPct}%`, opacity: 1 } : {}}
                    transition={{ duration: 1, delay: 0.3 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full rounded-t-md relative group"
                    style={{
                      background: d.rate >= 60
                        ? 'linear-gradient(180deg, #00ff41 0%, #00cc34 100%)'
                        : d.rate >= 50
                        ? 'linear-gradient(180deg, #888 0%, #444 100%)'
                        : d.rate > 0
                        ? 'linear-gradient(180deg, #ef4444 0%, #b91c1c 100%)'
                        : 'rgba(255,255,255,0.06)',
                      boxShadow: d.rate >= 60 ? '0 0 20px rgba(0,255,65,0.25)' : 'none',
                      minHeight: d.rate > 0 ? 4 : 0,
                    }}
                  >
                    {(d.wins + d.losses) > 0 && (
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <div className="px-2 py-1 rounded bg-panel border border-border text-xs font-mono whitespace-nowrap">
                          {d.wins}W / {d.losses}L
                        </div>
                      </div>
                    )}
                  </motion.div>
                </div>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={inView ? { opacity: 1 } : {}}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  className={`text-sm font-mono font-bold ${
                    d.rate >= 60 ? 'text-neon' : d.rate >= 50 ? 'text-muted' : d.rate > 0 ? 'text-red-400' : 'text-muted/40'
                  }`}
                >
                  {d.rate > 0 ? `${d.rate}%` : '—'}
                </motion.span>
                <span className="text-[10px] text-muted font-mono uppercase tracking-wider">{d.day}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function StatClusterSection({ hasTrades, stats }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  const bestDayDisplay  = hasTrades ? `+$${Math.abs(stats.bestDay ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—';
  const worstDayDisplay = hasTrades ? `-$${Math.abs(stats.worstDay ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—';
  const greenDaysDisplay = hasTrades ? `${stats.winDays ?? 0}/${stats.tradingDays ?? 0}` : '—';

  return (
    <div ref={ref} className="grid grid-cols-3 gap-3">
      <ClusterTile Icon={TrendingUp}   label="Best Day"   display={bestDayDisplay}   tone="neon" inView={inView} delay={0} />
      <ClusterTile Icon={TrendingDown} label="Worst Day"  display={worstDayDisplay}  tone="red"  inView={inView} delay={0.1} />
      <ClusterTile Icon={Calendar}     label="Green Days" display={greenDaysDisplay} tone="neon" inView={inView} delay={0.2} />
    </div>
  );
}

function SetupSection({ setupRows }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const best = setupRows[0]; // already sorted by pl desc
  const maxTrades = Math.max(...setupRows.map(s => s.trades), 1);

  return (
    <section ref={ref}>
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <SectionEyebrow>Setup Performance</SectionEyebrow>
          <h2 className="mt-3 text-2xl md:text-3xl font-bold tracking-tight">Your Playbook</h2>
        </div>
        {best && (
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.18em] text-muted">
            <Trophy className="w-3.5 h-3.5 text-neon" />
            Best: <span className="text-neon">{best.name}</span>
          </div>
        )}
      </div>
      <div className="mt-6 space-y-3">
        {setupRows.map((s, i) => (
          <SetupRow key={s.name} setup={s} maxTrades={maxTrades} inView={inView} index={i} />
        ))}
      </div>
    </section>
  );
}

function MonthlySection({ monthlyData }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const [hovered, setHovered] = useState(null);

  const max = Math.max(...monthlyData.map(d => Math.abs(d.pl)), 1);
  const recent3 = [...monthlyData].reverse().slice(0, 3);

  return (
    <section ref={ref}>
      <SectionEyebrow>Monthly P&L</SectionEyebrow>
      <h2 className="mt-3 text-2xl md:text-3xl font-bold tracking-tight">Last 6 Months</h2>

      <div className="mt-6 rounded-2xl border border-border bg-panel/50 backdrop-blur-sm p-5 md:p-6">
        {/* Bar chart */}
        <div className="flex items-center gap-2 md:gap-3 h-48 relative">
          <div className="absolute inset-x-0 top-1/2 h-px bg-border" />

          {monthlyData.map((m, i) => {
            const heightPct = (Math.abs(m.pl) / max) * 50;
            const positive  = m.pl >= 0;
            const active    = hovered === i;

            return (
              <div
                key={m.month}
                className="flex-1 h-full flex flex-col justify-center items-center relative cursor-pointer"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                <div className="w-full flex items-end justify-center relative" style={{ height: '50%' }}>
                  {positive && m.trades > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={inView ? { height: `${heightPct}%`, opacity: 1 } : {}}
                      transition={{ duration: 0.9, delay: 0.2 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute bottom-0 w-[70%] rounded-t-md"
                      style={{
                        background: 'linear-gradient(180deg, #00ff41 0%, #00a828 100%)',
                        boxShadow: active ? '0 0 20px rgba(0,255,65,0.5)' : '0 0 8px rgba(0,255,65,0.2)',
                      }}
                    />
                  )}
                </div>
                <div className="w-full flex items-start justify-center relative" style={{ height: '50%' }}>
                  {!positive && m.trades > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={inView ? { height: `${heightPct}%`, opacity: 1 } : {}}
                      transition={{ duration: 0.9, delay: 0.2 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute top-0 w-[70%] rounded-b-md"
                      style={{
                        background: 'linear-gradient(0deg, #ef4444 0%, #991b1b 100%)',
                        boxShadow: active ? '0 0 20px rgba(239,68,68,0.5)' : '0 0 8px rgba(239,68,68,0.2)',
                      }}
                    />
                  )}
                </div>

                {active && m.trades > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -top-14 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-panel border border-border shadow-neon-soft z-10 whitespace-nowrap"
                  >
                    <div className="text-[10px] text-muted font-mono uppercase">{m.month}</div>
                    <div className={`text-sm font-mono font-bold ${positive ? 'text-neon' : 'text-red-400'}`}>
                      {positive ? '+' : '-'}${Math.abs(m.pl).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>

        {/* X-axis */}
        <div className="flex items-center gap-2 md:gap-3 mt-3">
          {monthlyData.map((m, i) => (
            <div key={m.month} className="flex-1 text-center">
              <span className={`text-[9px] md:text-[10px] font-mono uppercase tracking-wider ${hovered === i ? 'text-neon' : 'text-muted'}`}>
                {m.month}
              </span>
            </div>
          ))}
        </div>

        {/* Table — last 3 months */}
        <div className="mt-6 pt-6 border-t border-border">
          <div className="grid grid-cols-5 gap-2 text-[10px] text-muted font-mono uppercase tracking-[0.18em] pb-3 border-b border-border/50">
            <span>Month</span>
            <span className="text-right">P&L</span>
            <span className="text-right">Days</span>
            <span className="text-right">Trades</span>
            <span className="text-right">Win%</span>
          </div>
          {recent3.map((m, i) => (
            <motion.div
              key={m.month}
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 1 + i * 0.1 }}
              className="grid grid-cols-5 gap-2 py-3 border-b border-border/30 last:border-0 text-sm font-mono"
            >
              <span className="text-ink">{m.month}</span>
              <span className={`text-right font-bold ${m.trades === 0 ? 'text-muted' : m.pl >= 0 ? 'text-neon' : 'text-red-400'}`}>
                {m.trades === 0 ? '—' : `${m.pl >= 0 ? '+' : '-'}$${Math.abs(m.pl).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </span>
              <span className="text-right text-muted">{m.trades === 0 ? '—' : `${m.days}d`}</span>
              <span className="text-right text-muted">{m.trades === 0 ? '—' : m.trades}</span>
              <span className={`text-right ${m.trades === 0 ? 'text-muted' : m.winRate >= 60 ? 'text-neon' : m.winRate >= 50 ? 'text-muted' : 'text-red-400'}`}>
                {m.trades === 0 ? '—' : `${m.winRate}%`}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
