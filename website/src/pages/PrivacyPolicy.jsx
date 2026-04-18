import { useNavigate } from 'react-router-dom';
const G = '#00ff41';

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 36 }}>
    <div style={{ fontSize: 13, fontWeight: 700, color: G, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 12, paddingBottom: 8, borderBottom: `1px solid ${G}22` }}>
      {title}
    </div>
    <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.75 }}>{children}</div>
  </div>
);
const P = ({ children }) => <p style={{ margin: '0 0 12px 0' }}>{children}</p>;
const Ul = ({ items }) => (
  <ul style={{ margin: '8px 0 12px 0', paddingLeft: 20 }}>
    {items.map((item, i) => <li key={i} style={{ marginBottom: 6 }}>{item}</li>)}
  </ul>
);

export default function PrivacyPolicy({ embedded = false }) {
  const navigate = useNavigate();
  return (
    <div style={{ background: '#080c08', minHeight: embedded ? 'auto' : '100dvh', color: '#fff', fontFamily: 'sans-serif' }}>
      {!embedded && (
        <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(8,12,8,0.95)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${G}12`, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: 'rgba(255,255,255,0.5)', fontSize: 13, cursor: 'pointer', fontWeight: 600, padding: '6px 12px' }}>
            ‹ Back
          </button>
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '1.5px', color: G, textTransform: 'uppercase' }}>TraderAscend</span>
        </div>
      )}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 80px' }}>
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 38, fontWeight: 900, color: '#fff', margin: '0 0 10px 0' }}>Privacy <span style={{ color: G }}>Policy</span></h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: 0 }}>Effective Date: April 14, 2026</p>
        </div>
        <Section title="1. Introduction"><P>Welcome to TraderAscend. We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our trading journal and analytics platform.</P><P>If you have questions about this policy, please contact us at <span style={{ color: G }}>support@traderascend.com</span>.</P></Section>
        <Section title="2. Data We Collect"><P><strong style={{ color: '#fff' }}>Account Information</strong></P><Ul items={['Name (optional)', 'Email address', 'Password (stored as a secure bcrypt hash — we never store plaintext passwords)']} /><P><strong style={{ color: '#fff' }}>Trading Data</strong></P><Ul items={['Trade records: symbol, date, setup type, P&L, direction, and notes', 'Journal entries and daily notes', 'Trade screenshots you choose to upload', 'Account names and linked account configurations', 'AI coaching session messages and responses', 'Trading plan content you create through the AI Plan Builder']} /><P><strong style={{ color: '#fff' }}>Payment Information</strong></P><P>All payment processing is handled by Stripe. We do not store your credit card number, CVV, or full billing details on our servers.</P></Section>
        <Section title="3. How We Use Your Data"><Ul items={['To provide and operate the TraderAscend service', 'To power AI coaching features using your trading journal data', 'To calculate statistics, analytics, and performance metrics displayed in your dashboard', 'To send transactional emails (e.g., password reset links)', 'To detect and prevent fraud, abuse, or security incidents', 'To improve and develop new features for the platform', 'To comply with legal obligations']} /></Section>
        <Section title="4. We Never Sell Your Data"><P>We do not sell, rent, trade, or otherwise transfer your personal information or trading data to third parties for their marketing or commercial purposes.</P></Section>
        <Section title="5. Third-Party Services"><Ul items={['Stripe (payment processing)', 'Anthropic (AI) — processes your trading journal messages to generate AI coaching responses', 'Render (cloud hosting)', 'Resend (transactional email)']} /></Section>
        <Section title="6. Data Retention"><P>We retain your data for as long as your account remains active. If you delete your account, we will permanently delete your personal information and trading data within 30 days.</P></Section>
        <Section title="7. Your Rights"><Ul items={['Access: request a copy of the data we hold about you', 'Correction: request correction of inaccurate data', 'Deletion: request deletion of your account and all associated data', 'Portability: request an export of your trading data']} /><P>Contact us at <span style={{ color: G }}>support@traderascend.com</span>.</P></Section>
        <Section title="8. Security"><Ul items={['Passwords are hashed using bcrypt', 'All data in transit is encrypted using TLS/HTTPS', 'API access requires JWT token authentication', 'Payment data is handled exclusively by Stripe']} /></Section>
        <Section title="9. Children's Privacy"><P>TraderAscend is not intended for users under the age of 18. We do not knowingly collect personal information from anyone under 18.</P></Section>
        <Section title="10. Contact Us"><P>Email: <span style={{ color: G }}>support@traderascend.com</span></P></Section>
        {!embedded && (
          <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.07)', fontSize: 12, color: 'rgba(255,255,255,0.25)', textAlign: 'center' }}>
            © 2026 TraderAscend · <button onClick={() => navigate('/terms')} style={{ background: 'none', border: 'none', color: G, cursor: 'pointer', fontSize: 12 }}>Terms of Service</button>
          </div>
        )}
      </div>
    </div>
  );
}
