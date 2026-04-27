"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Eye, ChevronRight, MoreVertical, PartyPopper } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

interface Proposal {
  id: string;
  client_name: string;
  job_description: string;
  status: string;
  created_at: string;
  output_text: string;
  rate: string;
}

export default function ProposalTable({ initialProposals }: { initialProposals: Proposal[] }) {
  const [proposals, setProposals] = useState(initialProposals);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [copied, setCopied] = useState(false);
  const [wonProposal, setWonProposal] = useState<Proposal | null>(null);
  const supabase = createClient();

  // Lock scroll when modal is open
  useEffect(() => {
    if (selectedProposal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [selectedProposal]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from("proposals")
      .update({ status: newStatus })
      .eq("id", id);

    if (!error) {
      setProposals(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
      if (newStatus === "won") {
        const proposal = proposals.find(p => p.id === id);
        if (proposal) setWonProposal(proposal);
      }
    }
  };

  const handleUpdateClient = async (id: string, name: string) => {
    await supabase
      .from("proposals")
      .update({ client_name: name })
      .eq("id", id);
  };

  return (
    <>
      {/* Won Celebration Banner */}
      {wonProposal && (
        <div className="mx-6 mb-4 p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center justify-between gap-4 animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <PartyPopper size={20} className="text-green-600" />
            </div>
            <div>
              <p className="font-bold text-green-800 text-sm">🎉 Congratulations! You won this project!</p>
              <p className="text-green-700 text-xs mt-0.5">Want to create a contract for {wonProposal.client_name || "this client"}?</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setWonProposal(null)} className="text-xs text-green-600 hover:text-green-800 font-medium px-3 py-2">
              Dismiss
            </button>
            <Link href={`/dashboard/contracts/new?proposal_id=${wonProposal.id}`}
              className="bg-green-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-green-700 transition-all">
              Create Contract →
            </Link>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-border">
              <th className="px-6 py-4 text-xs font-semibold text-muted uppercase">Client / Project</th>
              <th className="px-6 py-4 text-xs font-semibold text-muted uppercase">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-muted uppercase">Date</th>
              <th className="px-6 py-4 text-xs font-semibold text-muted uppercase text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {proposals.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-muted">
                  No proposals found. Start by generating one!
                </td>
              </tr>
            ) : (
              proposals.map((proposal) => (
                <tr key={proposal.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4">
                    <input
                      type="text"
                      defaultValue={proposal.client_name || "Unnamed Project"}
                      onBlur={(e) => handleUpdateClient(proposal.id, e.target.value)}
                      className="bg-transparent font-medium text-foreground border-b border-transparent hover:border-gray-300 focus:border-primary focus:outline-none py-1 w-full max-w-[200px]"
                    />
                    <p className="text-xs text-muted truncate max-w-[200px] mt-1">{proposal.job_description}</p>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={proposal.status}
                      onChange={(e) => handleStatusChange(proposal.id, e.target.value)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full appearance-none cursor-pointer focus:outline-none ${proposal.status === 'won' ? "bg-green-100 text-green-700" :
                        proposal.status === 'lost' ? "bg-red-100 text-red-700" :
                          proposal.status === 'sent' ? "bg-blue-100 text-blue-700" :
                            "bg-gray-100 text-gray-700"
                        }`}
                    >
                      <option value="draft">Draft</option>
                      <option value="sent">Sent</option>
                      <option value="won">Won</option>
                      <option value="lost">Lost</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted">
                    {new Date(proposal.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelectedProposal(proposal)}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-hover transition-colors"
                    >
                      View
                      <ChevronRight size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* View Modal — rendered via Portal to escape overflow:hidden */}
      {selectedProposal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md animate-fade-in transition-all">
          <div className="bg-white rounded-[32px] w-full max-w-3xl max-h-[85vh] flex flex-col shadow-[0_32px_64px_-15px_rgba(0,0,0,0.3)] overflow-hidden border border-white/20 animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-8 border-b border-gray-100">
              <div>
                <h3 className="text-2xl font-black text-foreground tracking-tight">Proposal Review</h3>
                <p className="text-sm text-muted mt-1">Review and copy your AI-generated response</p>
              </div>
              <button
                onClick={() => setSelectedProposal(null)}
                className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-muted hover:bg-gray-100 hover:text-foreground transition-all"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="space-y-10">
                {/* Meta Info Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Project Reference</h4>
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <p className="text-sm font-bold text-foreground truncate">{selectedProposal.client_name || "Unnamed Project"}</p>
                      <p className="text-[10px] text-muted mt-1">Generated on {new Date(selectedProposal.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Agreed Rate</h4>
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <p className="text-sm font-bold text-foreground">{selectedProposal.rate || "Not specified"}</p>
                      <p className="text-[10px] text-muted mt-1">Estimated project value</p>
                    </div>
                  </div>
                </div>

                {/* Job Description (Collapsible Feel) */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Original Job Post</h4>
                  <div className="max-h-[120px] overflow-y-auto p-5 bg-gray-50 rounded-2xl border border-gray-100 text-sm text-muted-foreground leading-relaxed italic">
                    {selectedProposal.job_description}
                  </div>
                </div>

                {/* Main Proposal Content */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-foreground uppercase tracking-[0.2em]">AI Generated Proposal</h4>
                    <span className="px-2 py-1 bg-green-50 text-green-600 text-[10px] font-bold rounded-md">Optimized for Conversion</span>
                  </div>
                  <div className="bg-primary-light/20 p-8 rounded-[28px] border border-primary/10 shadow-sm relative group">
                    <p className="text-foreground text-lg leading-relaxed whitespace-pre-wrap font-medium">
                      {selectedProposal.output_text}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
              <button
                onClick={() => setSelectedProposal(null)}
                className="text-sm font-bold text-muted hover:text-foreground transition-colors"
              >
                Close Preview
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedProposal.output_text);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex items-center gap-2 bg-primary text-white font-bold px-10 py-4 rounded-2xl hover:bg-primary-hover transition-all hover:shadow-xl hover:shadow-primary/20 active:scale-95"
              >
                {copied ? (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                    </svg>
                    Copy Proposal
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      , document.body)}
    </>
  );
}
