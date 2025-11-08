import { Link } from "react-router-dom";
import { Brain, MessageCircle, ShieldCheck, Zap } from "lucide-react";

export default function Index() {
  return (
    <div className="">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-30 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.35),transparent_40%),radial-gradient(ellipse_at_bottom_left,rgba(168,85,247,0.35),transparent_40%)]"/>
        <div className="mx-auto max-w-7xl px-4 md:px-6 pt-12 md:pt-20 pb-12 md:pb-20 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="inline-flex items-center gap-2 chip">
              <ShieldCheck className="h-4 w-4 text-blue-600"/>
              Empowering GHSS Karai students
            </div>
            <h1 className="mt-4 text-4xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-b from-blue-600 to-purple-600 bg-clip-text text-transparent">
              GHSS KARAI AI
            </h1>
            <p className="mt-4 text-slate-600 text-lg md:text-xl max-w-xl">
              Your intelligent study companion. Ask questions, get instant explanations, and learn faster with our AI tutor designed for school success.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link to="/tutor" className="btn-secondary">Start Learning</Link>
              <a href="#features" className="btn-primary">Explore Features</a>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -top-8 -left-8 h-40 w-40 rounded-full bg-blue-400/30 blur-3xl"/>
            <div className="absolute -bottom-8 -right-8 h-40 w-40 rounded-full bg-purple-400/30 blur-3xl"/>
            <div className="glass rounded-3xl p-6 shadow-2xl">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 p-4 text-white">
                  <div className="text-sm opacity-90">Subjects</div>
                  <div className="mt-1 text-2xl font-extrabold">Math • Science</div>
                </div>
                <div className="rounded-2xl bg-white/70 p-4">
                  <div className="text-sm text-slate-600">Daily Limit</div>
                  <div className="mt-1 text-2xl font-extrabold">20</div>
                </div>
                <div className="rounded-2xl bg-white/70 p-4">
                  <div className="text-sm text-slate-600">Real-time</div>
                  <div className="mt-1 text-2xl font-extrabold">AI Chat</div>
                </div>
                <div className="rounded-2xl bg-white/70 p-4">
                  <div className="text-sm text-slate-600">Secure</div>
                  <div className="mt-1 text-2xl font-extrabold">Google Auth</div>
                </div>
              </div>
              <div className="mt-6 rounded-2xl border bg-white/70 p-4">
                <div className="text-sm text-slate-600">Example Question</div>
                <div className="mt-2 rounded-xl bg-slate-50 p-3 text-slate-700">Explain photosynthesis in simple terms.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-4 md:px-6 pb-16">
        <div className="grid md:grid-cols-3 gap-6">
          <Feature icon={<Brain className="h-6 w-6"/>} title="Smart Explanations" desc="Clear, concise answers with examples, steps, and references using Gemini 2.0 Flash." />
          <Feature icon={<MessageCircle className="h-6 w-6"/>} title="Real-time Chat" desc="Smooth, mobile-first chat with Markdown, code blocks, and quick examples." />
          <Feature icon={<Zap className="h-6 w-6"/>} title="Fast & Secure" desc="Google login, daily limits, and a reliable backend deployed on Render." />
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-8 text-sm text-slate-600 flex items-center justify-between">
          <div>© {new Date().getFullYear()} GHSS KARAI AI</div>
          <div className="flex items-center gap-4">
            <Link to="/about" className="hover:text-slate-900">About</Link>
            <Link to="/contact" className="hover:text-slate-900">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="glass rounded-2xl p-6">
      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 text-white grid place-items-center">
        {icon}
      </div>
      <div className="mt-4 font-semibold text-lg">{title}</div>
      <div className="mt-1 text-slate-600 text-sm">{desc}</div>
    </div>
  );
}
