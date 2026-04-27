import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import Razorpay from "razorpay";

export async function POST(req: NextRequest) {
  try {
    const { planType } = await req.json(); // 'pro' or 'agency'
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const planId = planType === 'agency' 
      ? process.env.RAZORPAY_AGENCY_PLAN_ID 
      : process.env.RAZORPAY_PRO_PLAN_ID;

    if (!planId) {
      return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 });
    }

    const subscription = await instance.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      total_count: 120, // 10 years
      notes: {
        user_id: user.id,
        plan_type: planType
      }
    });

    return NextResponse.json({
      subscriptionId: subscription.id,
      key: process.env.RAZORPAY_KEY_ID,
      amount: planType === 'agency' ? 249900 : 79900, // in paise
      name: "FreelanceOS",
      description: `${planType === 'agency' ? 'Agency' : 'Pro'} Subscription`,
      prefill: {
        email: user.email,
      }
    });
  } catch (error: any) {
    console.error("Razorpay Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
