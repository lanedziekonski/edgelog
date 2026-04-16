import { motion } from 'framer-motion';
import { LayoutDashboard, BookOpen, CalendarDays, Wallet, ClipboardCheck, MessageSquare, User } from 'lucide-react';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { id: 'journal', label: 'Journal', Icon: BookOpen },
  { id: 'calendar', label: 'Calendar', Icon: CalendarDays },
  { id: 'accounts', label: 'Accounts', Icon: Wallet },
  { id: 'plan', label: 'Plan', Icon: ClipboardCheck },
  { id: 'coach', label: 'AI Coach', Icon: MessageSquare },
  { id: 'profile', label: 'Profile', Icon: User },
];

export default function BottomNav({ active = 'dashboard', onChange }) {
  return (
    <nav className="sticky bottom-0 z-30 border-t border-border bg-black/80 backdrop-blur-md">
      <div className="flex items-stretch justify-around gap-0.5 px-2 py-2 max-w-5xl mx-auto overflow-x-auto">
        {TABS.map((t) => {
          const on = t.id === active;
          return (
            <button
              key={t.id}
              onClick={() => onChange?.(t.id)}
              className="relative flex-1 min-w-[68px] flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-colors group"
            >
              {on && (
                <motion.span
                  layoutId="bottom-nav-active"
                  className="absolute inset-0 rounded-lg bg-neon/10"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                />
              )}
              <t.Icon
                className={`relative w-5 h-5 transition-colors ${
                  on ? 'text-neon' : 'text-muted group-hover:text-ink'
                }`}
              />
              <span
                className={`relative text-[9px] font-mono uppercase tracking-wider transition-colors ${
                  on ? 'text-neon' : 'text-muted group-hover:text-ink'
                }`}
              >
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
