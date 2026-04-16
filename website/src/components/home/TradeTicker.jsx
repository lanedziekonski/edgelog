/**
 * Horizontal marquee of trade pills — scrolls endlessly, gives the site
 * a live-feed feel. Duplicates the list so the animation loops seamlessly.
 */
const TRADES = [
  { sym: 'ES', tag: 'ORB', pl: '+$338', win: true },
  { sym: 'NQ', tag: 'VWAP', pl: '+$880', win: true },
  { sym: 'MNQ', tag: 'FOMO', pl: '-$95' },
  { sym: 'MES', tag: 'BREAKOUT', pl: '+$220', win: true },
  { sym: 'YM', tag: 'REVERSAL', pl: '+$145', win: true },
  { sym: 'CL', tag: 'SCALP', pl: '-$60' },
  { sym: 'GC', tag: 'SWING', pl: '+$410', win: true },
  { sym: 'ZB', tag: 'NEWS', pl: '+$95', win: true },
  { sym: 'ES', tag: 'ORB', pl: '+$512', win: true },
  { sym: 'NQ', tag: 'FADE', pl: '-$130' },
  { sym: 'RTY', tag: 'MOMENTUM', pl: '+$280', win: true },
  { sym: 'MNQ', tag: 'ORB', pl: '+$175', win: true },
];

export default function TradeTicker() {
  const doubled = [...TRADES, ...TRADES];
  return (
    <section className="relative py-10 border-y border-border bg-panel/30 overflow-hidden">
      {/* Gradient mask fades edges */}
      <div className="absolute inset-0 pointer-events-none z-10"
        style={{
          background:
            'linear-gradient(to right, #000 0%, transparent 8%, transparent 92%, #000 100%)',
        }}
      />
      <div className="flex gap-3 marquee whitespace-nowrap w-max">
        {doubled.map((t, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 px-4 py-2 rounded-full border border-border bg-black/60 backdrop-blur"
          >
            <span className="font-mono font-bold text-sm text-ink">{t.sym}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded border border-border text-muted font-mono uppercase">
              {t.tag}
            </span>
            <span
              className={`font-mono font-bold text-sm ${
                t.win ? 'text-neon' : 'text-red-400'
              }`}
            >
              {t.pl}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
