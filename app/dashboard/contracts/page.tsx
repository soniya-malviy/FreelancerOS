import { createClient } from "@/utils/supabase/server";
import { ScrollText, FileSignature, Clock, Plus } from "lucide-react";
import Link from "next/link";
import ContractTable from "@/components/ContractTable";

export default async function ContractsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();


  const { data: contracts } = await supabase
    .from("contracts")
    .select("*")
    .order("created_at", { ascending: false });

  const totalContracts = contracts?.length || 0;
  const signed = contracts?.filter(c => c.status === "signed").length || 0;
  const pending = contracts?.filter(c => c.status !== "signed").length || 0;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contracts</h1>
          <p className="text-muted text-sm">Generate and manage professional contracts</p>
        </div>
        <Link
          href="/dashboard/contracts/new"
          className="inline-flex items-center gap-2 font-semibold px-5 py-2.5 rounded-xl transition-all bg-primary text-white hover:bg-primary-hover"
        >
          <Plus size={18} />
          New Contract
        </Link>
      </div>


      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white border border-border p-6 rounded-2xl">
          <div className="flex items-center gap-3 text-muted mb-2">
            <ScrollText size={18} />
            <span className="text-sm font-medium">Total</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{totalContracts}</p>
        </div>
        <div className="bg-white border border-border p-6 rounded-2xl">
          <div className="flex items-center gap-3 text-green-600 mb-2">
            <FileSignature size={18} />
            <span className="text-sm font-medium">Signed</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{signed}</p>
        </div>
        <div className="bg-white border border-border p-6 rounded-2xl">
          <div className="flex items-center gap-3 text-amber-500 mb-2">
            <Clock size={18} />
            <span className="text-sm font-medium">Pending</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{pending}</p>
        </div>
      </div>

      <div className="bg-white border border-border rounded-2xl overflow-hidden">
        <ContractTable initialContracts={contracts || []} />
      </div>
    </div>
  );
}
