"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  FileText, 
  ScrollText, 
  Receipt, 
  PlusCircle, 
  LogOut,
  User as UserIcon
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

const navItems = [
  { name: "Proposals", href: "/dashboard", icon: FileText },
  { name: "Contracts", href: "/dashboard/contracts", icon: ScrollText },
  { name: "Invoices", href: "/dashboard/invoices", icon: Receipt },
  { name: "Profile", href: "/dashboard/settings", icon: UserIcon },
];

export default function Sidebar() {
  const pathname = usePathname();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-white p-6 h-screen sticky top-0">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-10 group">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center transition-transform group-hover:scale-105">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </div>
        <span className="text-xl font-bold text-foreground tracking-tight">
          FreelanceOS
        </span>
      </Link>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive 
                  ? "bg-primary-light text-primary" 
                  : "text-muted hover:bg-gray-50 hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={20} />
                {item.name}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Action */}
      <div className="mt-auto pt-6 space-y-4">
        <Link
          href="/generate"
          className="flex items-center justify-center gap-2 w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-hover transition-all"
        >
          <PlusCircle size={18} />
          New Proposal
        </Link>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-muted hover:bg-red-50 hover:text-red-500 transition-all"
        >
          <LogOut size={20} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
