import { Link } from "react-router-dom";
import { Shield, Brain, FileCheck, ArrowRight, Scale, Lock, Languages, Mic, ChevronRight, Sparkles, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";

/* ── Animated Counter ── */
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        let start = 0;
        const step = Math.ceil(to / 60);
        const timer = setInterval(() => {
          start += step;
          if (start >= to) { setCount(to); clearInterval(timer); }
          else setCount(start);
        }, 20);
      }
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to]);

  return <span ref={ref}>{count}{suffix}</span>;
}

/* ── Scroll Reveal ── */
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

const pillars = [
  {
    icon: Languages,
    title: "Multilingual Intake",
    description: "Citizens input grievances in any language — Hindi, English, or mixed. AI extracts facts, dates, amounts, and entities from unstructured text.",
    accent: "from-blue-500/20 to-indigo-500/20",
    border: "hover:border-blue-500/40",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-400",
    shadowColor: "hover:shadow-blue-500/10",
    number: "01",
  },
  {
    icon: Brain,
    title: "Deterministic RAG Legal Scribe",
    description: "A hallucination-free RAG pipeline maps complaints to exact BNS/BNSS sections and generates structured FIR drafts instantly.",
    accent: "from-orange-500/20 to-amber-500/20",
    border: "hover:border-orange-500/40",
    iconBg: "bg-orange-500/10",
    iconColor: "text-orange-400",
    shadowColor: "hover:shadow-orange-500/10",
    number: "02",
  },
  {
    icon: Lock,
    title: "Evidence Hashing Engine",
    description: "Client-side SHA-256 hashing for BSA Section 63(4) compliance. No file uploads — all cryptography runs locally in the browser.",
    accent: "from-emerald-500/20 to-green-500/20",
    border: "hover:border-emerald-500/40",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-400",
    shadowColor: "hover:shadow-emerald-500/10",
    number: "03",
  },
];

const steps = [
  { step: "01", title: "Citizen Files a Grievance", desc: "Type or speak your complaint in any language. Upload photos or documents as evidence.", emoji: "✍️", color: "from-orange-500 to-amber-500", shadow: "shadow-orange-500/30" },
  { step: "02", title: "AI Translates & Triages", desc: "NLP extracts entities, maps the crime to exact BNS sections, and generates a formal FIR draft.", emoji: "🤖", color: "from-indigo-500 to-blue-500", shadow: "shadow-indigo-500/30" },
  { step: "03", title: "Officer Reviews & Acts", desc: "The FIR routes to the responsible officer's dashboard for review, approval, and dispatch.", emoji: "🛡️", color: "from-violet-500 to-purple-500", shadow: "shadow-violet-500/30" },
  { step: "04", title: "Evidence Gets Certified", desc: "Digital evidence is hashed client-side with SHA-256, generating a BSA §63(4) compliant certificate.", emoji: "🔏", color: "from-emerald-500 to-green-500", shadow: "shadow-emerald-500/30" },
];

const stats = [
  { value: 98, suffix: "%", label: "Accuracy Rate" },
  { value: 12, suffix: "+", label: "Languages" },
  { value: 5, suffix: "s", label: "Avg. FIR Draft Time" },
  { value: 100, suffix: "%", label: "Secure & Local" },
];

export default function Index() {
  const [micActive, setMicActive] = useState(false);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);

  // Mouse parallax glow in hero
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };
    const hero = heroRef.current;
    hero?.addEventListener("mousemove", handler);
    return () => hero?.removeEventListener("mousemove", handler);
  }, []);

  return (
    <div className="min-h-screen bg-[#080b14] overflow-x-hidden">

      {/* ── HERO ── */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center pt-20 pb-16 px-4 overflow-hidden cursor-default"
      >
        {/* Static background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#080b14] via-[#0c1122] to-[#080b14]" />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(99,102,241,0.13) 0%, transparent 70%)" }} />

        {/* Mouse-following glow */}
        <div
          className="absolute pointer-events-none rounded-full blur-3xl opacity-20 transition-all duration-300"
          style={{
            width: 500,
            height: 500,
            left: mousePos.x - 250,
            top: mousePos.y - 250,
            background: "radial-gradient(circle, rgba(249,115,22,0.5), rgba(99,102,241,0.3), transparent)",
          }}
        />

        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />

        {/* Orbs */}
        <div className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full blur-3xl opacity-8 animate-pulse" style={{ background: "radial-gradient(circle, #6366f1, transparent)" }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-8" style={{ background: "radial-gradient(circle, #f97316, transparent)", animation: "pulse 5s ease-in-out infinite 1.5s" }} />

        <div className="container mx-auto relative z-10 text-center max-w-5xl">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-sm text-indigo-300 mb-8" style={{ animation: "fadeUp 0.5s ease-out both" }}>
            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
            BNS-Ready Justice Portal
          </div>

          {/* H1 */}
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-white leading-tight" style={{ animation: "fadeUp 0.6s ease-out 0.1s both" }}>
            Justice, Made{" "}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent">
                Accessible
              </span>
              {/* Animated underline */}
              <span className="absolute -bottom-1 left-0 right-0 h-[3px] rounded-full bg-gradient-to-r from-orange-400 to-amber-400" style={{ animation: "expandWidth 1s ease-out 0.8s both" }} />
            </span>
          </h1>

          {/* Subtext */}
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed" style={{ animation: "fadeUp 0.6s ease-out 0.2s both" }}>
            Bridging the gap between citizens and India's new justice system.
            AI-powered complaint filing, deterministic legal mapping, and
            court-ready evidence certification — all in one platform.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-14" style={{ animation: "fadeUp 0.6s ease-out 0.3s both" }}>
            <Link to="/citizen">
              <button
                className="group relative h-12 px-8 rounded-xl text-base font-semibold text-white overflow-hidden transition-all duration-300 hover:scale-105"
                style={{ background: "linear-gradient(135deg, #f97316, #f59e0b)", boxShadow: "0 0 40px rgba(249,115,22,0.4), 0 4px 20px rgba(0,0,0,0.4)" }}
              >
                <span className="relative z-10 flex items-center gap-2">
                  File a Complaint
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-white/15 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </Link>

            <Link to="/evidence">
              <button className="group h-12 px-8 rounded-xl text-base font-medium text-slate-300 border border-slate-700/80 hover:border-indigo-500/50 hover:text-white hover:bg-indigo-500/10 transition-all duration-300 hover:scale-105 flex items-center gap-2">
                <Shield className="h-4 w-4 group-hover:text-indigo-400 transition-colors" />
                Evidence Portal
              </button>
            </Link>
          </div>

          {/* Mic button */}
          <div style={{ animation: "fadeUp 0.6s ease-out 0.4s both" }}>
            <button
              onClick={() => setMicActive(!micActive)}
              className={`relative inline-flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-medium transition-all duration-300 hover:scale-105 ${
                micActive
                  ? "border-orange-500/60 bg-orange-500/10 text-orange-400 shadow-lg shadow-orange-500/20"
                  : "border-slate-700/80 text-slate-500 hover:border-slate-500 hover:text-slate-300 hover:bg-white/5"
              }`}
            >
              <Mic className={`h-4 w-4 ${micActive ? "animate-pulse text-orange-400" : ""}`} />
              {micActive ? "Listening..." : "Or speak your complaint"}
              {micActive && (
                <span className="flex gap-0.5 items-end ml-1">
                  {[3, 6, 9, 6, 4, 8, 5, 3].map((h, i) => (
                    <span
                      key={i}
                      className="w-0.5 rounded-full bg-orange-400"
                      style={{ height: `${h}px`, animation: `barPulse 0.7s ease-in-out infinite`, animationDelay: `${i * 0.09}s` }}
                    />
                  ))}
                </span>
              )}
            </button>
          </div>

          {/* Trust strip */}
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 mt-12 text-xs text-slate-600" style={{ animation: "fadeUp 0.6s ease-out 0.5s both" }}>
            {["🔒 End-to-end encrypted", "🇮🇳 BNS / BNSS compliant", "🤖 AI-powered", "⚖️ Court-admissible evidence"].map((item) => (
              <span key={item} className="hover:text-slate-400 transition-colors cursor-default">{item}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-10 px-4 border-y border-slate-800/60">
        <div className="container mx-auto max-w-4xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map((s) => (
              <Reveal key={s.label}>
                <div className="group cursor-default p-4 rounded-xl hover:bg-slate-800/30 transition-colors">
                  <p className="text-3xl font-bold text-white mb-1 group-hover:text-orange-400 transition-colors">
                    <Counter to={s.value} suffix={s.suffix} />
                  </p>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">{s.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── THREE PILLARS ── */}
      <section className="py-24 px-4 relative">
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(99,102,241,0.04) 0%, transparent 70%)" }} />
        <div className="container mx-auto max-w-5xl relative">
          <Reveal>
            <div className="text-center mb-16">
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-3">Architecture</p>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Three Pillars of{" "}
                <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">Nyaya-Sathi</span>
              </h2>
              <p className="text-slate-400 max-w-lg mx-auto">A comprehensive architecture designed for India's new legal framework</p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-6">
            {pillars.map((p, i) => (
              <Reveal key={p.title} delay={i * 0.15}>
                <div className={`group relative rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm p-7 transition-all duration-300 ${p.border} hover:shadow-2xl ${p.shadowColor} hover:-translate-y-2 cursor-default overflow-hidden`}>
                  {/* Active gradient fill */}
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${p.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  {/* Shimmer line */}
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div className="absolute top-5 right-5 font-mono text-xs text-slate-800 group-hover:text-slate-600 transition-colors">{p.number}</div>

                  <div className="relative">
                    <div className={`inline-flex h-12 w-12 rounded-xl items-center justify-center ${p.iconBg} mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                      <p.icon className={`h-6 w-6 ${p.iconColor}`} />
                    </div>
                    <h3 className="text-base font-semibold text-white mb-3 group-hover:text-white">{p.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">{p.description}</p>
                    <div className={`mt-5 flex items-center gap-1 text-xs font-medium ${p.iconColor} opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300`}>
                      Learn more <ChevronRight className="h-3 w-3" />
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 px-4 border-t border-slate-800/60 relative">
        <div className="container mx-auto max-w-4xl">
          <Reveal>
            <div className="text-center mb-16">
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-3">Process</p>
              <h2 className="text-3xl md:text-4xl font-bold text-white">How It Works</h2>
            </div>
          </Reveal>

          <div className="relative space-y-4">
            {/* Connector line */}
            <div className="absolute left-7 top-10 bottom-10 w-0.5 bg-gradient-to-b from-orange-500/50 via-indigo-500/30 to-transparent hidden sm:block" />

            {steps.map((item, i) => (
              <Reveal key={item.step} delay={i * 0.12}>
                <div
                  onMouseEnter={() => setActiveStep(i)}
                  onMouseLeave={() => setActiveStep(null)}
                  className={`group relative flex gap-5 items-start p-5 rounded-2xl border transition-all duration-300 cursor-default ${
                    activeStep === i
                      ? "border-orange-500/30 bg-slate-900/70 shadow-xl shadow-orange-500/5 -translate-x-1"
                      : "border-slate-800/60 bg-slate-900/20 hover:bg-slate-900/50"
                  }`}
                >
                  {/* Step circle */}
                  <div className={`relative shrink-0 h-14 w-14 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white font-bold text-sm transition-all duration-300 shadow-lg ${item.shadow} z-10 ${activeStep === i ? "scale-110 rotate-3" : ""}`}>
                    {item.step}
                    {activeStep === i && (
                      <div className="absolute inset-0 rounded-xl animate-ping opacity-20 bg-white" />
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex-1 pt-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{item.emoji}</span>
                      <h3 className={`font-semibold text-base transition-colors ${activeStep === i ? "text-orange-300" : "text-white"}`}>
                        {item.title}
                      </h3>
                      {activeStep === i && <CheckCircle className="h-4 w-4 text-emerald-400 animate-in fade-in duration-200" />}
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>

                  {/* Progress bar */}
                  <div className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-gradient-to-r ${item.color} transition-transform duration-500 origin-left ${activeStep === i ? "scale-x-100" : "scale-x-0"}`} />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA STRIP ── */}
      <section className="py-20 px-4">
        <Reveal>
          <div className="container mx-auto max-w-3xl">
            <div className="relative rounded-3xl p-10 text-center overflow-hidden border border-orange-500/20 group cursor-default"
              style={{ background: "linear-gradient(135deg, rgba(249,115,22,0.07), rgba(99,102,241,0.07))" }}>
              {/* Animated border glow on hover */}
              <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ boxShadow: "inset 0 0 60px rgba(249,115,22,0.08), 0 0 80px rgba(249,115,22,0.06)" }} />

              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 relative">
                Ready to file your complaint?
              </h2>
              <p className="text-slate-400 text-sm mb-8 relative">
                Join thousands of citizens using Nyaya-Sathi to access justice faster.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center relative">
                <Link to="/auth">
                  <button
                    className="group h-12 px-8 rounded-xl font-semibold text-white flex items-center gap-2 transition-all duration-300 hover:scale-105"
                    style={{ background: "linear-gradient(135deg, #f97316, #f59e0b)", boxShadow: "0 0 30px rgba(249,115,22,0.35)" }}
                  >
                    Get Started Free
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
                <Link to="/track">
                  <button className="h-12 px-8 rounded-xl font-medium text-slate-300 border border-slate-700 hover:border-slate-500 hover:text-white hover:bg-white/5 transition-all duration-300 hover:scale-105">
                    Track a Complaint
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-800/60 py-10 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #f97316, #f59e0b)" }}>
                <Scale className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-white">Nyaya-Sathi</span>
              <span className="text-slate-500 text-sm">— The BNS-Ready Justice Portal</span>
            </div>
            <div className="flex items-center gap-6 text-xs text-slate-600">
              <span>Built for a safer, more accessible India.</span>
              <span className="hidden md:block">© 2025</span>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes expandWidth {
          from { transform: scaleX(0); transform-origin: left; }
          to { transform: scaleX(1); transform-origin: left; }
        }
        @keyframes barPulse {
          0%, 100% { transform: scaleY(0.6); opacity: 0.6; }
          50% { transform: scaleY(1.6); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
