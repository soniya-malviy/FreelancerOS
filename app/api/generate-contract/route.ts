import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const {
      client_name,
      project_description,
      amount,
      payment_terms,
      revisions,
      delivery_date,
      proposal_id,
    } = await req.json();

    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Fetch profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, niche")
      .eq("id", user.id)
      .single();

    // Validate
    if (!client_name || !project_description || !amount || !payment_terms) {
      return NextResponse.json({ error: "Required fields missing." }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured." }, { status: 500 });
    }

    const client = new Groq({ apiKey });
    const startTime = Date.now();

    const chatCompletion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 2048,
      messages: [
        {
          role: "system",
          content: "You are an expert contract writer for freelancers. You write clear, professional contracts in plain English — no legalese. Your contracts are suitable for freelancers working with global clients.",
        },
        {
          role: "user",
          content: `Generate a professional freelance contract with these details:
- Freelancer: ${profile?.full_name || "Freelancer"}
- Client: ${client_name}
- Project: ${project_description}
- Amount: ${amount}
- Payment terms: ${payment_terms}
- Revisions: ${revisions || 2} rounds included
- Delivery: ${delivery_date || "To be discussed"}

Include sections: Scope of Work, Payment Terms, Revision Policy, Intellectual Property (client owns final files after full payment), Confidentiality, Cancellation Policy (50% kill fee if cancelled after work begins).

Tone: Professional but plain English. No legalese. Suitable for global freelancers.
Output ONLY the contract text, formatted with clear section headings.`,
        },
      ],
    });

    const endTime = Date.now();
    const generationTime = (endTime - startTime) / 1000;
    const contractText = chatCompletion.choices?.[0]?.message?.content || "No contract generated.";

    // Save to database
    const { data: contract, error: saveError } = await supabase
      .from("contracts")
      .insert({
        user_id: user.id,
        proposal_id: proposal_id || null,
        client_name,
        project_description,
        amount,
        payment_terms,
        revisions: revisions || 2,
        delivery_date: delivery_date || null,
        contract_text: contractText,
        status: "draft",
      })
      .select()
      .single();

    if (saveError) {
      console.error("Contract save error:", saveError);
      return NextResponse.json(
        { contractText, generationTime, saved: false, error: saveError.message },
        { status: 200 }
      );
    }

    return NextResponse.json({
      contractText,
      generationTime,
      saved: true,
      contractId: contract.id,
    });
  } catch (error: unknown) {
    console.error("Contract generation error:", error);
    return NextResponse.json(
      { error: "Something went wrong generating your contract." },
      { status: 500 }
    );
  }
}
