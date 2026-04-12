import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Auth() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        await register(email, password, name);
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 20px',
    }}>
      {/* Logo */}
      <div style={{ marginBottom: 40, textAlign: 'center' }}>
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 42,
          fontWeight: 700,
          letterSpacing: '2px',
          textTransform: 'uppercase',
          color: 'var(--text)',
          lineHeight: 1,
        }}>
          Edge<span style={{ color: 'var(--green)' }}>Log</span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6, letterSpacing: '0.3px' }}>
          Your trading edge, tracked.
        </div>
      </div>

      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: 400,
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '28px 24px',
      }}>
        {/* Mode toggle */}
        <div style={{
          display: 'flex',
          background: 'var(--surface)',
          borderRadius: 10,
          padding: 3,
          marginBottom: 24,
          border: '1px solid var(--border)',
        }}>
          {[['login', 'Sign In'], ['signup', 'Create Account']].map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => { setMode(val); setError(''); }}
              style={{
                flex: 1,
                padding: '9px 0',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                fontFamily: "'Barlow Condensed', sans-serif",
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                background: mode === val ? 'var(--green)' : 'transparent',
                color: mode === val ? '#000' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="form-field">
              <label className="form-label">Name</label>
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={e => setName(e.target.value)}
                autoComplete="name"
              />
            </div>
          )}

          <div className="form-field">
            <label className="form-label">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-field" style={{ marginBottom: 20 }}>
            <label className="form-label">Password</label>
            <input
              type="password"
              placeholder={mode === 'signup' ? 'Min. 6 characters' : '••••••••'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            />
          </div>

          {error && (
            <div style={{
              background: 'var(--red-dim)',
              border: '1px solid var(--red)',
              borderRadius: 8,
              padding: '10px 12px',
              fontSize: 13,
              color: 'var(--red)',
              marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            {loading ? 'Please wait…' : mode === 'signup' ? 'Create Account' : 'Sign In'}
          </button>
        </form>
      </div>

      {/* Plan teaser */}
      <div style={{ marginTop: 28, textAlign: 'center' }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>Plans from Free to Elite</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          {[
            { label: 'Free', color: '#888' },
            { label: 'Trader', color: '#6c63ff' },
            { label: 'Pro', color: '#f0a500' },
            { label: 'Elite', color: '#00f07a' },
          ].map(p => (
            <span key={p.label} style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '3px 9px',
              borderRadius: 20,
              background: `${p.color}18`,
              color: p.color,
              border: `1px solid ${p.color}44`,
              letterSpacing: '0.3px',
            }}>
              {p.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
