import { useEffect, useRef } from 'react';

/**
 * Follows the cursor with a soft neon radial glow. Uses CSS vars + rAF
 * throttling to stay cheap even on low-end devices. Fades out on touch.
 */
export default function CursorSpotlight() {
  const ref = useRef(null);
  const rafId = useRef(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Hide entirely on touch devices
    if (matchMedia('(pointer: coarse)').matches) {
      el.style.display = 'none';
      return;
    }

    const handleMove = (e) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;
    };

    const tick = () => {
      // Easing lerp for silky follow
      current.current.x += (target.current.x - current.current.x) * 0.15;
      current.current.y += (target.current.y - current.current.y) * 0.15;
      el.style.transform = `translate3d(${current.current.x - 300}px, ${current.current.y - 300}px, 0)`;
      rafId.current = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', handleMove, { passive: true });
    rafId.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="fixed top-0 left-0 w-[600px] h-[600px] pointer-events-none z-[5] opacity-40 mix-blend-screen"
      style={{
        background:
          'radial-gradient(circle, rgba(0,255,65,0.18) 0%, rgba(0,255,65,0.05) 35%, transparent 70%)',
        filter: 'blur(40px)',
        willChange: 'transform',
      }}
    />
  );
}
