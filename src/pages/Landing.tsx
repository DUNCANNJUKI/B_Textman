import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Smartphone, Zap, ShieldCheck, BarChart3, Globe2, ArrowRight, CheckCircle2 } from "lucide-react";
import logo from "@/assets/btextman-logo.png";
import Seo from "@/components/Seo";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <Seo
        title="B-TEXTMAN — Cloud SMS Gateway from Android Phones"
        description="Turn Android phones with real SIM cards into a programmable SMS gateway. REST API, multi-device routing, and realtime delivery reports."
        path="/"
      />
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none" style={{ background: "var(--gradient-glow)" }} />

      <header className="relative z-10 border-b border-border/60 bg-background/70 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logo} alt="B-TEXTMAN" className="h-10 w-10 rounded-md shadow-glow object-cover" />
            <div className="leading-tight">
              <div className="font-bold tracking-tight">B-TEXTMAN</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">SMS Gateway</div>
            </div>
          </div>
          <nav className="flex items-center gap-2">
            <Link to="/auth"><Button variant="ghost">Sign in</Button></Link>
            <Link to="/auth"><Button>Get started <ArrowRight className="h-4 w-4 ml-1" /></Button></Link>
          </nav>
        </div>
      </header>

      <section className="relative z-10 max-w-7xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-6">
          <span className="h-2 w-2 rounded-full bg-primary pulse-dot" /> Production-grade SMS infrastructure
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight max-w-4xl mx-auto leading-[1.05]">
          Your phones, <span className="text-gradient">your gateway</span>.
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mt-6 max-w-2xl mx-auto">
          B TEXTMAN turns Android phones with real SIM cards into a programmable SMS gateway.
          Send, route and track messages over a REST API with realtime delivery reports.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
          <Link to="/auth"><Button size="lg" className="shadow-glow">Open dashboard <ArrowRight className="h-4 w-4 ml-1" /></Button></Link>
          <Link to="/auth"><Button size="lg" variant="outline">Read API docs</Button></Link>
        </div>
      </section>

      <section className="relative z-10 max-w-7xl mx-auto px-6 pb-24 grid md:grid-cols-3 gap-6">
        {[
          { icon: Smartphone, title: "Multi-device routing", desc: "Connect unlimited Android gateways and route messages by SIM, operator or priority." },
          { icon: Zap, title: "Realtime delivery", desc: "Supabase Realtime pushes jobs to devices instantly. No polling, no delay." },
          { icon: ShieldCheck, title: "API-key auth", desc: "Per-client API keys with rate limits, hashed storage and usage analytics." },
          { icon: BarChart3, title: "Live analytics", desc: "Throughput, success rate, device health and per-client traffic graphs." },
          { icon: Globe2, title: "Unicode + multipart", desc: "Send GSM7 or UCS2 messages of any length. Parts are auto-counted and tracked." },
          { icon: CheckCircle2, title: "Reliable retries", desc: "Exponential backoff retries for failed sends and full delivery-report audit trail." },
        ].map((f, i) => (
          <div key={i} className="p-6 rounded-xl border border-border/60 bg-card shadow-card hover:shadow-glow transition">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <f.icon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold mb-1">{f.title}</h3>
            <p className="text-sm text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </section>

      <footer className="relative z-10 border-t border-border/60 py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} B TEXTMAN — SMS Gateway Platform
      </footer>
    </div>
  );
}
