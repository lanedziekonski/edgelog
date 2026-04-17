import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { ACCOUNTS } from '../../data/mockDashboard';

const FORMAT_DATE = (d) =>
  d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

export default function DashHeader() {
  const [now, setNow] = useState(new Date());
  const [account, setAccount] = useState(ACCOUNTS[0]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const marketOpen = (() => {
    const h = now.getHours();
    const d = now.getDay();
    return d >= 1 && d <= 5 && h >= 9 && h < 16;
  })();

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-30 flex items-center justify-between gap-4 px-4 md:px-6 py-4 border-b border-border bg-black/70 backdrop-blur-md"
    >
      <div className="flex flex-col">
        <span className="text-[11px] text-muted font-mono uppercase tracking-[0.18em] flex items-center gap-2">
          {FORMAT_DATE(now)}
          <span className="w-1 h-1 rounded-full bg-muted" />
          <span className={marketOpen ? 'text-neon inline-flex items-center gap-1.5' : 'text-muted inline-flex items-center gap-1.5'}>
            {marketOpen && <span className="w-1.5 h-1.5 rounded-full bg-neon animate-pulseSlow" />}
            {marketOpen ? 'Market Hours' : 'Market Closed'}
          </span>
        </span>
        <span className="mt-0.5 font-bold text-lg md:text-xl tracking-tight">
          Welcome back, <span className="text-neon">Trader</span>
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full border border-border bg-panel/70 hover:border-neon/40 transition-colors text-sm font-mono text-ink"
          >
            {account.label}
            <ChevronDown className={`w-3.5 h-3.5 text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
          </motion.button>

          <AnimatePresence>
            {open && (
              <motion.ul
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-48 rounded-xl border border-border bg-panel/95 backdrop-blur-md shadow-neon-soft overflow-hidden"
              >
                {ACCOUNTS.map((acc) => (
                  <li key={acc.id}>
                    <button
                      onClick={() => {
                        setAccount(acc);
                        setOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm font-mono hover:bg-neon/10 transition-colors ${
                        acc.id === account.id ? 'text-neon' : 'text-ink'
                      }`}
                    >
                      {acc.label}
                    </button>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>

        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-neon/40 bg-neon/10 text-neon text-xs font-mono font-bold uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-neon animate-pulseSlow" />
          2/3 today
        </span>
      </div>
    </motion.header>
  );
}
