import React, { useState } from 'react';
import { motion } from 'framer-motion';

const G        = '#00ff41';
const STORAGE_KEY = 'tradeascend_terms_v1_accepted';

export function needsTermsAgreement() {
  return localStorage.getItem(STORAGE_KEY) !== 'true';
}

export default function TermsAgreementPopup({ onAccept }) {
  const [termsChecked,   setTermsChecked]   = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);

  const bothChecked = termsChecked && privacyChecked;

  const handleAccept = () => {
    if (!bothChecked) return;
    localStorage.setItem(STORAGE_KEY, 'true');
    onAccept();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.95)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px 20px',
        // no onClick on overlay — cannot be dismissed by clicking outside
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', damping: 26, stiffness: 300, delay: 0.05 }}
        style={{
          width: '100%', maxWidth: 420,
          background: '#0d0d0d',
          border: `1px solid ${G}`,
          borderRadius: 20,
          padding: '32px 28px 28px',
          boxShadow: `0 0 60px ${G}14, 0 32px 80px rgba(0,0,0,0.8)`,
        }}
      >
        {/* Logo */}
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 30, fontWeight: 900, letterSpacing: '2px',
          textTransform: 'uppercase', color: '#fff',
          marginBottom: 6,
        }}>
          Trader<span style={{ color: G, textShadow: `0 0 18px ${G}60` }}>Ascend</span>
        </div>

        {/* Subtext */}
        <div style={{
          fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6,
          marginBottom: 28,
        }}>
          Before you continue, please review and agree to our Terms of Service and Privacy Policy.
          This app is a trading journal and performance coaching tool only —&nbsp;
          <span style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>not financial advice.</span>
        </div>

        {/* Checkboxes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
          <CheckRow
            checked={termsChecked}
            onChange={setTermsChecked}
            label={
              <>
                I have read and agree to the{' '}
                <LinkOut href="/terms-of-service">Terms of Service</LinkOut>
              </>
            }
          />
          <CheckRow
            checked={privacyChecked}
            onChange={setPrivacyChecked}
            label={
              <>
                I have read and agree to the{' '}
                <LinkOut href="/privacy-policy">Privacy Policy</LinkOut>
              </>
            }
          />
        </div>

        {/* Continue button */}
        <motion.button
          onClick={handleAccept}
          disabled={!bothChecked}
          whileTap={bothChecked ? { scale: 0.97 } : {}}
          style={{
            width: '100%', padding: '14px 0', borderRadius: 12,
            background: bothChecked ? G : 'rgba(0,255,65,0.1)',
            color: bothChecked ? '#000' : 'rgba(0,255,65,0.35)',
            border: `1px solid ${bothChecked ? G : 'rgba(0,255,65,0.2)'}`,
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 17, fontWeight: 900, letterSpacing: '2px',
            textTransform: 'uppercase',
            cursor: bothChecked ? 'pointer' : 'default',
            boxShadow: bothChecked ? `0 0 28px ${G}45` : 'none',
            transition: 'background 0.2s, color 0.2s, box-shadow 0.2s, border-color 0.2s',
          }}
        >
          Continue
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

function CheckRow({ checked, onChange, label }) {
  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: 12,
      cursor: 'pointer', userSelect: 'none',
      minHeight: 44, paddingTop: 12, paddingBottom: 12,
    }}>
      {/* Custom checkbox — 22x22 minimum tap target */}
      <div
        onClick={() => onChange(v => !v)}
        style={{
          width: 22, height: 22, borderRadius: 5, flexShrink: 0,
          border: `2px solid ${checked ? G : 'rgba(255,255,255,0.25)'}`,
          background: checked ? G : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.15s, border-color 0.15s',
          boxShadow: checked ? `0 0 8px ${G}60` : 'none',
        }}
      >
        {checked && (
          <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
            <path d="M1 4L4.5 7.5L10 1" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
        {label}
      </span>
    </label>
  );
}

function LinkOut({ href, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={e => e.stopPropagation()}
      style={{
        color: G, textDecoration: 'underline',
        textDecorationColor: `${G}60`,
        fontWeight: 600,
      }}
    >
      {children}
    </a>
  );
}
