import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const CANDLE_COUNT = 70;
const VIEW_WIDTH = 1000;
const VIEW_HEIGHT = 400;
const TICK_MS = 850;

function makeCandle(prevClose) {
  const bigMove = Math.random() < 0.1;
  const volatility = bigMove ? 24 : 9;
  const drift = (50 - prevClose) * 0.012;
  const direction = Math.random() < 0.5 ? -1 : 1;
  const open = prevClose;
  const close = Math.max(
    5,
    Math.min(95, open + direction * Math.random() * volatility + drift),
  );
  const wickExtra = volatility * (0.45 + Math.random() * 0.9);
  const high = Math.max(open, close) + Math.random() * wickExtra;
  const low = Math.min(open, close) - Math.random() * wickExtra;
  return { open, high, low, close };
}

function buildInitialCandles() {
  const arr = [];
  let prev = 50;
  for (let i = 0; i <= CANDLE_COUNT; i++) {
    const c = makeCandle(prev);
    arr.push(c);
    prev = c.close;
  }
  return arr;
}

function priceToY(p) {
  const padTop = VIEW_HEIGHT * 0.05;
  const usable = VIEW_HEIGHT * 0.9;
  return padTop + (1 - p / 100) * usable;
}

/**
 * Live candlestick ticker — simulated random walk, smooth scroll.
 * React state updates only on each new candle (~900ms).
 * RAF loop just mutates the group transform for sub-tick smoothness.
 */
function CandlestickChart() {
  const [candles, setCandles] = useState(buildInitialCandles);
  const groupRef = useRef(null);
  const lastTickRef = useRef(performance.now());
  const cw = VIEW_WIDTH / CANDLE_COUNT;

  useEffect(() => {
    let rafId;
    const loop = (now) => {
      const elapsed = now - lastTickRef.current;
      const progress = Math.min(1, elapsed / TICK_MS);
      if (groupRef.current) {
        groupRef.current.setAttribute(
          'transform',
          `translate(${-progress * cw}, 0)`,
        );
      }
      if (elapsed >= TICK_MS) {
        lastTickRef.current = now;
        setCandles((prev) => {
          const last = prev[prev.length - 1];
          return [...prev.slice(1), makeCandle(last.close)];
        });
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [cw]);

  return (
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      preserveAspectRatio="none"
      className="absolute inset-0 w-full h-full"
    >
      <g ref={groupRef}>
        {candles.map((c, i) => {
          const x = i * cw + cw / 2;
          const bull = c.close >= c.open;
          const color = bull ? '#00ff41' : '#ff2d55';
          const yH = priceToY(c.high);
          const yL = priceToY(c.low);
          const yO = priceToY(c.open);
          const yC = priceToY(c.close);
          const bTop = Math.min(yO, yC);
          const bH = Math.max(1.2, Math.abs(yC - yO));
          return (
            <g key={i}>
              <line
                x1={x}
                x2={x}
                y1={yH}
                y2={yL}
                stroke={color}
                strokeWidth={0.7}
                opacity={0.7}
              />
              <rect
                x={x - cw * 0.32}
                y={bTop}
                width={cw * 0.64}
                height={bH}
                fill={color}
              />
            </g>
          );
        })}
      </g>
    </svg>
  );
}

/**
 * Faint black-dominant background with a live candlestick ticker.
 * Supporting layers (edge glow, orbs, grid, scanline) are intentionally subtle.
 */
export default function AnimatedBackground({ fixed = false, variant = 'marketing' }) {
  const positionClass = fixed ? 'fixed' : 'absolute';
  const isDashboard = variant === 'dashboard';
  const candleOpacity = isDashboard ? 0.16 : 0.22;

  return (
    <div
      aria-hidden
      className={`${positionClass} inset-0 overflow-hidden pointer-events-none z-0 hidden md:block`}
    >
      <div className="absolute inset-0 bg-black" />

      <motion.div
        animate={{ opacity: [0.25, 0.45, 0.25] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 10% 0%, rgba(0,255,65,0.06) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 90% 100%, rgba(0,204,52,0.05) 0%, transparent 60%)',
        }}
      />

      <motion.div
        animate={{ x: [0, 100, -40, 0], y: [0, -60, 50, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-[10%] -left-[10%] w-[480px] h-[480px] rounded-full blur-[120px] opacity-[0.08]"
        style={{ background: 'radial-gradient(circle, rgba(0,255,65,1) 0%, transparent 70%)' }}
      />
      <motion.div
        animate={{ x: [0, -120, 60, 0], y: [0, 80, -30, 0] }}
        transition={{ duration: 36, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -bottom-[10%] -right-[10%] w-[560px] h-[560px] rounded-full blur-[140px] opacity-[0.07]"
        style={{ background: 'radial-gradient(circle, rgba(0,204,52,1) 0%, transparent 70%)' }}
      />

      <div
        className="absolute inset-0"
        style={{
          opacity: candleOpacity,
          maskImage:
            'radial-gradient(ellipse 95% 85% at 50% 50%, black 40%, transparent 95%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 95% 85% at 50% 50%, black 40%, transparent 95%)',
        }}
      >
        <CandlestickChart />
      </div>

      <motion.div
        animate={{ backgroundPosition: ['0px 0px', '60px 60px'] }}
        transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,255,65,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,65,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          maskImage:
            'radial-gradient(ellipse 70% 60% at 50% 50%, black 20%, transparent 85%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 70% 60% at 50% 50%, black 20%, transparent 85%)',
        }}
      />

      <motion.div
        initial={{ top: '-2%', opacity: 0 }}
        animate={{ top: ['-2%', '102%', '102%'], opacity: [0, 0.28, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'linear', times: [0, 0.9, 1] }}
        className="absolute inset-x-0 h-[1.5px]"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(0,255,65,0.6) 50%, transparent 100%)',
          boxShadow: '0 0 12px rgba(0,255,65,0.4), 0 0 28px rgba(0,255,65,0.2)',
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background: isDashboard
            ? 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 78%)'
            : 'radial-gradient(ellipse 55% 45% at 50% 50%, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0) 72%)',
        }}
      />
    </div>
  );
}
