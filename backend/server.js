require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');
const pdf = require('pdf-parse');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

// Supabase Setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Groq Setup
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Auth Middleware
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return next(); // Allow anonymous for some routes if needed

  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  req.user = user;
  next();
};

// Routes
app.get('/api/keep-alive', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 1. Generate Proposal/Cover Letter
app.post('/api/generate', authenticate, async (req, res) => {
  try {
    const { jobDescription, rate, aboutYou, wordCount, generationType } = req.body;
    const user = req.user;

    let profile = null;
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("id, proposals_this_month, experience, skills, niche")
        .eq("id", user.id)
        .single();
      profile = data;
    }

    if (!jobDescription || !rate || !aboutYou) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const isCoverLetter = generationType === "cover_letter";
    const systemPrompt = isCoverLetter
      ? `You are an expert cover letter writer. You help job applicants write concise, compelling, and professional cover letters that highlight their relevant experience and enthusiasm for the role.`
      : `You are an expert freelance proposal writer. You help freelancers win more clients by writing short, personalized, and professional proposals.`;

    const userPrompt = isCoverLetter
      ? `Write a professional cover letter for this person:\n\nAPPLICANT PROFILE:\n- Background: ${profile?.niche || "Professional"}\n- Skills: ${profile?.skills?.join(", ") || "General Skills"}\n- Experience: ${profile?.experience || aboutYou}\n- Expected Compensation: ${rate}\n\nJOB DESCRIPTION:\n${jobDescription}\n\nSTRICT RULES:\n1. LENGTH: ${wordCount || 200} words MAXIMUM.\n2. OPENING: Start with a specific, attention-grabbing line.\n3. Output ONLY the cover letter text.`
      : `Write a winning freelance proposal for this person:\n\nFREELANCER PROFILE:\n- Niche: ${profile?.niche || "Freelancer"}\n- Skills: ${profile?.skills?.join(", ") || "General Skills"}\n- Detailed Experience: ${profile?.experience || aboutYou}\n- Rate for this project: ${rate}\n\nJOB DESCRIPTION:\n${jobDescription}\n\nSTRICT RULES:\n1. LENGTH: ${wordCount || 150} words MAXIMUM.\n2. OPENING LINE: Start with ONE specific detail pulled directly from this job post.\n3. Output ONLY the proposal text.`;

    const chatCompletion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1024,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const proposalText = chatCompletion.choices?.[0]?.message?.content || "No text generated.";

    if (user && profile) {
      await supabase
        .from("profiles")
        .update({ proposals_this_month: (profile.proposals_this_month || 0) + 1 })
        .eq("id", user.id);
    }

    res.json({ proposal: proposalText });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Generation failed" });
  }
});

// 2. Parse Resume
app.post('/api/parse-resume', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const dataBuffer = req.file.buffer;
    const pdfData = await pdf(dataBuffer);
    const text = pdfData.text;

    const chatCompletion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { 
          role: "system", 
          content: "You are an AI that extracts professional information from resume text. Output ONLY valid JSON with keys: niche, skills (array), experience (detailed summary)." 
        },
        { role: "user", content: `Extract from this resume:\n\n${text}` }
      ],
      response_format: { type: "json_object" }
    });

    const extracted = JSON.parse(chatCompletion.choices[0].message.content);
    res.json({ success: true, data: extracted });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Parsing failed" });
  }
});

// 3. Generate Contract
app.post('/api/generate-contract', authenticate, async (req, res) => {
  try {
    const { clientName, projectDescription, amount, paymentTerms, revisions, deliveryDate } = req.body;
    
    const userPrompt = `Create a professional freelance contract with these details:
    - Client: ${clientName}
    - Project: ${projectDescription}
    - Amount: ${amount}
    - Payment Terms: ${paymentTerms}
    - Revisions: ${revisions}
    - Delivery Date: ${deliveryDate}
    
    Output ONLY the contract text in a professional format.`;

    const chatCompletion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: userPrompt }],
    });

    res.json({ contract: chatCompletion.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ error: "Contract generation failed" });
  }
});

// 4. Generate Invoice
app.post('/api/generate-invoice', authenticate, async (req, res) => {
  try {
    const { clientName, projectName, amount, dueDate, invoiceNumber } = req.body;
    
    const userPrompt = `Create a professional freelance invoice with these details:
    - Invoice #: ${invoiceNumber}
    - Client: ${clientName}
    - Project: ${projectName}
    - Amount: ${amount}
    - Due Date: ${dueDate}
    
    Output ONLY the invoice text in a clear, professional format.`;

    const chatCompletion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: userPrompt }],
    });

    res.json({ invoice: chatCompletion.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ error: "Invoice generation failed" });
  }
});

app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
});
