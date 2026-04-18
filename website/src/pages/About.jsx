import PageHeading from '../components/ui/PageHeading';
import SectionHeading from '../components/ui/SectionHeading';
import FadeUp from '../components/effects/FadeUp';
import GridBackground from '../components/effects/GridBackground';
import AmbientOrbs from '../components/effects/AmbientOrbs';
import CTABanner from '../components/ui/CTABanner';
import Icon from '../components/ui/Icon';
import { VALUES, TEAM } from '../data/site';

export default function About() {
  return (
    <>
      {/* Mission hero */}
      <section className="relative overflow-hidden border-b border-border">
        <GridBackground intensity={0.05} />
        <AmbientOrbs />
        <div className="relative max-w-7xl mx-auto px-6">
          <PageHeading
            eyebrow="Our Mission"
            title={<>Built by traders who refused to <span className="text-neon glow-text">settle</span>.</>}
            subtitle="Generic journals are bloated, slow, and built for a different generation of trader. TraderAscend is fast, opinionated, and powered by AI that actually reads your trades."
            watermark="ABOUT"
          />
        </div>
      </section>

      {/* Story */}
      <section className="py-20 md:py-28 border-b border-border">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-start">
          <FadeUp>
            <div className="text-xs font-mono uppercase tracking-[0.2em] text-neon mb-3">
              The Story
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              From four broken spreadsheets to one cinematic journal.
            </h2>
          </FadeUp>
          <FadeUp delay={0.1}>
            <div className="space-y-5 text-muted leading-relaxed text-lg">
              <p>
                The first version was a spreadsheet. Then a Notion database. Then a
                janky Google Sheets template that broke every time we added a column.
                The journals on the market either looked like they were built in 2008
                or cost more than the prop firm evaluations themselves.
              </p>
              <p>
                We wanted three things: ruthless speed, real intelligence, and a UI
                that didn't make us close the tab. So we built it.
              </p>
              <p className="text-ink">
                TraderAscend is the journal we needed. We hope it's the one you needed
                too.
              </p>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 md:py-28 border-b border-border">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeading
            eyebrow="Values"
            title="Four words that drive every decision"
            subtitle="When we argue about a feature, we end the argument with these."
          />
          <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v, i) => (
              <FadeUp key={v.title} delay={i * 0.06}>
                <div className="h-full rounded-xl border border-border bg-panel/50 p-6 hover:border-neon/40 hover:shadow-neon-soft transition-colors">
                  <span className="grid place-items-center w-11 h-11 rounded-md border border-neon/40 bg-black/40 text-neon mb-4">
                    <Icon name={v.icon} className="w-5 h-5" />
                  </span>
                  <h3 className="text-xl font-semibold tracking-tight mb-2">
                    {v.title}
                  </h3>
                  <p className="text-muted leading-relaxed">{v.description}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 md:py-28 border-b border-border">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeading
            eyebrow="Team"
            title="Small team. Sharp focus."
            subtitle="No growth-hackers. No roadmap committees. Just builders who trade."
          />
          <div className="mt-16 grid gap-5 md:grid-cols-3 max-w-5xl mx-auto">
            {TEAM.map((member, i) => (
              <FadeUp key={member.name} delay={i * 0.08}>
                <article className="h-full rounded-xl border border-border bg-panel/40 p-6 text-center">
                  <div className="mx-auto w-20 h-20 grid place-items-center rounded-full border border-neon/40 bg-black/60 shadow-neon-soft mb-4">
                    <span className="font-mono text-neon text-xl font-semibold">
                      {member.initials}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold">{member.name}</h3>
                  <div className="text-xs font-mono uppercase tracking-[0.2em] text-neon mt-1 mb-3">
                    {member.role}
                  </div>
                  <p className="text-sm text-muted leading-relaxed">{member.bio}</p>
                </article>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      <CTABanner
        title="Join the TraderAscend community"
        subtitle="Discord channel, weekly insights, and direct access to the team. Free with any plan."
        ctaLabel="Join Free"
      />
    </>
  );
}
