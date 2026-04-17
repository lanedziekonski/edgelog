import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, subtitle, children, size = 'md' }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  const widths = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
  };

  if (!open) return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
    >
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className={`relative w-full ${widths[size]} max-h-[85vh] flex flex-col rounded-2xl border border-neon/30 bg-panel/95 backdrop-blur-xl shadow-neon-soft overflow-hidden`}
      >
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-32 pointer-events-none opacity-60"
          style={{
            background:
              'radial-gradient(ellipse at top, rgba(0,255,65,0.15) 0%, transparent 70%)',
          }}
        />

        {(title || subtitle) && (
          <div className="relative flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-border">
            <div className="min-w-0">
              {subtitle && (
                <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-neon mb-1.5">
                  {subtitle}
                </div>
              )}
              {title && (
                <h2 className="text-xl md:text-2xl font-bold tracking-tight truncate">
                  {title}
                </h2>
              )}
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="flex-shrink-0 p-2 -m-2 text-muted hover:text-neon transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {!title && !subtitle && (
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3 right-3 z-10 p-2 text-muted hover:text-neon transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="relative flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </motion.div>
    </motion.div>,
    document.body,
  );
}
