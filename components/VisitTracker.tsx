"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function VisitTracker() {
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    // Generate or reuse a visitor ID
    let visitorId = localStorage.getItem("fo_vid");
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      localStorage.setItem("fo_vid", visitorId);
    }

    supabase.from("page_visits").insert({
      path: pathname,
      visitor_id: visitorId,
      user_agent: navigator.userAgent,
    }).then(() => {});
  }, [pathname, supabase]);

  return null;
}
