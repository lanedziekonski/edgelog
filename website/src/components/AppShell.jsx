import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, BookOpen, CalendarDays, Wallet,
  ClipboardCheck, MessageSquare, User, LogOut, ChevronLeft, Menu, X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAccounts } from '../hooks/useAccounts';
import { useAccountFilter } from '../context/AccountFilterContext';
import AnimatedBackground from './effects/AnimatedBackground';

const NAV = [
  { to: '/dashboard', label: 'Dashboard',    Icon: LayoutDashboard },
  { to: '/journal',   label: 'Journal',      Icon: BookOpen },
  { to: '/calendar',  label: 'Calendar',     Icon: CalendarDays },
  { to: '/accounts',  label: 'Accounts',     Icon: Wallet },
  { to: '/plan',      label: 'Trading Plan', Icon: ClipboardCheck },
  { to: '/coach',     label: 'AI Coach',     Icon: MessageSquare },
  { to: '/profile',   label: 'Profile',      Icon: User },
];

const G = '#00ff41';

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { accounts } = useAccounts();
  const { selectedAccountId, setSelectedAccountId } = useAccountFilter();

  const handleLogout = () => { logout(); navigate('/'); };

  const SidebarContent = ({ onNav }) => (
    <>
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-white/[0.06] flex-shrink-0">
        <Link
          to="/"
          className="font-bold text-lg whitespace-nowrap overflow-hidden"
          style={{ color: G, textDecoration: 'none' }}
        >
          {collapsed && !mobileOpen ? 'TA' : 'TRADERASCEND'}
        </Link>
        {mobileOpen && (
          <button onClick={() => setMobileOpen(false)} className="ml-auto p-1 text-white/40 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="flex flex-col gap-1 px-2">
          {NAV.map(({ to, label, Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                onClick={onNav}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
                    isActive
                      ? 'text-[#00ff41] bg-[#00ff41]/10 border border-[#00ff41]/25'
                      : 'text-white/50 hover:text-white hover:bg-white/[0.04]'
                  }`
                }
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {(!collapsed || mobileOpen) && (
                  <span className="whitespace-nowrap overflow-hidden">{label}</span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-white/[0.06] p-2 space-y-1 flex-shrink-0">
        {!mobileOpen && (
          <button
            onClick={() => setCollapsed(c => !c)}
            className="hidden lg:flex w-full items-center gap-3 px-3 py-2 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.04] transition-colors"
          >
            <ChevronLeft className={`w-5 h-5 flex-shrink-0 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
            {!collapsed && <span className="text-xs font-mono uppercase tracking-wider">Collapse</span>}
          </button>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/[0.06] transition-colors"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {(!collapsed || mobileOpen) && (
            <span className="text-xs font-mono uppercase tracking-wider">Log Out</span>
          )}
        </button>
      </div>
    </>
  );

  return (
    <div style={{ position: 'relative', overflow: 'hidden', minHeight: '100vh', background: '#080c08', color: '#fff' }}>
      <AnimatedBackground variant="marketing" />
      <div className="flex min-h-screen" style={{ position: 'relative', zIndex: 1 }}>
      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 224 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="hidden lg:flex flex-col flex-shrink-0 h-screen sticky top-0 border-r border-white/[0.06]"
        style={{ background: '#0d0d0d', minWidth: collapsed ? 72 : 224 }}
      >
        <SidebarContent onNav={undefined} />
      </motion.aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <div
        className={`lg:hidden fixed top-0 left-0 z-50 h-screen flex flex-col border-r border-white/[0.06] transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: '#0d0d0d', width: 224 }}
      >
        <SidebarContent onNav={() => setMobileOpen(false)} />
      </div>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header
          className="sticky top-0 z-20 h-14 flex items-center justify-between px-4 md:px-6 border-b border-white/[0.06] backdrop-blur-md"
          style={{ background: 'rgba(10,10,10,0.85)' }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 -ml-1 text-white/50 hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="text-sm">
              <span className="text-white/40">Welcome back, </span>
              <span className="font-semibold" style={{ color: G }}>
                {user?.name || user?.email?.split('@')[0] || 'Trader'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {accounts.length > 0 && (
              <select
                value={selectedAccountId || ''}
                onChange={e => setSelectedAccountId(e.target.value || null)}
                style={{
                  padding: '5px 10px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontFamily: 'monospace',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: selectedAccountId ? '#00ff41' : 'rgba(255,255,255,0.5)',
                  outline: 'none',
                  cursor: 'pointer',
                  maxWidth: 160,
                }}
              >
                <option value="">All Accounts</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            )}
            <span
              className="hidden sm:block text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full border"
              style={{ borderColor: `${G}40`, color: G, background: `${G}10` }}
            >
              {user?.plan || 'free'}
            </span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-4 md:px-6 lg:px-8 py-6 md:py-8">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
      </div>
    </div>
  );
}
