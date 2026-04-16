import React from 'react';
import { useAccountFilter } from '../context/AccountFilterContext';

const G = '#00ff41';

export default function AccountSelector({ accounts = [] }) {
  const { selectedAccountId, setSelectedAccountId } = useAccountFilter();

  if (accounts.length === 0) return null;

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <select
        value={selectedAccountId || ''}
        onChange={e => setSelectedAccountId(e.target.value || null)}
        style={{
          appearance: 'none',
          WebkitAppearance: 'none',
          background: selectedAccountId ? `${G}12` : '#111811',
          border: `1px solid ${selectedAccountId ? `${G}50` : 'rgba(255,255,255,0.12)'}`,
          borderRadius: 20,
          padding: '5px 28px 5px 12px',
          fontSize: 12,
          fontWeight: 600,
          fontFamily: "'Barlow', sans-serif",
          color: selectedAccountId ? G : 'rgba(255,255,255,0.6)',
          cursor: 'pointer',
          outline: 'none',
          minWidth: 120,
          transition: 'all 0.15s',
        }}
      >
        <option value="">All Accounts</option>
        {accounts.map(a => (
          <option key={a.id} value={a.id}>{a.name}</option>
        ))}
      </select>
      {/* Chevron */}
      <svg
        width="10" height="10" viewBox="0 0 24 24"
        fill="none" stroke={selectedAccountId ? G : 'rgba(255,255,255,0.4)'}
        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        style={{ position: 'absolute', right: 10, pointerEvents: 'none' }}
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </div>
  );
}
