import React, { useState } from 'react';
import { motion } from 'framer-motion';

const G    = '#00ff41';
const BG   = '#080c08';
const CARD = '#0d140d';

export default function ForgotPassword() {
  const [email, setEmail]       = useState('');
  const [focused, setFocused]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [done, setDone]         = useState(false);

  const inp = {
    width: '100%', padding: '12px 14px',
    background: BG,
    border: `1px solid ${focused === 'email' ? G : 'rgba(255,255,255,0.1)'}`,
    borderRadius: 10, color: '#fff', fontSize: 14,
    fontFamily: 'Barlow, sans-serif', outline: 'none',
    boxSizing: 'border-box', transition: 'border-color 0.15s',
    boxShadow: focused === 'email' ? `0 0 0 3px ${G}14` : 'none',
  };

  const lbl = {
    fontSize: 11, fontWeight: 700, letterSpacing: '1px',
    textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)',
    marginBottom: 6, display: 'block',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const base = import.meta.env.VITE_API_URL
        ? `${import.meta.env.VITE_API_URL}/api`
        : 'https://edgelog.onrender.com/api';
      const res = await fetch(`${base}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok || res.status === 200) {
        setDone(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      setError(err?.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
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
      {/* Top glow */}
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
      <button
        onClick={() => { window.location.href = '/'; }}
        style={{
          position: 'absolute', top: 20, left: 20,
          background: 'none', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8, color: 'rgba(255,255,255,0.4)',
          fontSize: 13, cursor: 'pointer', fontFamily: 'Barlow', fontWeight: 600,
          padding: '6px 12px', letterSpacing: '0.3px',
          display: 'flex', alignItems: 'center', gap: 4,
          transition: 'color 0.15s, border-color 0.15s', zIndex: 2,
        }}
        onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
      >
        ‹ Back to Sign In
      </button>

      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <h1 style={{ color: '#00ff41', fontSize: '28px', fontWeight: '700', letterSpacing: '2px', margin: 0 }}>
          TraderAscend
        </h1>
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        style={{
          width: '100%', maxWidth: 400, position: 'relative', zIndex: 1,
          background: CARD, border: `1px solid ${G}22`,
          borderRadius: 20, padding: '28px 24px',
          boxShadow: `0 0 80px ${G}07, 0 28px 60px rgba(0,0,0,0.55)`,
        }}
      >
        {done ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: `${G}18`, border: `1.5px solid ${G}50`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 18px', fontSize: 24, color: G,
            }}>✓</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
              Check your inbox
            </div>
            <div style={{
              background: `${G}12`, border: `1px solid ${G}35`,
              borderRadius: 10, padding: '14px 16px', marginBottom: 22,
              fontSize: 13, color: G, lineHeight: 1.6, textAlign: 'left',
            }}>
              A reset link is on its way if that email is registered with TraderAscend.
            </div>
            <button
              onClick={() => { window.location.href = '/'; }}
              style={{
                width: '100%', padding: '12px 0', borderRadius: 10,
                background: 'transparent', border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.5)', fontFamily: 'Barlow', fontSize: 14,
                fontWeight: 600, cursor: 'pointer',
              }}
            >
              ← Back to Sign In
            </button>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
                Reset your password
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.55 }}>
                Enter your email and we'll send a reset link if an account exists.
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 22 }}>
                <label style={lbl}>Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
                  style={inp}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused('')}
                />
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

              <motion.button
                type="submit"
                disabled={loading}
                whileTap={{ scale: 0.97 }}
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
                {loading ? 'Sending…' : 'Send Reset Link'}
              </motion.button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button
                type="button"
                onClick={() => { window.location.href = '/'; }}
                style={{
                  background: 'none', border: 'none', padding: 0,
                  fontSize: 13, color: 'rgba(255,255,255,0.35)',
                  cursor: 'pointer', fontFamily: 'Barlow',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.7)'}
                onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.35)'}
              >
                ← Back to Sign In
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
