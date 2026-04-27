"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import LoadingState from "@/components/LoadingState";
import ProposalOutput from "@/components/ProposalOutput";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import { Loader2, Sparkles, AlertCircle, FileText } from "lucide-react";

export default function GeneratePage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  
  const [jobDescription, setJobDescription] = useState("");
  const [rate, setRate] = useState("");
  const [aboutYou, setAboutYou] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [proposal, setProposal] = useState("");
  const [generationTime, setGenerationTime] = useState(0);
  const [error, setError] = useState("");
  const [wordCount, setWordCount] = useState(150);
  
  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("niche, experience, skills")
          .eq("id", user.id)
          .single();
          
        if (profile) {
          // Auto-fill from profile if experience exists
          if (profile.experience) {
            setAboutYou(profile.experience);
          } else if (profile.niche && !aboutYou) {
            setAboutYou(profile.niche);
          }
        }

        // AUTO-SAVE HANDOFF: Check for stashed proposal from guest session
        const stash = localStorage.getItem("fo_stash");
        if (stash) {
          const { text, job, rate: savedRate } = JSON.parse(stash);
          setProposal(text);
          setJobDescription(job);
          setRate(savedRate);
          
          // Small delay to ensure state is settled before saving
          setTimeout(() => {
            handleSave(text, job, savedRate);
            localStorage.removeItem("fo_stash");
          }, 500);
        }
      } else {
        // Guest user
        const savedAbout = localStorage.getItem("freelanceos_about");
        if (savedAbout) setAboutYou(savedAbout);
      }
    };
    
    fetchSession();
  }, [supabase]);

  // Save "aboutYou" locally
  useEffect(() => {
    if (aboutYou) {
      localStorage.setItem("freelanceos_about", aboutYou);
    }
  }, [aboutYou]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    setError("");
    setProposal("");
    setIsLoading(true);
    setIsSaved(false);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription, rate, aboutYou, wordCount }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setProposal(data.proposal);
      setGenerationTime(data.generationTime);
      
      // If guest, update local count and STASH for login handoff
      if (!user) {
        const newCount = parseInt(localStorage.getItem("fo_count") || "0") + 1;
        localStorage.setItem("fo_count", newCount.toString());
        
        localStorage.setItem("fo_stash", JSON.stringify({
          text: data.proposal,
          job: jobDescription,
          rate: rate
        }));
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (text: string, overrideJob?: string, overrideRate?: string) => {
    if (!user) {
      router.push("/login?next=/generate");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from("proposals").insert({
        user_id: user.id,
        job_description: overrideJob || jobDescription,
        rate: overrideRate || rate,
        output_text: text,
        status: "draft",
      });

      if (error) throw error;
      setIsSaved(true);
    } catch (err: any) {
      alert("Error saving: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };



  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-12 sm:py-20">
        {/* Page Header */}
        <div className="mb-12 text-center max-w-2xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight mb-4">
            Create a Winning Proposal
          </h1>
          <p className="text-muted-foreground text-lg">
            Our AI uses your profile data to craft high-converting proposals in seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Form */}
          <div className="lg:col-span-7 space-y-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="bg-white p-8 rounded-3xl border border-border shadow-sm space-y-6">
                <div className="space-y-3">
                  <label htmlFor="jobDescription" className="block text-sm font-bold text-foreground uppercase tracking-wider">
                    Job Description
                  </label>
                  <textarea
                    id="jobDescription"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the full job post from Upwork, LinkedIn, etc..."
                    rows={8}
                    required
                    className="w-full bg-gray-50 border border-border rounded-2xl px-5 py-4 text-foreground text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label htmlFor="rate" className="block text-sm font-bold text-foreground uppercase tracking-wider">
                      Budget / Rate
                    </label>
                    <input
                      id="rate"
                      type="text"
                      value={rate}
                      onChange={(e) => setRate(e.target.value)}
                      placeholder="e.g. $50/hr or $500 fixed"
                      required
                      className="w-full bg-gray-50 border border-border rounded-2xl px-5 py-4 text-foreground text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label htmlFor="wordCount" className="block text-sm font-bold text-foreground uppercase tracking-wider">
                        Length
                      </label>
                      <span className="text-xs font-bold text-primary">{wordCount} words</span>
                    </div>
                    <div className="pt-2">
                      <input
                        id="wordCount"
                        type="range"
                        min="50"
                        max="500"
                        step="10"
                        value={wordCount}
                        onChange={(e) => setWordCount(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-border shadow-sm space-y-4">
                <label htmlFor="aboutYou" className="block text-sm font-bold text-foreground uppercase tracking-wider">
                  Profile Context <span className="text-[10px] text-muted normal-case font-medium">(Synced with your profile)</span>
                </label>
                <textarea
                  id="aboutYou"
                  value={aboutYou}
                  onChange={(e) => setAboutYou(e.target.value)}
                  placeholder="Tell the AI a bit about your specific background for this bid..."
                  rows={4}
                  required
                  className="w-full bg-gray-50 border border-border rounded-2xl px-5 py-4 text-foreground text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-white text-xl font-bold py-5 rounded-2xl hover:bg-primary-hover transition-all hover:shadow-xl hover:shadow-primary/20 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    Generate Proposal
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Usage Info */}
            <div className="flex items-center justify-center gap-4">
              <span className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full bg-primary-light text-primary">
                <Sparkles size={14} />
                Unlimited Access
              </span>
            </div>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-5">
            {proposal && !isLoading ? (
              <div className="sticky top-24 animate-slide-up">
                <ProposalOutput
                  proposal={proposal}
                  generationTime={generationTime}
                  onGenerateVariant={() => handleSubmit()}
                  isGenerating={isLoading}
                  onSave={handleSave}
                  isSaving={isSaving}
                  isSaved={isSaved}
                />
              </div>
            ) : (
              <div className="h-full min-h-[400px] bg-gray-50 border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-border flex items-center justify-center mb-6">
                  <FileText className="text-muted-foreground" size={32} />
                </div>
                <h3 className="text-xl font-bold text-foreground">Awaiting Input</h3>
                <p className="text-muted-foreground mt-2 max-w-[200px]">
                  Fill in the details to the left to generate your proposal.
                </p>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-8 max-w-md mx-auto bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-4 animate-shake">
            <AlertCircle className="text-red-600 shrink-0" size={24} />
            <div>
              <p className="font-bold text-red-800 text-sm">Action Required</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-border bg-white mt-auto py-6 text-center">
        <p className="text-sm text-muted">FreelanceOS © 2025 | Made for Indian freelancers</p>
      </footer>
    </div>
  );
}
