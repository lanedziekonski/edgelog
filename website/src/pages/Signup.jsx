import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const G = '#00ff41';

export default function Signup() {
  const { signup } = useAuth();
  const navigate    = useNavigate();
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await signup(email.trim(), password, name.trim() || undefined);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Signup failed — please try again');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff',
  };

  const focusHandler = e => { e.target.style.borderColor = `${G}60`; };
  const blurHandler  = e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: '#080c08' }}
    >
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
            Create your free account
          </p>
        </div>

        <div
          className="rounded-2xl p-8"
          style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          {error && (
            <div
              className="mb-5 px-4 py-3 rounded-lg text-sm"
              style={{ background: 'rgba(255,60,60,0.08)', border: '1px solid rgba(255,60,60,0.25)', color: '#ff6b6b' }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Name <span style={{ color: 'rgba(255,255,255,0.25)' }}>(optional)</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
                style={inputStyle}
                onFocus={focusHandler}
                onBlur={blurHandler}
              />
            </div>

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
                style={inputStyle}
                onFocus={focusHandler}
                onBlur={blurHandler}
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="Min 6 characters"
                  className="w-full px-4 py-3 pr-11 rounded-lg text-sm outline-none transition-all"
                  style={inputStyle}
                  onFocus={focusHandler}
                  onBlur={blurHandler}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'rgba(255,255,255,0.3)' }}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileTap={!loading ? { scale: 0.98 } : {}}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-sm tracking-wide transition-all"
              style={{ background: loading ? `${G}70` : G, color: '#000', cursor: loading ? 'wait' : 'pointer' }}
            >
              {loading ? 'Creating account…' : (<>Create Account <ArrowRight className="w-4 h-4" /></>)}
            </motion.button>
          </form>

          <p className="mt-5 text-center text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Free forever · No credit card required
          </p>
        </div>

        <p className="mt-6 text-center text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Already have an account?{' '}
          <Link to="/login" className="font-medium hover:underline" style={{ color: G }}>
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
