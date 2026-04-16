import { motion } from 'framer-motion';

/**
 * Ambient floating neon orbs — soft radial blurs that drift slowly behind
 * content. Purely decorative. Zero layout cost: absolute + pointer-events-none.
 */
export default function AmbientOrbs() {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        animate={{ x: [0, 80, -40, 0], y: [0, -60, 40, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/4 left-[10%] w-[420px] h-[420px] rounded-full blur-3xl opacity-30"
        style={{ background: 'radial-gradient(circle, rgba(0,255,65,0.5) 0%, transparent 70%)' }}
      />
      <motion.div
        animate={{ x: [0, -100, 60, 0], y: [0, 80, -30, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-1/4 right-[8%] w-[520px] h-[520px] rounded-full blur-3xl opacity-20"
        style={{ background: 'radial-gradient(circle, rgba(0,204,52,0.5) 0%, transparent 70%)' }}
      />
    </div>
  );
}
