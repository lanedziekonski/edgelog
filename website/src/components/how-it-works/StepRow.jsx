import { motion } from 'framer-motion';
import Icon from '../ui/Icon';

export default function StepRow({ step, index, total }) {
  const reversed = index % 2 === 1;
  const isLast = index === total - 1;
  return (
    <div className="relative">
      {/* Vertical connector line */}
      {!isLast && (
        <div className="hidden md:block absolute left-1/2 top-24 bottom-[-6rem] w-px bg-gradient-to-b from-neon/30 to-transparent -translate-x-1/2" />
      )}

      <motion.article
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`grid md:grid-cols-2 gap-10 items-center ${
          reversed ? 'md:[&>*:first-child]:order-2' : ''
        }`}
      >
        {/* Copy side */}
        <div className={`${reversed ? 'md:text-right md:items-end' : ''} flex flex-col`}>
          <div
            className={`flex items-center gap-3 ${
              reversed ? 'md:justify-end' : ''
            }`}
          >
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-neon">
              Step {step.n}
            </span>
            <span className="h-px w-12 bg-neon/40" />
          </div>
          <h3 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight">
            {step.title}
          </h3>
          <p className="mt-4 text-lg text-muted leading-relaxed max-w-md">
            {step.description}
          </p>
        </div>

        {/* Visual side: big numbered circle with icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div
              className="absolute -inset-8 rounded-full pointer-events-none opacity-60 blur-2xl"
              style={{
                background:
                  'radial-gradient(ellipse at center, rgba(0,255,65,0.25) 0%, transparent 70%)',
              }}
            />
            <div className="relative w-44 h-44 md:w-56 md:h-56 rounded-full border border-neon/40 bg-gradient-to-b from-panel to-black flex flex-col items-center justify-center shadow-neon-soft">
              <span className="text-7xl md:text-8xl font-bold font-display text-neon glow-text">
                {step.n}
              </span>
              <span className="absolute bottom-7 grid place-items-center w-12 h-12 rounded-full border border-neon/40 bg-black text-neon">
                <Icon name={step.icon} className="w-5 h-5" />
              </span>
              <div className="absolute inset-0 rounded-full border border-neon/20 animate-pulseSlow pointer-events-none" />
            </div>
          </div>
        </div>
      </motion.article>
    </div>
  );
}
