import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const VARIANTS = {
  primary:
    'bg-neon text-black border-neon hover:shadow-neon hover:bg-neon/90 active:shadow-neon-soft',
  ghost:
    'bg-transparent text-neon border-neon hover:bg-neon/10 hover:shadow-neon-soft',
  dark:
    'bg-panel text-ink border-border hover:border-neon hover:text-neon hover:shadow-neon-soft',
};

const SIZES = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  to,
  href,
  onClick,
  className = '',
  type = 'button',
  external = false,
}) {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium rounded-md border tracking-tight transition-all duration-200 will-change-transform select-none';
  const classes = `${base} ${VARIANTS[variant]} ${SIZES[size]} ${className}`;

  const motionProps = {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    transition: { type: 'spring', stiffness: 400, damping: 24 },
  };

  if (href) {
    return (
      <motion.a
        href={href}
        className={classes}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        {...motionProps}
      >
        {children}
      </motion.a>
    );
  }

  if (to) {
    return (
      <motion.div {...motionProps} className="inline-block">
        <Link to={to} className={classes}>
          {children}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.button type={type} onClick={onClick} className={classes} {...motionProps}>
      {children}
    </motion.button>
  );
}
