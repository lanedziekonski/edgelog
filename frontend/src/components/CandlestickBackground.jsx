import { useEffect, useRef, useState } from 'react';

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
  const close = Math.max(5, Math.min(95, open + direction * Math.random() * volatility + drift));
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
        groupRef.current.setAttribute('transform', `translate(${-progress * cw}, 0)`);
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
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
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
              <line x1={x} x2={x} y1={yH} y2={yL} stroke={color} strokeWidth={0.7} opacity={0.7} />
              <rect x={x - cw * 0.32} y={bTop} width={cw * 0.64} height={bH} fill={color} />
            </g>
          );
        })}
      </g>
    </svg>
  );
}

export default function CandlestickBackground() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >

      {/* Semi-transparent dark base so content is readable */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,12,8,0.85)' }} />

      {/* Ambient green orbs */}
      <div style={{
        position: 'absolute',
        top: '-10%', left: '-10%',
        width: 480, height: 480,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,255,65,1) 0%, transparent 70%)',
        filter: 'blur(120px)',
        opacity: 0.08,
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-10%', right: '-10%',
        width: 560, height: 560,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,204,52,1) 0%, transparent 70%)',
        filter: 'blur(140px)',
        opacity: 0.07,
      }} />

      {/* Candlestick chart */}
      <div style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.22,
        maskImage: 'radial-gradient(ellipse 95% 85% at 50% 50%, black 40%, transparent 95%)',
        WebkitMaskImage: 'radial-gradient(ellipse 95% 85% at 50% 50%, black 40%, transparent 95%)',
      }}>
        <CandlestickChart />
      </div>

      {/* Subtle grid overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.025,
        backgroundImage: 'linear-gradient(rgba(0,255,65,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,65,0.5) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
        maskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black 20%, transparent 85%)',
        WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black 20%, transparent 85%)',
      }} />

      {/* Center vignette to keep UI readable */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse 55% 45% at 50% 50%, rgba(8,12,8,0.75) 0%, rgba(8,12,8,0) 72%)',
      }} />
    </div>
  );
}
