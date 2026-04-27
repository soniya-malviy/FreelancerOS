-- Supabase Schema for FreelanceOS

-- Create the PROFILES table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  full_name TEXT,
  plan TEXT DEFAULT 'free',
  proposals_this_month INTEGER DEFAULT 0,
  niche TEXT,
  experience TEXT,
  skills TEXT[],
  avatar_url TEXT,
  resume_url TEXT,
  bank_details TEXT,
  upi_id TEXT,
  ifsc_code TEXT,
  account_holder_name TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- CREATE STORAGE BUCKETS
-- Run these in the Supabase Dashboard:
-- 1. Create bucket 'avatars' (public: true)
-- 2. Create bucket 'resumes' (public: false)

-- Create the PROPOSALS table
CREATE TABLE IF NOT EXISTS public.proposals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  job_description TEXT NOT NULL,
  rate TEXT NOT NULL,
  output_text TEXT NOT NULL,
  client_name TEXT,
  status TEXT DEFAULT 'draft', -- 'draft', 'sent', 'won', 'lost'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create the CONTRACTS table
CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  proposal_id UUID REFERENCES public.proposals(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  project_description TEXT NOT NULL,
  amount TEXT NOT NULL,
  payment_terms TEXT NOT NULL,
  revisions INTEGER DEFAULT 2,
  delivery_date DATE,
  contract_text TEXT NOT NULL,
  status TEXT DEFAULT 'draft', -- 'draft', 'sent', 'signed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create the INVOICES table
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT,
  project_name TEXT NOT NULL,
  amount TEXT NOT NULL,
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'overdue'
  invoice_text TEXT,
  follow_up_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- POLICIES FOR PROFILES
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- POLICIES FOR PROPOSALS
CREATE POLICY "Users can view own proposals" ON public.proposals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own proposals" ON public.proposals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own proposals" ON public.proposals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own proposals" ON public.proposals
  FOR DELETE USING (auth.uid() = user_id);

-- POLICIES FOR CONTRACTS
CREATE POLICY "Users can view own contracts" ON public.contracts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contracts" ON public.contracts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contracts" ON public.contracts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own contracts" ON public.contracts
  FOR DELETE USING (auth.uid() = user_id);

-- POLICIES FOR INVOICES
CREATE POLICY "Users can view own invoices" ON public.invoices
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own invoices" ON public.invoices
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own invoices" ON public.invoices
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own invoices" ON public.invoices
  FOR DELETE USING (auth.uid() = user_id);

-- TRIGGER TO AUTOMATICALLY CREATE PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- MIGRATION QUERIES (run these if tables already exist)
-- =============================================
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bank_details TEXT;
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS upi_id TEXT;
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ifsc_code TEXT;
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_holder_name TEXT;
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS experience TEXT;
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS skills TEXT[];
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS resume_url TEXT;

-- =============================================
-- PAGE VISITS TABLE (for admin analytics)
-- Run this in Supabase SQL Editor
-- =============================================
CREATE TABLE IF NOT EXISTS public.page_visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  path TEXT NOT NULL,
  visitor_id TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Allow inserts from anyone (anonymous tracking)
ALTER TABLE public.page_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert visits" ON public.page_visits FOR INSERT WITH CHECK (true);
CREATE POLICY "Only service role can read visits" ON public.page_visits FOR SELECT USING (true);
