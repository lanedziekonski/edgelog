import { motion } from 'framer-motion';

// SVG mock of a dashboard — equity curve, stat tiles, and a recent trades list.
export default function MockDashboard({ className = '' }) {
  return (
    <div
      className={`relative w-full max-w-5xl mx-auto rounded-xl border border-border bg-panel/80 backdrop-blur shadow-neon-soft overflow-hidden ${className}`}
    >
      {/* window chrome */}
      <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border bg-black/40">
        <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
        <span className="w-2.5 h-2.5 rounded-full bg-neon" />
        <span className="ml-3 text-xs text-muted font-mono">tradeascend / dashboard</span>
        <span className="ml-auto text-[10px] text-neon font-mono">● live</span>
      </div>

      <div className="grid md:grid-cols-3 gap-3 p-5">
        {/* Stat tiles */}
        <StatTile label="Net P&L (MTD)" value="+$12,480.50" delta="+18.4%" positive />
        <StatTile label="Win Rate" value="64%" delta="+5%" positive />
        <StatTile label="Avg R:R" value="2.1" delta="+0.4" positive />

        {/* Equity curve */}
        <div className="md:col-span-2 rounded-lg border border-border bg-black/40 p-4">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-xs text-muted font-mono uppercase tracking-widest">
              Equity Curve · 30D
            </span>
            <span className="text-xs text-neon font-mono">+$12,480</span>
          </div>
          <EquitySvg />
        </div>

        {/* Recent trades */}
        <div className="rounded-lg border border-border bg-black/40 p-4">
          <span className="text-xs text-muted font-mono uppercase tracking-widest">
            Recent Trades
          </span>
          <ul className="mt-3 space-y-2.5 text-xs">
            <TradeRow ticker="MNQ" pl="+$340" tag="ORB" win />
            <TradeRow ticker="ES" pl="-$120" tag="FAILED" />
            <TradeRow ticker="NQ" pl="+$880" tag="VWAP" win />
            <TradeRow ticker="MES" pl="+$220" tag="ORB" win />
            <TradeRow ticker="MNQ" pl="-$95" tag="FOMO" />
          </ul>
        </div>
      </div>
    </div>
  );
}

function StatTile({ label, value, delta, positive }) {
  return (
    <div className="rounded-lg border border-border bg-black/40 p-4">
      <div className="text-[10px] text-muted font-mono uppercase tracking-widest">
        {label}
      </div>
      <div className="mt-1.5 text-2xl font-semibold tracking-tight">{value}</div>
      <div
        className={`text-xs font-mono mt-1 ${
          positive ? 'text-neon' : 'text-red-400'
        }`}
      >
        {delta}
      </div>
    </div>
  );
}

function TradeRow({ ticker, pl, tag, win }) {
  return (
    <li className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="font-mono font-semibold">{ticker}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded border border-border text-muted font-mono">
          {tag}
        </span>
      </div>
      <span className={`font-mono ${win ? 'text-neon' : 'text-red-400'}`}>
        {pl}
      </span>
    </li>
  );
}

function EquitySvg() {
  // Synthetic equity curve points
  const points = [
    [0, 60], [20, 58], [40, 55], [60, 50], [80, 52], [100, 45],
    [120, 42], [140, 38], [160, 40], [180, 32], [200, 30], [220, 25],
    [240, 22], [260, 18], [280, 15], [300, 10], [320, 12], [340, 8],
    [360, 5], [380, 7], [400, 4],
  ];
  const path = points
    .map((p, i) => (i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`))
    .join(' ');
  const area = `${path} L 400 100 L 0 100 Z`;

  return (
    <svg viewBox="0 0 400 100" className="w-full h-32" preserveAspectRatio="none">
      <defs>
        <linearGradient id="eg" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#00ff41" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#00ff41" stopOpacity="0" />
        </linearGradient>
        <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
          <path
            d="M 40 0 L 0 0 0 20"
            fill="none"
            stroke="rgba(0,255,65,0.07)"
            strokeWidth="0.5"
          />
        </pattern>
      </defs>
      <rect width="400" height="100" fill="url(#grid)" />
      <motion.path
        d={area}
        fill="url(#eg)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.4 }}
      />
      <motion.path
        d={path}
        fill="none"
        stroke="#00ff41"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.6, ease: 'easeInOut' }}
      />
    </svg>
  );
}
