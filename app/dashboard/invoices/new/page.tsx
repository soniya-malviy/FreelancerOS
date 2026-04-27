"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Loader2, ArrowLeft, Download, Copy, Check } from "lucide-react";
import Link from "next/link";

export default function NewInvoicePage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [invoiceText, setInvoiceText] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [contracts, setContracts] = useState<any[]>([]);

  const [form, setForm] = useState({
    client_name: "",
    client_email: "",
    project_name: "",
    amount: "",
    due_date: "",
    contract_id: "",
  });

  useEffect(() => {
    async function fetchContracts() {
      const { data } = await supabase
        .from("contracts")
        .select("id, client_name, project_description, amount")
        .order("created_at", { ascending: false });
      if (data) setContracts(data);
    }
    fetchContracts();
  }, [supabase]);

  const handleLinkedContractChange = (id: string) => {
    const linked = contracts.find((c: any) => c.id === id);
    if (linked) {
      setForm(prev => ({
        ...prev,
        client_name: linked.client_name || prev.client_name,
        project_name: linked.project_description || prev.project_name,
        amount: linked.amount || prev.amount,
        contract_id: id,
      }));
    } else {
      setForm(prev => ({ ...prev, contract_id: "" }));
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/generate-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to generate invoice");
        return;
      }

      setInvoiceText(data.invoiceText);
      setInvoiceNumber(data.invoiceNumber);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    import("jspdf").then(({ jsPDF }) => {
      const doc = new jsPDF();
      const pw = doc.internal.pageSize.getWidth();
      const m = 20;
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("INVOICE", m, 25);
      doc.setFontSize(12);
      doc.setTextColor(108, 71, 255);
      doc.text(invoiceNumber, pw - m, 25, { align: "right" });
      doc.setTextColor(100);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Client: ${form.client_name}  |  Amount: ${form.amount}`, m, 38);
      doc.setDrawColor(200);
      doc.line(m, 44, pw - m, 44);
      doc.setTextColor(0);
      doc.setFontSize(11);
      const lines = doc.splitTextToSize(invoiceText, pw - m * 2);
      let y = 54;
      for (const line of lines) {
        if (y > 275) { doc.addPage(); y = 20; }
        doc.text(line, m, y);
        y += 6;
      }
      doc.save(`${invoiceNumber}.pdf`);
    });
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in pb-20">
      <Link href="/dashboard/invoices" className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground mb-8 transition-colors">
        <ArrowLeft size={16} /> Back to Invoices
      </Link>

      <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">Create Invoice</h1>
      <p className="text-muted mb-10">Generate a professional invoice to send to your client.</p>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7">
          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border border-border shadow-sm space-y-6">
            {contracts.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground uppercase tracking-wider">Link to Contract</label>
                <select value={form.contract_id} onChange={(e) => handleLinkedContractChange(e.target.value)}
                  className="w-full bg-gray-50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                  <option value="">None</option>
                  {contracts.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.client_name} — {c.amount}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">Client Name *</label>
                <input type="text" value={form.client_name} onChange={e => setForm(p => ({ ...p, client_name: e.target.value }))} required
                  className="w-full bg-gray-50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="Client name" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">Client Email</label>
                <input type="email" value={form.client_email} onChange={e => setForm(p => ({ ...p, client_email: e.target.value }))}
                  className="w-full bg-gray-50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="client@email.com" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">Project Name *</label>
              <input type="text" value={form.project_name} onChange={e => setForm(p => ({ ...p, project_name: e.target.value }))} required
                className="w-full bg-gray-50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="E-commerce Website Redesign" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">Amount *</label>
                <input type="text" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} required
                  className="w-full bg-gray-50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="₹25,000" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">Due Date *</label>
                <input type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} required
                  className="w-full bg-gray-50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-primary text-white text-lg font-bold py-4 rounded-2xl hover:bg-primary-hover transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-3">
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating...</> : "Generate Invoice"}
            </button>

            {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4"><p className="text-sm text-red-700 font-medium">{error}</p></div>}
          </form>
        </div>

        <div className="lg:col-span-5">
          {invoiceText ? (
            <div className="sticky top-24 space-y-4 animate-slide-up">
              <div className="bg-white p-6 rounded-3xl border border-border shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-foreground">{invoiceNumber}</h3>
                  <span className="px-2 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-md">PENDING</span>
                </div>
                <div className="max-h-[500px] overflow-y-auto custom-scrollbar bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{invoiceText}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={handleDownloadPdf}
                  className="flex-1 flex items-center justify-center gap-2 border-2 border-primary text-primary font-bold py-3 rounded-2xl hover:bg-primary-light transition-all active:scale-95">
                  <Download size={18} /> PDF
                </button>
                <button onClick={() => { navigator.clipboard.writeText(invoiceText); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary text-white font-bold py-3 rounded-2xl hover:bg-primary-hover transition-all active:scale-95">
                  {copied ? <><Check size={18} /> Copied!</> : <><Copy size={18} /> Copy</>}
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] bg-gray-50 border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-border flex items-center justify-center mb-6">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
              </div>
              <h3 className="text-xl font-bold text-foreground">Invoice Preview</h3>
              <p className="text-muted mt-2 max-w-[200px]">Fill in the form to generate your invoice.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
