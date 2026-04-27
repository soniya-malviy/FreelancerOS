import { createClient } from "@/utils/supabase/server";
import { Receipt, DollarSign, AlertCircle, Plus } from "lucide-react";
import Link from "next/link";
import InvoiceTable from "@/components/InvoiceTable";

export default async function InvoicesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();


  const { data: invoices } = await supabase
    .from("invoices")
    .select("*")
    .order("created_at", { ascending: false });

  const total = invoices?.length || 0;
  const paid = invoices?.filter(i => i.status === "paid").length || 0;
  const pending = invoices?.filter(i => i.status === "pending").length || 0;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Invoices</h1>
          <p className="text-muted text-sm">Generate invoices and track payments</p>
        </div>
        <Link href="/dashboard/invoices/new"
          className="inline-flex items-center gap-2 font-semibold px-5 py-2.5 rounded-xl transition-all bg-primary text-white hover:bg-primary-hover">
          <Plus size={18} /> New Invoice
        </Link>
      </div>


      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white border border-border p-6 rounded-2xl">
          <div className="flex items-center gap-3 text-muted mb-2"><Receipt size={18} /><span className="text-sm font-medium">Total</span></div>
          <p className="text-3xl font-bold text-foreground">{total}</p>
        </div>
        <div className="bg-white border border-border p-6 rounded-2xl">
          <div className="flex items-center gap-3 text-green-600 mb-2"><DollarSign size={18} /><span className="text-sm font-medium">Paid</span></div>
          <p className="text-3xl font-bold text-foreground">{paid}</p>
        </div>
        <div className="bg-white border border-border p-6 rounded-2xl">
          <div className="flex items-center gap-3 text-amber-500 mb-2"><AlertCircle size={18} /><span className="text-sm font-medium">Pending</span></div>
          <p className="text-3xl font-bold text-foreground">{pending}</p>
        </div>
      </div>

      <div className="bg-white border border-border rounded-2xl overflow-hidden">
        <InvoiceTable initialInvoices={invoices || []} />
      </div>
    </div>
  );
}
