import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../services/api';

const G    = '#00ff41';
const BG   = '#080c08';
const CARD = '#0d140d';

export default function ResetPassword() {
  const token = new URLSearchParams(window.location.search).get('token') || '';

  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [focused, setFocused]     = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!token) return setError('Invalid or missing reset token.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    if (password !== confirm) return setError('Passwords do not match.');
    setLoading(true);
    try {
      await api.resetPassword(token, password);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
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

      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <h1 style={{
          margin: 0,
          fontSize: '56px',
          fontWeight: '800',
          letterSpacing: '2px',
          lineHeight: 1,
          filter: 'drop-shadow(0 0 8px rgba(0,255,65,0.8)) drop-shadow(0 0 20px rgba(0,255,65,0.5)) drop-shadow(0 0 40px rgba(0,255,65,0.3))'
        }}>
          <span style={{ color: '#ffffff' }}>TRADER</span><span style={{ color: '#00ff41' }}>ASCEND</span>
        </h1>
      </div>

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
        {success ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: `${G}18`, border: `1.5px solid ${G}50`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 18px', fontSize: 24, color: G,
            }}>✓</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
              Password updated!
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.55, marginBottom: 24 }}>
              Your password has been changed. You can now sign in with your new password.
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => { window.location.href = '/'; }}
              style={{
                width: '100%', padding: '14px 0', borderRadius: 12,
                background: G, color: '#000', border: 'none',
                cursor: 'pointer',
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 17, fontWeight: 900, letterSpacing: '2px',
                textTransform: 'uppercase',
                boxShadow: `0 0 28px ${G}45`,
              }}
            >
              Sign In
            </motion.button>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 6 }}>
                Set a new password
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
                Choose a strong password — at least 6 characters.
              </div>
            </div>

            {!token && (
              <div style={{
                background: 'rgba(255,45,45,0.1)', border: '1px solid rgba(255,45,45,0.35)',
                borderRadius: 8, padding: '10px 14px',
                fontSize: 13, color: '#ff4444', marginBottom: 16, lineHeight: 1.5,
              }}>
                Missing reset token. Please use the link from your email.
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>New Password</label>
                <input type="password" placeholder="Min. 6 characters"
                  value={password} onChange={e => setPassword(e.target.value)}
                  required autoComplete="new-password"
                  style={inp('password')}
                  onFocus={() => setFocused('password')} onBlur={() => setFocused('')} />
              </div>
              <div style={{ marginBottom: 22 }}>
                <label style={lbl}>Confirm Password</label>
                <input type="password" placeholder="Repeat your password"
                  value={confirm} onChange={e => setConfirm(e.target.value)}
                  required autoComplete="new-password"
                  style={inp('confirm')}
                  onFocus={() => setFocused('confirm')} onBlur={() => setFocused('')} />
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

              <motion.button type="submit" disabled={loading || !token} whileTap={{ scale: 0.97 }}
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
                {loading ? 'Please wait…' : 'Update Password'}
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
