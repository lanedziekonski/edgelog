import React from 'react';

const G   = '#00ff41';
const BG  = '#080c08';

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 36 }}>
    <div style={{
      fontSize: 13, fontWeight: 700, color: G,
      letterSpacing: '2px', textTransform: 'uppercase',
      marginBottom: 12, paddingBottom: 8,
      borderBottom: `1px solid ${G}22`,
    }}>
      {title}
    </div>
    <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.75 }}>
      {children}
    </div>
  </div>
);

const P = ({ children }) => <p style={{ margin: '0 0 12px 0' }}>{children}</p>;
const Ul = ({ items }) => (
  <ul style={{ margin: '8px 0 12px 0', paddingLeft: 20 }}>
    {items.map((item, i) => (
      <li key={i} style={{ marginBottom: 6 }}>{item}</li>
    ))}
  </ul>
);

export default function PrivacyPolicy() {
  return (
    <div style={{ background: BG, minHeight: '100dvh', color: '#fff', fontFamily: "'Barlow', sans-serif" }}>
      {/* Back button */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(8,12,8,0.95)', backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${G}12`,
        padding: '12px 20px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button
          onClick={() => { window.location.href = '/'; }}
          style={{
            background: 'none', border: `1px solid rgba(255,255,255,0.12)`,
            borderRadius: 8, color: 'rgba(255,255,255,0.5)',
            fontSize: 13, cursor: 'pointer', fontFamily: 'Barlow', fontWeight: 600,
            padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 4,
            transition: 'color 0.15s, border-color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
        >
          ‹ Back to App
        </button>
        <div style={{ textAlign: 'center', marginBottom: '24px', paddingTop: '16px' }}>
          <h1 style={{
            margin: 0,
            fontSize: '32px',
            fontWeight: '800',
            letterSpacing: '2px',
            lineHeight: 1,
            filter: 'drop-shadow(0 0 6px rgba(0,255,65,0.6))'
          }}>
            <span style={{ color: '#ffffff' }}>TRADER</span><span style={{ color: '#00ff41' }}>ASCEND</span>
          </h1>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 80px' }}>
        <div style={{ marginBottom: 40 }}>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 38, fontWeight: 900, letterSpacing: '1px',
            color: '#fff', lineHeight: 1, marginBottom: 10,
          }}>
            Privacy <span style={{ color: G }}>Policy</span>
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
            Effective Date: April 14, 2026
          </div>
        </div>

        <Section title="1. Introduction">
          <P>Welcome to TraderAscend. We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our trading journal and analytics platform.</P>
          <P>TraderAscend ("we," "us," or "our") operates the TraderAscend web application. By using our service, you agree to the collection and use of information in accordance with this policy.</P>
          <P>If you have questions about this policy, please contact us at <span style={{ color: G }}>support@traderascend.com</span>.</P>
        </Section>

        <Section title="2. Data We Collect">
          <P><strong style={{ color: '#fff' }}>Account Information</strong></P>
          <Ul items={[
            'Name (optional)',
            'Email address',
            'Password (stored as a secure bcrypt hash — we never store plaintext passwords)',
          ]} />
          <P><strong style={{ color: '#fff' }}>Trading Data</strong></P>
          <Ul items={[
            'Trade records: symbol, date, setup type, P&L, direction, and notes',
            'Journal entries and daily notes',
            'Trade screenshots you choose to upload',
            'Account names and linked account configurations',
            'AI coaching session messages and responses',
            'Trading plan content you create through the AI Plan Builder',
          ]} />
          <P><strong style={{ color: '#fff' }}>Usage Data</strong></P>
          <Ul items={[
            'Pages and features accessed within the app',
            'Browser type, device type, and operating system',
            'IP address and general geographic region',
            'Date and time of access',
          ]} />
          <P><strong style={{ color: '#fff' }}>Payment Information</strong></P>
          <P>All payment processing is handled by Stripe. We do not store your credit card number, CVV, or full billing details on our servers. We retain only a Stripe customer ID and subscription status to manage your plan.</P>
        </Section>

        <Section title="3. How We Use Your Data">
          <Ul items={[
            'To provide and operate the TraderAscend service',
            'To power AI coaching features using your trading journal data',
            'To calculate statistics, analytics, and performance metrics displayed in your dashboard',
            'To send transactional emails (e.g., password reset links)',
            'To respond to customer support requests',
            'To detect and prevent fraud, abuse, or security incidents',
            'To improve and develop new features for the platform',
            'To comply with legal obligations',
          ]} />
        </Section>

        <Section title="4. We Never Sell Your Data">
          <P>We do not sell, rent, trade, or otherwise transfer your personal information or trading data to third parties for their marketing or commercial purposes. Your data is used solely to provide and improve the TraderAscend service for you.</P>
        </Section>

        <Section title="5. Third-Party Services">
          <P>We use the following third-party services to operate TraderAscend. Each has its own privacy policy governing how they handle data:</P>
          <Ul items={[
            'Stripe (payment processing) — handles all subscription billing and payment information',
            'Anthropic (AI) — processes your trading journal messages to generate AI coaching responses',
            'Render (cloud hosting) — hosts the TraderAscend backend servers and database',
            'Resend (transactional email) — sends password reset and notification emails',
          ]} />
          <P>We only share the minimum data necessary with each provider to perform their specific function. We do not authorize these providers to use your data for their own independent purposes beyond providing services to us.</P>
        </Section>

        <Section title="6. Data Retention">
          <P>We retain your data for as long as your account remains active. If you delete your account, we will permanently delete your personal information and trading data within 30 days of account deletion, except where we are required to retain it for legal or financial compliance purposes.</P>
          <P>Backups may retain data for up to an additional 30 days after deletion before being purged from all backup systems.</P>
        </Section>

        <Section title="7. Your Rights">
          <P>You have the following rights with respect to your personal data:</P>
          <Ul items={[
            'Access: request a copy of the data we hold about you',
            'Correction: request correction of inaccurate data',
            'Deletion: request deletion of your account and all associated data',
            'Portability: request an export of your trading data in a machine-readable format',
            'Objection: object to certain types of data processing',
          ]} />
          <P>To exercise any of these rights, contact us at <span style={{ color: G }}>support@traderascend.com</span>. We will respond to verified requests within 30 days.</P>
        </Section>

        <Section title="8. Security">
          <P>We implement industry-standard security measures to protect your data:</P>
          <Ul items={[
            'Passwords are hashed using bcrypt — we cannot retrieve your plaintext password',
            'All data in transit is encrypted using TLS/HTTPS',
            'Database access is restricted and requires authentication',
            'API access requires JWT token authentication',
            'Payment data is handled exclusively by Stripe and never touches our servers',
          ]} />
          <P>No method of transmission over the internet or electronic storage is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.</P>
        </Section>

        <Section title="9. Children's Privacy">
          <P>TraderAscend is not intended for users under the age of 18. We do not knowingly collect personal information from anyone under 18. If you believe a minor has provided us with personal information, please contact us at <span style={{ color: G }}>support@traderascend.com</span> and we will promptly delete it.</P>
        </Section>

        <Section title="10. Changes to This Policy">
          <P>We may update this Privacy Policy from time to time. We will notify you of significant changes by updating the effective date at the top of this page and, where appropriate, by sending a notification to your registered email address. Your continued use of TraderAscend after any changes constitutes acceptance of the updated policy.</P>
        </Section>

        <Section title="11. Contact Us">
          <P>If you have questions, concerns, or requests regarding this Privacy Policy, please contact us:</P>
          <P>Email: <span style={{ color: G }}>support@traderascend.com</span></P>
        </Section>

        <div style={{
          marginTop: 48, paddingTop: 24,
          borderTop: `1px solid rgba(255,255,255,0.07)`,
          fontSize: 12, color: 'rgba(255,255,255,0.25)', textAlign: 'center',
        }}>
          © 2026 TraderAscend · <button onClick={() => { window.location.href = '/terms-of-service'; }} style={{ background: 'none', border: 'none', color: G, cursor: 'pointer', fontSize: 12, padding: 0, fontFamily: 'Barlow' }}>Terms of Service</button>
        </div>
      </div>
    </div>
  );
}
