"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { ChevronRight } from "lucide-react";

interface Invoice {
  id: string;
  invoice_number: string;
  client_name: string;
  client_email: string;
  project_name: string;
  amount: string;
  due_date: string;
  status: string;
  invoice_text: string;
  follow_up_count: number;
  created_at: string;
}

export default function InvoiceTable({ initialInvoices }: { initialInvoices: Invoice[] }) {
  const [invoices, setInvoices] = useState(initialInvoices);
  const [selected, setSelected] = useState<Invoice | null>(null);
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
      .from("invoices")
      .update({ status: newStatus })
      .eq("id", id);
    if (!error) {
      setInvoices(prev => prev.map(i => i.id === id ? { ...i, status: newStatus } : i));
    }
  };

  const handleDownloadPdf = (invoice: Invoice) => {
    import("jspdf").then(({ jsPDF }) => {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const maxWidth = pageWidth - margin * 2;

      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("INVOICE", margin, 25);

      doc.setFontSize(12);
      doc.setTextColor(108, 71, 255);
      doc.text(invoice.invoice_number, pageWidth - margin, 25, { align: "right" });

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text(`Client: ${invoice.client_name}`, margin, 38);
      doc.text(`Amount: ${invoice.amount}  |  Due: ${new Date(invoice.due_date).toLocaleDateString()}`, margin, 44);

      doc.setDrawColor(200);
      doc.line(margin, 50, pageWidth - margin, 50);

      doc.setTextColor(0);
      doc.setFontSize(11);
      const lines = doc.splitTextToSize(invoice.invoice_text || "", maxWidth);
      let y = 60;
      for (const line of lines) {
        if (y > 275) { doc.addPage(); y = 20; }
        doc.text(line, margin, y);
        y += 6;
      }

      doc.save(`${invoice.invoice_number}.pdf`);
    });
  };

  const isOverdue = (due: string) => new Date(due) < new Date();

  return (
    <>
      <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-white">
        <div>
          <h2 className="text-lg font-bold text-foreground">Your Invoices</h2>
          <p className="text-xs text-muted mt-0.5">Track payments and follow up with clients</p>
        </div>
        <span className="text-[10px] font-bold text-muted uppercase tracking-widest bg-gray-50 px-2 py-1 rounded">
          {invoices.length} Total
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-border">
              <th className="px-6 py-4 text-xs font-semibold text-muted uppercase">Invoice #</th>
              <th className="px-6 py-4 text-xs font-semibold text-muted uppercase">Client</th>
              <th className="px-6 py-4 text-xs font-semibold text-muted uppercase">Amount</th>
              <th className="px-6 py-4 text-xs font-semibold text-muted uppercase">Due Date</th>
              <th className="px-6 py-4 text-xs font-semibold text-muted uppercase">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-muted uppercase text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-muted">
                  No invoices yet. Create your first one!
                </td>
              </tr>
            ) : (
              invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm font-bold text-primary">{invoice.invoice_number}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-foreground">{invoice.client_name}</p>
                    <p className="text-xs text-muted mt-0.5">{invoice.project_name}</p>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-foreground">{invoice.amount}</td>
                  <td className="px-6 py-4 text-sm text-muted">
                    {new Date(invoice.due_date).toLocaleDateString()}
                    {invoice.status === "pending" && isOverdue(invoice.due_date) && (
                      <span className="ml-2 text-[10px] font-bold text-red-500">OVERDUE</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={invoice.status}
                      onChange={(e) => handleStatusChange(invoice.id, e.target.value)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full appearance-none cursor-pointer focus:outline-none ${
                        invoice.status === "paid" ? "bg-green-100 text-green-700" :
                        invoice.status === "overdue" ? "bg-red-100 text-red-700" :
                        "bg-amber-100 text-amber-700"
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="overdue">Overdue</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelected(invoice)}
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
                <h3 className="text-2xl font-black text-foreground tracking-tight">{selected.invoice_number}</h3>
                <p className="text-sm text-muted mt-1">{selected.client_name} · {selected.amount}</p>
              </div>
              <button onClick={() => setSelected(null)} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-muted hover:bg-gray-100 hover:text-foreground transition-all">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Due Date</p>
                  <p className="text-sm font-bold text-foreground mt-1">{new Date(selected.due_date).toLocaleDateString()}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Follow-ups Sent</p>
                  <p className="text-sm font-bold text-foreground mt-1">{selected.follow_up_count}</p>
                </div>
              </div>
              <div className="bg-primary-light/20 p-8 rounded-[28px] border border-primary/10">
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">{selected.invoice_text}</p>
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
                    navigator.clipboard.writeText(selected.invoice_text || "");
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
