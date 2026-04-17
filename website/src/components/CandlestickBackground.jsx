import { useEffect, useRef } from 'react';

export default function CandlestickBackground() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);
    const CANDLE_COUNT = 18;
    const candles = Array.from({ length: CANDLE_COUNT }, () => ({
      open: 0.3 + Math.random() * 0.4,
      close: 0.3 + Math.random() * 0.4,
      speed: 0.0008 + Math.random() * 0.001,
      phase: Math.random() * Math.PI * 2,
      width: 14 + Math.random() * 8,
    }));
    let t = 0;
    const draw = () => {
      const W = canvas.width; const H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      t += 1;
      candles.forEach((c, i) => {
        c.open = 0.2 + 0.6 * (0.5 + 0.5 * Math.sin(t * c.speed + c.phase));
        c.close = 0.2 + 0.6 * (0.5 + 0.5 * Math.sin(t * c.speed * 1.3 + c.phase + 1.2));
        const high = Math.min(c.open, c.close) - 0.03 - 0.05 * Math.abs(Math.sin(t * c.speed * 0.7 + i));
        const low = Math.max(c.open, c.close) + 0.03 + 0.05 * Math.abs(Math.cos(t * c.speed * 0.7 + i));
        const isGreen = c.close < c.open;
        const x = (i / CANDLE_COUNT) * W + W / CANDLE_COUNT / 2;
        ctx.beginPath(); ctx.moveTo(x, high * H); ctx.lineTo(x, low * H);
        ctx.strokeStyle = isGreen ? 'rgba(0,255,65,0.018)' : 'rgba(255,45,45,0.015)';
        ctx.lineWidth = 1; ctx.stroke();
        ctx.fillStyle = isGreen ? 'rgba(0,255,65,0.018)' : 'rgba(255,45,45,0.015)';
        const bodyTop = Math.min(c.open, c.close) * H;
        ctx.fillRect(x - c.width / 2, bodyTop, c.width, Math.max(Math.abs(c.open - c.close) * H, 2));
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />;
}
