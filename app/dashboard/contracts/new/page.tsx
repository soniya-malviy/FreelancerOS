"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Loader2, ArrowLeft, Download, Copy, Check } from "lucide-react";
import Link from "next/link";
import { getApiUrl, getAuthHeaders } from "@/utils/api";

interface Proposal {
  id: string;
  client_name: string;
  job_description: string;
  rate: string;
}

export default function NewContractPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const proposalId = searchParams.get("proposal_id");
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [contractText, setContractText] = useState("");
  const [generationTime, setGenerationTime] = useState(0);
  const [copied, setCopied] = useState(false);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    client_name: "",
    project_description: "",
    amount: "",
    payment_terms: "50-50",
    revisions: 2,
    delivery_date: "",
    proposal_id: proposalId || "",
  });

  useEffect(() => {
    async function fetchProposals() {
      const { data } = await supabase
        .from("proposals")
        .select("id, client_name, job_description, rate")
        .eq("status", "won")
        .order("created_at", { ascending: false });

      if (data) {
        setProposals(data);
        // Pre-fill from linked proposal
        if (proposalId) {
          const linked = data.find(p => p.id === proposalId);
          if (linked) {
            setForm(prev => ({
              ...prev,
              client_name: linked.client_name || "",
              project_description: linked.job_description || "",
              amount: linked.rate || "",
              proposal_id: linked.id,
            }));
          }
        }
      }
    }
    fetchProposals();
  }, [proposalId, supabase]);

  const handleLinkedProposalChange = (id: string) => {
    const linked = proposals.find(p => p.id === id);
    if (linked) {
      setForm(prev => ({
        ...prev,
        client_name: linked.client_name || prev.client_name,
        project_description: linked.job_description || prev.project_description,
        amount: linked.rate || prev.amount,
        proposal_id: id,
      }));
    } else {
      setForm(prev => ({ ...prev, proposal_id: "" }));
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setError("");

    try {
      const headers = await getAuthHeaders(supabase);
      const res = await fetch(getApiUrl("/api/generate-contract"), {
        method: "POST",
        headers,
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to generate contract");
        return;
      }

      setContractText(data.contractText);
      setGenerationTime(data.generationTime);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    import("jspdf").then(({ jsPDF }) => {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const maxWidth = pageWidth - margin * 2;

      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("FREELANCE CONTRACT", margin, 25);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text(`Client: ${form.client_name}  |  Amount: ${form.amount}`, margin, 35);
      doc.setDrawColor(200);
      doc.line(margin, 40, pageWidth - margin, 40);

      doc.setTextColor(0);
      doc.setFontSize(11);
      const lines = doc.splitTextToSize(contractText, maxWidth);
      let y = 50;
      for (const line of lines) {
        if (y > 275) { doc.addPage(); y = 20; }
        doc.text(line, margin, y);
        y += 6;
      }
      doc.save(`contract-${form.client_name.toLowerCase().replace(/\s+/g, "-")}.pdf`);
    });
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in pb-20">
      <Link href="/dashboard/contracts" className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground mb-8 transition-colors">
        <ArrowLeft size={16} /> Back to Contracts
      </Link>

      <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">Create Contract</h1>
      <p className="text-muted mb-10">Fill in the details and let AI generate a professional contract.</p>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7">
          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border border-border shadow-sm space-y-6">
            {/* Linked Proposal */}
            {proposals.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground uppercase tracking-wider">Link to Won Proposal</label>
                <select
                  value={form.proposal_id}
                  onChange={(e) => handleLinkedProposalChange(e.target.value)}
                  className="w-full bg-gray-50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="">None</option>
                  {proposals.map(p => (
                    <option key={p.id} value={p.id}>{p.client_name || "Unnamed"} — {p.job_description?.substring(0, 60)}...</option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">Client Name *</label>
                <input type="text" value={form.client_name} onChange={e => setForm(p => ({ ...p, client_name: e.target.value }))} required
                  className="w-full bg-gray-50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="Acme Corp" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">Total Amount *</label>
                <input type="text" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} required
                  className="w-full bg-gray-50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="$5,000 or €4,500" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">Project Description *</label>
              <textarea value={form.project_description} onChange={e => setForm(p => ({ ...p, project_description: e.target.value }))} required rows={4}
                className="w-full bg-gray-50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none" placeholder="Describe the project scope..." />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">Payment Terms *</label>
                <select value={form.payment_terms} onChange={e => setForm(p => ({ ...p, payment_terms: e.target.value }))}
                  className="w-full bg-gray-50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                  <option value="full-upfront">Full Upfront</option>
                  <option value="50-50">50-50 Split</option>
                  <option value="milestone">Milestone-based</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">Revisions</label>
                <input type="number" value={form.revisions} onChange={e => setForm(p => ({ ...p, revisions: parseInt(e.target.value) || 2 }))} min={0} max={10}
                  className="w-full bg-gray-50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">Delivery Date</label>
                <input type="date" value={form.delivery_date} onChange={e => setForm(p => ({ ...p, delivery_date: e.target.value }))}
                  className="w-full bg-gray-50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-primary text-white text-lg font-bold py-4 rounded-2xl hover:bg-primary-hover transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-3">
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating...</> : "Generate Contract"}
            </button>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}
          </form>
        </div>

        <div className="lg:col-span-5">
          {contractText ? (
            <div className="sticky top-24 space-y-4 animate-slide-up">
              <div className="bg-white p-6 rounded-3xl border border-border shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-foreground">Generated Contract</h3>
                  <span className="text-xs text-muted">{(generationTime || 0).toFixed(1)}s</span>
                </div>
                <div className="max-h-[500px] overflow-y-auto custom-scrollbar bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{contractText}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={handleDownloadPdf}
                  className="flex-1 flex items-center justify-center gap-2 border-2 border-primary text-primary font-bold py-3 rounded-2xl hover:bg-primary-light transition-all active:scale-95">
                  <Download size={18} /> PDF
                </button>
                <button onClick={() => { navigator.clipboard.writeText(contractText); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary text-white font-bold py-3 rounded-2xl hover:bg-primary-hover transition-all active:scale-95">
                  {copied ? <><Check size={18} /> Copied!</> : <><Copy size={18} /> Copy</>}
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] bg-gray-50 border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-border flex items-center justify-center mb-6">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14,2 14,8 20,8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-foreground">Contract Preview</h3>
              <p className="text-muted mt-2 max-w-[200px]">Fill in the form to generate your contract.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
