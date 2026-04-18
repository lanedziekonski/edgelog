import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  Wallet,
  ClipboardCheck,
  MessageSquare,
  User,
  ChevronLeft,
  Menu,
  X,
  LogOut,
} from 'lucide-react';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { id: 'journal', label: 'Journal', Icon: BookOpen },
  { id: 'calendar', label: 'Calendar', Icon: CalendarDays },
  { id: 'accounts', label: 'Accounts', Icon: Wallet },
  { id: 'plan', label: 'Trading Plan', Icon: ClipboardCheck },
  { id: 'coach', label: 'AI Coach', Icon: MessageSquare },
  { id: 'profile', label: 'Profile', Icon: User },
];

export default function Sidebar({ active = 'dashboard', onChange }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Lock scroll when mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  // Close drawer on tab change (mobile)
  const handleSelect = (id) => {
    onChange?.(id);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile toggle */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-40 p-2.5 rounded-lg border border-border bg-panel/80 backdrop-blur text-ink"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 224 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className={`
          fixed lg:sticky top-0 left-0 z-50 h-screen flex flex-col
          border-r border-border bg-panel/80 backdrop-blur-xl
          transition-transform duration-300 ease-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-border">
          <AnimatePresence mode="wait">
            {!collapsed ? (
              <motion.span
                key="expanded-logo"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-bold tracking-tight text-neon text-lg glow-text"
              >
                TRADERASCEND
              </motion.span>
            ) : (
              <motion.span
                key="collapsed-logo"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-bold text-neon text-xl glow-text"
              >
                TA
              </motion.span>
            )}
          </AnimatePresence>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1 text-muted hover:text-ink"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="flex flex-col gap-1 px-2">
            {TABS.map((t) => {
              const on = t.id === active;
              return (
                <li key={t.id}>
                  <button
                    onClick={() => handleSelect(t.id)}
                    className={`
                      relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                      transition-colors group
                      ${on ? 'text-neon' : 'text-muted hover:text-ink'}
                    `}
                  >
                    {on && (
                      <motion.span
                        layoutId="sidebar-active"
                        className="absolute inset-0 rounded-lg bg-neon/10 border border-neon/30 shadow-neon-soft"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                      />
                    )}
                    <t.Icon className="relative w-5 h-5 flex-shrink-0" />
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2 }}
                          className="relative text-sm font-medium whitespace-nowrap overflow-hidden"
                        >
                          {t.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer: collapse toggle + user */}
        <div className="border-t border-border p-2 space-y-1">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="hidden lg:flex w-full items-center gap-3 px-3 py-2 rounded-lg text-muted hover:text-ink hover:bg-white/5 transition-colors"
          >
            <ChevronLeft
              className={`w-5 h-5 flex-shrink-0 transition-transform ${collapsed ? 'rotate-180' : ''}`}
            />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-xs font-mono uppercase tracking-wider whitespace-nowrap"
                >
                  Collapse
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          <button
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted hover:text-red-400 hover:bg-red-500/5 transition-colors"
            aria-label="Log out"
            onClick={() => (window.location.href = '/')}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-xs font-mono uppercase tracking-wider whitespace-nowrap"
                >
                  Log Out
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>
    </>
  );
}
