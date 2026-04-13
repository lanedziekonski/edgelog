import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { fmtPnl, todayStr } from '../hooks/useTrades';
import { useAuth, hasAccess } from '../context/AuthContext';
import BrokerageSync from '../components/BrokerageSync';

const G = '#00ff41';
const R = '#ff2d2d';

function accountColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  const hues = [160, 200, 260, 30, 340, 180, 45];
  return `hsl(${hues[h % hues.length]}, 70%, 55%)`;
}

export default function Accounts({ trades }) {
  const { user }    = useAuth();
  const today       = todayStr();
  const [syncOpen, setSyncOpen] = useState(false);
  const canSync     = hasAccess(user?.plan, 'trader');

  const accountNames = [...new Set(trades.map(t => t.account))].filter(Boolean);
  const isEmpty = trades.length === 0;

  return (
    <div style={{ background: '#080c08', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ padding: '20px 16px 0', position: 'relative', overflow: 'hidden' }}>
        <motion.div
          animate={{ opacity: [0.04, 0.09, 0.04] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', top: 4, right: 12,
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 52, fontWeight: 900, color: G,
            letterSpacing: 4, userSelect: 'none', pointerEvents: 'none', lineHeight: 1,
          }}
        >
          ACCOUNTS
        </motion.div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 800, letterSpacing: 1, color: '#fff', lineHeight: 1 }}>
              Accounts
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 3, marginBottom: 16 }}>
              Live account metrics and limits
            </div>
          </div>
          {canSync && (
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={() => setSyncOpen(v => !v)}
              style={{
                padding: '7px 12px', borderRadius: 8, marginTop: 2,
                background: syncOpen ? G : 'transparent',
                border: `1px solid ${syncOpen ? G : 'rgba(255,255,255,0.15)'}`,
                color: syncOpen ? '#000' : 'rgba(255,255,255,0.5)',
                fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Barlow',
                display: 'flex', alignItems: 'center', gap: 5,
                transition: 'all 0.15s',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.26"/>
              </svg>
              Import
            </motion.button>
          )}
        </div>
      </div>

      {/* Brokerage Sync Panel */}
      {syncOpen && canSync && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ padding: '0 16px 16px' }}
        >
          <div style={{ background: '#111811', border: '1px solid rgba(0,255,65,0.15)', borderRadius: 12, padding: 16 }}>
            <BrokerageSync onTradesImported={() => setSyncOpen(false)} />
          </div>
        </motion.div>
      )}

      <div style={{ padding: '4px 16px 80px' }}>
        {isEmpty ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{ textAlign: 'center', padding: '60px 32px' }}
          >
            <div style={{
              width: 56, height: 56, borderRadius: 14, margin: '0 auto 14px',
              background: `${G}10`, border: `1px solid ${G}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={G} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2"/>
                <line x1="2" y1="10" x2="22" y2="10"/>
              </svg>
            </div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 8, color: '#fff' }}>
              No accounts yet
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, maxWidth: 260, margin: '0 auto' }}>
              Log trades in the <strong style={{ color: 'rgba(255,255,255,0.8)' }}>Journal</strong> tab and your account stats will appear here automatically.
              {canSync && (
                <span> Or use <strong style={{ color: 'rgba(255,255,255,0.8)' }}>Import</strong> to upload a CSV.</span>
              )}
            </div>
          </motion.div>
        ) : (
          accountNames.map((name, i) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.3 }}
            >
              <AccountCard name={name} color={accountColor(name)} trades={trades} today={today} />
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

function AccountCard({ name, color, trades, today }) {
  const acctTrades  = trades.filter(t => t.account === name);
  const todayTrades = acctTrades.filter(t => t.date === today);
  const totalPnl    = acctTrades.reduce((s, t) => s + t.pnl, 0);
  const dailyPnl    = todayTrades.reduce((s, t) => s + t.pnl, 0);
  const wins        = acctTrades.filter(t => t.pnl > 0).length;
  const winRate     = acctTrades.length > 0 ? Math.round((wins / acctTrades.length) * 100) : 0;
  const tradeCount  = todayTrades.length;

  return (
    <div
      style={{
        background: '#111811',
        border: '1px solid rgba(255,255,255,0.07)',
        borderLeft: `4px solid ${color}`,
        borderRadius: 12,
        padding: 14,
        marginBottom: 14,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700, letterSpacing: '0.5px', color: '#fff' }}>
            {name}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
            {acctTrades.length} trade{acctTrades.length !== 1 ? 's' : ''} · {winRate}% win rate
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 700, color: totalPnl >= 0 ? G : R }}>
            {fmtPnl(totalPnl)}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>all-time P&L</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <StatCell label="Today"        value={fmtPnl(dailyPnl)}  positive={dailyPnl >= 0} />
        <StatCell label="Trades Today" value={String(tradeCount)} positive={tradeCount < 3} warn={tradeCount >= 3} />
        <StatCell label="Win Rate"     value={`${winRate}%`}      positive={winRate >= 50} />
      </div>
    </div>
  );
}

function StatCell({ label, value, positive, warn }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</div>
      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, fontWeight: 700, color: warn ? R : positive ? G : R }}>
        {value}
      </div>
    </div>
  );
}
