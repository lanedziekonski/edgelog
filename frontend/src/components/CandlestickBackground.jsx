import { useEffect, useRef } from 'react';

export default function CandlestickBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const CANDLE_COUNT = 18;
    const candles = Array.from({ length: CANDLE_COUNT }, (_, i) => ({
      x: (i / CANDLE_COUNT) * canvas.width + 20,
      open: 0.3 + Math.random() * 0.4,
      close: 0.3 + Math.random() * 0.4,
      high: 0,
      low: 0,
      speed: 0.0008 + Math.random() * 0.001,
      phase: Math.random() * Math.PI * 2,
      width: 14 + Math.random() * 8,
    }));

    candles.forEach(c => {
      c.high = Math.min(c.open, c.close) - 0.04 - Math.random() * 0.06;
      c.low = Math.max(c.open, c.close) + 0.04 + Math.random() * 0.06;
    });

    let t = 0;
    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      t += 1;

      candles.forEach((c, i) => {
        c.open = 0.2 + 0.6 * (0.5 + 0.5 * Math.sin(t * c.speed + c.phase));
        c.close = 0.2 + 0.6 * (0.5 + 0.5 * Math.sin(t * c.speed * 1.3 + c.phase + 1.2));
        c.high = Math.min(c.open, c.close) - 0.03 - 0.05 * Math.abs(Math.sin(t * c.speed * 0.7 + i));
        c.low = Math.max(c.open, c.close) + 0.03 + 0.05 * Math.abs(Math.cos(t * c.speed * 0.7 + i));

        const isGreen = c.close < c.open;
        const bodyColor = isGreen ? 'rgba(0,255,65,0.018)' : 'rgba(255,45,45,0.015)';
        const wickColor = isGreen ? 'rgba(0,255,65,0.01)' : 'rgba(255,45,45,0.01)';

        const x = (i / CANDLE_COUNT) * W + W / CANDLE_COUNT / 2;
        const openY = c.open * H;
        const closeY = c.close * H;
        const highY = c.high * H;
        const lowY = c.low * H;
        const bodyTop = Math.min(openY, closeY);
        const bodyH = Math.max(Math.abs(openY - closeY), 2);

        ctx.beginPath();
        ctx.moveTo(x, highY);
        ctx.lineTo(x, lowY);
        ctx.strokeStyle = wickColor;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = bodyColor;
        ctx.fillRect(x - c.width / 2, bodyTop, c.width, bodyH);
      });

      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
