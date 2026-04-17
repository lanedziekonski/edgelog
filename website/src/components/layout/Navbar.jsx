import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowRight } from 'lucide-react';
import Button from '../ui/Button';
import Logo from '../ui/Logo';
import { NAV_LINKS } from '../../data/site';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-black/80 backdrop-blur-md border-b border-border'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo />

          {/* Desktop nav */}
          <ul className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) =>
                    link.highlight
                      ? `relative ml-2 px-3.5 py-1.5 text-sm rounded-full border transition-all ${
                          isActive
                            ? 'border-neon text-neon bg-neon/10 shadow-neon-soft'
                            : 'border-neon/40 text-neon hover:bg-neon/10 hover:shadow-neon-soft'
                        }`
                      : `relative px-3 py-2 text-sm transition-colors ${
                          isActive ? 'text-neon' : 'text-ink/80 hover:text-ink'
                        }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {link.highlight && (
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-neon animate-pulseSlow mr-2" />
                      )}
                      {link.label}
                      {isActive && !link.highlight && (
                        <motion.span
                          layoutId="nav-underline"
                          className="absolute left-3 right-3 -bottom-0.5 h-px bg-neon shadow-neon-soft"
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Button to="/login" variant="dark" size="sm">Log In</Button>
            <Button to="/signup" variant="primary" size="sm">
              Get Started <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="md:hidden p-2 -mr-2 text-ink"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </nav>
      </header>

      {/* Mobile overlay menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-40 md:hidden bg-black/95 backdrop-blur-xl pt-20"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <div className="px-6 pt-8 flex flex-col gap-2">
              {NAV_LINKS.map((link, i) => (
                <motion.div
                  key={link.to}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.3 }}
                >
                  <Link
                    to={link.to}
                    className="block py-4 text-2xl font-display font-medium text-ink border-b border-border hover:text-neon transition-colors"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
                className="pt-8"
              >
                <Button to="/signup" variant="primary" size="lg" className="w-full">
                  Get Started <ArrowRight className="w-5 h-5" />
                </Button>
                <Button to="/login" variant="ghost" size="lg" className="w-full">
                  Log In
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
