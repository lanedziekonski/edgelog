import { Link } from 'react-router-dom';
import { Twitter, MessageCircle, Mail } from 'lucide-react';
import Logo from '../ui/Logo';
import { NAV_LINKS, SOCIAL } from '../../data/site';

const SOCIAL_ITEMS = [
  { href: SOCIAL.twitter, icon: Twitter, label: 'Twitter / X' },
  { href: SOCIAL.discord, icon: MessageCircle, label: 'Discord' },
  { href: SOCIAL.email, icon: Mail, label: 'Email' },
];

export default function Footer() {
  return (
    <footer className="border-t border-border bg-bg">
      <div className="max-w-7xl mx-auto px-6 py-16 grid gap-12 md:grid-cols-4">
        <div className="md:col-span-2 flex flex-col gap-4">
          <Logo />
          <p className="text-muted text-sm max-w-xs">
            Built for traders, by traders. The cinematic trading journal that holds you
            accountable to your edge.
          </p>
          <div className="flex gap-2 mt-2">
            {SOCIAL_ITEMS.map(({ href, icon: Icon, label }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 grid place-items-center rounded-md border border-border text-muted hover:text-neon hover:border-neon transition-colors"
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-xs font-mono uppercase tracking-[0.2em] text-neon mb-4">
            Site
          </h4>
          <ul className="flex flex-col gap-2 text-sm">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="text-ink/70 hover:text-neon transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-mono uppercase tracking-[0.2em] text-neon mb-4">
            Resources
          </h4>
          <ul className="flex flex-col gap-2 text-sm">
            <li>
              <Link
                to="/dashboard"
                className="text-ink/70 hover:text-neon transition-colors"
              >
                Open Dashboard
              </Link>
            </li>
            <li>
              <a href="#" className="text-ink/70 hover:text-neon transition-colors">
                Changelog
              </a>
            </li>
            <li>
              <Link to="/privacy" className="text-ink/70 hover:text-neon transition-colors">
                Privacy
              </Link>
            </li>
            <li>
              <Link to="/terms" className="text-ink/70 hover:text-neon transition-colors">
                Terms
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted font-mono uppercase tracking-[0.15em]">
            © {new Date().getFullYear()} TradeAscend · All rights reserved
          </p>
          <p className="text-xs text-muted">
            Trading involves risk. Past performance is not indicative of future results.
          </p>
        </div>
      </div>
    </footer>
  );
}
