import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Brain, Sparkles, MessageSquareText, ClipboardList, BarChart3, NotebookPen, ArrowRight, CheckCircle2 } from "lucide-react";

const exams = ["SSC CGL", "SSC CHSL", "UPSC", "Banking", "Railway", "DSSSB", "CPO", "State PCS"];

const features = [
  { icon: MessageSquareText, title: "Chat with your PDFs", desc: "Upload notes, ask anything. Get answers cited to exact pages." },
  { icon: Sparkles, title: "AI Question Generator", desc: "Generate exam-pattern MCQs from your own material instantly." },
  { icon: ClipboardList, title: "Full Mock Tests", desc: "Real SSC/UPSC patterns. Timer, palette, negative marking, analysis." },
  { icon: BarChart3, title: "Performance Analytics", desc: "Track weak topics, accuracy trends, time-per-question." },
  { icon: NotebookPen, title: "Revision Notes & Flashcards", desc: "One-click summaries and spaced-repetition cards from any chapter." },
  { icon: Brain, title: "AI Revision Planner", desc: "Personalised daily/weekly plans based on your test performance." },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-40 glass-nav bg-white/80 dark:bg-slate-900/80 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2" data-testid="landing-logo">
            <div className="size-9 rounded-md bg-slate-900 flex items-center justify-center">
              <Brain className="size-5 text-orange-500" />
            </div>
            <span className="font-heading font-bold text-xl">PrepMind <span className="text-orange-600">AI</span></span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/auth/login">
              <Button variant="ghost" data-testid="landing-login-btn">Sign in</Button>
            </Link>
            <Link to="/auth/register">
              <Button className="bg-orange-600 hover:bg-orange-700 text-white" data-testid="landing-register-btn">
                Get started <ArrowRight className="size-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-28 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-white dark:bg-slate-800 text-xs font-semibold tracking-wider uppercase text-slate-700 dark:text-slate-300 mb-6">
              <span className="size-2 rounded-full bg-orange-500 animate-pulse" /> Built for Indian Government Exams
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-heading tracking-tight leading-[1.05]">
              Crack SSC, UPSC & Banking <br />
              <span className="text-orange-600">with an AI study partner.</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed">
              Upload your notes. Chat with them. Generate exam-pattern mocks. Track weak topics. PrepMind AI turns your PDFs into a complete prep platform.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth/register">
                <Button size="lg" className="bg-slate-900 hover:bg-slate-800 text-white h-12 px-6" data-testid="hero-cta-register">
                  Start free — Upload your PDF <ArrowRight className="size-4 ml-2" />
                </Button>
              </Link>
              <Link to="/auth/login">
                <Button size="lg" variant="outline" className="h-12 px-6" data-testid="hero-cta-login">
                  I have an account
                </Button>
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><CheckCircle2 className="size-4 text-emerald-600" /> No credit card</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="size-4 text-emerald-600" /> Hindi + English</div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 bg-gradient-to-tr from-orange-200/40 via-transparent to-slate-200/30 dark:from-orange-900/30 dark:to-slate-800/20 blur-3xl -z-10" />
            <div className="rounded-2xl overflow-hidden border border-border shadow-2xl bg-card">
              <img
                src="https://images.pexels.com/photos/16504588/pexels-photo-16504588.jpeg"
                alt="Indian student preparing for exams"
                className="w-full h-[480px] object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-card border border-border rounded-xl shadow-xl p-4 max-w-[220px]">
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Avg. Score Gain</div>
              <div className="text-3xl font-bold font-heading mt-1">+34%</div>
              <div className="text-xs text-muted-foreground mt-1">across 60-day prep cycles</div>
            </div>
          </div>
        </div>
      </section>

      {/* Exams strip */}
      <section className="border-y border-border bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground mb-4">Designed for</div>
          <div className="flex flex-wrap gap-3">
            {exams.map((e) => (
              <span key={e} className="px-4 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-border text-sm font-semibold">
                {e}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-20">
        <div className="max-w-2xl">
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-orange-600 mb-3">Features</div>
          <h2 className="text-3xl md:text-4xl font-bold font-heading leading-tight">
            Everything you need. Nothing you don't.
          </h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-7 border border-border rounded-xl bg-card hover:-translate-y-1 hover:shadow-lg transition-all">
              <div className="size-10 rounded-md bg-slate-900 dark:bg-slate-100 flex items-center justify-center mb-4">
                <Icon className="size-5 text-orange-500" />
              </div>
              <h3 className="font-heading font-semibold text-lg mb-2">{title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 pb-20">
        <div className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-2xl p-10 md:p-16 grid md:grid-cols-[1fr_auto] gap-6 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold font-heading">Ready to study smarter?</h2>
            <p className="mt-3 opacity-80">Join thousands of aspirants. Upload your first PDF in 60 seconds.</p>
          </div>
          <Link to="/auth/register">
            <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-white h-12 px-8" data-testid="footer-cta-register">
              Start free now <ArrowRight className="size-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © 2026 PrepMind AI · Built for serious aspirants.
      </footer>
    </div>
  );
}
