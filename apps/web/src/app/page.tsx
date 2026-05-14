import Link from 'next/link'
import { CtaStrip } from '@/components/marketing/cta-strip'
import type { Metadata } from 'next'
import { MARKETED_WORKSPACE_PLANS } from '@/lib/plans'

const pageUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_SHORT_URL_BASE || 'http://localhost:3000'

export const metadata: Metadata = {
  title: 'Branded URL Shortener for Startups, Campaign Teams, and Custom Domains',
  description:
    'Create branded short links, custom domains, QR codes, exports, and practical analytics from one premium workspace built for startups, agencies, and modern teams.',
  keywords: [
    'branded URL shortener',
    'custom domain short links',
    'startup link platform',
    'campaign analytics short links',
    'QR code campaign links',
    'team URL shortener'
  ],
  alternates: {
    canonical: '/'
  },
  openGraph: {
    title: 'Branded URL Shortener for Startups, Campaign Teams, and Custom Domains',
    description:
      'Launch branded short links, organize campaigns, use custom domains, and understand performance from one focused workspace.',
    url: pageUrl,
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'UrlShortener branded link platform'
      }
    ]
  },
  twitter: {
    title: 'Branded URL Shortener for Startups, Campaign Teams, and Custom Domains',
    description:
      'Create branded links, track campaign performance, share QR codes, and keep your team aligned from one clean workspace.',
    images: ['/twitter-image']
  }
}

export default function Page() {
  const features = [
    {
      title: 'Branded short links',
      description:
        'Create clean short URLs on your own domain for launches, newsletters, product drops, and client-facing campaigns.'
    },
    {
      title: 'Practical analytics',
      description:
        'Track clicks, referrers, countries, devices, and recent performance from dashboards that help you act, not over-analyze.'
    },
    {
      title: 'Team-ready workspaces',
      description:
        'Use workspaces, members, tags, and campaign fields so link operations stay organized as your team grows.'
    },
    {
      title: 'QR and exports',
      description:
        'Generate QR codes fast and export clean reports when you need to share results internally or with clients.'
    }
  ]

  const useCases = [
    {
      title: 'Startup marketing teams',
      description:
        'Run launches, newsletters, outbound campaigns, and paid traffic from one branded link workspace instead of scattered spreadsheets.'
    },
    {
      title: 'Agencies and consultants',
      description:
        'Manage client campaigns with cleaner exports, clearer dashboards, and domain-level trust that feels professional from day one.'
    },
    {
      title: 'Creators with real business workflows',
      description:
        'Use branded links and QR codes for bios, events, affiliate pushes, and offline promotions while keeping reporting simple.'
    }
  ]

  const stats = [
    { label: 'Link creation time', value: '< 10 sec' },
    { label: 'Workflow depth', value: 'Domains + QR + exports' },
    { label: 'Team views', value: 'Links + analytics + security' }
  ]

  const steps = [
    'Create a branded link with your domain, slug, and campaign context.',
    'Share it anywhere across web, social, offline, or client-facing surfaces.',
    'Track what moved, export results, and keep your team aligned from one workspace.'
  ]

  const testimonials = [
    {
      quote:
        'It gave us a cleaner branded-link workflow without forcing us into a heavy enterprise tool.',
      name: 'Aarav',
      role: 'Marketing Consultant'
    },
    {
      quote:
        'The dashboard feels fast, premium, and focused on the things our team actually checks every day.',
      name: 'Nisha',
      role: 'Growth Lead'
    },
    {
      quote:
        'Custom domains, QR codes, and exports made it feel useful from the first week, not just after setup.',
      name: 'Rohit',
      role: 'Operations Manager'
    }
  ]

  const faqs = [
    {
      q: 'Is this good for small businesses and startups?',
      a: 'Yes. It is built for startups, consultants, agencies, and small teams that want branded links, practical analytics, and cleaner collaboration without enterprise bloat.'
    },
    {
      q: 'Can I use custom slugs and branded domains?',
      a: 'Yes. You can create memorable slugs and connect custom domains so short links feel more trustworthy and aligned with your brand.'
    },
    {
      q: 'Does it support analytics that are actually useful?',
      a: 'Yes. You can track clicks, top-performing links, recent performance, referrers, devices, and workspace-level trends.'
    },
    {
      q: 'Can my team collaborate in one workspace?',
      a: 'Yes. Workspaces, invitations, roles, exports, API keys, and operational visibility are built into the product flow.'
    }
  ]

  const logos = ['LaunchCo', 'BrightOps', 'Northlane', 'StudioFlow', 'MetricForge']
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a
      }
    }))
  }
  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'UrlShortener',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: [
      {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        name: 'Free'
      },
      {
        '@type': 'Offer',
        price: '15',
        priceCurrency: 'USD',
        name: 'Pro'
      }
    ],
    description:
      'A startup-friendly branded link platform for custom domains, workspace collaboration, analytics, QR generation, and campaign organization.',
    url: pageUrl,
    featureList: [
      'Branded short links',
      'Custom domains',
      'QR code generation',
      'Workspace collaboration',
      'Click analytics',
      'CSV exports'
    ]
  }
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'UrlShortener',
    url: pageUrl,
    logo: `${pageUrl.replace(/\/+$/, '')}/icon`
  }
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'UrlShortener',
    url: pageUrl,
    description:
      'Branded URL shortener for custom domains, campaign analytics, QR codes, and team collaboration.'
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />

      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute right-0 top-40 h-[360px] w-[360px] rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute left-0 top-[32rem] h-[300px] w-[300px] rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        <div className="flex items-center gap-3">
          <div className="premium-panel-strong flex h-11 w-11 items-center justify-center rounded-2xl text-lg font-bold text-cyan-100">
            U
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-white/45">Branded link platform</p>
            <h1 className="text-lg font-semibold">UrlShortener</h1>
          </div>
        </div>

        <nav className="hidden items-center gap-8 text-sm text-white/70 md:flex">
          <a href="#features" className="transition hover:text-white">Features</a>
          <a href="#how-it-works" className="transition hover:text-white">How it works</a>
          <a href="#pricing" className="transition hover:text-white">Pricing</a>
          <a href="#faq" className="transition hover:text-white">FAQ</a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-2xl border border-white/15 px-4 py-2 text-sm text-white/80 transition hover:bg-white/5"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="rounded-2xl bg-white px-4 py-2 text-sm font-medium text-slate-950 shadow-xl transition hover:scale-[1.02]"
          >
            Start free
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 pb-24 lg:px-10">
        <section className="grid items-center gap-10 pb-20 pt-10 lg:grid-cols-[1.15fr_0.85fr] lg:pb-28 lg:pt-20">
          <div>
            <div className="mb-4 flex flex-wrap gap-2 text-xs text-white/65 sm:text-sm">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Custom domains</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">QR codes</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Team workspaces</span>
            </div>

            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-1.5 text-sm text-cyan-100">
              Built for startups, agencies, and modern teams that want branded traffic to feel premium
            </div>

            <h2 className="max-w-4xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Branded links, campaign analytics, and team-ready sharing in one focused workspace.
            </h2>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/70">
              Create short links with custom domains, QR codes, analytics, exports, and clean team
              workflows from one platform designed for startups that need more than a basic shortener.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/register"
                className="rounded-2xl bg-cyan-400 px-6 py-3 text-center text-base font-semibold text-slate-950 shadow-2xl shadow-cyan-500/20 transition hover:scale-[1.02]"
              >
                Start your first branded link
              </Link>

              <Link
                href="/login"
                className="rounded-2xl border border-white/15 px-6 py-3 text-center text-base text-white/90 transition hover:bg-white/5"
              >
                See the dashboard
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-3 text-sm text-white/58">
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-emerald-200">
                Custom domains included
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                Team workspaces built in
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                Exports and QR from day one
              </span>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="premium-panel rounded-3xl p-5 backdrop-blur-sm"
                >
                  <div className="text-2xl font-semibold">{stat.value}</div>
                  <div className="mt-1 text-sm text-white/60">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="premium-orbit premium-panel rounded-[34px] p-4">
            <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(13,25,42,0.96),rgba(6,13,24,0.98))] p-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/40">Workspace</p>
                  <h3 className="text-xl font-semibold">Q2 Launch Campaign</h3>
                </div>
                <div className="rounded-full bg-emerald-400/15 px-3 py-1 text-sm text-emerald-200">
                  Live
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-sm text-white/50">Short URL</p>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <p className="truncate font-medium text-cyan-300">go.brand.com/q2-launch</p>
                    <button className="rounded-xl bg-white/10 px-3 py-2 text-sm text-white/80">
                      Copy
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl bg-white/5 p-4">
                    <p className="text-sm text-white/50">Clicks</p>
                    <p className="mt-2 text-2xl font-semibold">12,842</p>
                  </div>
                  <div className="rounded-2xl bg-white/5 p-4">
                    <p className="text-sm text-white/50">Repeat traffic</p>
                    <p className="mt-2 text-2xl font-semibold">31%</p>
                  </div>
                  <div className="rounded-2xl bg-white/5 p-4">
                    <p className="text-sm text-white/50">QR scans</p>
                    <p className="mt-2 text-2xl font-semibold">3,204</p>
                  </div>
                </div>

                <div className="rounded-2xl bg-white/5 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="font-medium">7-day performance</p>
                    <span className="text-sm text-white/50">Updated now</span>
                  </div>
                  <div className="flex h-36 items-end gap-2">
                    {[32, 54, 61, 48, 78, 85, 92].map((v, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t-2xl bg-gradient-to-t from-cyan-500 to-blue-400"
                        style={{ height: `${v}%` }}
                      />
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-white/50">Most active country</p>
                    <p className="mt-2 text-lg font-semibold">India</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-white/50">Top source</p>
                    <p className="mt-2 text-lg font-semibold">Launch newsletter</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-20">
          <div className="premium-panel rounded-[32px] p-8">
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-300/80">Trusted by growing teams</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {logos.map((logo) => (
                <div
                  key={logo}
                  className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-5 text-center text-sm font-medium text-white/75"
                >
                  {logo}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="pb-20">
          <div className="mb-10 max-w-2xl">
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-300/80">Features</p>
            <h3 className="mt-3 text-3xl font-semibold tracking-tight">
              Everything a lean team needs to ship branded links well
            </h3>
            <p className="mt-4 text-white/65">
              The product is strongest when short links are part of a real workflow: branding,
              tracking, collaboration, exports, and faster decision-making.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-sm"
              >
                <h4 className="text-xl font-semibold">{feature.title}</h4>
                <p className="mt-3 leading-7 text-white/65">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="pb-20">
          <div className="mb-10 max-w-2xl">
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-300/80">Use Cases</p>
            <h3 className="mt-3 text-3xl font-semibold tracking-tight">
              Built for teams that need more than a generic shortener
            </h3>
            <p className="mt-4 text-white/65">
              This product shines when links are tied to real campaigns, real reporting, and real
              brand trust, not one-off utility use.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {useCases.map((item) => (
              <div key={item.title} className="premium-panel rounded-[28px] p-6">
                <h4 className="text-xl font-semibold">{item.title}</h4>
                <p className="mt-3 leading-7 text-white/65">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="grid gap-6 pb-20 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-8">
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-300/80">How it works</p>
            <h3 className="mt-3 text-3xl font-semibold tracking-tight">
              A clean path from link creation to campaign clarity
            </h3>
            <p className="mt-4 text-white/65">
              The best short-link products do not just shorten URLs. They make launch, sharing,
              tracking, and reporting feel connected from the first use.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => (
              <div
                key={step}
                className="rounded-[28px] border border-white/10 bg-slate-900/70 p-6"
              >
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-200">
                  {index + 1}
                </div>
                <p className="leading-7 text-white/80">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="pb-20">
          <div className="mb-10 max-w-2xl">
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-300/80">What users like</p>
            <h3 className="mt-3 text-3xl font-semibold tracking-tight">
              Built to feel useful from day one
            </h3>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {testimonials.map((item) => (
              <div
                key={item.name}
                className="rounded-[28px] border border-white/10 bg-white/5 p-6"
              >
                <p className="leading-7 text-white/75">&ldquo;{item.quote}&rdquo;</p>
                <div className="mt-6">
                  <p className="font-semibold text-white">{item.name}</p>
                  <p className="text-sm text-white/50">{item.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="pricing" className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-8">
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-300/80">Pricing</p>
            <h3 className="mt-3 text-3xl font-semibold tracking-tight">
              Free to start. Pro when branded workflows become serious.
            </h3>
            <p className="mt-4 text-white/65">
              Keep the launch offer simple: a real free plan for solo use, and a Pro plan for
              teams that need custom domains, exports, collaboration, and deeper analytics.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {MARKETED_WORKSPACE_PLANS.map((plan) => (
              <div
                key={plan.plan}
                className={
                  plan.plan === 'PRO'
                    ? 'rounded-[32px] border border-cyan-300/30 bg-gradient-to-b from-cyan-400/10 to-transparent p-8 shadow-2xl shadow-cyan-500/10'
                    : 'rounded-[32px] border border-white/10 bg-white/5 p-8'
                }
              >
                {plan.plan === 'PRO' ? (
                  <div className="mb-3 inline-flex rounded-full bg-cyan-300/15 px-3 py-1 text-sm text-cyan-200">
                    Best for teams
                  </div>
                ) : null}
                <p className="text-sm text-white/55">{plan.label}</p>
                <div className="mt-3 text-4xl font-semibold">
                  {plan.price}
                  {plan.plan === 'PRO' ? (
                    <span className="text-lg text-white/50">/mo</span>
                  ) : null}
                </div>
                <p className="mt-4 text-sm leading-6 text-white/60">{plan.summary}</p>
                <ul className="mt-6 space-y-3 text-white/80">
                  {plan.highlights.map((highlight) => (
                    <li key={highlight}>{highlight}</li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={
                    plan.plan === 'PRO'
                      ? 'mt-8 block w-full rounded-2xl bg-cyan-400 px-5 py-3 text-center font-semibold text-slate-950 transition hover:scale-[1.02]'
                      : 'mt-8 block w-full rounded-2xl border border-white/15 px-5 py-3 text-center text-white/90 transition hover:bg-white/5'
                  }
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section id="faq" className="pt-20">
          <div className="mb-10 max-w-2xl">
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-300/80">FAQ</p>
            <h3 className="mt-3 text-3xl font-semibold tracking-tight">
              Common questions before getting started
            </h3>
          </div>

          <div className="grid gap-4">
            {faqs.map((item) => (
              <div
                key={item.q}
                className="rounded-[24px] border border-white/10 bg-white/5 p-6"
              >
                <p className="text-lg font-semibold text-white">{item.q}</p>
                <p className="mt-3 text-white/65">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="pt-20">
          <CtaStrip />
        </section>
      </main>
    </div>
  )
}
