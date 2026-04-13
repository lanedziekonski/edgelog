import React, { useMemo, useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { calcDetailedStats, buildEquityCurve, fmtPnl, todayStr } from '../hooks/useTrades';

// ── Design tokens ─────────────────────────────────────────────────────────
const G    = '#00ff41';
const R    = '#ff2d2d';
const BG   = '#080c08';
const BG2  = '#0d1a0d';
const BG3  = '#0a120a';

const ghost = (text, extra = {}) => ({
  content: text,
  position: 'absolute',
  fontFamily: "'Barlow Condensed', sans-serif",
  fontWeight: 900,
  fontSize: 'clamp(72px, 22vw, 150px)',
  color: 'rgba(0,255,65,0.07)',
  letterSpacing: '-2px',
  textTransform: 'uppercase',
  userSelect: 'none',
  pointerEvents: 'none',
  lineHeight: 1,
  whiteSpace: 'nowrap',
  zIndex: 0,
  ...extra,
});

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
    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    const W = canvas.width, H = canvas.height;
    const pts = Array.from({ length: 55 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.18, vy: (Math.random() - 0.5) * 0.18,
      r: Math.random() * 1.4 + 0.4,
      o: Math.random() * 0.25 + 0.08,
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
  return (
    <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />
  );
}

// ── Section dot nav ───────────────────────────────────────────────────────
const NAV_ITEMS = ['Overview', 'Win Rate', 'Trades', 'Equity', 'Playbook'];

function SectionDots({ active, sectionIds }) {
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };
  return (
    <div style={{
      position: 'fixed', right: 14, top: '50%', transform: 'translateY(-50%)',
      display: 'flex', flexDirection: 'column', gap: 10, zIndex: 200,
    }}>
      {NAV_ITEMS.map((label, i) => (
        <button
          key={label}
          title={label}
          onClick={() => scrollTo(sectionIds[i])}
          style={{
            width: active === i ? 8 : 4,
            height: active === i ? 8 : 4,
            borderRadius: '50%',
            background: active === i ? G : 'rgba(255,255,255,0.18)',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: active === i ? `0 0 10px ${G}` : 'none',
          }}
        />
      ))}
    </div>
  );
}

// ── Small helper components ───────────────────────────────────────────────
function GhostText({ children, style }) {
  return (
    <motion.div
      animate={{ opacity: [0.06, 0.13, 0.06] }}
      transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
      style={{
        position: 'absolute',
        fontFamily: "'Barlow Condensed', sans-serif",
        fontWeight: 900,
        fontSize: 'clamp(72px, 22vw, 150px)',
        color: G,
        opacity: 0.07,
        letterSpacing: '-2px',
        textTransform: 'uppercase',
        userSelect: 'none',
        pointerEvents: 'none',
        lineHeight: 1,
        whiteSpace: 'nowrap',
        zIndex: 0,
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 10, letterSpacing: '4px', textTransform: 'uppercase',
      color: `rgba(0,255,65,0.7)`, fontWeight: 700, marginBottom: 10,
    }}>
      {children}
    </div>
  );
}

function StatPill({ label, value, color }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 3 }}>{label}</div>
      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 700, color: color || '#fff', lineHeight: 1 }}>{value}</div>
    </div>
  );
}

function StatBlock({ label, value, color, size = 36 }) {
  return (
    <div>
      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: size, fontWeight: 900, lineHeight: 1, color: color || '#fff', marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '2px', textTransform: 'uppercase' }}>{label}</div>
    </div>
  );
}

// ── Section 1: Hero ───────────────────────────────────────────────────────
function HeroSection({ stats, todayPnl, weekPnl, sectionId }) {
  const ref  = useRef(null);
  const inV  = useInView(ref, { once: true, amount: 0.4 });
  const isPos = stats.totalPnl >= 0;

  const absTotal = useTicker(Math.abs(stats.totalPnl), inV, 1600);
  const absToday = useTicker(Math.abs(todayPnl), inV, 1200);
  const absWeek  = useTicker(Math.abs(weekPnl), inV, 1200);

  return (
    <section
      id={sectionId} ref={ref}
      style={{
        minHeight: '100svh', position: 'relative', overflow: 'hidden',
        background: BG, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        paddingBottom: 80,
      }}
    >
      <ParticleCanvas />

      {/* Ghost layer: slightly offset number behind */}
      <GhostText style={{ top: '22%', left: '50%', transform: 'translateX(-50%)', fontSize: 'clamp(60px, 18vw, 130px)', opacity: 0.04 }}>
        {isPos ? '+' : '-'}${fmt$(stats.totalPnl, 0)}
      </GhostText>
      <GhostText style={{ top: '14%', left: '4%', fontSize: 'clamp(60px, 16vw, 120px)' }}>
        {isPos ? 'PROFIT' : 'LOSS'}
      </GhostText>

      {/* Main P&L */}
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={inV ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        style={{ textAlign: 'center', position: 'relative', zIndex: 1, padding: '0 24px', maxWidth: 520 }}
      >
        <SectionLabel>Total Profit</SectionLabel>

        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 'clamp(68px, 20vw, 96px)',
          fontWeight: 900, lineHeight: 1, letterSpacing: '-2px',
          color: isPos ? G : R,
          textShadow: `0 0 60px ${isPos ? 'rgba(0,255,65,0.25)' : 'rgba(255,45,45,0.25)'}`,
        }}>
          {isPos ? '+' : '-'}${fmt$(absTotal)}
        </div>

        {/* Divider */}
        <div style={{ width: 40, height: 1, background: `rgba(0,255,65,0.3)`, margin: '24px auto' }} />

        {/* Secondary stats */}
        <div style={{ display: 'flex', gap: 32, justifyContent: 'center', flexWrap: 'wrap' }}>
          <StatPill
            label="Today"
            value={`${todayPnl >= 0 ? '+' : '-'}$${fmt$(absToday)}`}
            color={todayPnl >= 0 ? G : R}
          />
          <StatPill
            label="This Week"
            value={`${weekPnl >= 0 ? '+' : '-'}$${fmt$(absWeek)}`}
            color={weekPnl >= 0 ? G : R}
          />
          <StatPill
            label="Streak"
            value={stats.streak > 0 ? `${stats.streak}${stats.streakType === 'win' ? 'W' : 'L'}` : '—'}
            color={stats.streakType === 'win' ? G : stats.streakType === 'loss' ? R : 'rgba(255,255,255,0.4)'}
          />
        </div>
      </motion.div>

      {/* Scroll arrow */}
      <motion.div
        animate={{ y: [0, 7, 0] }}
        transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
        style={{ position: 'absolute', bottom: 96, left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.2)', fontSize: 18, zIndex: 1 }}
      >
        ↓
      </motion.div>
    </section>
  );
}

// ── Section 2: Win Rate ───────────────────────────────────────────────────
function WinRateSection({ stats, sectionId }) {
  const ref = useRef(null);
  const inV = useInView(ref, { once: true, amount: 0.35 });

  const wrVal    = useTicker(stats.winRate, inV, 1300);
  const totVal   = useTicker(stats.totalTrades, inV, 1000);
  const avgRR    = stats.avgLoss !== 0 ? stats.avgWin / Math.abs(stats.avgLoss) : 0;
  const rrVal    = useTicker(avgRR, inV, 1100);
  const pfVal    = useTicker(Math.min(stats.profitFactor, 20), inV, 1100);

  return (
    <section
      id={sectionId} ref={ref}
      style={{
        minHeight: '100svh', background: BG2, position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '40px 28px 100px',
      }}
    >
      <GhostText style={{ top: '-2%', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'pre', textAlign: 'center', lineHeight: 0.9 }}>{"WIN\nRATE"}</GhostText>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={inV ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: 'relative', zIndex: 1, maxWidth: 480 }}
      >
        <SectionLabel>Win Rate</SectionLabel>

        {/* Big win rate */}
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 'clamp(80px, 24vw, 130px)',
          fontWeight: 900, lineHeight: 1, letterSpacing: '-3px', color: '#fff',
          marginBottom: 24,
        }}>
          {Math.round(wrVal)}<span style={{ fontSize: '40%', opacity: 0.6 }}>%</span>
        </div>

        {/* Progress bar */}
        <div style={{ height: 2, background: 'rgba(255,255,255,0.07)', borderRadius: 1, marginBottom: 36, overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={inV ? { width: `${Math.min(stats.winRate, 100)}%` } : { width: 0 }}
            transition={{ duration: 1.4, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{ height: '100%', background: G, boxShadow: `0 0 10px ${G}` }}
          />
        </div>

        {/* Accent line + stat block */}
        <div>
          <div style={{ display: 'flex', gap: 3, marginBottom: 20 }}>
            <div style={{ width: 28, height: 2, background: G }} />
            <div style={{ width: 8, height: 2, background: `rgba(0,255,65,0.3)` }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            <StatBlock label="Win Rate"     value={`${Math.round(wrVal)}%`} />
            <StatBlock label="Total Trades" value={Math.round(totVal)} />
            <StatBlock
              label="Avg R:R"
              value={stats.avgLoss !== 0 ? `${rrVal.toFixed(1)}R` : '∞'}
              color={avgRR >= 1 ? G : R}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginTop: 20 }}>
            <StatBlock label="Avg Win"  value={`$${fmt$(stats.avgWin, 0)}`}           color={G} size={28} />
            <StatBlock label="Avg Loss" value={`$${fmt$(Math.abs(stats.avgLoss), 0)}`} color={R} size={28} />
            <StatBlock
              label="P. Factor"
              value={stats.profitFactor >= 999 ? '∞' : pfVal.toFixed(1)}
              color={stats.profitFactor >= 1 ? G : R}
              size={28}
            />
          </div>
        </div>
      </motion.div>
    </section>
  );
}

// ── Section 3: Recent Trades ──────────────────────────────────────────────
function RecentTradesSection({ trades, sectionId }) {
  const ref   = useRef(null);
  const inV   = useInView(ref, { once: true, amount: 0.2 });
  const recent = [...trades].sort((a, b) => b.date.localeCompare(a.date) || (b.id > a.id ? 1 : -1)).slice(0, 10);

  const rowVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i) => ({ opacity: 1, x: 0, transition: { delay: i * 0.07, duration: 0.4, ease: 'easeOut' } }),
  };

  return (
    <section
      id={sectionId} ref={ref}
      style={{
        minHeight: '100svh', background: BG3, position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '40px 0 100px',
      }}
    >
      <GhostText style={{ top: '5%', left: '4%' }}>TRADES</GhostText>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={inV ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7 }}
        style={{ position: 'relative', zIndex: 1, padding: '0 20px' }}
      >
        <SectionLabel>Recent Trades</SectionLabel>
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 900, letterSpacing: '-1px',
          color: '#fff', marginBottom: 24,
        }}>
          Last {recent.length} Trades
        </div>
      </motion.div>

      {/* Table */}
      <div style={{ position: 'relative', zIndex: 1, overflowX: 'auto' }}>
        {/* Header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '80px 64px 1fr 80px 76px',
          padding: '6px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          gap: 8,
        }}>
          {['Date', 'Symbol', 'Setup', 'Account', 'P&L'].map(h => (
            <div key={h} style={{ fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>
              {h}
            </div>
          ))}
        </div>

        {/* Rows */}
        {recent.map((t, i) => (
          <motion.div
            key={t.id}
            custom={i}
            initial="hidden"
            animate={inV ? 'visible' : 'hidden'}
            variants={rowVariants}
            whileHover={{ backgroundColor: 'rgba(0,255,65,0.04)', x: 2 }}
            style={{
              display: 'grid', gridTemplateColumns: '80px 64px 1fr 80px 76px',
              padding: '11px 20px', gap: 8,
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              cursor: 'default', transition: 'background 0.15s',
            }}
          >
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', alignSelf: 'center' }}>
              {t.date.slice(5)}
            </div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 700, color: '#fff', alignSelf: 'center' }}>
              {t.symbol}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', alignSelf: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {t.setup}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', alignSelf: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {t.account || '—'}
            </div>
            <div style={{ textAlign: 'right', alignSelf: 'center' }}>
              <span style={{
                fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, fontWeight: 700,
                color: t.pnl >= 0 ? G : R,
                textShadow: t.pnl >= 0 ? `0 0 12px rgba(0,255,65,0.5)` : `0 0 12px rgba(255,45,45,0.4)`,
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
        transition={{ delay: 0.6, duration: 0.6 }}
        style={{ position: 'relative', zIndex: 1, padding: '20px 20px 0', display: 'flex', gap: 3, flexWrap: 'wrap' }}
      >
        {(() => {
          const byDate = {};
          trades.forEach(t => { byDate[t.date] = (byDate[t.date] || 0) + t.pnl; });
          return Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b)).map(([date, pnl]) => (
            <div key={date} title={`${date}: ${fmtPnl(pnl)}`} style={{
              width: 8, height: 8, borderRadius: 2,
              background: pnl > 0 ? G : R, opacity: 0.55,
              boxShadow: pnl > 0 ? `0 0 4px rgba(0,255,65,0.4)` : `0 0 4px rgba(255,45,45,0.3)`,
            }} />
          ));
        })()}
      </motion.div>
    </section>
  );
}

// ── Section 4: Equity Curve ───────────────────────────────────────────────
function EquitySection({ curve, stats, sectionId }) {
  const ref  = useRef(null);
  const inV  = useInView(ref, { once: true, amount: 0.3 });
  const isPos = stats.totalPnl >= 0;

  const bestVal  = useTicker(Math.abs(stats.bestDay), inV, 1200);
  const worstVal = useTicker(Math.abs(stats.worstDay), inV, 1200);

  return (
    <section
      id={sectionId} ref={ref}
      style={{
        minHeight: '100svh', background: BG, position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '40px 0 100px',
      }}
    >
      <GhostText style={{ bottom: '10%', right: '4%' }}>EQUITY</GhostText>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={inV ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7 }}
        style={{ position: 'relative', zIndex: 1, padding: '0 20px 20px' }}
      >
        <SectionLabel>Equity Curve</SectionLabel>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 900, letterSpacing: '-1px', color: '#fff',
          }}>
            {curve.length} Trading Days
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow' }}>
            Net {fmtPnl(stats.totalPnl)}
          </div>
        </div>
      </motion.div>

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={inV ? { opacity: 1 } : {}}
        transition={{ delay: 0.2, duration: 0.8 }}
        style={{
          position: 'relative', zIndex: 1, flex: 1,
          filter: `drop-shadow(0 0 10px rgba(0,255,65,0.25))`,
          minHeight: 200,
        }}
      >
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={curve} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={isPos ? G : R} stopOpacity={0.25} />
                <stop offset="100%" stopColor={isPos ? G : R} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              tick={{ fill: '#333', fontSize: 9, fontFamily: 'Barlow' }}
              axisLine={false} tickLine={false} interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: '#333', fontSize: 9, fontFamily: 'Barlow' }}
              axisLine={false} tickLine={false} width={46}
              tickFormatter={v => `${v < 0 ? '-' : ''}$${Math.abs(v) >= 1000 ? `${(Math.abs(v) / 1000).toFixed(1)}k` : Math.abs(v)}`}
            />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
            <Tooltip
              contentStyle={{ background: '#111', border: `1px solid rgba(0,255,65,0.2)`, borderRadius: 8, fontFamily: 'Barlow', fontSize: 12 }}
              labelStyle={{ color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}
              formatter={(v) => [fmtPnl(v), 'Equity']}
            />
            <Area
              type="monotone" dataKey="value"
              stroke={isPos ? G : R} strokeWidth={2}
              fill="url(#eqGrad)" dot={false}
              activeDot={{ r: 4, fill: isPos ? G : R, strokeWidth: 0 }}
              isAnimationActive={inV}
              animationDuration={2200}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Bottom stat block */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inV ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.5, duration: 0.7 }}
        style={{ position: 'relative', zIndex: 1, padding: '24px 20px 0' }}
      >
        <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
          <div style={{ width: 24, height: 2, background: G }} />
          <div style={{ width: 8, height: 2, background: 'rgba(0,255,65,0.3)' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          <StatBlock
            label="Best Day"
            value={`${stats.bestDay >= 0 ? '+' : '-'}$${fmt$(bestVal, 0)}`}
            color={G} size={26}
          />
          <StatBlock
            label="Worst Day"
            value={`-$${fmt$(worstVal, 0)}`}
            color={R} size={26}
          />
          <StatBlock
            label="Streak"
            value={stats.streak > 0 ? `${stats.streak}${stats.streakType === 'win' ? 'W' : 'L'}` : '—'}
            color={stats.streakType === 'win' ? G : stats.streakType === 'loss' ? R : '#fff'}
            size={26}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 16 }}>
          <StatBlock label="Green Days"  value={stats.winDays}   color={G}   size={24} />
          <StatBlock label="Red Days"    value={stats.lossDays}  color={R}   size={24} />
          <StatBlock
            label="Day Win%"
            value={stats.tradingDays > 0 ? `${Math.round(stats.winDays / stats.tradingDays * 100)}%` : '—'}
            color={stats.tradingDays > 0 && stats.winDays / stats.tradingDays >= 0.5 ? G : R}
            size={24}
          />
        </div>
      </motion.div>
    </section>
  );
}

// ── Section 5: Playbook ───────────────────────────────────────────────────
function PlaybookSection({ stats, sectionId }) {
  const ref     = useRef(null);
  const inV     = useInView(ref, { once: true, amount: 0.25 });
  const setups  = Object.entries(stats.bySetup).filter(([, v]) => v.total > 0).sort(([, a], [, b]) => b.pnl - a.pnl);
  const maxAbs  = Math.max(...setups.map(([, v]) => Math.abs(v.pnl)), 1);

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i) => ({ opacity: 1, y: 0, transition: { delay: 0.1 + i * 0.1, duration: 0.5, ease: 'easeOut' } }),
  };

  return (
    <section
      id={sectionId} ref={ref}
      style={{
        minHeight: '100svh', background: BG2, position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '40px 20px 100px',
      }}
    >
      <GhostText style={{ top: '5%', left: '50%', transform: 'translateX(-50%)', fontSize: 'clamp(56px, 18vw, 120px)' }}>PLAYBOOK</GhostText>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={inV ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7 }}
        style={{ position: 'relative', zIndex: 1, marginBottom: 28 }}
      >
        <SectionLabel>Setup Performance</SectionLabel>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 900, letterSpacing: '-1px', color: '#fff',
          }}>
            Your Playbook
          </div>
          {stats.bestSetup && (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textAlign: 'right' }}>
              Best: <span style={{ color: G, fontWeight: 700 }}>{stats.bestSetup.name}</span>
            </div>
          )}
        </div>
      </motion.div>

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {setups.length === 0 ? (
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>No setup data yet.</div>
        ) : setups.map(([name, v], i) => {
          const isPos  = v.pnl >= 0;
          const barPct = Math.round((Math.abs(v.pnl) / maxAbs) * 100);
          return (
            <motion.div
              key={name}
              custom={i}
              initial="hidden"
              animate={inV ? 'visible' : 'hidden'}
              variants={cardVariants}
              whileHover={{ scale: 1.01, borderColor: `rgba(0,255,65,0.35)` }}
              style={{
                background: '#111811',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 12,
                padding: '16px 18px',
                cursor: 'default',
                transition: 'border-color 0.2s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '0.3px' }}>
                    {name}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                    {v.total} trade{v.total !== 1 ? 's' : ''} · {Math.round(v.winRate)}% win rate
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 700,
                    color: isPos ? G : R,
                    textShadow: isPos ? `0 0 12px rgba(0,255,65,0.4)` : `0 0 12px rgba(255,45,45,0.3)`,
                  }}>
                    {fmtPnl(v.pnl)}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
                    {v.wins}W / {v.total - v.wins}L
                  </div>
                </div>
              </div>
              {/* Progress bar */}
              <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 1, overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={inV ? { width: `${barPct}%` } : { width: 0 }}
                  transition={{ duration: 1, delay: 0.2 + i * 0.1, ease: 'easeOut' }}
                  style={{ height: '100%', background: isPos ? G : R, opacity: 0.8 }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Rule score */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={inV ? { opacity: 1 } : {}}
        transition={{ delay: 0.7, duration: 0.6 }}
        style={{ position: 'relative', zIndex: 1, marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: '3px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>
              Rule Adherence
            </div>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif", fontSize: 36, fontWeight: 900,
              color: stats.ruleScore >= 80 ? G : stats.ruleScore >= 60 ? '#f0a500' : R,
            }}>
              {Math.round(stats.ruleScore)}%
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>
              Discipline
            </div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 36, fontWeight: 900, color: '#fff' }}>
              {stats.tradingDays > 0 ? `${Math.round(stats.winDays / stats.tradingDays * 100)}%` : '—'}
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div style={{ minHeight: '100svh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 32px' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        style={{ textAlign: 'center', maxWidth: 280 }}
      >
        <div style={{
          width: 64, height: 64, borderRadius: 16, marginBottom: 24, margin: '0 auto 24px',
          background: 'rgba(0,255,65,0.06)', border: '1px solid rgba(0,255,65,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={G} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
        </div>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 12, letterSpacing: '-0.5px' }}>
          No trades yet
        </div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>
          Head to the <span style={{ color: '#fff', fontWeight: 600 }}>Journal</span> tab and log your first trade — your stats will appear here.
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────
const SECTION_IDS = ['dash-overview', 'dash-winrate', 'dash-trades', 'dash-equity', 'dash-playbook'];

export default function Dashboard({ trades, tradesLoading }) {
  const today    = todayStr();
  const stats    = useMemo(() => calcDetailedStats(trades), [trades]);
  const curve    = useMemo(() => buildEquityCurve(trades), [trades]);

  const todayPnl = useMemo(() => trades.filter(t => t.date === today).reduce((s, t) => s + t.pnl, 0), [trades, today]);

  const weekPnl = useMemo(() => {
    const ago = new Date(Date.now() - 7 * 864e5).toISOString().split('T')[0];
    return trades.filter(t => t.date >= ago).reduce((s, t) => s + t.pnl, 0);
  }, [trades]);

  // Active section for dot nav
  const [activeSection, setActiveSection] = useState(0);
  useEffect(() => {
    const observers = SECTION_IDS.map((id, i) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(i); },
        { threshold: 0.4 }
      );
      obs.observe(el);
      return obs;
    });
    return () => observers.forEach(o => o?.disconnect());
  }, [trades]);

  const isEmpty = trades.length === 0;

  const now      = new Date();
  const greeting = now.getHours() < 12 ? 'Pre-Market' : now.getHours() < 17 ? 'Market Hours' : 'Post-Market';
  const todayTrades = trades.filter(t => t.date === today);

  return (
    <div style={{ background: BG, color: '#fff', position: 'relative', fontFamily: "'Barlow', sans-serif" }}>

      {/* Floating header — minimal, non-intrusive */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 150,
        background: 'rgba(8,12,8,0.85)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(0,255,65,0.08)',
        padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 900, letterSpacing: '1px', color: G }}>
            EDGELOG
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '1px' }}>
            {now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {greeting}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {tradesLoading && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>syncing…</span>}
          <div style={{
            fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
            border: `1px solid ${todayTrades.length >= 3 ? R : 'rgba(0,255,65,0.3)'}`,
            color: todayTrades.length >= 3 ? R : G,
            background: todayTrades.length >= 3 ? 'rgba(255,45,45,0.06)' : 'rgba(0,255,65,0.06)',
          }}>
            {todayTrades.length}/3 today
          </div>
        </div>
      </div>

      {isEmpty ? (
        <EmptyState />
      ) : (
        <>
          <SectionDots active={activeSection} sectionIds={SECTION_IDS} />

          <div style={{ paddingTop: 44 }}>
            <HeroSection
              stats={stats} todayPnl={todayPnl} weekPnl={weekPnl}
              sectionId={SECTION_IDS[0]}
            />
            <WinRateSection
              stats={stats}
              sectionId={SECTION_IDS[1]}
            />
            <RecentTradesSection
              trades={trades}
              sectionId={SECTION_IDS[2]}
            />
            {curve.length > 1 && (
              <EquitySection
                curve={curve} stats={stats}
                sectionId={SECTION_IDS[3]}
              />
            )}
            {Object.values(stats.bySetup).some(v => v.total > 0) && (
              <PlaybookSection
                stats={stats}
                sectionId={SECTION_IDS[4]}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
