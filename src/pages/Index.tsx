import { Link } from "react-router-dom";
import { Shield, Brain, FileCheck, ArrowRight, Scale, Lock, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";

const pillars = [
  {
    icon: Languages,
    title: "Multilingual Intake",
    description:
      "Citizens input grievances in any language — Hindi, English, or mixed. AI extracts facts, dates, amounts, and entities from unstructured text.",
    color: "text-primary",
  },
  {
    icon: Brain,
    title: "Deterministic RAG Legal Scribe",
    description:
      "A hallucination-free RAG pipeline maps complaints to exact BNS/BNSS sections and generates structured FIR drafts instantly.",
    color: "text-ashoka",
  },
  {
    icon: Lock,
    title: "Evidence Hashing Engine",
    description:
      "Client-side SHA-256 hashing for BSA Section 63(4) compliance. No file uploads — all cryptography runs locally in the browser.",
    color: "text-success",
  },
];

const Index = () => {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 gradient-navy" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />

        <div className="container mx-auto relative z-10 text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-secondary/50 text-sm text-muted-foreground mb-8 animate-fade-up">
            <Scale className="h-4 w-4 text-primary" />
            BNS-Ready Justice Portal
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 animate-fade-up text-foreground">
            Justice, Made{" "}
            <span className="text-gradient-saffron">Accessible</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-up" style={{ animationDelay: "0.1s" }}>
            Bridging the gap between citizens and India's new justice system.
            AI-powered complaint filing, deterministic legal mapping, and
            court-ready evidence certification — all in one platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up" style={{ animationDelay: "0.2s" }}>
            <Button asChild size="lg" className="gradient-saffron glow-saffron text-primary-foreground font-semibold">
              <Link to="/citizen">
                File a Complaint <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/evidence">
                <Shield className="mr-2 h-4 w-4" />
                Evidence Portal
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4 text-foreground">
            Three Pillars of <span className="text-gradient-saffron">Nyaya-Sathi</span>
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
            A comprehensive architecture designed for India's new legal framework
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {pillars.map((pillar, i) => (
              <div
                key={pillar.title}
                className="rounded-xl border border-border bg-card p-6 card-glow transition-all hover:border-primary/30 animate-fade-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <pillar.icon className={`h-10 w-10 ${pillar.color} mb-4`} />
                <h3 className="text-lg font-semibold mb-2 text-card-foreground">{pillar.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 border-t border-border">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 text-foreground">
            How It Works
          </h2>
          <div className="space-y-8">
            {[
              { step: "01", title: "Citizen Files a Grievance", desc: "Type or speak your complaint in any language. Upload photos or documents as evidence." },
              { step: "02", title: "AI Translates & Triages", desc: "NLP extracts entities, maps the crime to exact BNS sections, and generates a formal FIR draft." },
              { step: "03", title: "Officer Reviews & Acts", desc: "The FIR routes to the responsible officer's dashboard for review, approval, and dispatch." },
              { step: "04", title: "Evidence Gets Certified", desc: "Digital evidence is hashed client-side with SHA-256, generating a BSA §63(4) compliant certificate." },
            ].map((item, i) => (
              <div key={item.step} className="flex gap-6 items-start animate-fade-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="flex-shrink-0 w-12 h-12 rounded-lg gradient-saffron flex items-center justify-center text-primary-foreground font-bold text-sm">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>Nyaya-Sathi — The BNS-Ready Justice Portal</p>
          <p className="mt-1">Built for a safer, more accessible India.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
