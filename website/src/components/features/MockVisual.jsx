// Each mockType returns a small SVG/JSX preview themed for the feature
import { Check } from 'lucide-react';

export default function MockVisual({ type }) {
  switch (type) {
    case 'journal':
      return <Journal />;
    case 'csv':
      return <CSV />;
    case 'broker':
      return <Broker />;
    case 'coach':
      return <Coach />;
    case 'plan':
      return <Plan />;
    case 'dashboard':
      return <Dashboard />;
    case 'calendar':
      return <Calendar />;
    case 'payout':
      return <Payout />;
    case 'screenshot':
      return <Screenshot />;
    case 'accounts':
      return <Accounts />;
    default:
      return null;
  }
}

const Card = ({ children, className = '' }) => (
  <div
    className={`rounded-lg border border-border bg-black/40 backdrop-blur p-4 ${className}`}
  >
    {children}
  </div>
);

const Bar = ({ label, value, color = 'bg-neon' }) => (
  <div className="flex items-center gap-3">
    <span className="text-[10px] font-mono uppercase tracking-widest text-muted w-16">
      {label}
    </span>
    <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
      <div className={`h-full ${color}`} style={{ width: `${value}%` }} />
    </div>
    <span className="text-xs font-mono text-neon w-10 text-right">{value}%</span>
  </div>
);

function Journal() {
  return (
    <Card>
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted mb-3">
        New Trade · MNQ · 2026-04-14
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <Field label="Direction" value="Long" />
        <Field label="Setup" value="ORB Breakout" />
        <Field label="Entry" value="18,420.50" />
        <Field label="Exit" value="18,455.00" />
        <Field label="Conviction" value="★★★★☆" />
        <Field label="P&L" value="+$340" valueClass="text-neon" />
      </div>
      <div className="mt-3 flex gap-1.5 flex-wrap">
        {['breakout', 'london-open', 'A+'].map((t) => (
          <span
            key={t}
            className="text-[10px] px-2 py-0.5 border border-neon/40 rounded text-neon font-mono"
          >
            #{t}
          </span>
        ))}
      </div>
    </Card>
  );
}

function Field({ label, value, valueClass = 'text-ink' }) {
  return (
    <div>
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted">
        {label}
      </div>
      <div className={`text-sm font-mono ${valueClass}`}>{value}</div>
    </div>
  );
}

function CSV() {
  return (
    <Card>
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted mb-3">
        Importing · positions.csv
      </div>
      <div className="space-y-1.5">
        {['Tradovate', 'IBKR', 'ThinkorSwim', 'TradeStation', 'Webull'].map((b, i) => (
          <div
            key={b}
            className="flex items-center justify-between px-3 py-2 rounded border border-border bg-panel/60 text-xs"
          >
            <span className="font-mono">{b}</span>
            <span className="flex items-center gap-1.5 text-neon">
              <Check className="w-3.5 h-3.5" />
              <span className="text-[10px] font-mono">supported</span>
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Broker() {
  return (
    <Card>
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted mb-3">
        Linked accounts · 3
      </div>
      <div className="space-y-2">
        {[
          { name: 'Tradovate · Live', status: 'Synced 2m ago', n: 'TR' },
          { name: 'Apex 50K · Funded', status: 'Synced 2m ago', n: 'AP' },
          { name: 'IBKR · Personal', status: 'Synced 12m ago', n: 'IB' },
        ].map((a) => (
          <div
            key={a.name}
            className="flex items-center gap-3 p-3 rounded border border-border bg-panel/40"
          >
            <span className="grid place-items-center w-8 h-8 rounded border border-neon/40 text-neon font-mono text-xs">
              {a.n}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate">{a.name}</div>
              <div className="text-[10px] font-mono text-muted">{a.status}</div>
            </div>
            <span className="w-1.5 h-1.5 rounded-full bg-neon animate-pulseSlow" />
          </div>
        ))}
      </div>
    </Card>
  );
}

function Coach() {
  return (
    <Card>
      <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-neon mb-3">
        <span className="w-1.5 h-1.5 rounded-full bg-neon animate-pulseSlow" />
        AI Coach · Today
      </div>
      <p className="text-sm leading-relaxed text-ink/90">
        Yesterday you took 3 trades outside your defined session window. Two were losers.
        Your win rate <span className="text-neon font-mono">in-session</span> is 68%.
        <br />
        <br />
        <span className="text-neon">→ Today's focus:</span> No trades before 9:30 ET.
        Period.
      </p>
    </Card>
  );
}

function Plan() {
  return (
    <Card>
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted mb-3">
        Trading Plan · v2
      </div>
      <ul className="space-y-2 text-xs">
        {[
          'Edge: ORB + VWAP reclaim on NQ/MNQ',
          'Session: 9:30 ET → 11:00 ET only',
          'Max risk per trade: 0.5R',
          'Daily loss limit: 2R',
          'Stop trading after 3 consecutive losses',
        ].map((line) => (
          <li key={line} className="flex items-start gap-2">
            <Check className="w-3.5 h-3.5 text-neon mt-0.5 flex-none" />
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function Dashboard() {
  return (
    <Card>
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted mb-3">
        Performance · MTD
      </div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Stat label="P&L" value="+$12,480" />
        <Stat label="Win" value="64%" />
        <Stat label="R:R" value="2.1" />
      </div>
      <div className="space-y-2">
        <Bar label="Mon" value={72} />
        <Bar label="Tue" value={48} />
        <Bar label="Wed" value={84} />
        <Bar label="Thu" value={62} />
        <Bar label="Fri" value={90} />
      </div>
    </Card>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded border border-border bg-panel/40 p-2 text-center">
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted">
        {label}
      </div>
      <div className="text-sm font-semibold text-neon font-mono">{value}</div>
    </div>
  );
}

function Calendar() {
  const cells = Array.from({ length: 28 }).map((_, i) => {
    const r = (i * 9301 + 49297) % 233280;
    const v = (r / 233280 - 0.5) * 2;
    return v;
  });
  return (
    <Card>
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted mb-3">
        April 2026
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((v, i) => {
          const positive = v > 0;
          const intensity = Math.abs(v);
          return (
            <div
              key={i}
              className="aspect-square rounded text-[9px] font-mono flex items-end justify-end p-1 border"
              style={{
                background: positive
                  ? `rgba(0,255,65,${0.08 + intensity * 0.4})`
                  : `rgba(255,80,80,${0.04 + intensity * 0.25})`,
                borderColor: positive
                  ? `rgba(0,255,65,${0.2 + intensity * 0.4})`
                  : `rgba(255,80,80,${0.15 + intensity * 0.3})`,
                color: positive ? '#00ff41' : '#ff6b6b',
              }}
            >
              {i + 1}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function Payout() {
  return (
    <Card>
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted mb-3">
        Payouts · YTD
      </div>
      <div className="space-y-2">
        {[
          { firm: 'Apex Trader', amt: '+$4,200', date: 'Apr 02' },
          { firm: 'TopStep', amt: '+$2,800', date: 'Mar 14' },
          { firm: 'Apex Trader', amt: '+$3,400', date: 'Feb 28' },
          { firm: 'Earn2Trade', amt: '+$1,650', date: 'Feb 10' },
        ].map((p) => (
          <div
            key={p.date}
            className="flex items-center justify-between px-3 py-2 rounded border border-border bg-panel/40 text-xs"
          >
            <div>
              <div className="font-mono">{p.firm}</div>
              <div className="text-[10px] text-muted font-mono">{p.date}</div>
            </div>
            <div className="text-neon font-mono font-semibold">{p.amt}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Screenshot() {
  return (
    <Card>
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted mb-3">
        Trade chart · MNQ 5m
      </div>
      <div className="aspect-video rounded border border-border bg-black overflow-hidden relative">
        <svg viewBox="0 0 200 120" className="w-full h-full" preserveAspectRatio="none">
          {Array.from({ length: 30 }).map((_, i) => {
            const r1 = (i * 9301 + 49297) % 233280;
            const r2 = (i * 7919 + 12345) % 233280;
            const open = 60 + (r1 / 233280 - 0.5) * 40;
            const close = 60 + (r2 / 233280 - 0.5) * 40;
            const high = Math.min(open, close) - 4;
            const low = Math.max(open, close) + 4;
            const up = close < open;
            return (
              <g key={i}>
                <line
                  x1={i * 6.5 + 3}
                  x2={i * 6.5 + 3}
                  y1={high}
                  y2={low}
                  stroke={up ? '#00ff41' : '#ff5757'}
                  strokeWidth="0.6"
                />
                <rect
                  x={i * 6.5 + 1}
                  y={Math.min(open, close)}
                  width="4"
                  height={Math.max(2, Math.abs(close - open))}
                  fill={up ? '#00ff41' : '#ff5757'}
                />
              </g>
            );
          })}
          <line
            x1="0"
            x2="200"
            y1="40"
            y2="40"
            stroke="rgba(0,255,65,0.4)"
            strokeWidth="0.5"
            strokeDasharray="2 2"
          />
        </svg>
      </div>
    </Card>
  );
}

function Accounts() {
  return (
    <Card>
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted mb-3">
        Account switcher
      </div>
      <div className="space-y-1.5">
        {[
          { name: 'Apex 50K', balance: '$52,340', active: true },
          { name: 'Apex 100K', balance: '$104,210', active: false },
          { name: 'TopStep 150K', balance: '$148,900', active: false },
          { name: 'Personal · IBKR', balance: '$28,540', active: false },
        ].map((a) => (
          <div
            key={a.name}
            className={`flex items-center justify-between px-3 py-2 rounded border text-xs ${
              a.active
                ? 'border-neon/60 bg-neon/5 text-ink'
                : 'border-border bg-panel/40 text-ink/70'
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  a.active ? 'bg-neon animate-pulseSlow' : 'bg-muted'
                }`}
              />
              <span className="font-mono">{a.name}</span>
            </div>
            <span className={`font-mono ${a.active ? 'text-neon' : 'text-muted'}`}>
              {a.balance}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
