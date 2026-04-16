import { motion } from 'framer-motion';

export default function FadeUp({
  children,
  delay = 0,
  y = 24,
  duration = 0.6,
  className = '',
  as: Tag = 'div',
}) {
  const MotionTag = motion[Tag] || motion.div;
  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </MotionTag>
  );
}
