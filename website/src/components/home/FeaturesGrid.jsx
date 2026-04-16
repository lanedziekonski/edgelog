import { motion } from 'framer-motion';
import SectionHeading from '../ui/SectionHeading';
import FadeUp from '../effects/FadeUp';
import Icon from '../ui/Icon';
import { homeFeatures } from '../../data/features';

export default function FeaturesGrid() {
  return (
    <section className="relative py-24 md:py-32 border-t border-border">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeading
          eyebrow="Features"
          title="Everything you need to find your edge"
          subtitle="A complete trading journal — fast logging, deep analytics, and an AI that actually pays attention to your trades."
        />

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {homeFeatures.map((f, i) => (
            <FadeUp key={f.title} delay={i * 0.05}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                className="group relative h-full rounded-xl border border-border bg-panel/60 p-6 overflow-hidden hover:border-neon/40 hover:shadow-neon-soft transition-all"
              >
                <div className="absolute left-0 top-6 bottom-6 w-px bg-border group-hover:bg-neon transition-colors" />
                <div className="flex items-center gap-3 mb-4">
                  <span className="grid place-items-center w-10 h-10 rounded-md border border-border bg-black/40 text-neon group-hover:border-neon/60 transition-colors">
                    <Icon name={f.icon} className="w-5 h-5" />
                  </span>
                  <h3 className="text-lg font-semibold tracking-tight">{f.title}</h3>
                </div>
                <p className="text-muted text-sm leading-relaxed">{f.description}</p>
              </motion.div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
