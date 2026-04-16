import { motion } from 'framer-motion';
import SectionEyebrow from './SectionEyebrow';

/**
 * Full-featured dashboard mock — mirrors the TraderAscend app layout:
 * top stat grid, equity curve, recent trades table, monthly P&L bars.
 * All content is animated in via framer-motion on mount.
 */
export default function MockDashboard({ className = '' }) {
  return (
    <div
      className={`relative w-full max-w-6xl mx-auto rounded-2xl border border-border bg-panel/85 backdrop-blur shadow-neon-soft overflow-hidden ${className}`}
    >
      {/* window chrome */}
      <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border bg-black/60">
        <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
        <span className="w-2.5 h-2.5 rounded-full bg-neon" />
        <span className="ml-3 text-xs text-muted font-mono tracking-wide">
          traderascend / dashboard
        </span>
        <span className="ml-auto text-[10px] text-neon font-mono inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-neon animate-pulseSlow" />
          live
        </span>
      </div>

      <div className="p-5 md:p-6 space-y-6">
        {/* Top stat grid — 6 tiles */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2.5">
          <MiniStat label="Win Rate" value="64%" sub="18W / 10L" positive />
          <MiniStat label="Avg Win" value="+$412" positive />
          <MiniStat label="Avg Loss" value="-$185" negative />
          <MiniStat label="Avg R:R" value="2.1" positive />
          <MiniStat label="P. Factor" value="1.84" positive />
          <MiniStat label="Rule Score" value="92%" positive />
        </div>

        {/* Equity curve + Recent trades */}
        <div className="grid lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3 rounded-xl border border-border bg-black/40 p-5">
            <div className="flex items-baseline justify-between mb-4">
              <SectionEyebrow>Equity Curve · 30D</SectionEyebrow>
              <span className="text-sm text-neon font-mono font-bold">+$12,480</span>
            </div>
            <EquitySvg />
            <div className="mt-2 flex justify-between text-[10px] text-muted font-mono uppercase tracking-wider">
              <span>Mar 16</span>
              <span>Mar 24</span>
              <span>Apr 1</span>
              <span>Apr 8</span>
              <span>Apr 16</span>
            </div>
          </div>

          <div className="lg:col-span-2 rounded-xl border border-border bg-black/40 p-5">
            <SectionEyebrow className="mb-4">Recent Trades</SectionEyebrow>
            <ul className="space-y-3 text-sm">
              <TradeRow date="04-10" ticker="ES" tag="ORB" pl="+$338" win />
              <TradeRow date="04-10" ticker="NQ" tag="VWAP" pl="+$880" win />
              <TradeRow date="04-09" ticker="MNQ" tag="ORB" pl="-$81" />
              <TradeRow date="04-09" ticker="MES" tag="FOMO" pl="-$95" />
              <TradeRow date="04-08" ticker="MNQ" tag="ORB" pl="+$220" win />
            </ul>
          </div>
        </div>

        {/* Monthly P&L bars */}
        <div className="rounded-xl border border-border bg-black/40 p-5">
          <div className="flex items-baseline justify-between mb-4">
            <SectionEyebrow>Monthly P&L · Last 12 Months</SectionEyebrow>
            <span className="text-xs text-muted font-mono">Best: Mar</span>
          </div>
          <MonthlyBars />
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, sub, positive, negative }) {
  const color = positive ? 'text-neon' : negative ? 'text-red-400' : 'text-ink';
  return (
    <div className="rounded-lg border border-border bg-black/40 px-3 py-3">
      <div className="text-[9px] text-muted font-mono uppercase tracking-[0.18em] truncate">
        {label}
      </div>
      <div className={`mt-1.5 text-base md:text-lg font-bold tracking-tight ${color}`}>
        {value}
      </div>
      {sub && <div className="text-[10px] text-muted font-mono mt-0.5">{sub}</div>}
    </div>
  );
}

function TradeRow({ date, ticker, tag, pl, win }) {
  return (
    <li className="flex items-center justify-between text-xs">
      <div className="flex items-center gap-3 min-w-0">
        <span className="font-mono text-muted">{date}</span>
        <span className="font-mono font-bold text-ink">{ticker}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded border border-border text-muted font-mono uppercase">
          {tag}
        </span>
      </div>
      <span className={`font-mono font-semibold ${win ? 'text-neon' : 'text-red-400'}`}>
        {pl}
      </span>
    </li>
  );
}

function MonthlyBars() {
  // 12 months of synthetic P&L, most positive with a couple of down months
  const months = [
    { label: 'May', v: 0.35 },
    { label: 'Jun', v: 0.55 },
    { label: 'Jul', v: -0.15, neg: true },
    { label: 'Aug', v: 0.45 },
    { label: 'Sep', v: 0.72 },
    { label: 'Oct', v: 0.5 },
    { label: 'Nov', v: -0.25, neg: true },
    { label: 'Dec', v: 0.6 },
    { label: 'Jan', v: 0.85 },
    { label: 'Feb', v: 0.66 },
    { label: 'Mar', v: 1.0 },
    { label: 'Apr', v: 0.44 },
  ];
  return (
    <div className="flex items-end gap-1.5 h-28">
      {months.map((m, i) => {
        const h = Math.abs(m.v) * 100;
        return (
          <div key={m.label} className="flex-1 flex flex-col items-center gap-1.5">
            <div className="flex-1 w-full flex items-end">
              <motion.div
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.8, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                className={`w-full rounded-sm origin-bottom ${m.neg ? 'bg-red-500/70' : 'bg-neon/70'}`}
                style={{ height: `${h}%` }}
              />
            </div>
            <span className="text-[9px] text-muted font-mono uppercase tracking-wider">
              {m.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function EquitySvg() {
  // Synthetic equity curve — upward trend with a small pullback
  const points = [
    [0, 80], [20, 78], [40, 72], [60, 70], [80, 64], [100, 66],
    [120, 58], [140, 55], [160, 60], [180, 48], [200, 42], [220, 45],
    [240, 38], [260, 30], [280, 34], [300, 24], [320, 20], [340, 22],
    [360, 14], [380, 12], [400, 8],
  ];
  const path = points
    .map((p, i) => (i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`))
    .join(' ');
  const area = `${path} L 400 100 L 0 100 Z`;

  return (
    <svg viewBox="0 0 400 100" className="w-full h-40" preserveAspectRatio="none">
      <defs>
        <linearGradient id="equity-grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#00ff41" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#00ff41" stopOpacity="0" />
        </linearGradient>
        <pattern id="equity-grid" width="40" height="20" patternUnits="userSpaceOnUse">
          <path
            d="M 40 0 L 0 0 0 20"
            fill="none"
            stroke="rgba(0,255,65,0.06)"
            strokeWidth="0.5"
          />
        </pattern>
      </defs>
      <rect width="400" height="100" fill="url(#equity-grid)" />
      <motion.path
        d={area}
        fill="url(#equity-grad)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.6 }}
      />
      <motion.path
        d={path}
        fill="none"
        stroke="#00ff41"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2.2, ease: 'easeInOut' }}
        style={{ filter: 'drop-shadow(0 0 6px rgba(0,255,65,0.5))' }}
      />
    </svg>
  );
}
