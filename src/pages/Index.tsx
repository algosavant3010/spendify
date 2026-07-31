import { Button } from "@/components/ui/button";
import {
  ArrowRight, ArrowUpRight, Sparkles, TrendingUp, Shield, Zap, PieChart,
  Bell, Receipt, Brain, Lock, Globe, BarChart3, Check, Smartphone, Clock,
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";
import AdvisorShowcase from "@/components/landing/AdvisorShowcase";

const Index = () => {
  const features = [
    { icon: Brain, title: "AI Insights", desc: "Personalised recommendations that learn your spending DNA." },
    { icon: Sparkles, title: "Auto Categorize", desc: "Transactions filed the moment they land. Zero manual sorting." },
    { icon: PieChart, title: "Visual Analytics", desc: "Charts that read like a story, not a spreadsheet." },
    { icon: Bell, title: "Smart Alerts", desc: "Real-time nudges before you overspend." },
    { icon: Receipt, title: "Receipt OCR", desc: "Snap a bill — we file it perfectly." },
    { icon: TrendingUp, title: "Trend Forecasts", desc: "Know tomorrow's spend with predictive AI." },
    { icon: Shield, title: "Private by Default", desc: "Encrypted in transit and at rest. Yours alone." },
    { icon: Globe, title: "Multi-Currency", desc: "Travel-ready conversion, INR-first." },
  ];

  const principles = [
    { n: "I.", title: "Rupee-native", body: "Built around UPI, EMIs, EPF and festive spikes — not translated from a dollar app." },
    { n: "II.", title: "Quiet by design", body: "No streaks, no badges shouting for attention. One brief a day, and silence otherwise." },
    { n: "III.", title: "Your data, yours", body: "Row-level isolation on every record. We never sell, never share, never train on your ledger." },
  ];

  const pricingPlans = [
    { name: "Free", price: "₹0", period: "forever", features: ["50 transactions / month", "Basic AI insights", "Budget tracking", "Mobile access"], cta: "Get Started", highlighted: false },
    { name: "Pro", price: "₹199", period: "per month", features: ["Unlimited transactions", "Advanced AI insights", "Receipt scanning", "Multi-currency", "Priority support", "PDF exports"], cta: "Start Free Trial", highlighted: true },
    { name: "Business", price: "₹499", period: "per month", features: ["Everything in Pro", "Team collaboration", "API access", "Custom integrations", "Dedicated support"], cta: "Contact Sales", highlighted: false },
  ];


  return (
    <div className="min-h-screen bg-background dark:bg-transparent text-foreground">
      {/* ───────────── Nav ───────────── */}
      <nav className="sticky top-0 z-50 border-b border-border/60 glass">
        <div className="container mx-auto px-6 lg:px-8 py-5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-sm bg-foreground text-background grid place-items-center font-display text-xl">S</div>
            <div className="leading-none">
              <div className="font-display text-2xl">Spendify</div>
              <div className="eyebrow mt-1">Edition 01 · 2026</div>
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm">
            <a href="#features" className="link-underline">Features</a>
            <a href="#ai" className="link-underline">Intelligence</a>
            <a href="#advisor" className="link-underline">AI Advisor</a>
            <a href="#pricing" className="link-underline">Pricing</a>
            <a href="#principles" className="link-underline">Principles</a>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/auth?mode=signin"><Button variant="ghost">Sign in</Button></Link>
            <Link to="/auth?mode=signup" className="hidden sm:block">
              <Button className="group rounded-sm">
                Open account
                <ArrowUpRight className="ml-1.5 h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ───────────── Hero — editorial split ───────────── */}
      <section className="container mx-auto px-6 lg:px-8 pt-20 pb-24 lg:pt-32 lg:pb-32 relative">
        <div className="grid lg:grid-cols-12 gap-10 items-end">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="lg:col-span-8">
            <div className="eyebrow mb-8">
              <span className="h-px w-10 bg-foreground/40" />
              The personal-finance quarterly · Issue 01
            </div>
            <h1 className="font-display tracking-tight mb-8">
              Money,{" "}
              <span className="accent-italic">rewritten</span>
              <br />
              for the age of <span className="accent-italic">intelligence.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-[52ch] leading-[1.65]">
              Spendify is a private, AI-led ledger for the modern Indian household.
              We watch the patterns so you can live the life — fewer charts, sharper decisions, zero noise.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link to="/auth?mode=signup">
                <Button size="lg" className="group rounded-sm px-7 h-12">
                  Begin free trial
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="rounded-sm px-7 h-12 border-foreground/30">Read the manifesto</Button>
            </div>
          </motion.div>

          {/* Numbered marginalia */}
          <motion.aside initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.15 }} className="lg:col-span-4 lg:border-l lg:border-border/60 lg:pl-8">
            <div className="eyebrow mb-4">In this issue</div>
            <ol className="space-y-5">
              {[
                ["I.", "Eight features that retire the spreadsheet"],
                ["II.", "An AI that knows a chai run from a chemist"],
                ["III.", "Pricing for households, freelancers, founders"],
                ["IV.", "Three principles we refuse to bend"],
              ].map(([n, t]) => (
                <li key={n} className="flex gap-4 group">
                  <span className="font-display text-2xl text-primary w-8">{n}</span>
                  <span className="text-sm leading-relaxed group-hover:text-foreground transition-colors">{t}</span>
                </li>
              ))}
            </ol>
          </motion.aside>
        </div>

        <div className="hairline mt-20 mb-10" />

        {/* Capability strip — factual, no invented metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border/60 surface">
          {[
            { icon: Sparkles, top: "AI", bottom: "Categorisation & insights" },
            { icon: Receipt, top: "OCR", bottom: "Receipt scanning" },
            { icon: Lock, top: "RLS", bottom: "Per-user data isolation" },
            { icon: Smartphone, top: "PWA", bottom: "Works on any device" },
          ].map((s) => (
            <div key={s.bottom} className="group bg-card p-8 transition-colors duration-300 hover:bg-secondary/60">
              <s.icon className="h-4 w-4 text-primary mb-6 transition-transform duration-300 group-hover:-translate-y-0.5" strokeWidth={1.5} />
              <div className="font-display text-4xl md:text-5xl mb-2 leading-none">{s.top}</div>
              <div className="eyebrow">{s.bottom}</div>
            </div>
          ))}
        </div>

      </section>

      {/* ───────────── Features — bento ───────────── */}
      <section id="features" className="container mx-auto px-6 lg:px-8 py-24 lg:py-32">
        <div className="grid lg:grid-cols-12 gap-10 mb-16">
          <div className="lg:col-span-4">
            <div className="eyebrow mb-4">§ 01 · Capabilities</div>
            <h2 className="font-display text-5xl md:text-6xl mb-6 max-w-[12ch]">A complete <span className="accent-italic">apparatus.</span></h2>
          </div>
          <p className="lg:col-span-7 lg:col-start-6 text-lg text-muted-foreground leading-relaxed self-end">
            Eight quietly powerful tools, designed to disappear into the background of your day —
            and surface only when they have something worth saying.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className={`bento group p-7 sm:p-8 ${i === 0 ? "md:col-span-2 md:row-span-2 bg-gradient-to-br from-card to-secondary" : ""}`}
            >
              <div className="flex items-start justify-between mb-8">
                <f.icon className="h-5 w-5 text-primary transition-transform duration-300 ease-out group-hover:-translate-y-0.5 group-hover:scale-110" strokeWidth={1.5} />
                <span className="eyebrow transition-colors duration-300 group-hover:text-foreground">№ {String(i + 1).padStart(2, "0")}</span>
              </div>
              <h3 className={`font-display mb-3 ${i === 0 ? "text-4xl md:text-5xl" : "text-2xl"}`}>{f.title}</h3>
              <p className={`text-muted-foreground leading-relaxed ${i === 0 ? "text-lg max-w-md" : "text-sm"}`}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ───────────── AI editorial spread ───────────── */}
      <section id="ai" className="relative overflow-hidden border-y border-border/60 bg-secondary/40">
        <div className="container mx-auto px-6 lg:px-8 py-24 lg:py-32 grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5">
            <div className="eyebrow mb-4">§ 02 · The Intelligence</div>
            <h2 className="font-display text-5xl md:text-7xl leading-[0.95]">
              An assistant that reads <span className="accent-italic">between the rupees.</span>
            </h2>
          </div>
          <div className="lg:col-span-6 lg:col-start-7 space-y-10">
            {[
              { icon: Brain, title: "Pattern reading", body: "Ninety days of context — recurring bills, weekly rhythms, festive surges — distilled into a single morning brief." },
              { icon: Zap, title: "Instant judgement", body: "Every transaction routed to the right ledger in under 100 ms, learning from every correction." },
              { icon: BarChart3, title: "Predictive forecast", body: "A monthly outlook calibrated to your last quarter, with confidence intervals you can actually trust." },
            ].map((b) => (
              <div key={b.title} className="flex gap-6 pb-10 border-b border-border/60 last:border-0">
                <div className="h-10 w-10 rounded-sm border border-border grid place-items-center shrink-0">
                  <b.icon className="h-4 w-4 text-primary" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-display text-2xl mb-2">{b.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{b.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <AdvisorShowcase />

      {/* ───────────── Principles — editorial columns ───────────── */}

      <section id="principles" className="container mx-auto px-6 lg:px-8 py-24 lg:py-32">
        <div className="flex items-end justify-between mb-16 gap-6 flex-wrap">
          <div>
            <div className="eyebrow mb-4">§ 03 · Principles</div>
            <h2 className="font-display text-5xl md:text-6xl">What we <span className="accent-italic">stand on.</span></h2>
          </div>
          <p className="max-w-sm text-sm text-muted-foreground leading-relaxed">
            No borrowed testimonials, no invented numbers. Just the three commitments the product is built around.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-px bg-border/60 surface">
          {principles.map((p, i) => (
            <motion.article
              key={p.n}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="group bg-card p-9 sm:p-11 flex flex-col justify-between transition-colors duration-300 hover:bg-secondary/50"
            >
              <div>
                <div className="font-display text-5xl text-primary mb-8 leading-none">{p.n}</div>
                <h3 className="font-display text-3xl mb-4">{p.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{p.body}</p>
              </div>
              <div className="hairline mt-10 transition-opacity duration-300 opacity-60 group-hover:opacity-100" />
            </motion.article>
          ))}
        </div>
      </section>


      {/* ───────────── Pricing ───────────── */}
      <section id="pricing" className="border-y border-border/60 bg-secondary/40">
        <div className="container mx-auto px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="eyebrow mb-4 justify-center">§ 04 · Subscription</div>
            <h2 className="font-display text-5xl md:text-6xl mb-6">Pricing, <span className="accent-italic">unmasked.</span></h2>
            <p className="text-muted-foreground text-lg">Three tiers. No upsells. Cancel in two clicks.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-border/60 surface max-w-6xl mx-auto">
            {pricingPlans.map((p) => (
              <div key={p.name} className={`bg-card p-10 ${p.highlighted ? "relative ring-1 ring-primary" : ""}`}>
                {p.highlighted && <div className="eyebrow text-primary mb-6">Most chosen</div>}
                {!p.highlighted && <div className="eyebrow mb-6">{p.name === "Free" ? "Starter" : "For teams"}</div>}
                <h3 className="font-display text-3xl mb-2">{p.name}</h3>
                <div className="flex items-baseline gap-2 mb-8 tabular">
                  <span className="font-display text-6xl">{p.price}</span>
                  <span className="text-sm text-muted-foreground">/ {p.period}</span>
                </div>
                <ul className="space-y-3 mb-10">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-3 text-sm">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/auth?mode=signup" className="block">
                  <Button className="w-full rounded-sm h-11" variant={p.highlighted ? "default" : "outline"}>{p.cta}</Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── Marks of trust ───────────── */}
      <section className="container mx-auto px-6 lg:px-8 py-24">
        <div className="grid md:grid-cols-4 gap-px bg-border/60 surface">
          {[
            { icon: Smartphone, top: "Any device", bottom: "Responsive web app" },
            { icon: Globe, top: "INR-first", bottom: "Multi-currency" },
            { icon: Shield, top: "Encrypted", bottom: "In transit & at rest" },
            { icon: Clock, top: "Always on", bottom: "Background AI checks" },
          ].map((s) => (
            <div key={s.bottom} className="bg-card p-8 sm:p-9">
              <s.icon className="h-4 w-4 text-primary mb-6" strokeWidth={1.5} />
              <div className="font-display text-3xl mb-2">{s.top}</div>
              <div className="eyebrow">{s.bottom}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────── CTA ───────────── */}
      <section className="container mx-auto px-6 lg:px-8 pb-24">
        <div className="relative overflow-hidden rounded-sm border border-border/60 grain bg-gradient-hero text-white p-12 md:p-20">
          <div className="max-w-3xl">
            <div className="eyebrow text-white/70 mb-6">Closing note</div>
            <h2 className="font-display text-5xl md:text-7xl mb-8 leading-[0.95]">
              Begin the <span className="italic">quiet revolution</span><br /> in your finances.
            </h2>
            <p className="text-xl text-white/80 mb-10 max-w-2xl">
              Fourteen days. No card required. The first morning brief lands tomorrow.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/auth?mode=signup">
                <Button size="lg" variant="secondary" className="rounded-sm h-12 px-7">Open your account <ArrowUpRight className="ml-2 h-4 w-4" /></Button>
              </Link>
              <Button size="lg" variant="outline" className="rounded-sm h-12 px-7 bg-transparent border-white/40 text-white hover:bg-white/10">Speak to sales</Button>
            </div>
            <div className="hairline mt-12 border-white/20" />
            <div className="mt-6 flex flex-wrap gap-8 text-sm text-white/70">
              <span className="flex items-center gap-2"><Check className="h-4 w-4" /> No credit card</span>
              <span className="flex items-center gap-2"><Check className="h-4 w-4" /> 14-day trial</span>
              <span className="flex items-center gap-2"><Lock className="h-4 w-4" /> Encrypted end-to-end</span>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── Footer ───────────── */}
      <footer className="border-t border-border/60">
        <div className="container mx-auto px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-12 gap-10 mb-12">
            <div className="md:col-span-4">
              <div className="font-display text-3xl mb-3">Spendify</div>
              <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">A private, AI-led ledger published from Bengaluru for the modern Indian household.</p>
            </div>
            {[
              { h: "Product", items: ["Features", "Pricing", "Security", "Changelog"] },
              { h: "Company", items: ["About", "Journal", "Careers", "Press"] },
              { h: "Resources", items: ["Documentation", "Help", "API", "Community"] },
              { h: "Legal", items: ["Privacy", "Terms", "Cookies", "Licenses"] },
            ].map((c) => (
              <div key={c.h} className="md:col-span-2">
                <div className="eyebrow mb-4">{c.h}</div>
                <ul className="space-y-2 text-sm">
                  {c.items.map((i) => (
                    <li key={i}><a href="#" className="link-underline text-muted-foreground hover:text-foreground">{i}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="hairline mb-6" />
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <span>© 2026 Spendify · Edition 01 · Printed in Bengaluru</span>
            <div className="flex gap-6">
              <a href="#" className="link-underline">Twitter</a>
              <a href="#" className="link-underline">LinkedIn</a>
              <a href="#" className="link-underline">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
