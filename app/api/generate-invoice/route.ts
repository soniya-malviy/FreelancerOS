import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const {
      client_name,
      client_email,
      project_name,
      amount,
      due_date,
      contract_id,
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
      .select("full_name, email, bank_details, upi_id, ifsc_code, account_holder_name")
      .eq("id", user.id)
      .single();

    // Validate
    if (!client_name || !project_name || !amount || !due_date) {
      return NextResponse.json({ error: "Required fields missing." }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured." }, { status: 500 });
    }

    // Generate invoice number
    const invoiceNumber = `INV-${Math.floor(1000 + Math.random() * 9000)}`;

    // Build payment details string
    const paymentDetails = [
      profile?.upi_id ? `UPI: ${profile.upi_id}` : null,
      profile?.bank_details ? `Bank Account: ${profile.bank_details}` : null,
      profile?.ifsc_code ? `IFSC: ${profile.ifsc_code}` : null,
      profile?.account_holder_name ? `Account Holder: ${profile.account_holder_name}` : null,
    ].filter(Boolean).join("\n") || "Payment details not configured";

    const client = new Groq({ apiKey });
    const startTime = Date.now();

    const chatCompletion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1024,
      messages: [
        {
          role: "system",
          content: "You are an expert invoice writer. You generate clean, professional invoices that are clear and easy to understand.",
        },
        {
          role: "user",
          content: `Generate a clean, professional invoice:
- Invoice #: ${invoiceNumber}
- From: ${profile?.full_name || "Freelancer"}, ${profile?.email || ""}
- To: ${client_name}${client_email ? `, ${client_email}` : ""}
- Project: ${project_name}
- Amount due: ${amount}
- Due date: ${due_date}
- Payment details:
${paymentDetails}

Include: Description of work, amount, due date, payment instructions, thank you note.
Output ONLY the invoice content in a clean format with clear labels.`,
        },
      ],
    });

    const endTime = Date.now();
    const generationTime = (endTime - startTime) / 1000;
    const invoiceText = chatCompletion.choices?.[0]?.message?.content || "No invoice generated.";

    // Save to database
    const { data: invoice, error: saveError } = await supabase
      .from("invoices")
      .insert({
        user_id: user.id,
        contract_id: contract_id || null,
        invoice_number: invoiceNumber,
        client_name,
        client_email: client_email || null,
        project_name,
        amount,
        due_date,
        status: "pending",
        invoice_text: invoiceText,
      })
      .select()
      .single();

    if (saveError) {
      console.error("Invoice save error:", saveError);
      return NextResponse.json(
        { invoiceText, invoiceNumber, generationTime, saved: false, error: saveError.message },
        { status: 200 }
      );
    }

    return NextResponse.json({
      invoiceText,
      invoiceNumber,
      generationTime,
      saved: true,
      invoiceId: invoice.id,
    });
  } catch (error: unknown) {
    console.error("Invoice generation error:", error);
    return NextResponse.json(
      { error: "Something went wrong generating your invoice." },
      { status: 500 }
    );
  }
}
