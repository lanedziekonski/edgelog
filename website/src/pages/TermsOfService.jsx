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
const DisclaimerBox = ({ children }) => (
  <div style={{ border: `2px solid ${G}`, borderRadius: 10, padding: '20px 24px', background: `${G}08`, margin: '16px 0', boxShadow: `0 0 24px ${G}12` }}>
    {children}
  </div>
);

export default function TermsOfService({ embedded = false }) {
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
          <h1 style={{ fontSize: 38, fontWeight: 900, color: '#fff', margin: '0 0 10px 0' }}>Terms of <span style={{ color: G }}>Service</span></h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: 0 }}>Effective Date: April 14, 2026</p>
        </div>
        <Section title="1. Acceptance of Terms"><P>By accessing or using TraderAscend, you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</P></Section>
        <Section title="2. Service Description"><P>TraderAscend is a trading journal, analytics, and performance coaching tool.</P><Ul items={['Log and track trades, P&L, and performance metrics', 'View analytics dashboards and calendars', 'Build and maintain a personal trading plan', 'Receive AI-powered coaching based on your journal data', 'Manage funded and personal trading accounts']} /></Section>
        <Section title="3. No Financial Advice Disclaimer">
          <DisclaimerBox>
            <div style={{ fontSize: 13, fontWeight: 800, color: G, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 14 }}>⚠ Important — Please Read Carefully</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 1.8 }}>
              <strong style={{ color: '#fff' }}>TRADEASCEND IS NOT A FINANCIAL ADVISOR.</strong> Nothing on this platform constitutes financial advice, investment advice, trading advice, or a recommendation to buy or sell any financial instrument.<br /><br />
              All AI coaching features are for <strong style={{ color: '#fff' }}>educational and performance improvement purposes only</strong>. Past performance does not guarantee future results.<br /><br />
              Trading financial instruments involves <strong style={{ color: '#fff' }}>substantial risk of loss</strong>. Consult a qualified licensed financial advisor before making any investment decisions.<br /><br />
              TraderAscend is <strong style={{ color: '#fff' }}>not responsible for any trading or investment losses</strong> incurred by users of this platform.
            </div>
          </DisclaimerBox>
        </Section>
        <Section title="4. Eligibility"><P>You must be at least 18 years of age to use TraderAscend.</P></Section>
        <Section title="5. Account Responsibilities"><Ul items={['Keeping your login credentials secure and confidential', 'All activity that occurs under your account', 'Providing accurate and truthful information', 'Notifying us immediately of any unauthorized access']} /></Section>
        <Section title="6. Subscriptions and Billing"><Ul items={['Subscriptions automatically renew unless cancelled', 'You may cancel at any time through the billing portal in your Profile', 'No refunds for partial subscription periods already paid', 'Prices subject to change with 30 days notice', 'All charges are in USD']} /></Section>
        <Section title="7. Acceptable Use Policy"><P>You agree not to hack, scrape, reverse engineer, or misuse the platform. Violation may result in immediate account termination.</P></Section>
        <Section title="8. Intellectual Property"><P>Your data is yours. You retain full ownership of your trading data, journal entries, and trading plans.</P></Section>
        <Section title="9. Disclaimer of Warranties"><P>THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. We do not guarantee uptime, accuracy of analytics, or that the Service will meet your requirements.</P></Section>
        <Section title="10. Limitation of Liability">
          <DisclaimerBox>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 1.8 }}>
              To the maximum extent permitted by law, TraderAscend shall not be liable for any <strong style={{ color: '#fff' }}>indirect, incidental, special, consequential, or punitive damages</strong>, including trading losses, arising from your use of the Service.<br /><br />
              Our <strong style={{ color: '#fff' }}>total liability</strong> shall not exceed the total amount you paid us in the three (3) months preceding the claim.
            </div>
          </DisclaimerBox>
        </Section>
        <Section title="11. Governing Law"><P>These Terms are governed by the laws of the State of Illinois, United States.</P></Section>
        <Section title="12. Contact"><P>Email: <span style={{ color: G }}>support@traderascend.com</span></P></Section>
        {!embedded && (
          <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.07)', fontSize: 12, color: 'rgba(255,255,255,0.25)', textAlign: 'center' }}>
            © 2026 TraderAscend · <button onClick={() => navigate('/privacy')} style={{ background: 'none', border: 'none', color: G, cursor: 'pointer', fontSize: 12 }}>Privacy Policy</button>
          </div>
        )}
      </div>
    </div>
  );
}
