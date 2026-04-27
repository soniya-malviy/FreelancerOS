import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import path from "path";
import { PDFParse } from "pdf-parse";

export async function POST(req: NextRequest) {
  try {
    // Set the worker path for PDF parsing in Node.js environment
    const workerPath = path.join(process.cwd(), "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs");
    PDFParse.setWorker(workerPath);

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let rawText = "";

    // If it's a PDF, parse it using the modern class-based API
    if (file.type === "application/pdf") {
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      rawText = result.text;
    } else {
      // For images, we would ideally use OCR, but for this version 
      // we'll assume PDF for full text extraction.
      return NextResponse.json({ error: "Please upload a PDF for automatic extraction." }, { status: 400 });
    }

    if (!rawText || rawText.trim().length < 50) {
      return NextResponse.json({ error: "Could not extract enough text from the resume." }, { status: 400 });
    }

    // Now send the raw text to Groq to extract structured data
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "AI API key not configured" }, { status: 500 });
    }

    const groq = new Groq({ apiKey });

    const prompt = `Extract professional information from the following resume text. 
    Return ONLY a JSON object with these keys: 
    - "niche": (A short professional title, e.g., "Senior React Developer")
    - "experience": (A 3-4 sentence professional summary of their background and achievements)
    - "skills": (An array of the top 10 core technical or professional skills)

    RESUME TEXT:
    ${rawText.substring(0, 4000)} // Limit text to avoid token limits`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const aiData = JSON.parse(completion.choices[0].message.content || "{}");

    return NextResponse.json({
      success: true,
      data: aiData
    });

  } catch (error: any) {
    console.error("Resume parsing error:", error);
    return NextResponse.json({ error: error.message || "Failed to process resume" }, { status: 500 });
  }
}
