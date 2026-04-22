import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, TrendingUp } from 'lucide-react';
import Button from '../ui/Button';
import GridBackground from '../effects/GridBackground';
import AmbientOrbs from '../effects/AmbientOrbs';
import MockDashboard from '../ui/MockDashboard';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function Hero() {
  return (
    <section className="relative pt-24 pb-16 md:pt-36 md:pb-24 overflow-hidden">
      <GridBackground />
      <AmbientOrbs />

      {/* Soft top neon glow */}
      <div
        aria-hidden
        className="absolute top-0 inset-x-0 h-[520px] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(0,255,65,0.22) 0%, transparent 70%)',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-6">
        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
          className="mt-8 text-center text-5xl md:text-7xl lg:text-[104px] font-bold tracking-tight text-balance leading-[0.92]"
        >
          Trade smarter.
          <br />
          Journal better.
          <br />
          <span className="text-neon glow-text">Win consistently.</span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
          className="mt-8 max-w-2xl mx-auto text-center text-lg md:text-xl text-muted text-balance"
        >
          The AI-powered trading journal built for serious futures, stocks, and options
          traders. Find your edge — and keep it.
        </motion.p>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={2}
          className="mt-10 flex flex-wrap justify-center gap-4"
        >
          <Button href="https://app.traderascend.com/signup" variant="primary" size="lg">
            Start Free <ArrowRight className="w-5 h-5" />
          </Button>
          <Button to="/how-it-works" variant="ghost" size="lg">
            See How It Works
          </Button>
        </motion.div>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={3}
          className="mt-4 text-center text-xs text-muted font-mono uppercase tracking-[0.18em]"
        >
          Free forever · No credit card · Cancel anytime
        </motion.p>

        {/* Dashboard + floating side cards */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mt-20 md:mt-28 relative"
        >
          <div
            className="absolute -inset-8 pointer-events-none opacity-60 blur-3xl"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(0,255,65,0.22) 0%, transparent 70%)',
            }}
          />

          {/* Floating side cards — hidden on mobile */}
          <motion.div
            initial={{ opacity: 0, x: -40, rotate: -6 }}
            animate={{ opacity: 1, x: 0, rotate: -6 }}
            transition={{ duration: 1, delay: 1, ease: [0.22, 1, 0.36, 1] }}
            className="hidden xl:block absolute -left-20 top-20 z-20 w-60"
          >
            <FloatingWinCard />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40, rotate: 6 }}
            animate={{ opacity: 1, x: 0, rotate: 6 }}
            transition={{ duration: 1, delay: 1.15, ease: [0.22, 1, 0.36, 1] }}
            className="hidden xl:block absolute -right-16 bottom-24 z-20 w-64"
          >
            <FloatingCoachCard />
          </motion.div>

          <MockDashboard />
        </motion.div>
      </div>
    </section>
  );
}

function FloatingWinCard() {
  return (
    <div className="rounded-2xl border border-neon/30 bg-panel/90 backdrop-blur shadow-neon-soft p-4">
      <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-neon">
        <TrendingUp className="w-3.5 h-3.5" />
        Best trade
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="font-mono font-bold text-xl text-ink">NQ</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded border border-neon/40 text-neon font-mono uppercase bg-neon/10">
          LONG
        </span>
      </div>
      <div className="mt-1 text-xs text-muted font-mono">VWAP Reclaim · 2ct</div>
      <div className="mt-3 pt-3 border-t border-border flex items-baseline justify-between">
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted">
          P&L
        </span>
        <span className="font-mono font-bold text-2xl text-neon">+$880</span>
      </div>
    </div>
  );
}

function FloatingCoachCard() {
  return (
    <div className="rounded-2xl border border-border bg-panel/90 backdrop-blur shadow-neon-soft p-4">
      <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-neon">
        <Sparkles className="w-3.5 h-3.5" />
        AI Coach
      </div>
      <p className="mt-3 text-sm text-ink leading-snug">
        You&apos;re up <span className="text-neon font-bold">+18%</span> this month. Your ORB
        setup wins 78% before 10:30 — consider stopping earlier.
      </p>
      <div className="mt-3 pt-3 border-t border-border flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-neon animate-pulseSlow" />
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted">
          Live analysis
        </span>
      </div>
    </div>
  );
}
