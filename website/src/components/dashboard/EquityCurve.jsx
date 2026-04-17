import { motion, AnimatePresence, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import SectionEyebrow from '../ui/SectionEyebrow';
import { EQUITY_CURVE } from '../../data/mockDashboard';

const W = 800;
const H = 220;
const PAD = 20;

export default function EquityCurve() {
  const ref = useRef(null);
  const wrapRef = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [hover, setHover] = useState(null);

  const data = EQUITY_CURVE;
  const max = Math.max(...data.map((d) => d.value));
  const min = Math.min(...data.map((d) => d.value));
  const range = max - min || 1;

  const points = data.map((d, i) => {
    const x = PAD + (i / (data.length - 1)) * (W - PAD * 2);
    const y = H - PAD - ((d.value - min) / range) * (H - PAD * 2);
    return [x, y, d];
  });

  const path = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ');
  const area = `${path} L ${W - PAD} ${H - PAD} L ${PAD} ${H - PAD} Z`;

  const last = data[data.length - 1].value;
  const first = data[0].value;
  const change = last - first;
  const positive = change >= 0;

  return (
    <section ref={ref}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <SectionEyebrow>Equity Curve</SectionEyebrow>
          <h2 className="mt-3 text-2xl md:text-3xl font-bold tracking-tight">
            {data.length} Trading Days
          </h2>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-muted font-mono uppercase tracking-[0.2em]">Net</div>
          <div className={`text-2xl md:text-3xl font-bold tabular-nums ${positive ? 'text-neon' : 'text-red-400'}`}>
            {positive ? '+' : ''}${Math.abs(change).toLocaleString('en-US')}
          </div>
        </div>
      </div>

      <div ref={wrapRef} className="mt-6 rounded-2xl border border-border bg-panel/50 backdrop-blur-sm p-5 md:p-6 relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-[220px]"
          preserveAspectRatio="none"
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id="equityFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#00ff41" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#00ff41" stopOpacity="0" />
            </linearGradient>
            <pattern id="grid" width="80" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M 80 0 L 0 0 0 40"
                fill="none"
                stroke="rgba(255,255,255,0.035)"
                strokeWidth="1"
              />
            </pattern>
          </defs>

          <rect width={W} height={H} fill="url(#grid)" />

          {/* Animated area fill */}
          <motion.path
            d={area}
            fill="url(#equityFill)"
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 1.5, delay: 0.6 }}
          />

          {/* Line drawing animation */}
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

          {/* End point pulse */}
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
            transition={{
              delay: 2.3,
              duration: 1.8,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />

          {/* Hover hitboxes */}
          {points.map(([x, y, d], i) => (
            <rect
              key={i}
              x={x - (W / data.length) / 2}
              y={0}
              width={W / data.length}
              height={H}
              fill="transparent"
              onMouseEnter={() => setHover({ x, y, d, i })}
            />
          ))}

          {/* Hover crosshair */}
          {hover && (
            <g>
              <line
                x1={hover.x}
                x2={hover.x}
                y1={PAD}
                y2={H - PAD}
                stroke="rgba(0,255,65,0.35)"
                strokeWidth="1"
                strokeDasharray="2 3"
              />
              <circle cx={hover.x} cy={hover.y} r="6" fill="rgba(0,255,65,0.15)" />
              <circle cx={hover.x} cy={hover.y} r="4" fill="#00ff41" stroke="#000" strokeWidth="1.5" />
            </g>
          )}
        </svg>

        {/* Floating tooltip */}
        <AnimatePresence>
          {hover && (
            <motion.div
              key={hover.d.day}
              initial={{ opacity: 0, y: 4, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="pointer-events-none absolute top-4 rounded-lg border border-neon/40 bg-panel/95 backdrop-blur-md px-3 py-2 shadow-neon-soft min-w-[120px]"
              style={{
                left: `calc(${(hover.x / W) * 100}% - 60px)`,
                maxWidth: 160,
              }}
            >
              <div className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted">
                {hover.d.day}
              </div>
              <div className="mt-0.5 font-mono font-bold text-sm text-neon tabular-nums">
                +${hover.d.value.toLocaleString('en-US')}
              </div>
              {hover.i > 0 && (
                <div className="mt-0.5 text-[10px] font-mono text-muted">
                  {(() => {
                    const diff = hover.d.value - data[hover.i - 1].value;
                    const sign = diff >= 0 ? '+' : '-';
                    const cls = diff >= 0 ? 'text-neon/80' : 'text-red-400';
                    return (
                      <span className={cls}>
                        {sign}${Math.abs(diff).toLocaleString('en-US')} vs prev
                      </span>
                    );
                  })()}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* X-axis labels (show first, mid, last) */}
        <div className="mt-2 flex justify-between px-5 text-[10px] font-mono text-muted uppercase tracking-wider">
          <span>{data[0].day}</span>
          <span>{data[Math.floor(data.length / 2)].day}</span>
          <span>{data[data.length - 1].day}</span>
        </div>
      </div>
    </section>
  );
}
