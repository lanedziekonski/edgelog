import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle } from 'lucide-react';

const G = '#00ff41';
const API = 'https://edgelog.onrender.com/api';

export default function ForgotPassword() {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [sent, setSent]       = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await fetch(`${API}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      setSent(true); // always show success to prevent email enumeration
    } catch {
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#080c08' }}>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(0,255,65,0.12) 0%, transparent 70%)' }}
      />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <Link to="/">
            <h1
              className="text-4xl font-bold tracking-tight leading-none"
              style={{ filter: 'drop-shadow(0 0 8px rgba(0,255,65,0.5))' }}
            >
              <span style={{ color: '#fff' }}>TRADER</span>
              <span style={{ color: G }}>ASCEND</span>
            </h1>
          </Link>
          <p className="mt-3 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Reset your password
          </p>
        </div>

        <div className="rounded-2xl p-8" style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.07)' }}>
          {sent ? (
            <div className="text-center py-4 space-y-4">
              <CheckCircle className="w-12 h-12 mx-auto" style={{ color: G }} />
              <p className="font-semibold">Check your email</p>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                If an account exists for <strong style={{ color: 'rgba(255,255,255,0.8)' }}>{email}</strong>, a password reset link has been sent.
              </p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
                Check your spam folder if you don't see it within a few minutes.
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-5 px-4 py-3 rounded-lg text-sm"
                  style={{ background: 'rgba(255,60,60,0.08)', border: '1px solid rgba(255,60,60,0.25)', color: '#ff6b6b' }}>
                  {error}
                </div>
              )}
              <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Enter your email and we'll send you a link to reset your password.
              </p>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                    onFocus={e => { e.target.style.borderColor = `${G}60`; }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                  />
                </div>
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileTap={!loading ? { scale: 0.98 } : {}}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-sm tracking-wide transition-all"
                  style={{ background: loading ? `${G}70` : G, color: '#000', cursor: loading ? 'wait' : 'pointer' }}
                >
                  {loading ? 'Sending…' : (<>Send Reset Link <ArrowRight className="w-4 h-4" /></>)}
                </motion.button>
              </form>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Remembered your password?{' '}
          <Link to="/login" className="font-medium hover:underline" style={{ color: G }}>
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
