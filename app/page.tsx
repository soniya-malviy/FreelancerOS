import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 sm:pt-28 sm:pb-24">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-primary-light text-primary text-sm font-medium px-4 py-2 rounded-full mb-8 animate-fade-in">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              AI-powered proposal writing
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight leading-[1.1] mb-6 animate-slide-up">
              Winning proposals
              <br />
              <span className="text-primary">in 30 seconds.</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-muted max-w-xl mx-auto mb-10 leading-relaxed animate-slide-up stagger-1">
              Paste a job. Set your rate. AI writes a personalized proposal — ready to send.
            </p>

            {/* CTA Button */}
            <div className="animate-slide-up stagger-2">
              <Link
                href="/generate"
                className="inline-flex items-center gap-2 bg-primary text-white text-lg font-semibold px-8 py-4 rounded-2xl hover:bg-primary-hover transition-all hover:shadow-xl hover:shadow-primary/25 active:scale-[0.97]"
              >
                Try free — no signup needed
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
              <p className="text-sm text-muted mt-4">
                3 free proposals/month. No credit card.
              </p>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="border-y border-border bg-card/50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-center gap-4">
            {/* Avatar stack */}
            <div className="flex -space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                AS
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                RK
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                PM
              </div>
            </div>
            <p className="text-sm font-medium text-muted">
              Trusted by <span className="text-foreground font-semibold">1,200+</span> Indian freelancers
            </p>
          </div>
        </section>

        {/* How It Works */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-4">
              How it works
            </h2>
            <p className="text-muted text-lg max-w-md mx-auto">
              Three simple steps to your next winning proposal
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {/* Step 1 */}
            <div className="relative group">
              <div className="bg-white border border-border rounded-2xl p-8 hover:shadow-lg hover:shadow-primary/5 transition-all hover:-translate-y-1">
                <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center mb-5">
                  <span className="text-primary font-bold text-lg">1</span>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">
                  Paste the job description
                </h3>
                <p className="text-muted text-sm leading-relaxed">
                  Copy-paste any job post from Upwork, LinkedIn, Fiverr, or anywhere else.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative group">
              <div className="bg-white border border-border rounded-2xl p-8 hover:shadow-lg hover:shadow-primary/5 transition-all hover:-translate-y-1">
                <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center mb-5">
                  <span className="text-primary font-bold text-lg">2</span>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">
                  Enter your rate and niche
                </h3>
                <p className="text-muted text-sm leading-relaxed">
                  Tell us your rate and a few lines about your skills and experience.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative group">
              <div className="bg-white border border-border rounded-2xl p-8 hover:shadow-lg hover:shadow-primary/5 transition-all hover:-translate-y-1">
                <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center mb-5">
                  <span className="text-primary font-bold text-lg">3</span>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">
                  Get your proposal in 30 seconds
                </h3>
                <p className="text-muted text-sm leading-relaxed">
                  AI generates a personalized, client-ready proposal you can send immediately.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-primary">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
              Stop wasting hours on proposals
            </h2>
            <p className="text-white/70 text-lg max-w-md mx-auto mb-8">
              Join 1,200+ freelancers who send better proposals in less time.
            </p>
            <Link
              href="/generate"
              className="inline-flex items-center gap-2 bg-white text-primary text-lg font-semibold px-8 py-4 rounded-2xl hover:bg-gray-50 transition-all hover:shadow-xl active:scale-[0.97]"
            >
              Generate your first proposal
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted">
            FreelanceOS © 2025 | Made for Indian freelancers
          </p>
          <div className="flex items-center gap-1 text-sm text-muted">
            Built with
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#EF4444" stroke="none">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
            </svg>
            in India
          </div>
        </div>
      </footer>
    </div>
  );
}
