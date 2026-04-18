import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, BarChart2, Target, Zap, Clock } from 'lucide-react';
import { useTrades, calcStats, buildEquityCurve, fmtPnl } from '../hooks/useTrades';

const G = '#00ff41';

function StatCard({ label, value, sub, positive, Icon }) {
  const color = positive === true ? G : positive === false ? '#ff4d4d' : 'rgba(255,255,255,0.8)';
  return (
    <div className="rounded-xl p-5" style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</p>
          <p className="text-2xl font-bold" style={{ color }}>{value}</p>
          {sub && <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{sub}</p>}
        </div>
        {Icon && <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'rgba(255,255,255,0.2)' }} />}
      </div>
    </div>
  );
}

function EquityChart({ curve }) {
  if (curve.length < 2) return (
    <div className="flex items-center justify-center h-32 text-sm" style={{ color: 'rgba(255,255,255,0.25)' }}>
      Log more trades to see your equity curve
    </div>
  );
  const values = curve.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const W = 800; const H = 120;
  const pts = curve.map((d, i) => {
    const x = (i / (curve.length - 1)) * W;
    const y = H - ((d.value - min) / range) * (H - 16) - 8;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const isUp = values[values.length - 1] >= values[0];
  const stroke = isUp ? G : '#ff4d4d';
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-28" preserveAspectRatio="none">
        <defs>
          <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.18" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          points={`0,${H} ${pts.join(' ')} ${W},${H}`}
          fill="url(#cg)"
        />
        <polyline points={pts.join(' ')} fill="none" stroke={stroke} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <div className="flex justify-between mt-1 px-0.5">
        <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>{curve[0]?.label}</span>
        <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>{curve[curve.length - 1]?.label}</span>
      </div>
    </div>
  );
}

export default function AppDashboard() {
  const navigate = useNavigate();
  const { trades, loading } = useTrades();
  const stats = useMemo(() => calcStats(trades), [trades]);
  const curve = useMemo(() => buildEquityCurve(trades), [trades]);

  const recent = useMemo(() =>
    [...trades].sort((a, b) => b.date?.localeCompare(a.date) || 0).slice(0, 8),
  [trades]);

  const setupRows = useMemo(() =>
    Object.entries(stats.bySetup || {})
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.pnl - a.pnl)
      .slice(0, 5),
  [stats]);

  if (loading) return <Loader />;

  return (
    <div className="space-y-8">
      {/* Hero stats */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-5">Dashboard</h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Total P&L"
            value={fmtPnl(stats.totalPnl)}
            sub={`${stats.totalTrades} trades`}
            positive={stats.totalPnl >= 0}
            Icon={stats.totalPnl >= 0 ? TrendingUp : TrendingDown}
          />
          <StatCard
            label="Win Rate"
            value={`${stats.winRate.toFixed(1)}%`}
            sub={`${stats.wins}W / ${stats.losses}L`}
            positive={stats.winRate >= 50}
            Icon={Target}
          />
          <StatCard
            label="Profit Factor"
            value={stats.profitFactor >= 99 ? '∞' : stats.profitFactor.toFixed(2)}
            sub="wins ÷ losses"
            positive={stats.profitFactor >= 1.5}
            Icon={BarChart2}
          />
          <StatCard
            label="Avg Win"
            value={fmtPnl(stats.avgWin)}
            sub={`Avg Loss: ${fmtPnl(stats.avgLoss)}`}
            positive={Math.abs(stats.avgWin) >= Math.abs(stats.avgLoss)}
            Icon={Zap}
          />
        </div>
      </div>

      {/* Equity curve */}
      <div className="rounded-xl p-5" style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-xs font-mono uppercase tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Equity Curve
        </p>
        <EquityChart curve={curve} />
      </div>

      {/* Stats row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Rule Score" value={`${stats.ruleScore?.toFixed(0) ?? 0}%`} sub="plan adherence" positive={stats.ruleScore >= 80} Icon={Target} />
        <StatCard label="Best Day" value={fmtPnl(stats.bestDay ?? 0)} sub="single day" positive={true} Icon={TrendingUp} />
        <StatCard label="Worst Day" value={fmtPnl(stats.worstDay ?? 0)} sub="single day" positive={false} Icon={TrendingDown} />
        <StatCard label="Win Days" value={`${stats.winDays ?? 0}/${stats.tradingDays ?? 0}`} sub="trading days" positive={(stats.winDays ?? 0) >= (stats.tradingDays ?? 1) / 2} Icon={BarChart2} />
      </div>

      {/* Streak banner */}
      {stats.streak > 0 && (
        <div
          className="rounded-xl px-5 py-4 flex items-center gap-3"
          style={{
            background: stats.streakType === 'win' ? `${G}12` : 'rgba(255,77,77,0.08)',
            border: `1px solid ${stats.streakType === 'win' ? `${G}30` : 'rgba(255,77,77,0.2)'}`,
          }}
        >
          <Zap className="w-5 h-5 flex-shrink-0" style={{ color: stats.streakType === 'win' ? G : '#ff4d4d' }} />
          <p className="text-sm font-semibold" style={{ color: stats.streakType === 'win' ? G : '#ff4d4d' }}>
            {stats.streak}-trade {stats.streakType} streak
          </p>
          <p className="text-xs ml-auto" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {stats.streakType === 'win' ? 'Keep it up!' : 'Stay disciplined'}
          </p>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent trades */}
        <div className="rounded-xl p-5" style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-xs font-mono uppercase tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Recent Trades
          </p>
          {recent.length === 0 ? (
            <EmptyTrades onAdd={() => navigate('/journal?addTrade=1')} />
          ) : (
            <div className="space-y-2">
              {recent.map((t, i) => (
                <motion.div
                  key={t.id ?? i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.025)' }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                      style={{
                        background: t.direction === 'LONG' ? `${G}18` : 'rgba(255,77,77,0.12)',
                        color: t.direction === 'LONG' ? G : '#ff6b6b',
                      }}
                    >
                      {t.direction ?? '—'}
                    </span>
                    <span className="font-semibold text-sm truncate">{t.symbol}</span>
                    <span className="text-xs truncate hidden sm:block" style={{ color: 'rgba(255,255,255,0.35)' }}>{t.setup}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>{t.date}</span>
                    <span className="font-mono font-bold text-sm" style={{ color: t.pnl >= 0 ? G : '#ff4d4d' }}>
                      {fmtPnl(t.pnl)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Setup breakdown */}
        <div className="rounded-xl p-5" style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-xs font-mono uppercase tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Setup Performance
          </p>
          {setupRows.length === 0 ? (
            <div className="text-center py-8 text-sm" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Add trades with setup tags to see breakdown
            </div>
          ) : (
            <div className="space-y-3">
              {setupRows.map(s => (
                <div key={s.name} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{s.name}</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {s.total} trades · {((s.wins / s.total) * 100).toFixed(0)}% WR
                    </p>
                  </div>
                  <span className="font-mono font-bold text-sm flex-shrink-0" style={{ color: s.pnl >= 0 ? G : '#ff4d4d' }}>
                    {fmtPnl(s.pnl)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Loader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-sm font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>Loading…</div>
    </div>
  );
}

function EmptyTrades({ onAdd }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-3">
      <Clock className="w-8 h-8" style={{ color: 'rgba(255,255,255,0.15)' }} />
      <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>No trades yet</p>
      <button
        onClick={onAdd}
        className="text-xs font-semibold px-4 py-1.5 rounded-lg"
        style={{ background: `${G}20`, color: G, border: `1px solid ${G}40` }}
      >
        Log your first trade
      </button>
    </div>
  );
}
