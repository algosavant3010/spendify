import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, MessageSquare, Send, Activity, Brain } from "lucide-react";

const CHAT = [
  { role: "user", text: "Where am I overspending this month?" },
  {
    role: "assistant",
    text:
      "Dining is ₹8,400 — 34% above your 90-day average. Two food-delivery subscriptions overlap; cancelling one saves ₹1,398/yr.",
  },
  { role: "user", text: "Suggest a fix under 80C." },
  {
    role: "assistant",
    text:
      "Redirect ₹4,000/month into an ELSS SIP. That covers the 80C gap by March and keeps your emergency fund untouched.",
  },
];

const FACTS = [
  { k: "Weekend effect", v: "62%", d: "of discretionary spend in Indian households lands Fri–Sun." },
  { k: "Silent leaks", v: "₹1,900", d: "average monthly spend on subscriptions people forget they hold." },
  { k: "Festive surge", v: "1.8×", d: "typical Oct–Nov jump versus a normal spending month." },
  { k: "Small tickets", v: "48%", d: "of transactions are under ₹200 — and they decide the month." },
];

const BARS = [38, 62, 45, 78, 55, 90, 48, 70, 34, 82, 58, 66];

const AdvisorShowcase = () => {
  const [visible, setVisible] = useState(1);
  const [fact, setFact] = useState(0);

  useEffect(() => {
    if (visible >= CHAT.length) return;
    const t = setTimeout(() => setVisible((v) => v + 1), 1400);
    return () => clearTimeout(t);
  }, [visible]);

  useEffect(() => {
    const i = setInterval(() => setFact((f) => (f + 1) % FACTS.length), 3600);
    return () => clearInterval(i);
  }, []);

  const f = FACTS[fact];

  return (
    <section id="advisor" className="container mx-auto px-6 lg:px-8 py-24 lg:py-32">
      <div className="grid lg:grid-cols-12 gap-10 mb-14">
        <div className="lg:col-span-5">
          <div className="eyebrow mb-4">§ 03 · The Advisor</div>
          <h2 className="font-display text-5xl md:text-6xl leading-[1.02]">
            Ask your money <span className="accent-italic">anything.</span>
          </h2>
        </div>
        <p className="lg:col-span-6 lg:col-start-7 text-lg text-muted-foreground leading-relaxed self-end">
          The AI Advisor reads your live ledger — transactions, budgets, goals — and answers in plain
          language with rupee-specific moves you can make today.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-4">
        {/* Chat panel */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="lg:col-span-7 bento p-6 sm:p-8 flex flex-col"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-sm border border-border grid place-items-center">
                <MessageSquare className="h-4 w-4 text-primary" strokeWidth={1.5} />
              </div>
              <div className="leading-tight">
                <div className="font-display text-xl">AI Advisor</div>
                <div className="eyebrow">Live ledger context</div>
              </div>
            </div>
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> online
            </span>
          </div>

          <div className="space-y-3 min-h-[280px]">
            {CHAT.slice(0, visible).map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[84%] rounded-sm px-4 py-3 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "border border-border/70 bg-secondary/50 text-foreground"
                  }`}
                >
                  {m.text}
                </div>
              </motion.div>
            ))}
            {visible < CHAT.length && (
              <div className="flex gap-1.5 pl-1 pt-1">
                {[0, 1, 2].map((d) => (
                  <span
                    key={d}
                    className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-pulse"
                    style={{ animationDelay: `${d * 0.15}s` }}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="hairline my-6" />
          <div className="flex items-center gap-3">
            <div className="flex-1 rounded-sm border border-border/70 px-4 py-2.5 text-sm text-muted-foreground">
              Ask about your finances…
            </div>
            <Link to="/auth?mode=signin">
              <Button size="icon" className="rounded-sm h-10 w-10">
                <Send className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Analyser card */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="lg:col-span-5 bento p-6 sm:p-8 flex flex-col justify-between overflow-hidden"
        >
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 eyebrow">
                <Activity className="h-3.5 w-3.5 text-primary" strokeWidth={2} /> Spend analyser
              </div>
              <Brain className="h-4 w-4 text-primary" strokeWidth={1.5} />
            </div>

            {/* animated bar field */}
            <div className="flex items-end gap-1.5 h-32 mb-8">
              {BARS.map((h, i) => (
                <motion.div
                  key={i}
                  style={{ height: `${h}%`, transformOrigin: "bottom" }}
                  initial={{ scaleY: 0.05, opacity: 0.4 }}
                  animate={{ scaleY: 1, opacity: 1 }}
                  transition={{ duration: 0.7, delay: i * 0.04, ease: "easeOut" }}
                  className={`flex-1 rounded-t-sm ${
                    h > 75 ? "bg-primary" : "bg-primary/25"
                  } transition-colors duration-300 hover:bg-primary`}
                />
              ))}
            </div>

            <div className="hairline mb-6" />

            <div className="eyebrow mb-3">Do you know?</div>
            <motion.div key={fact} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <div className="font-display text-5xl tabular leading-none mb-3">{f.v}</div>
              <div className="text-sm font-medium mb-1">{f.k}</div>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.d}</p>
            </motion.div>
          </div>

          <div className="mt-8 flex items-center gap-1.5">
            {FACTS.map((_, i) => (
              <button
                key={i}
                aria-label={`Show insight ${i + 1}`}
                onClick={() => setFact(i)}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === fact ? "w-6 bg-primary" : "w-2 bg-border hover:bg-muted-foreground/50"
                }`}
              />
            ))}
          </div>
        </motion.div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <Link to="/auth?mode=signin">
          <Button size="lg" className="group rounded-sm h-12 px-7">
            Try the AI Advisor
            <ArrowUpRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Button>
        </Link>
        <span className="text-sm text-muted-foreground">Answers grounded in your own ledger — never generic advice.</span>
      </div>
    </section>
  );
};

export default AdvisorShowcase;
