import React from 'react';
import { motion } from 'framer-motion';

const G  = '#00ff41';
const BG = '#080c08';

export default function GuestGate({ onSignUp, onLogin }) {
  return (
    <div style={{
      minHeight: '100%',
      background: BG,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 32px 80px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Subtle grid texture */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `linear-gradient(${G}04 1px, transparent 1px), linear-gradient(90deg, ${G}04 1px, transparent 1px)`,
        backgroundSize: '44px 44px',
      }} />

      {/* Radial glow */}
      <div style={{
        position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 340, height: 240, pointerEvents: 'none',
        background: `radial-gradient(ellipse, ${G}09 0%, transparent 70%)`,
      }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          textAlign: 'center', maxWidth: 300, position: 'relative', zIndex: 1,
        }}
      >
        {/* Logo */}
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 22, fontWeight: 900, letterSpacing: '2px',
          textTransform: 'uppercase', color: '#fff', marginBottom: 28,
        }}>
          Trade<span style={{ color: G }}>Ascend</span>
        </div>

        {/* Lock icon */}
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: `${G}0e`,
          border: `1px solid ${G}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 20,
          boxShadow: `0 0 24px ${G}14`,
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
            stroke={G} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        {/* Message */}
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 22, fontWeight: 800, color: '#fff',
          letterSpacing: '0.3px', lineHeight: 1.2, marginBottom: 10,
        }}>
          Account Required
        </div>
        <div style={{
          fontSize: 14, color: 'rgba(255,255,255,0.42)',
          lineHeight: 1.6, marginBottom: 32,
        }}>
          You need an account to access this feature.
        </div>

        {/* Create Account button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onSignUp}
          style={{
            width: '100%', padding: '14px 0', borderRadius: 12,
            background: G, color: '#000', border: 'none',
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 16, fontWeight: 900, letterSpacing: '1.5px',
            textTransform: 'uppercase', cursor: 'pointer',
            boxShadow: `0 0 24px ${G}40`,
            marginBottom: 14,
          }}
        >
          Create Free Account
        </motion.button>

        {/* Sign In link */}
        <button
          onClick={onLogin}
          style={{
            background: 'none', border: 'none', padding: '4px 0',
            fontSize: 13, color: `${G}88`,
            cursor: 'pointer', fontFamily: 'Barlow, sans-serif',
            fontWeight: 500, transition: 'color 0.15s',
          }}
          onMouseEnter={e => e.target.style.color = G}
          onMouseLeave={e => e.target.style.color = `${G}88`}
        >
          Already have an account? Sign In
        </button>
      </motion.div>
    </div>
  );
}
