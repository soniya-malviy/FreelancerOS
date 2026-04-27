import { createClient } from "@/utils/supabase/server";
import { Plus, Eye, TrendingUp, CheckCircle, Send } from "lucide-react";
import Link from "next/link";
import ProposalTable from "@/components/ProposalTable";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();


  // Fetch proposals
  const { data: proposals } = await supabase
    .from("proposals")
    .select("*")
    .order("created_at", { ascending: false });

  const totalSent = proposals?.filter(p => p.status !== 'draft').length || 0;
  const totalWon = proposals?.filter(p => p.status === 'won').length || 0;
  const winRate = totalSent > 0 ? Math.round((totalWon / totalSent) * 100) : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Proposals</h1>
          <p className="text-muted text-sm">Manage your projects and track performance</p>
        </div>
        <Link
          href="/generate"
          className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-primary-hover transition-all"
        >
          <Plus size={18} />
          New Proposal
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white border border-border p-6 rounded-2xl">
          <div className="flex items-center gap-3 text-muted mb-2">
            <Send size={18} />
            <span className="text-sm font-medium">Sent</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{totalSent}</p>
        </div>
        <div className="bg-white border border-border p-6 rounded-2xl">
          <div className="flex items-center gap-3 text-green-600 mb-2">
            <CheckCircle size={18} />
            <span className="text-sm font-medium">Won</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{totalWon}</p>
        </div>
        <div className="bg-white border border-border p-6 rounded-2xl">
          <div className="flex items-center gap-3 text-primary mb-2">
            <TrendingUp size={18} />
            <span className="text-sm font-medium">Win Rate</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{winRate}%</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-border rounded-2xl mt-16">
        <ProposalTable initialProposals={proposals || []} />
      </div>
    </div>
  );
}
