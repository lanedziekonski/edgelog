import React, { useState } from 'react';
import { fmtPnl, todayStr } from '../hooks/useTrades';
import { useAuth, hasAccess } from '../context/AuthContext';
import BrokerageSync from '../components/BrokerageSync';

// Known account configs — matched by name when trades arrive
const ACCOUNT_CONFIGS = {
  'Apex Funded': {
    type: 'Prop Firm', color: '#00f07a', badge: 'FUNDED',
    startingBalance: 100000, dailyLossLimit: 2000, maxDrawdown: 3000, profitTarget: 6000,
  },
  'FTMO': {
    type: 'Evaluation', color: '#6c63ff', badge: 'EVAL',
    startingBalance: 50000, dailyLossLimit: 2500, maxDrawdown: 5000, profitTarget: 5000,
  },
  'tastytrade': {
    type: 'Live Account', color: '#f0a500', badge: 'LIVE',
    startingBalance: 25000, dailyLossLimit: null, maxDrawdown: null, profitTarget: null,
  },
};

const DEFAULT_CONFIG = {
  type: 'Live Account', color: '#888888', badge: 'LIVE',
  startingBalance: 0, dailyLossLimit: null, maxDrawdown: null, profitTarget: null,
};

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
          accountNames.map(name => {
            const cfg = ACCOUNT_CONFIGS[name] || { ...DEFAULT_CONFIG };
            return <AccountCard key={name} name={name} cfg={cfg} trades={trades} today={today} />;
          })
        )}
      </div>
    </div>
  );
}

function AccountCard({ name, cfg, trades, today }) {
  const acctTrades  = trades.filter(t => t.account === name);
  const todayTrades = acctTrades.filter(t => t.date === today);
  const totalPnl    = acctTrades.reduce((s, t) => s + t.pnl, 0);
  const dailyPnl    = todayTrades.reduce((s, t) => s + t.pnl, 0);
  const currentBalance = cfg.startingBalance + totalPnl;

  // Daily loss used
  const dailyLossUsed = Math.abs(Math.min(dailyPnl, 0));
  const dailyLossPct  = cfg.dailyLossLimit ? (dailyLossUsed / cfg.dailyLossLimit) * 100 : 0;

  // Drawdown: running peak vs current
  let peak = cfg.startingBalance;
  let runningBalance = cfg.startingBalance;
  const sorted = [...acctTrades].sort((a, b) => a.date.localeCompare(b.date));
  sorted.forEach(t => {
    runningBalance += t.pnl;
    if (runningBalance > peak) peak = runningBalance;
  });
  const currentDrawdown = peak - currentBalance;
  const drawdownPct = cfg.maxDrawdown ? (currentDrawdown / cfg.maxDrawdown) * 100 : 0;

  // Profit progress
  const profitPct = cfg.profitTarget ? (Math.max(totalPnl, 0) / cfg.profitTarget) * 100 : 0;

  const tradeCount = todayTrades.length;
  const maxTradesReached = tradeCount >= 3;

  return (
    <div
      className="card"
      style={{ marginBottom: 16, borderLeft: `3px solid ${cfg.color}` }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700, letterSpacing: '0.5px' }}>
              {name}
            </div>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
              background: `${cfg.color}22`, color: cfg.color, letterSpacing: '0.5px',
            }}>
              {cfg.badge}
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{cfg.type}</div>
        </div>
        {cfg.startingBalance > 0 && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 700 }}>
              ${currentBalance.toLocaleString()}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>balance</div>
          </div>
        )}
      </div>

      {/* P&L row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
        <PnlCell label="All-Time"     value={fmtPnl(totalPnl)}   positive={totalPnl >= 0} />
        <PnlCell label="Today"        value={fmtPnl(dailyPnl)}   positive={dailyPnl >= 0} />
        <PnlCell label="Trades Today" value={`${tradeCount}/3`}  positive={!maxTradesReached} warn={maxTradesReached} />
      </div>

      {/* Limits */}
      {cfg.dailyLossLimit && (
        <LimitBar
          label="Daily Loss Limit"
          used={dailyLossUsed}
          limit={cfg.dailyLossLimit}
          pct={dailyLossPct}
          color={dailyLossPct > 75 ? 'var(--red)' : dailyLossPct > 50 ? 'var(--yellow)' : 'var(--green)'}
          prefix="-$"
        />
      )}
      {cfg.maxDrawdown && (
        <LimitBar
          label="Max Drawdown"
          used={currentDrawdown}
          limit={cfg.maxDrawdown}
          pct={drawdownPct}
          color={drawdownPct > 75 ? 'var(--red)' : drawdownPct > 50 ? 'var(--yellow)' : 'var(--green)'}
          prefix="-$"
        />
      )}
      {cfg.profitTarget && (
        <LimitBar
          label="Profit Target"
          used={Math.max(totalPnl, 0)}
          limit={cfg.profitTarget}
          pct={profitPct}
          color={cfg.color}
          prefix="$"
          goal
        />
      )}

      {/* Status tags */}
      {cfg.profitTarget && totalPnl >= cfg.profitTarget && (
        <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--green-dim)', border: '1px solid var(--green)', borderRadius: 8, fontSize: 13, fontWeight: 700, color: 'var(--green)', textAlign: 'center', letterSpacing: '0.5px' }}>
          🎯 PROFIT TARGET HIT
        </div>
      )}
      {cfg.dailyLossLimit && dailyLossUsed >= cfg.dailyLossLimit && (
        <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--red-dim)', border: '1px solid var(--red)', borderRadius: 8, fontSize: 13, fontWeight: 700, color: 'var(--red)', textAlign: 'center', letterSpacing: '0.5px' }}>
          ⛔ DAILY LOSS LIMIT HIT — DONE FOR TODAY
        </div>
      )}
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

function LimitBar({ label, used, limit, pct, color, prefix, goal }) {
  const clampedPct = Math.min(pct, 100);
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          {prefix}{Math.round(used).toLocaleString()} / ${limit.toLocaleString()}
        </span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${clampedPct}%`, background: color }} />
      </div>
      {goal && (
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', textAlign: 'right', marginTop: 3 }}>
          {Math.round(clampedPct)}% complete
        </div>
      )}
    </div>
  );
}
