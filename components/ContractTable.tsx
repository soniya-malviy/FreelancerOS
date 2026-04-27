"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Eye, ChevronRight } from "lucide-react";

interface Contract {
  id: string;
  client_name: string;
  project_description: string;
  amount: string;
  payment_terms: string;
  status: string;
  created_at: string;
  contract_text: string;
}

export default function ContractTable({ initialContracts }: { initialContracts: Contract[] }) {
  const [contracts, setContracts] = useState(initialContracts);
  const [selected, setSelected] = useState<Contract | null>(null);
  const [copied, setCopied] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (selected) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [selected]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from("contracts")
      .update({ status: newStatus })
      .eq("id", id);
    if (!error) {
      setContracts(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
    }
  };

  const handleDownloadPdf = (contract: Contract) => {
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
      doc.text(`Client: ${contract.client_name}  |  Amount: ${contract.amount}`, margin, 35);
      doc.text(`Generated: ${new Date(contract.created_at).toLocaleDateString()}`, margin, 41);

      doc.setDrawColor(200);
      doc.line(margin, 46, pageWidth - margin, 46);

      doc.setTextColor(0);
      doc.setFontSize(11);
      const lines = doc.splitTextToSize(contract.contract_text, maxWidth);
      let y = 55;
      for (const line of lines) {
        if (y > 275) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, margin, y);
        y += 6;
      }

      doc.save(`contract-${contract.client_name.toLowerCase().replace(/\s+/g, "-")}.pdf`);
    });
  };

  return (
    <>
      <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-white">
        <div>
          <h2 className="text-lg font-bold text-foreground">Your Contracts</h2>
          <p className="text-xs text-muted mt-0.5">Manage and track your freelance contracts</p>
        </div>
        <span className="text-[10px] font-bold text-muted uppercase tracking-widest bg-gray-50 px-2 py-1 rounded">
          {contracts.length} Total
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-border">
              <th className="px-6 py-4 text-xs font-semibold text-muted uppercase">Client</th>
              <th className="px-6 py-4 text-xs font-semibold text-muted uppercase">Amount</th>
              <th className="px-6 py-4 text-xs font-semibold text-muted uppercase">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-muted uppercase">Date</th>
              <th className="px-6 py-4 text-xs font-semibold text-muted uppercase text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {contracts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-muted">
                  No contracts yet. Create your first one!
                </td>
              </tr>
            ) : (
              contracts.map((contract) => (
                <tr key={contract.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-foreground">{contract.client_name}</p>
                    <p className="text-xs text-muted truncate max-w-[200px] mt-0.5">{contract.project_description}</p>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-foreground">{contract.amount}</td>
                  <td className="px-6 py-4">
                    <select
                      value={contract.status}
                      onChange={(e) => handleStatusChange(contract.id, e.target.value)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full appearance-none cursor-pointer focus:outline-none ${
                        contract.status === "signed" ? "bg-green-100 text-green-700" :
                        contract.status === "sent" ? "bg-blue-100 text-blue-700" :
                        "bg-gray-100 text-gray-700"
                      }`}
                    >
                      <option value="draft">Draft</option>
                      <option value="sent">Sent</option>
                      <option value="signed">Signed</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted">
                    {new Date(contract.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelected(contract)}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-hover transition-colors"
                    >
                      View <ChevronRight size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* View Modal */}
      {selected && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-[32px] w-full max-w-3xl max-h-[85vh] flex flex-col shadow-[0_32px_64px_-15px_rgba(0,0,0,0.3)] overflow-hidden animate-scale-in">
            <div className="flex items-center justify-between p-8 border-b border-gray-100">
              <div>
                <h3 className="text-2xl font-black text-foreground tracking-tight">Contract Review</h3>
                <p className="text-sm text-muted mt-1">{selected.client_name} · {selected.amount}</p>
              </div>
              <button onClick={() => setSelected(null)} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-muted hover:bg-gray-100 hover:text-foreground transition-all">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="bg-primary-light/20 p-8 rounded-[28px] border border-primary/10">
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">{selected.contract_text}</p>
              </div>
            </div>
            <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between gap-3">
              <button onClick={() => setSelected(null)} className="text-sm font-bold text-muted hover:text-foreground transition-colors">
                Close
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleDownloadPdf(selected)}
                  className="flex items-center gap-2 border-2 border-primary text-primary font-bold px-6 py-3 rounded-2xl hover:bg-primary-light transition-all active:scale-95"
                >
                  Download PDF
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selected.contract_text);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="flex items-center gap-2 bg-primary text-white font-bold px-8 py-3 rounded-2xl hover:bg-primary-hover transition-all active:scale-95"
                >
                  {copied ? "Copied!" : "Copy Text"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
