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

const DisclaimerBox = ({ children }) => (
  <div style={{
    border: `2px solid ${G}`,
    borderRadius: 10,
    padding: '20px 24px',
    background: `${G}08`,
    margin: '16px 0',
    boxShadow: `0 0 24px ${G}12`,
  }}>
    {children}
  </div>
);

export default function TermsOfService() {
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
            Terms of <span style={{ color: G }}>Service</span>
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
            Effective Date: April 14, 2026
          </div>
        </div>

        <Section title="1. Acceptance of Terms">
          <P>By accessing or using TraderAscend ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Service.</P>
          <P>These Terms constitute a legally binding agreement between you and TraderAscend. We may update these Terms from time to time; continued use of the Service after changes constitutes acceptance.</P>
        </Section>

        <Section title="2. Service Description">
          <P>TraderAscend is a trading journal, analytics, and performance coaching tool. The Service allows users to:</P>
          <Ul items={[
            'Log and track trades, P&L, and performance metrics',
            'View analytics dashboards and calendars',
            'Build and maintain a personal trading plan',
            'Receive AI-powered coaching based on their journal data',
            'Manage funded and personal trading accounts',
          ]} />
        </Section>

        <Section title="3. No Financial Advice Disclaimer">
          <DisclaimerBox>
            <div style={{
              fontSize: 13, fontWeight: 800, color: G,
              letterSpacing: '1.5px', textTransform: 'uppercase',
              marginBottom: 14,
            }}>
              ⚠ Important — Please Read Carefully
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 1.8 }}>
              <strong style={{ color: '#fff' }}>TRADERASCEND IS NOT A FINANCIAL ADVISOR.</strong> Nothing on this platform constitutes financial advice, investment advice, trading advice, or a recommendation to buy or sell any financial instrument or security.
              <br /><br />
              All AI coaching features are for <strong style={{ color: '#fff' }}>educational and performance improvement purposes only</strong>. Past performance shown in your journal does not guarantee future results.
              <br /><br />
              Trading financial instruments involves <strong style={{ color: '#fff' }}>substantial risk of loss</strong> and is not suitable for all investors. You should consult a qualified licensed financial advisor before making any investment or trading decisions.
              <br /><br />
              TraderAscend, its owners, employees, and affiliates are <strong style={{ color: '#fff' }}>not responsible for any trading or investment losses</strong> incurred by users of this platform.
            </div>
          </DisclaimerBox>
        </Section>

        <Section title="4. Eligibility">
          <P>You must be at least 18 years of age to use TraderAscend. By using the Service, you represent and warrant that you are 18 or older and have the legal capacity to enter into these Terms.</P>
          <P>If you are using the Service on behalf of an organization, you represent that you have authority to bind that organization to these Terms.</P>
        </Section>

        <Section title="5. Account Responsibilities">
          <P>You are responsible for:</P>
          <Ul items={[
            'Keeping your login credentials secure and confidential',
            'All activity that occurs under your account',
            'Providing accurate and truthful information',
            'Notifying us immediately of any unauthorized access to your account',
          ]} />
          <P>You may not share your account with others or use another person's account without permission. We reserve the right to suspend accounts where credential sharing is detected.</P>
        </Section>

        <Section title="6. Subscriptions and Billing">
          <P>TraderAscend offers the following plan tiers: Free, Trader, Pro, and Elite. Paid plans are billed on a monthly or annual basis through Stripe.</P>
          <Ul items={[
            'Subscriptions automatically renew at the end of each billing period unless cancelled',
            'You may cancel your subscription at any time through the billing portal in your Profile',
            'Upon cancellation, your paid features remain active until the end of the current billing period',
            'We do not offer refunds for partial subscription periods already paid',
            'Prices are subject to change with 30 days notice to your registered email address',
            'All charges are in USD',
          ]} />
          <P>If a payment fails, we will attempt to retry the charge. If payment cannot be collected, your account may be downgraded to the Free tier.</P>
        </Section>

        <Section title="7. Acceptable Use Policy">
          <P>You agree not to use TraderAscend to:</P>
          <Ul items={[
            'Violate any applicable laws or regulations',
            'Attempt to hack, penetrate, or compromise the security of the platform',
            'Reverse engineer, decompile, or disassemble any portion of the Service',
            'Scrape, crawl, or systematically extract data from the platform',
            'Upload false, misleading, or fraudulent trade data',
            'Impersonate any person or entity',
            'Interfere with or disrupt the integrity or performance of the Service',
            'Use the Service for any purpose other than personal trading journaling and analytics',
          ]} />
          <P>Violation of this policy may result in immediate account termination.</P>
        </Section>

        <Section title="8. Intellectual Property">
          <P>TraderAscend owns all rights, title, and interest in and to the Service, including all software, design, trademarks, logos, and content created by us. These Terms do not grant you any ownership rights in the Service.</P>
          <P><strong style={{ color: '#fff' }}>Your data is yours.</strong> You retain full ownership of your trading data, journal entries, screenshots, and trading plans. We do not claim ownership of any content you create on the platform.</P>
        </Section>

        <Section title="9. User Content and License">
          <P>By uploading trade data, journal entries, screenshots, or other content to TraderAscend, you grant us a limited, non-exclusive, royalty-free license to store, process, and use that content solely for the purpose of providing the Service to you — including generating AI coaching responses and analytics.</P>
          <P>We do not use your trading data to train AI models for third parties, sell it, or use it for any purpose beyond operating the Service for you.</P>
        </Section>

        <Section title="10. Disclaimer of Warranties">
          <P>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMITTED BY LAW, TRADERASCEND DISCLAIMS ALL WARRANTIES INCLUDING:</P>
          <Ul items={[
            'Warranties of merchantability, fitness for a particular purpose, or non-infringement',
            'Guarantees of uptime, availability, or uninterrupted access',
            'Accuracy or completeness of any analytics, statistics, or AI-generated content',
            'That the Service will meet your specific requirements',
          ]} />
        </Section>

        <Section title="11. Limitation of Liability">
          <DisclaimerBox>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 1.8 }}>
              To the maximum extent permitted by law, TraderAscend and its affiliates, officers, employees, agents, and licensors shall not be liable for any <strong style={{ color: '#fff' }}>indirect, incidental, special, consequential, or punitive damages</strong>, including but not limited to loss of profits, loss of data, or trading losses, arising from your use of or inability to use the Service, even if we have been advised of the possibility of such damages.
              <br /><br />
              Our <strong style={{ color: '#fff' }}>total liability</strong> to you for any claims arising from or related to these Terms or the Service shall not exceed the <strong style={{ color: '#fff' }}>total amount you paid us in the three (3) months immediately preceding the claim</strong>.
            </div>
          </DisclaimerBox>
        </Section>

        <Section title="12. Indemnification">
          <P>You agree to indemnify, defend, and hold harmless TraderAscend and its affiliates, officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, costs, or expenses (including reasonable legal fees) arising from:</P>
          <Ul items={[
            'Your use of or access to the Service',
            'Your violation of these Terms',
            'Your violation of any third-party rights',
            'Any content you submit, post, or transmit through the Service',
          ]} />
        </Section>

        <Section title="13. Governing Law">
          <P>These Terms are governed by and construed in accordance with the laws of the State of Illinois, United States, without regard to its conflict of law provisions.</P>
          <P>You consent to the exclusive jurisdiction of the state and federal courts located in Illinois for any disputes arising from these Terms or the Service.</P>
        </Section>

        <Section title="14. Dispute Resolution">
          <P>Any dispute, claim, or controversy arising from or relating to these Terms or the Service shall be resolved by <strong style={{ color: '#fff' }}>binding individual arbitration</strong> rather than in court, except that you may assert claims in small claims court if your claims qualify.</P>
          <P><strong style={{ color: '#fff' }}>CLASS ACTION WAIVER:</strong> You agree that any arbitration or proceeding shall be limited to the dispute between us individually. To the fullest extent permitted by law, you waive the right to participate in any class action, class arbitration, or representative proceeding.</P>
          <P>This arbitration provision does not apply to claims for injunctive or equitable relief to protect intellectual property rights.</P>
        </Section>

        <Section title="15. Termination">
          <P>We reserve the right to suspend or terminate your account and access to the Service at our discretion, without notice, for conduct that we determine violates these Terms, is harmful to other users, or is otherwise objectionable.</P>
          <P>You may terminate your account at any time by contacting us at <span style={{ color: G }}>support@traderascend.com</span>. Upon termination, your right to use the Service ceases immediately.</P>
          <P>Sections covering intellectual property, disclaimers, limitation of liability, indemnification, and governing law survive termination.</P>
        </Section>

        <Section title="16. Changes to Terms">
          <P>We may modify these Terms at any time. We will notify you of material changes by updating the effective date and sending an email to your registered address. Your continued use of the Service after changes take effect constitutes acceptance of the revised Terms.</P>
        </Section>

        <Section title="17. Contact">
          <P>Questions about these Terms? Contact us:</P>
          <P>Email: <span style={{ color: G }}>support@traderascend.com</span></P>
        </Section>

        <div style={{
          marginTop: 48, paddingTop: 24,
          borderTop: `1px solid rgba(255,255,255,0.07)`,
          fontSize: 12, color: 'rgba(255,255,255,0.25)', textAlign: 'center',
        }}>
          © 2026 TraderAscend · <button onClick={() => { window.location.href = '/privacy-policy'; }} style={{ background: 'none', border: 'none', color: G, cursor: 'pointer', fontSize: 12, padding: 0, fontFamily: 'Barlow' }}>Privacy Policy</button>
        </div>
      </div>
    </div>
  );
}
