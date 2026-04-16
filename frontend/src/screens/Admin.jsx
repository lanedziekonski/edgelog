import React, { useState, useEffect, useCallback } from 'react';

const G    = '#00ff41';
const GOLD = '#f0a500';
const R    = '#ff2d2d';
const BG   = '#080c08';
const ADMIN_KEY = 'ta_admin_session';

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/admin`
  : 'https://edgelog.onrender.com/api/admin';

async function adminCall(endpoint, token, options = {}) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

const PLAN_COLORS = {
  free:   { bg: 'rgba(150,150,150,0.15)', color: '#999', label: 'Free' },
  trader: { bg: 'rgba(139,92,246,0.15)',  color: '#a78bfa', label: 'Trader' },
  pro:    { bg: 'rgba(240,165,0,0.15)',   color: GOLD, label: 'Pro' },
  elite:  { bg: 'rgba(0,255,65,0.12)',    color: G, label: 'Elite' },
};

function PlanBadge({ plan }) {
  const p = PLAN_COLORS[plan] || PLAN_COLORS.free;
  return (
    <span style={{
      background: p.bg, color: p.color,
      border: `1px solid ${p.color}40`,
      borderRadius: 4, padding: '2px 8px',
      fontSize: 11, fontWeight: 700, letterSpacing: '0.5px',
      textTransform: 'uppercase',
    }}>{p.label}</span>
  );
}

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
}

function fmtDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

// ─── Login gate ────────────────────────────────────────────────────────────

function AdminLogin({ onLogin }) {
  const [pw, setPw]       = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!pw) return;
    setLoading(true);
    setError('');
    try {
      const BASE = import.meta.env.VITE_API_URL
        ? `${import.meta.env.VITE_API_URL}/api/admin`
        : 'https://edgelog.onrender.com/api/admin';
      const res  = await fetch(`${BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || 'Invalid password'); setLoading(false); return; }
      localStorage.setItem(ADMIN_KEY, data.token);
      onLogin(data.token);
    } catch {
      setError('Network error — is the backend running?');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100dvh', background: BG,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Barlow, sans-serif',
    }}>
      <div style={{
        width: 340, background: '#0d0d0d',
        border: `1px solid ${G}25`, borderRadius: 12,
        padding: '36px 32px',
        boxShadow: `0 0 40px rgba(0,255,65,0.06)`,
      }}>
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 24, fontWeight: 700, letterSpacing: '2px',
          color: '#fff', marginBottom: 4,
        }}>
          Trader<span style={{ color: G }}>Ascend</span>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 28, letterSpacing: '2px', textTransform: 'uppercase' }}>
          Admin Access
        </div>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Admin password"
            value={pw}
            onChange={e => { setPw(e.target.value); setError(''); }}
            autoFocus
            style={{
              width: '100%', boxSizing: 'border-box',
              background: '#111', border: `1px solid ${error ? R : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 8, padding: '11px 14px',
              color: '#fff', fontSize: 14, fontFamily: 'Barlow, sans-serif',
              outline: 'none', marginBottom: error ? 8 : 16,
            }}
          />
          {error && (
            <div style={{ color: R, fontSize: 12, marginBottom: 12 }}>{error}</div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '11px 0',
              background: G, color: '#000', border: 'none',
              borderRadius: 8, fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 15, fontWeight: 800, letterSpacing: '1.5px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'VERIFYING...' : 'ENTER'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Stat card ─────────────────────────────────────────────────────────────

function StatCard({ label, value, color = G, sub }) {
  return (
    <div style={{
      background: '#0d0d0d', border: '1px solid rgba(0,255,65,0.1)',
      borderRadius: 8, padding: '14px 18px', flex: '1 1 0',
    }}>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '1px' }}>
        {value ?? '—'}
      </div>
      {sub && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ─── Confirm modal ─────────────────────────────────────────────────────────

function ConfirmModal({ action, onConfirm, onCancel }) {
  if (!action) return null;
  const planColors = PLAN_COLORS[action.plan] || PLAN_COLORS.free;
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onCancel}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#111', border: `1px solid ${G}30`,
          borderRadius: 10, padding: '24px 28px', width: 360,
          boxShadow: `0 0 40px rgba(0,255,65,0.08)`,
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 10 }}>
          Confirm Plan Change
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 20, lineHeight: 1.5 }}>
          Set <span style={{ color: '#fff' }}>{action.email}</span> to{' '}
          <span style={{ color: planColors.color, fontWeight: 700 }}>{action.plan.toUpperCase()}</span>?
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onConfirm}
            style={{
              flex: 1, padding: '9px 0',
              background: planColors.color, color: action.plan === 'free' ? '#fff' : '#000',
              border: 'none', borderRadius: 6,
              fontWeight: 700, fontSize: 13, cursor: 'pointer',
            }}
          >
            Confirm
          </button>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: '9px 0',
              background: 'transparent', color: 'rgba(255,255,255,0.4)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6,
              fontWeight: 600, fontSize: 13, cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Assign referral modal ─────────────────────────────────────────────────

function AssignModal({ token, onClose, onAssigned }) {
  const [email, setEmail] = useState('');
  const [code, setCode]   = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !code) return;
    setSaving(true);
    setError('');
    try {
      await adminCall('/referrals/assign', token, {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), code: code.trim() }),
      });
      onAssigned();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#111', border: `1px solid ${G}30`,
          borderRadius: 10, padding: '24px 28px', width: 360,
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 16 }}>
          Assign Referral Code
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.5px', display: 'block', marginBottom: 5 }}>USER EMAIL</label>
            <input
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoFocus
              style={inputStyle}
            />
          </div>
          <div style={{ marginBottom: error ? 8 : 16 }}>
            <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.5px', display: 'block', marginBottom: 5 }}>CODE</label>
            <input
              type="text"
              placeholder="e.g. TALANE20"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              style={inputStyle}
            />
          </div>
          {error && <div style={{ color: R, fontSize: 12, marginBottom: 10 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                flex: 1, padding: '9px 0',
                background: G, color: '#000',
                border: 'none', borderRadius: 6,
                fontWeight: 700, fontSize: 13, cursor: 'pointer',
              }}
            >
              {saving ? 'Saving...' : 'Assign'}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, padding: '9px 0',
                background: 'transparent', color: 'rgba(255,255,255,0.4)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6,
                fontWeight: 600, fontSize: 13, cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6, padding: '9px 12px',
  color: '#fff', fontSize: 13, fontFamily: 'Barlow, sans-serif',
  outline: 'none',
};

// ─── Main dashboard ────────────────────────────────────────────────────────

function AdminDashboard({ token, onLogout }) {
  const [stats, setStats]         = useState(null);
  const [users, setUsers]         = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [confirmAction, setConfirmAction] = useState(null); // { userId, email, plan }
  const [showAssign, setShowAssign]       = useState(false);
  const [planUpdating, setPlanUpdating]   = useState(null); // userId being updated

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, u, r] = await Promise.all([
        adminCall('/stats', token),
        adminCall('/users', token),
        adminCall('/referrals', token),
      ]);
      setStats(s);
      setUsers(u);
      setReferrals(r);
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('expired')) {
        localStorage.removeItem(ADMIN_KEY);
        onLogout();
      }
    } finally {
      setLoading(false);
    }
  }, [token, onLogout]);

  useEffect(() => { load(); }, [load]);

  async function executePlanChange() {
    if (!confirmAction) return;
    const { userId, plan } = confirmAction;
    setPlanUpdating(userId);
    setConfirmAction(null);
    try {
      await adminCall(`/users/${userId}/plan`, token, {
        method: 'POST',
        body: JSON.stringify({ plan }),
      });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, plan } : u));
      if (stats) {
        setStats(prev => {
          const user = users.find(u => u.id === userId);
          if (!user) return prev;
          const old = user.plan;
          return {
            ...prev,
            byPlan: {
              ...prev.byPlan,
              [old]: Math.max(0, (prev.byPlan[old] || 0) - 1),
              [plan]: (prev.byPlan[plan] || 0) + 1,
            },
          };
        });
      }
    } catch (err) {
      alert('Failed to update plan: ' + err.message);
    } finally {
      setPlanUpdating(null);
    }
  }

  const filtered = users.filter(u =>
    !search ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const PLAN_ACTIONS = [
    { plan: 'elite',  label: 'Elite',  color: G },
    { plan: 'pro',    label: 'Pro',    color: GOLD },
    { plan: 'trader', label: 'Trader', color: '#a78bfa' },
    { plan: 'free',   label: 'Free',   color: '#888' },
  ];

  return (
    <div style={{
      minHeight: '100dvh', background: BG,
      color: '#fff', fontFamily: 'Barlow, sans-serif',
      paddingBottom: 60,
    }}>
      {/* Header */}
      <div style={{
        background: '#0d0d0d', borderBottom: '1px solid rgba(0,255,65,0.12)',
        padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 20, fontWeight: 700, letterSpacing: '2px',
          }}>
            Trader<span style={{ color: G }}>Ascend</span>
          </div>
          <span style={{
            fontSize: 10, letterSpacing: '2px', textTransform: 'uppercase',
            color: G, border: `1px solid ${G}40`, borderRadius: 4, padding: '2px 7px',
          }}>Admin</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={load}
            style={{
              background: 'none', border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.5)', borderRadius: 6, padding: '5px 12px',
              fontSize: 12, cursor: 'pointer', fontFamily: 'Barlow, sans-serif',
            }}
          >
            Refresh
          </button>
          <button
            onClick={() => { localStorage.removeItem(ADMIN_KEY); onLogout(); }}
            style={{
              background: 'none', border: `1px solid ${R}40`,
              color: R, borderRadius: 6, padding: '5px 12px',
              fontSize: 12, cursor: 'pointer', fontFamily: 'Barlow, sans-serif',
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 16px' }}>

        {/* Stats bar */}
        {stats && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
            <StatCard label="Total Users"   value={stats.totalUsers} />
            <StatCard label="Free"          value={stats.byPlan.free}   color="#888" />
            <StatCard label="Trader"        value={stats.byPlan.trader} color="#a78bfa" />
            <StatCard label="Pro"           value={stats.byPlan.pro}    color={GOLD} />
            <StatCard label="Elite"         value={stats.byPlan.elite}  color={G} />
            <StatCard label="Total Trades"  value={stats.totalTrades}   color="rgba(255,255,255,0.7)" />
            <StatCard label="New Today"     value={stats.newToday}      color={G}
              sub={`${stats.newThisWeek} this week`} />
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '60px 0', fontSize: 14 }}>
            Loading…
          </div>
        )}

        {!loading && (
          <>
            {/* Users section */}
            <div style={{ marginBottom: 36 }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Users</div>
                  <span style={{
                    fontSize: 11, color: G, background: `${G}15`,
                    border: `1px solid ${G}30`, borderRadius: 4, padding: '1px 7px',
                  }}>
                    {filtered.length}{search ? ` of ${users.length}` : ''}
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="Search email or name…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{
                    background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 6, padding: '7px 12px', color: '#fff',
                    fontSize: 12, fontFamily: 'Barlow, sans-serif', outline: 'none',
                    width: 220,
                  }}
                />
              </div>

              {/* Table */}
              <div style={{
                background: '#0a0a0a', border: '1px solid rgba(0,255,65,0.1)',
                borderRadius: 8, overflow: 'hidden',
              }}>
                {/* Table header */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '2.5fr 1.5fr 90px 100px 120px 60px 260px',
                  padding: '9px 14px',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  fontSize: 10, letterSpacing: '0.8px', textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.3)',
                }}>
                  <div>Email</div>
                  <div>Name</div>
                  <div>Plan</div>
                  <div>Joined</div>
                  <div>Last Login</div>
                  <div>Trades</div>
                  <div>Actions</div>
                </div>

                {filtered.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>
                    No users found
                  </div>
                )}

                {filtered.map((u, i) => (
                  <div
                    key={u.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2.5fr 1.5fr 90px 100px 120px 60px 260px',
                      padding: '9px 14px',
                      borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      alignItems: 'center',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,255,65,0.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }}>
                      {u.email}
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }}>
                      {u.name || '—'}
                    </div>
                    <div><PlanBadge plan={u.plan} /></div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{fmtDate(u.joinedAt)}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{fmtDateTime(u.lastLogin)}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>{u.tradeCount}</div>
                    <div style={{ display: 'flex', gap: 5 }}>
                      {PLAN_ACTIONS.filter(a => a.plan !== u.plan).map(a => (
                        <button
                          key={a.plan}
                          disabled={planUpdating === u.id}
                          onClick={() => setConfirmAction({ userId: u.id, email: u.email, plan: a.plan })}
                          style={{
                            padding: '3px 8px', border: `1px solid ${a.color}40`,
                            background: `${a.color}10`, color: a.color,
                            borderRadius: 4, fontSize: 10, fontWeight: 700,
                            cursor: 'pointer', letterSpacing: '0.3px',
                            opacity: planUpdating === u.id ? 0.4 : 1,
                            transition: 'background 0.1s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = `${a.color}25`}
                          onMouseLeave={e => e.currentTarget.style.background = `${a.color}10`}
                        >
                          {a.label}
                        </button>
                      ))}
                      {planUpdating === u.id && (
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', alignSelf: 'center' }}>Saving…</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Referrals section */}
            <div>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 12,
              }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>
                  Referral Codes
                  <span style={{
                    fontSize: 11, color: G, background: `${G}15`,
                    border: `1px solid ${G}30`, borderRadius: 4, padding: '1px 7px',
                    marginLeft: 10,
                  }}>
                    {referrals.length}
                  </span>
                </div>
                <button
                  onClick={() => setShowAssign(true)}
                  style={{
                    padding: '6px 14px', background: `${G}15`,
                    border: `1px solid ${G}50`, color: G,
                    borderRadius: 6, fontSize: 12, fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'Barlow, sans-serif',
                  }}
                >
                  + Assign Code
                </button>
              </div>

              <div style={{
                background: '#0a0a0a', border: '1px solid rgba(0,255,65,0.1)',
                borderRadius: 8, overflow: 'hidden',
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '2.5fr 120px 120px 80px 120px',
                  padding: '9px 14px',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  fontSize: 10, letterSpacing: '0.8px', textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.3)',
                }}>
                  <div>User Email</div>
                  <div>Code</div>
                  <div>Created</div>
                  <div>Uses</div>
                  <div>Earnings</div>
                </div>

                {referrals.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>
                    No referral codes assigned yet
                  </div>
                )}

                {referrals.map((r, i) => (
                  <div
                    key={r.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2.5fr 120px 120px 80px 120px',
                      padding: '9px 14px',
                      borderBottom: i < referrals.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      alignItems: 'center',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,255,65,0.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }}>
                      {r.email}
                    </div>
                    <div style={{
                      fontSize: 12, fontWeight: 700, fontFamily: 'monospace',
                      color: G, letterSpacing: '1px',
                    }}>
                      {r.code}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{fmtDate(r.createdAt)}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{r.useCount}</div>
                    <div style={{ fontSize: 12, color: r.totalEarnings > 0 ? GOLD : 'rgba(255,255,255,0.4)' }}>
                      ${r.totalEarnings.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Confirm plan change modal */}
      <ConfirmModal
        action={confirmAction}
        onConfirm={executePlanChange}
        onCancel={() => setConfirmAction(null)}
      />

      {/* Assign referral code modal */}
      {showAssign && (
        <AssignModal
          token={token}
          onClose={() => setShowAssign(false)}
          onAssigned={load}
        />
      )}
    </div>
  );
}

// ─── Root export ───────────────────────────────────────────────────────────

export default function Admin() {
  const [token, setToken] = useState(() => localStorage.getItem(ADMIN_KEY) || null);

  // Verify stored token is still valid on mount
  useEffect(() => {
    if (!token) return;
    adminCall('/stats', token).catch(() => {
      localStorage.removeItem(ADMIN_KEY);
      setToken(null);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!token) {
    return <AdminLogin onLogin={t => setToken(t)} />;
  }

  return (
    <AdminDashboard
      token={token}
      onLogout={() => setToken(null)}
    />
  );
}
