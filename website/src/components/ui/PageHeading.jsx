import { motion } from 'framer-motion';

/**
 * Big page heading with a ghost-text watermark behind the title.
 * Matches the aesthetic of the TraderAscend app (e.g. "Journal" with
 * giant "JOURNAL" ghost in the background).
 */
export default function PageHeading({
  eyebrow,
  title,
  subtitle,
  watermark,
  align = 'left',
}) {
  const alignClass = align === 'center' ? 'text-center items-center' : 'text-left items-start';
  const watermarkText = watermark ?? title;

  return (
    <div className={`relative flex flex-col ${alignClass} pt-20 pb-14 md:pt-28 md:pb-20 overflow-hidden`}>
      {/* Ghost watermark */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 0.08, y: 0 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
      >
        <span className="font-black uppercase tracking-tighter text-neon/30 leading-none text-[22vw] md:text-[18vw] lg:text-[16rem] whitespace-nowrap">
          {watermarkText}
        </span>
      </motion.div>

      <div className="relative z-10 max-w-3xl">
        {eyebrow && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2.5 text-xs font-mono uppercase tracking-[0.2em] text-neon"
          >
            <span className="w-[3px] h-3 bg-neon rounded-full" />
            {eyebrow}
          </motion.div>
        )}

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="mt-4 text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.95] text-balance"
        >
          {title}
        </motion.h1>

        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mt-6 text-lg md:text-xl text-muted max-w-2xl text-balance"
          >
            {subtitle}
          </motion.p>
        )}
      </div>
    </div>
  );
}
