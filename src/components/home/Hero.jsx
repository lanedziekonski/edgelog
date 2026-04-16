import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import Button from '../ui/Button';
import GridBackground from '../effects/GridBackground';
import MockDashboard from '../ui/MockDashboard';
import { APP_URL } from '../../data/site';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function Hero() {
  return (
    <section className="relative pt-20 pb-10 md:pt-32 md:pb-20 overflow-hidden">
      <GridBackground />

      {/* Soft top neon glow */}
      <div
        className="absolute top-0 inset-x-0 h-[480px] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(0,255,65,0.18) 0%, transparent 70%)',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-6">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
          className="flex justify-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-panel/50 text-xs font-mono uppercase tracking-[0.18em] text-muted">
            <Sparkles className="w-3.5 h-3.5 text-neon" />
            <span>Powered by Claude AI</span>
            <span className="w-1 h-1 rounded-full bg-neon animate-pulseSlow" />
          </div>
        </motion.div>

        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
          className="mt-8 text-center text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-balance leading-[0.95]"
        >
          Trade Smarter.
          <br />
          Journal Better.
          <br />
          <span className="text-neon glow-text">Win Consistently.</span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={2}
          className="mt-8 max-w-2xl mx-auto text-center text-lg md:text-xl text-muted text-balance"
        >
          TradeAscend is the AI-powered trading journal built for serious futures, stocks,
          and options traders. Find your edge — and keep it.
        </motion.p>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={3}
          className="mt-10 flex flex-wrap justify-center gap-4"
        >
          <Button href={APP_URL} variant="primary" size="lg" external>
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
          custom={4}
          className="mt-4 text-center text-xs text-muted font-mono uppercase tracking-[0.18em]"
        >
          Free forever · No credit card · Cancel anytime
        </motion.p>

        {/* Mock dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mt-16 md:mt-24 relative"
        >
          <div
            className="absolute -inset-6 pointer-events-none opacity-60 blur-3xl"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(0,255,65,0.18) 0%, transparent 70%)',
            }}
          />
          <MockDashboard />
        </motion.div>
      </div>
    </section>
  );
}
