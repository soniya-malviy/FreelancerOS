import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { jobDescription, rate, aboutYou, wordCount, generationType } = await req.json();

    // 1. Auth & Usage Check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let proposalsThisMonth = 0;
    let profileId = null;
    let profile = null;

    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("id, proposals_this_month, experience, skills, niche")
        .eq("id", user.id)
        .single();
        
      profile = data;

      if (profile) {
        profileId = profile.id;
        proposalsThisMonth = profile.proposals_this_month;
      }
    }

    // Validate inputs
    if (!jobDescription || !rate || !aboutYou) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === "your_key_here") {
      return NextResponse.json(
        {
          error:
            "API key not configured. Please add your GROQ_API_KEY to .env.local",
        },
        { status: 500 }
      );
    }

    const client = new Groq({ apiKey });

    const startTime = Date.now();

    const isCoverLetter = generationType === "cover_letter";

    const systemPrompt = isCoverLetter
      ? `You are an expert cover letter writer. You help job applicants write concise, compelling, and professional cover letters that highlight their relevant experience and enthusiasm for the role. You write in a confident, warm tone — never desperate or generic.`
      : `You are an expert freelance proposal writer. You help freelancers win more clients by writing short, personalized, and professional proposals. You have deep knowledge of what clients on Upwork, Fiverr, and LinkedIn actually respond to.`;

    const userPrompt = isCoverLetter
      ? `Write a professional cover letter for this person:

APPLICANT PROFILE:
- Background: ${profile?.niche || "Professional"}
- Skills: ${profile?.skills?.join(", ") || "General Skills"}
- Experience: ${profile?.experience || aboutYou}
- Expected Compensation: ${rate}

JOB DESCRIPTION:
${jobDescription}

STRICT RULES:

1. LENGTH: ${wordCount || 200} words MAXIMUM.

2. OPENING: Start with a specific, attention-grabbing line that references something unique about the company or role. Never open with "I am writing to apply for...".

3. STRUCTURE:
   - Paragraph 1: Hook — why this role excites you (be specific to THIS job)
   - Paragraph 2: Your 2-3 most relevant experiences/skills that directly match the job requirements
   - Paragraph 3: What you'd bring to the team and a confident closing with a call to action

4. TONE: Professional but human. Confident but not arrogant. Show personality.

5. BANNED PHRASES: "I believe I am a great fit", "I am passionate about", "Please find attached", "I am excited to apply", "With my X years of experience".

6. PERSONALIZATION: This letter must feel custom-written for THIS specific job. If it could be sent to any other role without editing, rewrite it.

7. Never invent specific fake company names. Use descriptive references instead.

Output ONLY the cover letter text. No labels, no preamble. Just the letter, ready to send.`
      : `Write a winning freelance proposal for this person:

FREELANCER PROFILE:
- Niche: ${profile?.niche || "Freelancer"}
- Skills: ${profile?.skills?.join(", ") || "General Skills"}
- Detailed Experience: ${profile?.experience || aboutYou}
- Rate for this project: ${rate}

JOB DESCRIPTION THEY ARE APPLYING FOR:
${jobDescription}

STRICT RULES — follow every single one:

1. LENGTH: ${wordCount || 150} words MAXIMUM. Count every word. If it exceeds ${wordCount || 150}, cut 
   the fluff.

2. OPENING LINE: Start with ONE specific detail pulled directly from this 
   job post — something unique to this client only. Never open with "I", 
   never open with a compliment about the project.

3. BANNED PHRASES — never use these under any circumstances:
   - "I love the idea"
   - "I am excited to"
   - "I believe I am a great fit"
   - "I am writing to apply"
   - "With my X years of experience"
   - "I would love to"
   - "Please find attached"
   - "I am passionate about"
   - "Look no further"
   - "I am the perfect candidate"

4. STRUCTURE — follow this exact order:
   - Line 1-2: Hook using a specific detail from the job post.
   - Line 3-5: Mention 1-2 past projects or skills that directly match THIS job.
   - Line 6-8: Clearly state deliverables, timeline, and rate.
   - Last 1-2 lines: End with ONE genuine question or a soft offer for a quick call.

5. TONE: Write like a confident, experienced professional having a direct 
   conversation — not like someone filling out a job application.

6. NO FLUFF RULE: Every single sentence must earn its place.

7. PERSONALIZATION CHECK: This proposal must NOT be sendable to a different job post without editing.

8. IMPORTANT: Never invent specific fake company names as past clients.

Output ONLY the proposal text. No labels, no explanations, no preamble. Just the proposal, ready to copy and send.`;

    const chatCompletion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1024,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const endTime = Date.now();
    const generationTime = (endTime - startTime) / 1000;

    const proposalText =
      chatCompletion.choices?.[0]?.message?.content || "No proposal generated.";

    // 4. Increment usage if logged in
    if (user && profileId) {
      await supabase
        .from("profiles")
        .update({ proposals_this_month: proposalsThisMonth + 1 })
        .eq("id", profileId);
    }

    return NextResponse.json({
      proposal: proposalText,
      generationTime,
    });
  } catch (error: unknown) {
    console.error("Groq API error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    if (
      errorMessage.includes("401") ||
      errorMessage.includes("authentication")
    ) {
      return NextResponse.json(
        { error: "Invalid API key. Please check your GROQ_API_KEY." },
        { status: 401 }
      );
    }

    if (errorMessage.includes("429") || errorMessage.includes("rate")) {
      return NextResponse.json(
        {
          error:
            "Rate limit reached. Please wait a moment and try again.",
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        error:
          "Something went wrong generating your proposal. Please try again.",
      },
      { status: 500 }
    );
  }
}
