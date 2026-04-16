import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import Icon from '../ui/Icon';
import MockVisual from './MockVisual';

export default function FeatureDetailRow({ feature, index }) {
  const reversed = index % 2 === 1;

  return (
    <motion.article
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`grid md:grid-cols-2 gap-10 md:gap-16 items-center ${
        reversed ? 'md:[&>*:first-child]:order-2' : ''
      }`}
    >
      <div className="border-l-2 border-neon/40 pl-6 md:pl-8">
        <div className="text-xs font-mono uppercase tracking-[0.2em] text-neon mb-3">
          {feature.eyebrow}
        </div>
        <div className="flex items-center gap-3 mb-4">
          <span className="grid place-items-center w-10 h-10 rounded-md border border-neon/40 bg-black/40 text-neon shadow-neon-soft">
            <Icon name={feature.icon} className="w-5 h-5" />
          </span>
          <h3 className="text-3xl md:text-4xl font-bold tracking-tight">
            {feature.title}
          </h3>
        </div>
        <p className="text-muted text-lg leading-relaxed mb-6">
          {feature.description}
        </p>
        <ul className="space-y-2.5">
          {feature.bullets.map((b) => (
            <li key={b} className="flex items-start gap-3">
              <Check className="w-4 h-4 text-neon mt-1 flex-none" />
              <span className="text-ink/85">{b}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative">
        <div
          className="absolute -inset-6 pointer-events-none opacity-50 blur-2xl"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(0,255,65,0.15) 0%, transparent 70%)',
          }}
        />
        <div className="relative rounded-xl border border-border bg-panel/60 p-5 shadow-panel">
          <MockVisual type={feature.mockType} />
        </div>
      </div>
    </motion.article>
  );
}
