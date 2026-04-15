import React, { useMemo, useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
  BarChart, Bar, Cell,
} from 'recharts';
import { calcDetailedStats, buildEquityCurve, fmtPnl, todayStr } from '../hooks/useTrades';
import { useAccountFilter } from '../context/AccountFilterContext';
import AccountSelector from '../components/AccountSelector';

// ── Design tokens ─────────────────────────────────────────────────────────
const G    = '#00ff41';
const R    = '#ff2d2d';
const GOLD = '#f0a500';
const BG   = '#080c08';
const BG2  = '#0b0f0b';

// ── Number ticker hook ────────────────────────────────────────────────────
function useTicker(target, active, duration = 1400) {
  const [val, setVal] = useState(0);
  const ran = useRef(false);
  useEffect(() => {
    if (!active || ran.current) return;
    ran.current = true;
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min((now - t0) / duration, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setVal(target * e);
      if (p < 1) requestAnimationFrame(step);
      else setVal(target);
    };
    requestAnimationFrame(step);
  }, [active, target, duration]);
  return val;
}

function fmt$(n, decimals = 2) {
  return Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

// ── Particle canvas ───────────────────────────────────────────────────────
function ParticleCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    const W = canvas.width, H = canvas.height;
    const pts = Array.from({ length: 40 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.15, vy: (Math.random() - 0.5) * 0.15,
      r: Math.random() * 1.2 + 0.3, o: Math.random() * 0.2 + 0.06,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      pts.forEach(p => {
        p.x = (p.x + p.vx + W) % W;
        p.y = (p.y + p.vy + H) % H;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,255,65,${p.o})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />;
}

// ── Shared sub-components ─────────────────────────────────────────────────
function PanelHeader({ label, title, right }) {
  return (
    <div style={{ marginBottom: 16, position: 'relative', zIndex: 1 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: title ? 4 : 0,
      }}>
        <div style={{ width: 3, height: 14, background: G, borderRadius: 2, flexShrink: 0 }} />
        <div style={{ fontSize: 9, letterSpacing: '3px', textTransform: 'uppercase', color: `${G}bb`, fontWeight: 700 }}>
          {label}
        </div>
        {right && <div style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{right}</div>}
      </div>
      {title && (
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif", fontSize: 24, fontWeight: 900,
          letterSpacing: '-0.5px', color: '#fff', lineHeight: 1, paddingLeft: 11,
        }}>
          {title}
        </div>
      )}
    </div>
  );
}

function StatPill({ label, value, color }) {
  return (
    <div>
      <div style={{ fontSize: 24, color: 'rgba(255,255,255,0.35)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 32 }}>{label}</div>
      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 44, fontWeight: 700, color: color || '#fff', lineHeight: 1 }}>{value}</div>
    </div>
  );
}

function StatBlock({ label, value, color, size = 30 }) {
  return (
    <div>
      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: size, fontWeight: 900, lineHeight: 1, color: color || '#fff', marginBottom: 16 }}>{value}</div>
      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>{label}</div>
    </div>
  );
}

// Separator between panels
function Divider() {
  return <div style={{ height: 1, background: `rgba(0,255,65,0.07)`, margin: '0' }} />;
}

// ── Section 1: Hero ───────────────────────────────────────────────────────
function HeroSection({ stats, todayPnl, weekPnl, sectionId }) {
  const ref  = useRef(null);
  const inV  = useInView(ref, { once: true, amount: 0.3 });
  const isPos = stats.totalPnl >= 0;

  const absTotal = useTicker(Math.abs(stats.totalPnl), inV, 1400);
  const absToday = useTicker(Math.abs(todayPnl), inV, 1100);
  const absWeek  = useTicker(Math.abs(weekPnl), inV, 1100);

  return (
    <section
      id={sectionId} ref={ref}
      style={{
        position: 'relative', overflow: 'hidden',
        background: 'radial-gradient(ellipse at 50% 80%, #0f1f0f 0%, #080c08 70%)',
        padding: '80px 48px 80px', minHeight: 360,
      }}
    >
      <ParticleCanvas />
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse at 50% 60%, transparent 20%, rgba(8,12,8,0.75) 85%)',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={inV ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}
      >
        <div style={{ fontSize: 24, letterSpacing: '3px', textTransform: 'uppercase', color: `${G}99`, fontWeight: 700, marginBottom: 16 }}>
          Total P&L
        </div>
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 'clamp(136px, 40vw, 198px)',
          fontWeight: 900, lineHeight: 1, letterSpacing: '-2px',
          color: isPos ? G : R,
          textShadow: `0 0 40px ${isPos ? 'rgba(0,255,65,0.22)' : 'rgba(255,45,45,0.22)'}`,
        }}>
          {isPos ? '+' : '-'}${fmt$(absTotal)}
        </div>

        <div style={{ width: 28, height: 1, background: 'rgba(0,255,65,0.3)', margin: '48px auto' }} />

        <div style={{ display: 'flex', gap: 80, justifyContent: 'center', flexWrap: 'wrap' }}>
          <StatPill label="Today"     value={`${todayPnl >= 0 ? '+' : '-'}$${fmt$(absToday)}`} color={todayPnl >= 0 ? G : R} />
          <StatPill label="This Week" value={`${weekPnl >= 0 ? '+' : '-'}$${fmt$(absWeek)}`}  color={weekPnl >= 0 ? G : R} />
          <StatPill
            label="Streak"
            value={stats.streak > 0 ? `${stats.streak}${stats.streakType === 'win' ? 'W' : 'L'}` : '—'}
            color={stats.streakType === 'win' ? G : stats.streakType === 'loss' ? R : 'rgba(255,255,255,0.4)'}
          />
        </div>
      </motion.div>
    </section>
  );
}

// ── Section 2: Win Rate ───────────────────────────────────────────────────
function WinRateSection({ stats, sectionId }) {
  const ref = useRef(null);
  const inV = useInView(ref, { once: true, amount: 0.3 });

  const wrVal  = useTicker(stats.winRate, inV, 1200);
  const totVal = useTicker(stats.totalTrades, inV, 900);
  const avgRR  = stats.avgLoss !== 0 ? stats.avgWin / Math.abs(stats.avgLoss) : 0;
  const rrVal  = useTicker(avgRR, inV, 1000);
  const pfVal  = useTicker(Math.min(stats.profitFactor, 20), inV, 1000);

  return (
    <>
      <Divider />
      <section
        id={sectionId} ref={ref}
        style={{
          background: BG2,
          padding: '20px 20px 28px',
          position: 'relative', overflow: 'hidden',
        }}
      >
        <PanelHeader label="Win Rate" />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inV ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{ position: 'relative', zIndex: 1 }}
        >
          {/* Big win rate + bar */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginBottom: 16 }}>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 'clamp(48px, 14vw, 72px)',
              fontWeight: 900, lineHeight: 1, letterSpacing: '-2px', color: '#fff',
            }}>
              {Math.round(wrVal)}<span style={{ fontSize: '38%', opacity: 0.5 }}>%</span>
            </div>
            <div style={{ flex: 1, paddingBottom: 20 }}>
              <div style={{ height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={inV ? { width: `${Math.min(stats.winRate, 100)}%` } : { width: 0 }}
                  transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  style={{ height: '100%', background: G, boxShadow: `0 0 8px ${G}` }}
                />
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 16 }}>
                {stats.wins}W / {stats.losses}L of {Math.round(totVal)} trades
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 16 }}>
            <StatBlock label="Avg Win"   value={`+$${fmt$(stats.avgWin, 0)}`}           color={G} size={22} />
            <StatBlock label="Avg Loss"  value={`-$${fmt$(Math.abs(stats.avgLoss), 0)}`} color={R} size={22} />
            <StatBlock label="Avg R:R"   value={stats.avgLoss !== 0 ? `${rrVal.toFixed(1)}R` : '∞'} color={avgRR >= 1 ? G : R} size={22} />
            <StatBlock label="P. Factor" value={stats.profitFactor >= 999 ? '∞' : pfVal.toFixed(1)} color={stats.profitFactor >= 1 ? G : R} size={22} />
            <StatBlock label="Rule Score" value={`${Math.round(stats.ruleScore)}%`} color={stats.ruleScore >= 80 ? G : stats.ruleScore >= 60 ? GOLD : R} size={22} />
            <StatBlock label="Day Win%"  value={stats.tradingDays > 0 ? `${Math.round(stats.winDays / stats.tradingDays * 100)}%` : '—'} color={stats.tradingDays > 0 && stats.winDays / stats.tradingDays >= 0.5 ? G : R} size={22} />
          </div>
        </motion.div>
      </section>
    </>
  );
}

// ── Section 3: Recent Trades ──────────────────────────────────────────────
function RecentTradesSection({ trades, sectionId }) {
  const ref    = useRef(null);
  const inV    = useInView(ref, { once: true, amount: 0.2 });
  const recent = [...trades].sort((a, b) => b.date.localeCompare(a.date) || (b.id > a.id ? 1 : -1)).slice(0, 8);

  const rowVariants = {
    hidden: { opacity: 0, x: -12 },
    visible: (i) => ({ opacity: 1, x: 0, transition: { delay: i * 0.055, duration: 0.35, ease: 'easeOut' } }),
  };

  return (
    <>
      <Divider />
      <section
        id={sectionId} ref={ref}
        style={{
          background: BG,
          padding: '20px 0 28px',
          position: 'relative', overflow: 'hidden',
        }}
      >
        <div style={{ padding: '0 20px', marginBottom: 16 }}>
          <PanelHeader label="Recent Trades" title={`Last ${recent.length} Trades`} />
        </div>

        {/* Table */}
        <div>
          {/* Header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '72px 56px 1fr 72px 68px',
            padding: '5px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', gap: 16,
          }}>
            {['Date', 'Symbol', 'Setup', 'Account', 'P&L'].map(h => (
              <div key={h} style={{ fontSize: 8, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>
                {h}
              </div>
            ))}
          </div>

          {recent.map((t, i) => (
            <motion.div
              key={t.id}
              custom={i}
              initial="hidden"
              animate={inV ? 'visible' : 'hidden'}
              variants={rowVariants}
              whileHover={{ backgroundColor: 'rgba(0,255,65,0.04)', x: 2 }}
              style={{
                display: 'grid', gridTemplateColumns: '72px 56px 1fr 72px 68px',
                padding: '20px 20px', gap: 16,
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                cursor: 'default', transition: 'background 0.12s',
              }}
            >
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', alignSelf: 'center' }}>{t.date.slice(5)}</div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, fontWeight: 700, color: '#fff', alignSelf: 'center' }}>{t.symbol}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', alignSelf: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.setup}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', alignSelf: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.account || '—'}</div>
              <div style={{ textAlign: 'right', alignSelf: 'center' }}>
                <span style={{
                  fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 700,
                  color: t.pnl >= 0 ? G : R,
                  textShadow: t.pnl >= 0 ? `0 0 10px rgba(0,255,65,0.45)` : `0 0 10px rgba(255,45,45,0.35)`,
                }}>
                  {t.pnl >= 0 ? '+' : ''}{fmtPnl(t.pnl)}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Day heat dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inV ? { opacity: 1 } : {}}
          transition={{ delay: 0.5, duration: 0.5 }}
          style={{ padding: '20px 20px 0', display: 'flex', gap: 16, flexWrap: 'wrap' }}
        >
          {(() => {
            const byDate = {};
            trades.forEach(t => { byDate[t.date] = (byDate[t.date] || 0) + t.pnl; });
            return Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b)).map(([date, pnl]) => (
              <div key={date} title={`${date}: ${fmtPnl(pnl)}`} style={{
                width: 7, height: 7, borderRadius: 2,
                background: pnl > 0 ? G : R, opacity: 0.5,
                boxShadow: pnl > 0 ? `0 0 3px rgba(0,255,65,0.4)` : `0 0 3px rgba(255,45,45,0.3)`,
              }} />
            ));
          })()}
        </motion.div>
      </section>
    </>
  );
}

// ── Section 4: Equity Curve ───────────────────────────────────────────────
function EquitySection({ curve, stats, sectionId }) {
  const ref   = useRef(null);
  const inV   = useInView(ref, { once: true, amount: 0.25 });
  const isPos = stats.totalPnl >= 0;

  const bestVal  = useTicker(Math.abs(stats.bestDay), inV, 1100);
  const worstVal = useTicker(Math.abs(stats.worstDay), inV, 1100);

  return (
    <>
      <Divider />
      <section
        id={sectionId} ref={ref}
        style={{
          background: BG2,
          padding: '20px 20px 28px',
          position: 'relative', overflow: 'hidden',
        }}
      >
        <PanelHeader
          label="Equity Curve"
          title={`${curve.length} Trading Days`}
          right={`Net ${fmtPnl(stats.totalPnl)}`}
        />

        <motion.div
          initial={{ opacity: 0 }}
          animate={inV ? { opacity: 1 } : {}}
          transition={{ delay: 0.15, duration: 0.7 }}
          style={{ filter: `drop-shadow(0 0 8px rgba(0,255,65,0.2))`, margin: '0 -4px' }}
        >
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={curve} margin={{ top: 6, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={isPos ? G : R} stopOpacity={0.35} />
                  <stop offset="40%"  stopColor={isPos ? G : R} stopOpacity={0.16} />
                  <stop offset="100%" stopColor={isPos ? G : R} stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tick={{ fill: '#2a3a2a', fontSize: 9, fontFamily: 'Barlow' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: '#2a3a2a', fontSize: 9, fontFamily: 'Barlow' }} axisLine={false} tickLine={false} width={42}
                tickFormatter={v => `${v < 0 ? '-' : ''}$${Math.abs(v) >= 1000 ? `${(Math.abs(v)/1000).toFixed(1)}k` : Math.abs(v)}`}
              />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.07)" strokeDasharray="3 3" />
              <Tooltip
                contentStyle={{ background: '#111', border: `1px solid rgba(0,255,65,0.2)`, borderRadius: 8, fontFamily: 'Barlow', fontSize: 12 }}
                labelStyle={{ color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}
                formatter={(v) => [fmtPnl(v), 'Equity']}
              />
              <Area type="monotone" dataKey="value" stroke={isPos ? G : R} strokeWidth={2}
                fill="url(#eqGrad)" dot={false}
                activeDot={{ r: 4, fill: isPos ? G : R, strokeWidth: 0 }}
                isAnimationActive={inV} animationDuration={1800} animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inV ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4, duration: 0.6 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 16, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.05)' }}
        >
          <StatBlock label="Best Day"  value={`+$${fmt$(bestVal, 0)}`}  color={G} size={22} />
          <StatBlock label="Worst Day" value={`-$${fmt$(worstVal, 0)}`} color={R} size={22} />
          <StatBlock
            label="Green Days"
            value={`${stats.winDays}/${stats.tradingDays}`}
            color={stats.tradingDays > 0 && stats.winDays / stats.tradingDays >= 0.5 ? G : R}
            size={22}
          />
        </motion.div>
      </section>
    </>
  );
}

// ── Section 5: Playbook ───────────────────────────────────────────────────
function PlaybookSection({ stats, sectionId }) {
  const ref    = useRef(null);
  const inV    = useInView(ref, { once: true, amount: 0.2 });
  const setups = Object.entries(stats.bySetup).filter(([, v]) => v.total > 0).sort(([, a], [, b]) => b.pnl - a.pnl);
  const maxAbs = Math.max(...setups.map(([, v]) => Math.abs(v.pnl)), 1);

  const cardVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: (i) => ({ opacity: 1, y: 0, transition: { delay: 0.06 + i * 0.07, duration: 0.4, ease: 'easeOut' } }),
  };

  return (
    <>
      <Divider />
      <section
        id={sectionId} ref={ref}
        style={{
          background: BG,
          padding: '20px 20px 28px',
          position: 'relative', overflow: 'hidden',
        }}
      >
        <PanelHeader
          label="Setup Performance"
          title="Your Playbook"
          right={stats.bestSetup ? `Best: ${stats.bestSetup.name}` : null}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', zIndex: 1 }}>
          {setups.length === 0 ? (
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, padding: '20px 0' }}>No setup data yet.</div>
          ) : setups.map(([name, v], i) => {
            const isP   = v.pnl >= 0;
            const barPct = Math.round((Math.abs(v.pnl) / maxAbs) * 100);
            return (
              <motion.div
                key={name}
                custom={i}
                initial="hidden"
                animate={inV ? 'visible' : 'hidden'}
                variants={cardVariants}
                whileHover={{ scale: 1.01, borderColor: `rgba(0,255,65,0.3)` }}
                style={{
                  background: BG2,
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 10, padding: '20px 14px',
                  cursor: 'default', transition: 'border-color 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 700, color: '#fff' }}>{name}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 16 }}>
                      {v.total} trade{v.total !== 1 ? 's' : ''} · {Math.round(v.winRate)}% win
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 700, color: isP ? G : R, textShadow: isP ? `0 0 10px rgba(0,255,65,0.35)` : `0 0 10px rgba(255,45,45,0.3)` }}>
                      {fmtPnl(v.pnl)}
                    </div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>{v.wins}W / {v.total - v.wins}L</div>
                  </div>
                </div>
                <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 1, overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={inV ? { width: `${barPct}%` } : { width: 0 }}
                    transition={{ duration: 0.9, delay: 0.15 + i * 0.08, ease: 'easeOut' }}
                    style={{ height: '100%', background: isP ? G : R, opacity: 0.75 }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>
    </>
  );
}

// ── Section 6: Monthly P&L ────────────────────────────────────────────────
function MonthlyPnLSection({ trades, sectionId }) {
  const ref = useRef(null);
  const inV = useInView(ref, { once: true, amount: 0.2 });

  const monthlyData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const d    = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      const key  = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      const mTrades = trades.filter(t => t.date.startsWith(key));
      const pnl  = mTrades.reduce((s, t) => s + t.pnl, 0);
      const days = new Set(mTrades.map(t => t.date)).size;
      const wins = mTrades.filter(t => t.pnl > 0).length;
      const winRate = mTrades.length > 0 ? Math.round((wins / mTrades.length) * 100) : null;
      return { key, label, pnl, days, trades: mTrades.length, winRate, isPos: pnl >= 0 };
    });
  }, [trades]);

  const maxAbs = Math.max(...monthlyData.map(m => Math.abs(m.pnl)), 1);

  return (
    <>
      <Divider />
      <section
        id={sectionId} ref={ref}
        style={{
          background: BG2,
          padding: '20px 20px 80px',
          position: 'relative', overflow: 'hidden',
        }}
      >
        <PanelHeader label="Monthly P&L" title="Last 12 Months" />

        {/* Bar chart */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inV ? { opacity: 1 } : {}}
          transition={{ delay: 0.15, duration: 0.7 }}
          style={{ margin: '0 -4px 16px' }}
        >
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barCategoryGap="22%">
              <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.28)', fontSize: 8.5, fontFamily: 'Barlow' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.08)" />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                contentStyle={{ background: '#111', border: '1px solid rgba(0,255,65,0.2)', borderRadius: 8, fontFamily: 'Barlow', fontSize: 12 }}
                labelStyle={{ color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}
                formatter={(v) => [fmtPnl(v), 'P&L']}
              />
              <Bar dataKey="pnl" radius={[3, 3, 0, 0]} isAnimationActive={inV} animationDuration={1000}>
                {monthlyData.map((m) => (
                  <Cell key={m.key} fill={m.isPos ? G : R} opacity={m.trades === 0 ? 0.12 : 0.82} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Summary table */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inV ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div style={{
            display: 'grid', gridTemplateColumns: '52px 1fr 48px 48px 54px',
            padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.07)', gap: 16, marginBottom: 16,
          }}>
            {['Month', 'P&L', 'Days', 'Trades', 'Win%'].map(h => (
              <div key={h} style={{ fontSize: 8, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', fontWeight: 700, textAlign: h === 'P&L' || h === 'Win%' ? 'right' : 'left' }}>
                {h}
              </div>
            ))}
          </div>

          {monthlyData.filter(m => m.trades > 0).reverse().map((m, i) => (
            <motion.div
              key={m.key}
              initial={{ opacity: 0, x: -8 }}
              animate={inV ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.38 + i * 0.035, duration: 0.28 }}
              style={{
                display: 'grid', gridTemplateColumns: '52px 1fr 48px 48px 54px',
                padding: '20px 0', gap: 16,
                borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontFamily: 'Barlow', alignSelf: 'center' }}>{m.label}</div>
              <div style={{ textAlign: 'right', fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 700, color: m.isPos ? G : R, alignSelf: 'center' }}>
                {m.pnl >= 0 ? '+' : ''}{fmtPnl(m.pnl)}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', alignSelf: 'center' }}>{m.days}d</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', alignSelf: 'center' }}>{m.trades}</div>
              <div style={{ textAlign: 'right', fontSize: 11, fontWeight: 600, color: m.winRate >= 50 ? G : R, alignSelf: 'center' }}>
                {m.winRate != null ? `${m.winRate}%` : '—'}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div style={{ background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 32px', minHeight: '60vh' }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ textAlign: 'center', maxWidth: 260 }}
      >
        <div style={{
          width: 56, height: 56, borderRadius: 14, marginBottom: 20, margin: '0 auto 20px',
          background: 'rgba(0,255,65,0.06)', border: '1px solid rgba(0,255,65,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={G} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
        </div>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 26, fontWeight: 900, color: '#fff', marginBottom: 10, letterSpacing: '-0.5px' }}>
          No trades yet
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', lineHeight: 1.65 }}>
          Head to the <span style={{ color: '#fff', fontWeight: 600 }}>Journal</span> tab and log your first trade — your stats will appear here.
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────
const SECTION_IDS = ['dash-overview', 'dash-winrate', 'dash-trades', 'dash-equity', 'dash-playbook', 'dash-monthly'];

export default function Dashboard({ trades, tradesLoading, accounts = [] }) {
  const today    = todayStr();
  const { selectedAccountId } = useAccountFilter();

  const filteredTrades = useMemo(() => {
    if (!selectedAccountId) return trades;
    return trades.filter(t => t.accountId === selectedAccountId || (!t.accountId && accounts.find(a => a.id === selectedAccountId)?.name === t.account));
  }, [trades, selectedAccountId, accounts]);

  const stats  = useMemo(() => calcDetailedStats(filteredTrades), [filteredTrades]);
  const curve  = useMemo(() => buildEquityCurve(filteredTrades), [filteredTrades]);

  const todayPnl = useMemo(() => filteredTrades.filter(t => t.date === today).reduce((s, t) => s + t.pnl, 0), [filteredTrades, today]);

  const weekPnl = useMemo(() => {
    const ago = new Date(Date.now() - 7 * 864e5).toISOString().split('T')[0];
    return filteredTrades.filter(t => t.date >= ago).reduce((s, t) => s + t.pnl, 0);
  }, [filteredTrades]);

  const violations = useMemo(() => {
    const alerts = [];
    const checkAccounts = selectedAccountId ? accounts.filter(a => a.id === selectedAccountId) : accounts;
    checkAccounts.forEach(account => {
      if (!account.dailyLossLimit && !account.maxDrawdown) return;
      const acctTrades = filteredTrades.filter(t => t.accountId === account.id || (!t.accountId && t.account === account.name));
      const dailyPnl   = acctTrades.filter(t => t.date === today).reduce((s, t) => s + t.pnl, 0);
      const totalPnl   = acctTrades.reduce((s, t) => s + t.pnl, 0);
      if (account.dailyLossLimit > 0) {
        const used = -Math.min(dailyPnl, 0);
        const pct  = used / account.dailyLossLimit;
        const rem  = account.dailyLossLimit - used;
        if (pct >= 0.9) alerts.push({ level: 'critical', msg: `🚨 ${account.name}: Near daily loss limit — $${rem.toFixed(0)} remaining. Stop trading.` });
        else if (pct >= 0.7) alerts.push({ level: 'warning',  msg: `⚠ ${account.name}: Approaching daily loss limit — $${rem.toFixed(0)} remaining` });
      }
      if (account.maxDrawdown > 0) {
        const used = Math.max(0, -totalPnl);
        const pct  = used / account.maxDrawdown;
        const rem  = account.maxDrawdown - used;
        if (pct >= 0.9) alerts.push({ level: 'critical', msg: `🚨 ${account.name}: Near max drawdown — $${rem.toFixed(0)} remaining. Stop trading.` });
        else if (pct >= 0.7) alerts.push({ level: 'warning',  msg: `⚠ ${account.name}: Approaching max drawdown — $${rem.toFixed(0)} remaining` });
      }
    });
    return alerts.sort((a, b) => (a.level === 'critical' ? -1 : 1) - (b.level === 'critical' ? -1 : 1));
  }, [accounts, filteredTrades, today, selectedAccountId]);

  const isEmpty     = filteredTrades.length === 0 && trades.length === 0;
  const todayTrades = filteredTrades.filter(t => t.date === today);

  const now      = new Date();
  const greeting = now.getHours() < 12 ? 'Pre-Market' : now.getHours() < 17 ? 'Market Hours' : 'Post-Market';

  return (
    <div style={{ background: BG, color: '#fff', fontFamily: "'Barlow', sans-serif" }}>

      {/* Sticky header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 150,
        background: 'rgba(8,12,8,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(0,255,65,0.08)',
      }}>
        <div style={{ padding: '9px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 17, fontWeight: 900, letterSpacing: '1px', color: G }}>
              TRADEASCEND
            </div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.8px' }}>
              {now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {greeting}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AccountSelector accounts={accounts} />
            {tradesLoading && <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)' }}>syncing…</span>}
            <div style={{
              fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
              border: `1px solid ${todayTrades.length >= 3 ? R : 'rgba(0,255,65,0.28)'}`,
              color: todayTrades.length >= 3 ? R : G,
              background: todayTrades.length >= 3 ? 'rgba(255,45,45,0.06)' : 'rgba(0,255,65,0.06)',
            }}>
              {todayTrades.length}/3 today
            </div>
          </div>
        </div>

        <AnimatePresence>
          {violations.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{
                padding: '14px 16px',
                background: violations[0].level === 'critical' ? 'rgba(255,45,45,0.12)' : 'rgba(240,165,0,0.1)',
                borderTop: `1px solid ${violations[0].level === 'critical' ? 'rgba(255,45,45,0.3)' : 'rgba(240,165,0,0.3)'}`,
                fontSize: 11, fontWeight: 600,
                color: violations[0].level === 'critical' ? R : GOLD,
              }}>
                {violations[0].msg}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {isEmpty ? (
        <EmptyState />
      ) : (
        <>
          <HeroSection stats={stats} todayPnl={todayPnl} weekPnl={weekPnl} sectionId={SECTION_IDS[0]} />
          <WinRateSection stats={stats} sectionId={SECTION_IDS[1]} />
          <RecentTradesSection trades={filteredTrades} sectionId={SECTION_IDS[2]} />
          {curve.length > 1 && <EquitySection curve={curve} stats={stats} sectionId={SECTION_IDS[3]} />}
          {Object.values(stats.bySetup).some(v => v.total > 0) && <PlaybookSection stats={stats} sectionId={SECTION_IDS[4]} />}
          <MonthlyPnLSection trades={filteredTrades} sectionId={SECTION_IDS[5]} />
        </>
      )}
    </div>
  );
}
