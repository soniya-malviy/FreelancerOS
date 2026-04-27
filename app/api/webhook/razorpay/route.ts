import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest("hex");

  if (signature !== expectedSignature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const payload = JSON.parse(body);
  const event = payload.event;

  if (event === "subscription.charged") {
    const userId = payload.payload.subscription.entity.notes.user_id;
    const planType = payload.payload.subscription.entity.notes.plan_type;

    await supabaseAdmin
      .from("profiles")
      .update({ plan: planType })
      .eq("id", userId);
  }

  if (event === "subscription.cancelled" || event === "subscription.halted") {
    const userId = payload.payload.subscription.entity.notes.user_id;

    await supabaseAdmin
      .from("profiles")
      .update({ plan: "free" })
      .eq("id", userId);
  }

  return NextResponse.json({ received: true });
}
