"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import { LayoutDashboard, LogOut, User as UserIcon } from "lucide-react";

export default function UserNav() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (loading) return <div className="w-20 h-8 bg-gray-100 animate-pulse rounded-lg"></div>;

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <Link 
          href={`/login${typeof window !== 'undefined' ? `?next=${window.location.pathname}` : ''}`}
          className="text-sm font-medium text-muted hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-gray-50"
        >
          Login
        </Link>
        <Link
          href="/generate"
          className="text-sm font-semibold bg-primary text-white px-5 py-2.5 rounded-xl hover:bg-primary-hover transition-all hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98]"
        >
          Try Free
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <Link
        href="/dashboard"
        className="hidden sm:flex items-center gap-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
      >
        <LayoutDashboard size={18} />
        Dashboard
      </Link>
      <Link
        href="/generate"
        className="text-sm font-semibold bg-primary-light text-primary px-4 py-2 rounded-xl hover:bg-primary/10 transition-all"
      >
        New Proposal
      </Link>
      <button
        onClick={handleSignOut}
        className="text-muted hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50"
        title="Sign out"
      >
        <LogOut size={18} />
      </button>
    </div>
  );
}
