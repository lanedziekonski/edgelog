import React, { useState } from 'react';
import { fmtPnl, todayStr } from '../hooks/useTrades';
import { useAuth, hasAccess } from '../context/AuthContext';
import BrokerageSync from '../components/BrokerageSync';

// Generate a consistent accent color from an account name
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

  // Derive unique account names from actual trade data
  const accountNames = [...new Set(trades.map(t => t.account))].filter(Boolean);
  const isEmpty = trades.length === 0;

  return (
    <div>
      <div className="screen-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="screen-title">Accounts</div>
            <div className="screen-subtitle">Live account metrics and limits</div>
          </div>
          {canSync && (
            <button
              onClick={() => setSyncOpen(v => !v)}
              style={{
                padding: '7px 12px', borderRadius: 8, marginTop: 2,
                background: syncOpen ? 'var(--green)' : 'transparent',
                border: `1px solid ${syncOpen ? 'var(--green)' : 'var(--border)'}`,
                color: syncOpen ? '#000' : 'var(--text-secondary)',
                fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Barlow',
                display: 'flex', alignItems: 'center', gap: 5,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.26"/>
              </svg>
              Import
            </button>
          )}
        </div>
      </div>

      {/* Brokerage Sync Panel */}
      {syncOpen && canSync && (
        <div style={{ padding: '0 16px 16px' }}>
          <div className="card">
            <BrokerageSync onTradesImported={() => setSyncOpen(false)} />
          </div>
        </div>
      )}

      <div style={{ padding: '20px 16px 0' }}>
        {isEmpty ? (
          <div style={{ textAlign: 'center', padding: '60px 32px' }}>
            <div style={{
              width: 56, height: 56, borderRadius: 14, margin: '0 auto 14px',
              background: 'var(--green-dim)', border: '1px solid rgba(0,240,122,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2"/>
                <line x1="2" y1="10" x2="22" y2="10"/>
              </svg>
            </div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
              No accounts yet
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 260, margin: '0 auto' }}>
              Log trades in the <strong style={{ color: 'var(--text)' }}>Journal</strong> tab and your account stats will appear here automatically.
              {canSync && (
                <span> Or use <strong style={{ color: 'var(--text)' }}>Import</strong> to upload a CSV.</span>
              )}
            </div>
          </div>
        ) : (
          accountNames.map(name => (
            <AccountCard key={name} name={name} color={accountColor(name)} trades={trades} today={today} />
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
    <div className="card" style={{ marginBottom: 16, borderLeft: `3px solid ${color}` }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700, letterSpacing: '0.5px' }}>
            {name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            {acctTrades.length} trade{acctTrades.length !== 1 ? 's' : ''} · {winRate}% win rate
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 700, color: totalPnl >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {fmtPnl(totalPnl)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>all-time P&L</div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <PnlCell label="Today"        value={fmtPnl(dailyPnl)}  positive={dailyPnl >= 0} />
        <PnlCell label="Trades Today" value={String(tradeCount)} positive={tradeCount < 3} warn={tradeCount >= 3} />
        <PnlCell label="Win Rate"     value={`${winRate}%`}      positive={winRate >= 50} />
      </div>
    </div>
  );
}

function PnlCell({ label, value, positive, warn }) {
  return (
    <div style={{ background: 'var(--surface)', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
      <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</div>
      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, fontWeight: 700, color: warn ? 'var(--red)' : positive ? 'var(--green)' : 'var(--red)' }}>
        {value}
      </div>
    </div>
  );
}

