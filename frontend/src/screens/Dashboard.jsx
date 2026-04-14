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
const NAV_ITEMS = ['Overview', 'Win Rate', 'Trades', 'Equity', 'Playbook', 'Monthly'];

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
        maskImage: 'linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)',
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
        background: 'radial-gradient(ellipse at 50% 42%, #0f1f0f 0%, #080c08 68%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        paddingBottom: 80,
      }}
    >
      <ParticleCanvas />
      {/* Radial vignette over particles */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse at 50% 50%, transparent 25%, rgba(8,12,8,0.65) 75%)',
      }} />
      {/* Bottom section blend → BG2 */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 160,
        background: 'linear-gradient(to bottom, transparent 0%, #0d1a0d 100%)',
        pointerEvents: 'none', zIndex: 3,
      }} />

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
        minHeight: '100svh', position: 'relative', overflow: 'hidden',
        background: 'radial-gradient(ellipse at 50% 50%, #122012 0%, #0d1a0d 65%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '40px 28px 100px',
      }}
    >
      {/* Top blend from BG */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 140,
        background: 'linear-gradient(to bottom, #080c08 0%, transparent 100%)',
        pointerEvents: 'none', zIndex: 3,
      }} />
      {/* Bottom blend → BG3 */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 160,
        background: 'linear-gradient(to bottom, transparent 0%, #0a120a 100%)',
        pointerEvents: 'none', zIndex: 3,
      }} />
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
        minHeight: '100svh', position: 'relative', overflow: 'hidden',
        background: 'radial-gradient(ellipse at 50% 50%, #0f1a0f 0%, #0a120a 65%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '40px 0 100px',
      }}
    >
      {/* Top blend from BG2 */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 140,
        background: 'linear-gradient(to bottom, #0d1a0d 0%, transparent 100%)',
        pointerEvents: 'none', zIndex: 3,
      }} />
      {/* Bottom blend → BG */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 160,
        background: 'linear-gradient(to bottom, transparent 0%, #080c08 100%)',
        pointerEvents: 'none', zIndex: 3,
      }} />
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
        minHeight: '100svh', position: 'relative', overflow: 'hidden',
        background: 'radial-gradient(ellipse at 50% 55%, #0d1a0d 0%, #080c08 68%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '40px 0 100px',
      }}
    >
      {/* Top blend from BG3 */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 140,
        background: 'linear-gradient(to bottom, #0a120a 0%, transparent 100%)',
        pointerEvents: 'none', zIndex: 3,
      }} />
      {/* Bottom blend → BG2 */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 160,
        background: 'linear-gradient(to bottom, transparent 0%, #0d1a0d 100%)',
        pointerEvents: 'none', zIndex: 3,
      }} />
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
                <stop offset="0%"   stopColor={isPos ? G : R} stopOpacity={0.40} />
                <stop offset="30%"  stopColor={isPos ? G : R} stopOpacity={0.22} />
                <stop offset="75%"  stopColor={isPos ? G : R} stopOpacity={0.07} />
                <stop offset="100%" stopColor={isPos ? G : R} stopOpacity={0.01} />
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
        minHeight: '100svh', position: 'relative', overflow: 'hidden',
        background: 'radial-gradient(ellipse at 50% 50%, #122012 0%, #0d1a0d 65%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '40px 20px 100px',
      }}
    >
      {/* Top blend from BG2 (equity) */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 140,
        background: 'linear-gradient(to bottom, #0d1a0d 0%, transparent 100%)',
        pointerEvents: 'none', zIndex: 3,
      }} />
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
                background: 'linear-gradient(170deg, #161e16 0%, #0b140b 100%)',
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

// ── Section 6: Monthly P&L ────────────────────────────────────────────────
function MonthlyPnLSection({ trades, sectionId }) {
  const ref = useRef(null);
  const inV = useInView(ref, { once: true, amount: 0.2 });

  const monthlyData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      const mTrades = trades.filter(t => t.date.startsWith(key));
      const pnl = mTrades.reduce((s, t) => s + t.pnl, 0);
      const days = new Set(mTrades.map(t => t.date)).size;
      const wins = mTrades.filter(t => t.pnl > 0).length;
      const winRate = mTrades.length > 0 ? Math.round((wins / mTrades.length) * 100) : null;
      return { key, label, pnl, days, trades: mTrades.length, winRate, isPos: pnl >= 0 };
    });
  }, [trades]);

  const maxAbs = Math.max(...monthlyData.map(m => Math.abs(m.pnl)), 1);

  return (
    <section
      id={sectionId} ref={ref}
      style={{
        minHeight: '100svh', position: 'relative', overflow: 'hidden',
        background: 'radial-gradient(ellipse at 50% 50%, #0f1a0f 0%, #080c08 68%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '40px 20px 100px',
      }}
    >
      {/* Blends */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 140, background: 'linear-gradient(to bottom, #0d1a0d 0%, transparent 100%)', pointerEvents: 'none', zIndex: 3 }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 160, background: 'linear-gradient(to bottom, transparent 0%, #080c08 100%)', pointerEvents: 'none', zIndex: 3 }} />
      <GhostText style={{ top: '8%', left: '50%', transform: 'translateX(-50%)' }}>MONTHLY</GhostText>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={inV ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7 }}
        style={{ position: 'relative', zIndex: 1, marginBottom: 24 }}
      >
        <SectionLabel>Monthly P&L</SectionLabel>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 900, letterSpacing: '-1px', color: '#fff' }}>
          Last 12 Months
        </div>
      </motion.div>

      {/* Bar chart */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={inV ? { opacity: 1 } : {}}
        transition={{ delay: 0.2, duration: 0.8 }}
        style={{ position: 'relative', zIndex: 1, marginBottom: 28 }}
      >
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barCategoryGap="20%">
            <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9, fontFamily: 'Barlow' }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.08)" />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              contentStyle={{ background: '#111', border: '1px solid rgba(0,255,65,0.2)', borderRadius: 8, fontFamily: 'Barlow', fontSize: 12 }}
              labelStyle={{ color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}
              formatter={(v) => [fmtPnl(v), 'P&L']}
            />
            <Bar dataKey="pnl" radius={[3, 3, 0, 0]} isAnimationActive={inV} animationDuration={1200}>
              {monthlyData.map((m) => (
                <Cell key={m.key} fill={m.isPos ? G : R} opacity={m.trades === 0 ? 0.15 : 0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Summary table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inV ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.4, duration: 0.6 }}
        style={{ position: 'relative', zIndex: 1 }}
      >
        {/* Header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '56px 1fr 56px 52px 60px',
          padding: '6px 4px', borderBottom: '1px solid rgba(255,255,255,0.08)', gap: 4, marginBottom: 2,
        }}>
          {['Month', 'P&L', 'Days', 'Trades', 'Win%'].map(h => (
            <div key={h} style={{ fontSize: 9, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', fontWeight: 700, textAlign: h === 'P&L' || h === 'Win%' ? 'right' : 'left' }}>
              {h}
            </div>
          ))}
        </div>

        {/* Rows — show only months with trades */}
        {monthlyData.filter(m => m.trades > 0).reverse().map((m, i) => (
          <motion.div
            key={m.key}
            initial={{ opacity: 0, x: -10 }}
            animate={inV ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.5 + i * 0.04, duration: 0.3 }}
            style={{
              display: 'grid', gridTemplateColumns: '56px 1fr 56px 52px 60px',
              padding: '9px 4px', gap: 4,
              borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontFamily: 'Barlow', alignSelf: 'center' }}>{m.label}</div>
            <div style={{ textAlign: 'right', fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, fontWeight: 700, color: m.isPos ? G : R, alignSelf: 'center' }}>
              {m.pnl >= 0 ? '+' : ''}{fmtPnl(m.pnl)}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', alignSelf: 'center' }}>{m.days}d</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', alignSelf: 'center' }}>{m.trades}</div>
            <div style={{ textAlign: 'right', fontSize: 12, fontWeight: 600, color: m.winRate >= 50 ? G : R, alignSelf: 'center' }}>
              {m.winRate != null ? `${m.winRate}%` : '—'}
            </div>
          </motion.div>
        ))}
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
const SECTION_IDS = ['dash-overview', 'dash-winrate', 'dash-trades', 'dash-equity', 'dash-playbook', 'dash-monthly'];

export default function Dashboard({ trades, tradesLoading, accounts = [] }) {
  const today    = todayStr();
  const { selectedAccountId } = useAccountFilter();

  // Filter trades by selected account
  const filteredTrades = useMemo(() => {
    if (!selectedAccountId) return trades;
    return trades.filter(t => t.accountId === selectedAccountId || (!t.accountId && accounts.find(a => a.id === selectedAccountId)?.name === t.account));
  }, [trades, selectedAccountId, accounts]);

  const stats    = useMemo(() => calcDetailedStats(filteredTrades), [filteredTrades]);
  const curve    = useMemo(() => buildEquityCurve(filteredTrades), [filteredTrades]);

  const todayPnl = useMemo(() => filteredTrades.filter(t => t.date === today).reduce((s, t) => s + t.pnl, 0), [filteredTrades, today]);

  const weekPnl = useMemo(() => {
    const ago = new Date(Date.now() - 7 * 864e5).toISOString().split('T')[0];
    return filteredTrades.filter(t => t.date >= ago).reduce((s, t) => s + t.pnl, 0);
  }, [filteredTrades]);

  // Violation alerts across all accounts (or selected account only)
  const violations = useMemo(() => {
    const alerts = [];
    const checkAccounts = selectedAccountId
      ? accounts.filter(a => a.id === selectedAccountId)
      : accounts;
    checkAccounts.forEach(account => {
      if (!account.dailyLossLimit && !account.maxDrawdown) return;
      const acctTrades = filteredTrades.filter(t => t.accountId === account.id || (!t.accountId && t.account === account.name));
      const dailyPnl = acctTrades.filter(t => t.date === today).reduce((s, t) => s + t.pnl, 0);
      const totalPnl = acctTrades.reduce((s, t) => s + t.pnl, 0);
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

  const isEmpty = filteredTrades.length === 0 && trades.length === 0;
  const todayTrades = filteredTrades.filter(t => t.date === today);

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
  }, [filteredTrades]);

  const now      = new Date();
  const greeting = now.getHours() < 12 ? 'Pre-Market' : now.getHours() < 17 ? 'Market Hours' : 'Post-Market';

  return (
    <div style={{ background: BG, color: '#fff', position: 'relative', fontFamily: "'Barlow', sans-serif" }}>

      {/* Floating header — minimal, non-intrusive */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 150,
        background: 'rgba(8,12,8,0.88)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(0,255,65,0.08)',
      }}>
        <div style={{ padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 900, letterSpacing: '1px', color: G }}>
              TRADEASCEND
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '1px' }}>
              {now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {greeting}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AccountSelector accounts={accounts} />
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

        {/* Violation alert banner */}
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
                padding: '8px 20px',
                background: violations[0].level === 'critical' ? 'rgba(255,45,45,0.12)' : 'rgba(240,165,0,0.1)',
                borderTop: `1px solid ${violations[0].level === 'critical' ? 'rgba(255,45,45,0.3)' : 'rgba(240,165,0,0.3)'}`,
                fontSize: 12, fontWeight: 600,
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
          <SectionDots active={activeSection} sectionIds={SECTION_IDS} />

          <div style={{ paddingTop: violations.length > 0 ? 80 : 44 }}>
            <HeroSection
              stats={stats} todayPnl={todayPnl} weekPnl={weekPnl}
              sectionId={SECTION_IDS[0]}
            />
            <WinRateSection
              stats={stats}
              sectionId={SECTION_IDS[1]}
            />
            <RecentTradesSection
              trades={filteredTrades}
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
            <MonthlyPnLSection
              trades={filteredTrades}
              sectionId={SECTION_IDS[5]}
            />
          </div>
        </>
      )}
    </div>
  );
}
