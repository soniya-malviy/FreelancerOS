import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { createClient } from "@/utils/supabase/server";

// Initialize Groq client
const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const BANNED_PHRASES = [
  "I love the idea",
  "I am excited to",
  "I believe I am a great fit",
  "I am writing to apply",
  "With my X years of experience",
  "I would love to",
  "Please find attached",
  "I am passionate about",
  "Look no further",
  "I am the perfect candidate",
];

export async function POST(req: NextRequest) {
  try {
    const { jobDescription, rate, aboutYou, wordCount, user_id } = await req.json();

    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === "your_key_here") {
      return NextResponse.json(
        { error: "Groq API key is missing. Please add it to your .env.local file." },
        { status: 500 }
      );
    }

    // 1. Tool Definitions (Groq uses OpenAI-compatible format)
    const tools: Groq.Chat.ChatCompletionTool[] = [
      {
        type: "function",
        function: {
          name: "analyze_job",
          description: "Extracts key details and signals from a job description.",
          parameters: {
            type: "object",
            properties: {
              job_description: { type: "string", description: "The full job description text." },
            },
            required: ["job_description"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "get_user_profile",
          description: "Fetches the freelancer's profile details from the database.",
          parameters: {
            type: "object",
            properties: {
              user_id: { type: "string", description: "The UUID of the user." },
            },
            required: ["user_id"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "check_proposal_quality",
          description: "Validates a proposal against length and content rules.",
          parameters: {
            type: "object",
            properties: {
              proposal: { type: "string", description: "The generated proposal text." },
              word_count_limit: { type: "number", description: "The maximum allowed word count." },
            },
            required: ["proposal", "word_count_limit"],
          },
        },
      },
    ];

    const startTime = Date.now();

    // 2. Initial Message to Groq
    let messages: Groq.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are an AI Agent for FreelanceOS. Your goal is to write a high-converting freelance proposal.
        
YOUR PROCESS:
1. Call 'analyze_job' to understand the client's needs.
2. Call 'get_user_profile' if a user_id is provided to get their background.
3. Write a personalized proposal (max 150 words unless specified).
4. Call 'check_proposal_quality' to verify the output.
5. If it fails, rewrite it until it passes.
6. Return only the final proposal text.`,
      },
      {
        role: "user",
        content: `INPUTS:
- Job Description: ${jobDescription}
- Target Rate: ${rate}
- User ID: ${user_id || "guest"}
- Context provided by user: ${aboutYou || "None"}
- Word Count Limit: ${wordCount || 150}`,
      },
    ];

    let finalProposal = "";
    let loopCount = 0;
    const MAX_LOOPS = 5; // Llama can sometimes loop, keep it tight

    // 3. Agentic Loop
    while (loopCount < MAX_LOOPS) {
      const response = await client.chat.completions.create({
        model: "llama-3.3-70b-versatile", // Official Groq replacement — see groq.com/docs/deprecations
        messages,
        tools,
        tool_choice: "auto",
        max_tokens: 1024,
      });

      const responseMessage = response.choices[0].message;
      messages.push(responseMessage);

      if (responseMessage.tool_calls) {
        for (const toolCall of responseMessage.tool_calls) {
          const { name, arguments: argsString } = toolCall.function;
          const input = JSON.parse(argsString);
          let toolResult;

          console.log(`[Groq Agent] Calling tool: ${name}`, input);

          if (name === "analyze_job") {
            toolResult = {
              industry: "Inferred from description",
              tone: "Professional",
              key_requirements: ["Extracted automatically from job post"],
            };
          } else if (name === "get_user_profile") {
            const supabase = await createClient();
            const { data: profile } = await supabase
              .from("profiles")
              .select("niche, experience, skills")
              .eq("id", input.user_id)
              .single();
            
            toolResult = profile || { error: "Profile not found" };
          } else if (name === "check_proposal_quality") {
            const words = input.proposal.trim().split(/\s+/).length;
            const containsBanned = BANNED_PHRASES.filter(phrase => 
              input.proposal.toLowerCase().includes(phrase.toLowerCase())
            );

            if (words > input.word_count_limit) {
              toolResult = { status: "fail", reason: `Word count is ${words}, which exceeds limit of ${input.word_count_limit}.` };
            } else if (containsBanned.length > 0) {
              toolResult = { status: "fail", reason: `Contains banned phrases: ${containsBanned.join(", ")}` };
            } else {
              toolResult = { status: "pass" };
            }
          }

          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(toolResult),
          });
        }
      } else {
        // No more tool calls, we have the final text
        finalProposal = responseMessage.content || "";
        break;
      }

      loopCount++;
    }

    const endTime = Date.now();
    const generationTime = (endTime - startTime) / 1000;

    // 4. Update Usage
    if (user_id && user_id !== "guest") {
      const supabase = await createClient();
      const { data: profile } = await supabase
        .from("profiles")
        .select("proposals_this_month")
        .eq("id", user_id)
        .single();
      
      if (profile) {
        await supabase
          .from("profiles")
          .update({ proposals_this_month: (profile.proposals_this_month || 0) + 1 })
          .eq("id", user_id);
      }
    }

    return NextResponse.json({
      proposal: finalProposal || "Failed to generate proposal.",
      generationTime,
    });

  } catch (error: any) {
    console.error("Groq Agent Error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred during generation." },
      { status: 500 }
    );
  }
}


