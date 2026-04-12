import React, { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, BarChart, Bar, Cell,
} from 'recharts';
import { calcDetailedStats, buildEquityCurve, fmtPnl, todayStr } from '../hooks/useTrades';

const ACCOUNT_CONFIGS = {
  'Apex Funded': { startingBalance: 100000, dailyLimit: 2000, profitTarget: 6000, color: '#00f07a' },
  'FTMO':        { startingBalance: 50000,  dailyLimit: 2500, profitTarget: 5000, color: '#6c63ff' },
  'tastytrade':  { startingBalance: 25000,  dailyLimit: null, profitTarget: null, color: '#f0a500' },
};

export default function Dashboard({ trades, tradesLoading }) {
  const today       = todayStr();
  const todayTrades = trades.filter(t => t.date === today);
  const stats       = useMemo(() => calcDetailedStats(trades), [trades]);
  const todayPnl    = todayTrades.reduce((s, t) => s + t.pnl, 0);
  const curve       = useMemo(() => buildEquityCurve(trades), [trades]);

  const accounts = Object.entries(ACCOUNT_CONFIGS).map(([name, cfg]) => {
    const at = trades.filter(t => t.account === name);
    const todayAt = at.filter(t => t.date === today);
    const totalPnl = at.reduce((s, t) => s + t.pnl, 0);
    const dailyPnl = todayAt.reduce((s, t) => s + t.pnl, 0);
    return { name, ...cfg, totalPnl, dailyPnl, balance: cfg.startingBalance + totalPnl };
  });

  const now      = new Date();
  const greeting = now.getHours() < 12 ? 'Pre-Market' : now.getHours() < 17 ? 'Market Hours' : 'Post-Market';
  const isEmpty  = trades.length === 0;

  const pfColor = stats.profitFactor >= 2
    ? 'var(--green)'
    : stats.profitFactor >= 1
    ? 'var(--yellow)'
    : 'var(--red)';

  const curveColor = stats.totalPnl >= 0 ? '#00f07a' : '#ff4444';

  return (
    <div>
      {/* ── Header ── */}
      <div className="screen-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="screen-title">EdgeLog</div>
          <div className="screen-subtitle">
            {now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} · {greeting}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <span className="badge badge-green">{todayTrades.length}/3 trades</span>
          {tradesLoading && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>syncing…</span>}
        </div>
      </div>

      {isEmpty ? (
        <EmptyState />
      ) : (
        <>
          {/* ── Hero P&L ── */}
          <div className="section" style={{ paddingTop: 20 }}>
            <div className="card" style={{
              background: 'linear-gradient(135deg, #1a1a1a 0%, #0f1f14 100%)',
              border: '1px solid rgba(0,240,122,0.15)',
            }}>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 2 }}>Net P&amp;L</div>
              <div style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 52,
                fontWeight: 700,
                color: stats.totalPnl >= 0 ? 'var(--green)' : 'var(--red)',
                lineHeight: 1,
                letterSpacing: '-1px',
              }}>
                {fmtPnl(stats.totalPnl)}
              </div>
              <div style={{ display: 'flex', gap: 20, marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <HeroPill label="Today" value={fmtPnl(todayPnl)} color={todayPnl >= 0 ? 'var(--green)' : 'var(--red)'} />
                <HeroPill label="Win Rate" value={`${Math.round(stats.winRate)}%`} color={stats.winRate >= 50 ? 'var(--green)' : 'var(--red)'} />
                <HeroPill label="Profit Factor" value={stats.profitFactor >= 999 ? '∞' : stats.profitFactor.toFixed(2)} color={pfColor} />
                <HeroPill
                  label="Streak"
                  value={stats.streak > 0 ? `${stats.streak}${stats.streakType === 'win' ? 'W' : 'L'}` : '—'}
                  color={stats.streakType === 'win' ? 'var(--green)' : stats.streakType === 'loss' ? 'var(--red)' : 'var(--text-secondary)'}
                />
              </div>
            </div>
          </div>

          {/* ── Equity Curve ── */}
          {curve.length > 1 && (
            <div className="section" style={{ paddingTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div className="section-label" style={{ marginBottom: 0 }}>Equity Curve</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  {curve.length} trading day{curve.length !== 1 ? 's' : ''}
                </div>
              </div>
              <div className="card" style={{ padding: '12px 4px 8px 0' }}>
                <ResponsiveContainer width="100%" height={150}>
                  <AreaChart data={curve} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="curveGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={curveColor} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={curveColor} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="label"
                      tick={{ fill: '#555', fontSize: 10, fontFamily: 'Barlow' }}
                      axisLine={false} tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fill: '#555', fontSize: 10, fontFamily: 'Barlow' }}
                      axisLine={false} tickLine={false} width={52}
                      tickFormatter={v => `$${v >= 0 ? '' : '-'}${Math.abs(v) >= 1000 ? `${(Math.abs(v)/1000).toFixed(1)}k` : Math.abs(v)}`}
                    />
                    <ReferenceLine y={0} stroke="#333" strokeDasharray="3 3" />
                    <Tooltip
                      contentStyle={{ background: '#1e1e1e', border: '1px solid #333', borderRadius: 8, fontFamily: 'Barlow', fontSize: 12 }}
                      labelStyle={{ color: '#aaa', fontWeight: 600, marginBottom: 4 }}
                      formatter={(v, name) => [fmtPnl(v), name === 'value' ? 'Equity' : 'Daily P&L']}
                    />
                    <Area
                      type="monotone" dataKey="value"
                      stroke={curveColor} strokeWidth={2}
                      fill="url(#curveGrad)" dot={false} activeDot={{ r: 4, fill: curveColor }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ── Stats Grid ── */}
          <div className="section" style={{ paddingTop: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <StatCard label="Avg Win"      value={`$${Math.round(stats.avgWin)}`}           color="var(--green)" />
              <StatCard label="Avg Loss"     value={`$${Math.round(Math.abs(stats.avgLoss))}`} color="var(--red)" />
              <StatCard label="Total Trades" value={stats.totalTrades} />
              <StatCard label="Best Day"     value={fmtPnl(stats.bestDay)}    color={stats.bestDay  >= 0 ? 'var(--green)' : 'var(--red)'} />
              <StatCard label="Worst Day"    value={fmtPnl(stats.worstDay)}   color={stats.worstDay >= 0 ? 'var(--green)' : 'var(--red)'} />
              <StatCard label="Rule Score"   value={`${Math.round(stats.ruleScore)}%`} color={stats.ruleScore >= 80 ? 'var(--green)' : 'var(--yellow)'} />
            </div>
          </div>

          {/* ── Trading Days ── */}
          <div className="section" style={{ paddingTop: 16 }}>
            <div className="section-label">Trading Days</div>
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 700 }}>
                    {stats.tradingDays}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>Total</div>
                </div>
                <div style={{ width: 1, height: 40, background: 'var(--border)' }} />
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 700, color: 'var(--green)' }}>
                    {stats.winDays}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>Green</div>
                </div>
                <div style={{ width: 1, height: 40, background: 'var(--border)' }} />
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 700, color: 'var(--red)' }}>
                    {stats.lossDays}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>Red</div>
                </div>
                <div style={{ width: 1, height: 40, background: 'var(--border)' }} />
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: 22,
                    fontWeight: 700,
                    color: stats.tradingDays > 0 ? (stats.winDays / stats.tradingDays >= 0.5 ? 'var(--green)' : 'var(--red)') : 'var(--text)',
                  }}>
                    {stats.tradingDays > 0 ? `${Math.round(stats.winDays / stats.tradingDays * 100)}%` : '—'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>Day Win%</div>
                </div>
              </div>

              {/* Day dots */}
              {stats.tradingDays > 0 && (
                <div style={{ display: 'flex', gap: 3, marginTop: 14, flexWrap: 'wrap' }}>
                  {(() => {
                    const byDate = {};
                    trades.forEach(t => { byDate[t.date] = (byDate[t.date] || 0) + t.pnl; });
                    return Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b)).map(([date, pnl]) => (
                      <div
                        key={date}
                        title={`${date}: ${fmtPnl(pnl)}`}
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 2,
                          background: pnl > 0 ? 'var(--green)' : 'var(--red)',
                          opacity: 0.7,
                        }}
                      />
                    ));
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* ── Setup Performance ── */}
          {Object.values(stats.bySetup).some(v => v.total > 0) && (
            <div className="section" style={{ paddingTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div className="section-label" style={{ marginBottom: 0 }}>Setup Performance</div>
                {stats.bestSetup && (
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    Best: <span style={{ color: 'var(--green)', fontWeight: 700 }}>{stats.bestSetup.name}</span>
                  </div>
                )}
              </div>
              <div className="card" style={{ padding: '12px 16px' }}>
                {Object.entries(stats.bySetup)
                  .filter(([, v]) => v.total > 0)
                  .sort(([, a], [, b]) => b.pnl - a.pnl)
                  .map(([name, v]) => {
                    const shortName = name === 'VWAP Reclaim' ? 'VWAP Reclaim' : name;
                    const isPos = v.pnl >= 0;
                    const maxAbsPnl = Math.max(
                      ...Object.values(stats.bySetup).filter(s => s.total > 0).map(s => Math.abs(s.pnl)), 1
                    );
                    const barPct = Math.round((Math.abs(v.pnl) / maxAbsPnl) * 100);
                    return (
                      <div key={name} style={{ marginBottom: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 600 }}>{shortName}</span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{v.total} trade{v.total !== 1 ? 's' : ''}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{Math.round(v.winRate)}% WR</span>
                            <span style={{
                              fontFamily: "'Barlow Condensed', sans-serif",
                              fontSize: 14,
                              fontWeight: 700,
                              color: isPos ? 'var(--green)' : 'var(--red)',
                              minWidth: 60,
                              textAlign: 'right',
                            }}>
                              {fmtPnl(v.pnl)}
                            </span>
                          </div>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{
                            width: `${barPct}%`,
                            background: isPos ? 'var(--green)' : 'var(--red)',
                            opacity: 0.7,
                          }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* ── Account Overview ── */}
          <div className="section" style={{ paddingTop: 16, paddingBottom: 8 }}>
            <div className="section-label">Account Overview</div>
            {accounts.map(acct => (
              <AccountMiniCard key={acct.name} acct={acct} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────��──────────────

function EmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: '60px 32px' }}>
      <div style={{
        width: 64, height: 64, borderRadius: 16, marginBottom: 16,
        background: 'var(--green-dim)', border: '1px solid rgba(0,240,122,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
      }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
      </div>
      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 700, marginBottom: 8, letterSpacing: '0.5px' }}>
        No trades yet
      </div>
      <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 260, margin: '0 auto' }}>
        Head to the <strong style={{ color: 'var(--text)' }}>Journal</strong> tab and log your first trade — your stats will appear here automatically.
      </div>
    </div>
  );
}

function HeroPill({ label, value, color }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 17, fontWeight: 700, color, lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {value}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '12px 6px' }}>
      <div style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 5 }}>{label}</div>
      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 21, fontWeight: 700, color: color || 'var(--text)', lineHeight: 1 }}>
        {value}
      </div>
    </div>
  );
}

function AccountMiniCard({ acct }) {
  const dailyUsed = Math.abs(Math.min(acct.dailyPnl, 0));
  const dailyPct  = acct.dailyLimit ? Math.min((dailyUsed / acct.dailyLimit) * 100, 100) : 0;
  const profitPct = acct.profitTarget ? Math.min((Math.max(acct.totalPnl, 0) / acct.profitTarget) * 100, 100) : 0;

  return (
    <div className="card" style={{ marginBottom: 8, borderLeft: `3px solid ${acct.color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: acct.dailyLimit || acct.profitTarget ? 10 : 0 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{acct.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>${acct.balance.toLocaleString()}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 700, color: acct.totalPnl >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {fmtPnl(acct.totalPnl)}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
            today: <span style={{ color: acct.dailyPnl >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>{fmtPnl(acct.dailyPnl)}</span>
          </div>
        </div>
      </div>
      {acct.dailyLimit && (
        <div style={{ marginBottom: acct.profitTarget ? 6 : 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Daily loss</span>
            <span style={{ fontSize: 10, color: dailyPct > 70 ? 'var(--red)' : 'var(--text-muted)' }}>
              ${dailyUsed.toLocaleString()} / ${acct.dailyLimit.toLocaleString()}
            </span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${dailyPct}%`, background: dailyPct > 70 ? 'var(--red)' : dailyPct > 40 ? 'var(--yellow)' : 'var(--green)' }} />
          </div>
        </div>
      )}
      {acct.profitTarget && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Profit target</span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{Math.round(profitPct)}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${profitPct}%`, background: acct.color }} />
          </div>
        </div>
      )}
    </div>
  );
}
