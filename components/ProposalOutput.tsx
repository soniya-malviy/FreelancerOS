"use client";

import { useState, useRef, useEffect } from "react";

interface ProposalOutputProps {
  proposal: string;
  generationTime: number;
  onGenerateVariant: () => void;
  isGenerating: boolean;
  onSave?: (text: string) => void;
  isSaving?: boolean;
  isSaved?: boolean;
}

export default function ProposalOutput({
  proposal,
  generationTime,
  onGenerateVariant,
  isGenerating,
  onSave,
  isSaving,
  isSaved,
}: ProposalOutputProps) {
  const [editedProposal, setEditedProposal] = useState(proposal);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditedProposal(proposal);
  }, [proposal]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editedProposal);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      if (textareaRef.current) {
        textareaRef.current.select();
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  return (
    <div className="animate-slide-up">
      {/* Section Title */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Your proposal is ready</h2>
          <p className="text-sm text-muted">Edit it below, then copy and send</p>
        </div>
      </div>

      {/* Proposal Card */}
      <div className="bg-card border border-border rounded-2xl p-1">
        <textarea
          ref={textareaRef}
          value={editedProposal}
          onChange={(e) => setEditedProposal(e.target.value)}
          className="w-full bg-transparent text-foreground text-[15px] leading-relaxed p-5 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[280px]"
          rows={12}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mt-5">
        <button
          onClick={handleCopy}
          className="flex-1 flex items-center justify-center gap-2 bg-primary text-white font-semibold py-3.5 px-6 rounded-xl hover:bg-primary-hover transition-all hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98]"
        >
          {copied ? (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
              Copy to clipboard
            </>
          )}
        </button>

        <button
          onClick={onGenerateVariant}
          disabled={isGenerating}
          className="flex-1 flex items-center justify-center gap-2 border-2 border-primary text-primary font-semibold py-3.5 px-6 rounded-xl hover:bg-primary-light transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2" />
          </svg>
          Generate another variant
        </button>

        <button
          onClick={() => onSave?.(editedProposal)}
          disabled={isSaving || isSaved}
          className={`flex-1 flex items-center justify-center gap-2 border border-border font-medium py-3.5 px-6 rounded-xl transition-all active:scale-[0.98] ${
            isSaved ? "bg-green-50 text-green-600 border-green-200" : "text-muted hover:bg-gray-50 hover:text-foreground"
          }`}
        >
          {isSaving ? (
            <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          ) : isSaved ? (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              Saved to dashboard
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                <polyline points="17,21 17,13 7,13 7,21" />
                <polyline points="7,3 7,8 15,8" />
              </svg>
              Save to dashboard →
            </>
          )}
        </button>
      </div>

      {/* Generation time */}
      <p className="text-center text-sm text-muted mt-5">
        Generated in {generationTime.toFixed(1)} seconds
      </p>
    </div>
  );
}
