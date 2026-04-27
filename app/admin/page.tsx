import { createClient } from "@/utils/supabase/server";
import { Users, FileText, MousePointer2, BarChart3, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AdminDashboard() {
  const supabase = await createClient();
  
  // Auth check - restricted to owner only
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== "soniya.04malviya@gmail.com") {
    redirect("/dashboard");
  }
  
  // Fetch Stats
  const [
    { count: totalUsers },
    { count: totalProposals },
    { data: visits },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("proposals").select("*", { count: "exact", head: true }),
    supabase.from("page_visits").select("visitor_id, path"),
  ]);

  const totalPageViews = visits?.length || 0;
  const uniqueVisitors = new Set(visits?.map(v => v.visitor_id)).size;

  // Path breakdown
  const paths: Record<string, number> = {};
  visits?.forEach(v => {
    paths[v.path] = (paths[v.path] || 0) + 1;
  });

  const topPaths = Object.entries(paths)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const stats = [
    { name: "Total Users", value: totalUsers || 0, icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
    { name: "Total Proposals", value: totalProposals || 0, icon: FileText, color: "text-purple-600", bg: "bg-purple-100" },
    { name: "Total Page Views", value: totalPageViews, icon: MousePointer2, color: "text-emerald-600", bg: "bg-emerald-100" },
    { name: "Unique Visitors", value: uniqueVisitors, icon: BarChart3, color: "text-amber-600", bg: "bg-amber-100" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground mb-2 transition-colors">
              <ArrowLeft size={16} /> Back to Dashboard
            </Link>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Admin Analytics</h1>
            <p className="text-muted text-sm mt-1">Real-time overview of FreelanceOS performance</p>
          </div>
          <div className="bg-primary/10 text-primary px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider">
            Live Data
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.name} className="bg-white p-6 rounded-3xl border border-border shadow-sm">
                <div className={`w-12 h-12 ${stat.bg} rounded-2xl flex items-center justify-center mb-4`}>
                  <Icon className={stat.color} size={24} />
                </div>
                <p className="text-muted text-sm font-medium mb-1">{stat.name}</p>
                <p className="text-3xl font-bold text-foreground tracking-tight">{stat.value.toLocaleString()}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Pages */}
          <div className="bg-white p-8 rounded-3xl border border-border shadow-sm">
            <h3 className="text-xl font-bold text-foreground mb-6">Top Pages</h3>
            <div className="space-y-4">
              {topPaths.map(([path, count]) => (
                <div key={path} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground bg-gray-50 px-3 py-1.5 rounded-lg border border-border">
                    {path}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary" 
                        style={{ width: `${(count / totalPageViews) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-foreground">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Info */}
          <div className="bg-white p-8 rounded-3xl border border-border shadow-sm flex flex-col justify-center text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <BarChart3 className="text-primary" size={32} />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Growth Tracking</h3>
            <p className="text-muted text-sm leading-relaxed max-w-xs mx-auto">
              Your platform is currently tracking all user interactions. 
              Visitor data is anonymized and stored securely in your Supabase database.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
