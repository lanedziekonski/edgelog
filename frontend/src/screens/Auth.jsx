import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const G   = '#00ff41';
const BG  = '#080c08';
const CARD = '#0d140d';

const PLAN_PILLS = [
  { label: 'Free',   color: '#888888' },
  { label: 'Trader', color: '#6c63ff' },
  { label: 'Pro',    color: '#f0a500' },
  { label: 'Elite',  color: '#00f07a' },
];

export default function Auth({ onClose, initialMode = 'signup' }) {
  const { login, register } = useAuth();
  const [mode, setMode]       = useState(initialMode);
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [focused, setFocused] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'signup') await register(email, password, name);
      else                   await login(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inp = (field) => ({
    width: '100%',
    padding: '12px 14px',
    background: BG,
    border: `1px solid ${focused === field ? G : 'rgba(255,255,255,0.1)'}`,
    borderRadius: 10,
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Barlow, sans-serif',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
    boxShadow: focused === field ? `0 0 0 3px ${G}14` : 'none',
  });

  const lbl = {
    fontSize: 11, fontWeight: 700, letterSpacing: '1px',
    textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)',
    marginBottom: 6, display: 'block',
  };

  return (
    <div style={{
      minHeight: '100dvh', background: BG,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px 20px', position: 'relative', overflow: 'hidden',
    }}>
      {/* Grid texture */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `linear-gradient(${G}04 1px, transparent 1px), linear-gradient(90deg, ${G}04 1px, transparent 1px)`,
        backgroundSize: '44px 44px',
      }} />
      {/* Top ambient glow */}
      <div style={{
        position: 'absolute', top: '-15%', left: '50%', transform: 'translateX(-50%)',
        width: 500, height: 380, pointerEvents: 'none',
        background: `radial-gradient(ellipse, ${G}0a 0%, transparent 68%)`,
      }} />
      {/* Watermark */}
      <motion.div
        animate={{ opacity: [0.025, 0.06, 0.025] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', bottom: '8%', right: '-4%',
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 'clamp(72px, 18vw, 150px)', fontWeight: 900,
          color: G, letterSpacing: 6,
          userSelect: 'none', pointerEvents: 'none', lineHeight: 1,
          transform: 'rotate(-10deg)',
        }}
      >ASCEND</motion.div>

      {/* Back button */}
      {onClose && (
        <button onClick={onClose} style={{
          position: 'absolute', top: 20, left: 20,
          background: 'none', border: `1px solid rgba(255,255,255,0.1)`,
          borderRadius: 8, color: 'rgba(255,255,255,0.4)',
          fontSize: 13, cursor: 'pointer',
          fontFamily: 'Barlow', fontWeight: 600,
          padding: '6px 12px', letterSpacing: '0.3px',
          display: 'flex', alignItems: 'center', gap: 4,
          transition: 'color 0.15s, border-color 0.15s',
          zIndex: 2,
        }}>
          ‹ Back
        </button>
      )}

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        style={{ marginBottom: 32, textAlign: 'center', position: 'relative', zIndex: 1 }}
      >
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 46, fontWeight: 900, letterSpacing: '3px',
          textTransform: 'uppercase', color: '#fff', lineHeight: 1,
        }}>
          Trade<span style={{ color: G, textShadow: `0 0 24px ${G}70` }}>Ascend</span>
        </div>
        <div style={{
          fontSize: 11, color: 'rgba(255,255,255,0.28)',
          marginTop: 8, letterSpacing: '3px', textTransform: 'uppercase',
        }}>
          Your trading edge, tracked.
        </div>
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
        style={{
          width: '100%', maxWidth: 400, position: 'relative', zIndex: 1,
          background: CARD,
          border: `1px solid ${G}22`,
          borderRadius: 20, padding: '28px 24px',
          boxShadow: `0 0 80px ${G}07, 0 28px 60px rgba(0,0,0,0.55)`,
        }}
      >
        {/* Mode toggle */}
        <div style={{
          display: 'flex', background: BG,
          borderRadius: 10, padding: 3, marginBottom: 26,
          border: '1px solid rgba(255,255,255,0.07)',
        }}>
          {[['login', 'Sign In'], ['signup', 'Create Account']].map(([val, label]) => (
            <button
              key={val} type="button"
              onClick={() => { setMode(val); setError(''); }}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 8,
                fontSize: 13, fontWeight: 800,
                fontFamily: "'Barlow Condensed', sans-serif",
                letterSpacing: '1px', textTransform: 'uppercase',
                background: mode === val ? G : 'transparent',
                color: mode === val ? '#000' : 'rgba(255,255,255,0.35)',
                border: 'none', cursor: 'pointer',
                transition: 'background 0.15s, color 0.15s',
                boxShadow: mode === val ? `0 0 16px ${G}45` : 'none',
              }}
            >{label}</button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>Name</label>
              <input type="text" placeholder="Your name" value={name}
                onChange={e => setName(e.target.value)} autoComplete="name"
                style={inp('name')}
                onFocus={() => setFocused('name')} onBlur={() => setFocused('')} />
            </div>
          )}
          <div style={{ marginBottom: 16 }}>
            <label style={lbl}>Email</label>
            <input type="email" placeholder="you@example.com" value={email}
              onChange={e => setEmail(e.target.value)} required autoComplete="email"
              style={inp('email')}
              onFocus={() => setFocused('email')} onBlur={() => setFocused('')} />
          </div>
          <div style={{ marginBottom: 22 }}>
            <label style={lbl}>Password</label>
            <input type="password"
              placeholder={mode === 'signup' ? 'Min. 6 characters' : '••••••••'}
              value={password} onChange={e => setPassword(e.target.value)}
              required autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              style={inp('password')}
              onFocus={() => setFocused('password')} onBlur={() => setFocused('')} />
          </div>

          {error && (
            <div style={{
              background: 'rgba(255,45,45,0.1)', border: '1px solid rgba(255,45,45,0.35)',
              borderRadius: 8, padding: '10px 14px',
              fontSize: 13, color: '#ff4444', marginBottom: 16, lineHeight: 1.5,
            }}>
              {error}
            </div>
          )}

          <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.97 }}
            style={{
              width: '100%', padding: '14px 0', borderRadius: 12,
              background: loading ? `${G}66` : G,
              color: '#000', border: 'none',
              cursor: loading ? 'default' : 'pointer',
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 17, fontWeight: 900, letterSpacing: '2px',
              textTransform: 'uppercase',
              boxShadow: loading ? 'none' : `0 0 28px ${G}45`,
              transition: 'background 0.15s, box-shadow 0.15s',
            }}
          >
            {loading ? 'Please wait…' : mode === 'signup' ? 'Create Account' : 'Sign In'}
          </motion.button>
        </form>
      </motion.div>

      {/* Plan tier pills */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.4 }}
        style={{ marginTop: 24, textAlign: 'center', position: 'relative', zIndex: 1 }}
      >
        <div style={{
          fontSize: 10, color: 'rgba(255,255,255,0.18)',
          marginBottom: 10, letterSpacing: '2px', textTransform: 'uppercase',
        }}>
          Plans from Free to Elite
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          {PLAN_PILLS.map(p => (
            <span key={p.label} style={{
              fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
              background: `${p.color}14`, color: p.color,
              border: `1px solid ${p.color}35`, letterSpacing: '0.3px',
            }}>{p.label}</span>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
