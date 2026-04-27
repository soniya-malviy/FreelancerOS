"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import { useDropzone } from "react-dropzone";
import { 
  User as UserIcon, 
  Upload, 
  FileText, 
  Sparkles, 
  Save, 
  Check,
  AlertCircle,
  Loader2,
  Image as ImageIcon
} from "lucide-react";
import { getApiUrl, getAuthHeaders } from "@/utils/api";

export default function SettingsPage() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("general");

  // Profile State
  const [profile, setProfile] = useState({
    full_name: "",
    niche: "",
    experience: "",
    skills: [] as string[],
    avatar_url: "",
    resume_url: "",
    bank_details: "",
    upi_id: "",
    ifsc_code: "",
    account_holder_name: "",
  });

  const [newSkill, setNewSkill] = useState("");

  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (data) {
          setProfile({
            full_name: data.full_name || "",
            niche: data.niche || "",
            experience: data.experience || "",
            skills: data.skills || [],
            avatar_url: data.avatar_url || "",
            resume_url: data.resume_url || "",
            bank_details: data.bank_details || "",
            upi_id: data.upi_id || "",
            ifsc_code: data.ifsc_code || "",
            account_holder_name: data.account_holder_name || "",
          });
        }
      }
      setLoading(false);
    }
    getProfile();
  }, [supabase]);

  const onDropAvatar = useCallback(async (acceptedFiles: File[]) => {
    if (!user) return;
    const file = acceptedFiles[0];
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}-${Math.random()}.${fileExt}`;

    setSaving(true);
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);

    if (uploadError) {
      console.error("Upload error:", uploadError);
      setMessage({ type: "error", text: `Upload failed: ${uploadError.message}` });
    } else {
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      setMessage({ type: "success", text: "Avatar updated!" });
    }
    setSaving(false);
  }, [user, supabase]);

  const onDropResume = useCallback(async (acceptedFiles: File[]) => {
    if (!user) return;
    const file = acceptedFiles[0];
    
    setParsing(true);
    setMessage({ type: "info", text: "Analyzing resume with AI..." });

    const formData = new FormData();
    formData.append("file", file);

    try {
      const headers = await getAuthHeaders(supabase);
      delete headers["Content-Type"]; // Let browser set boundary for FormData
      
      const res = await fetch(getApiUrl("/api/parse-resume"), {
        method: "POST",
        headers,
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        setProfile(prev => ({
          ...prev,
          niche: data.data.niche || prev.niche,
          experience: data.data.experience || prev.experience,
          skills: [...new Set([...prev.skills, ...(data.data.skills || [])])]
        }));
        setMessage({ type: "success", text: "Resume analyzed successfully!" });
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to parse resume" });
    } finally {
      setParsing(false);
    }
  }, [user]);

  const { getRootProps: getAvatarProps, getInputProps: getAvatarInput } = useDropzone({
    onDrop: onDropAvatar,
    accept: { 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/webp': ['.webp'] },
    multiple: false
  });

  const { getRootProps: getResumeProps, getInputProps: getResumeInput } = useDropzone({
    onDrop: onDropResume,
    accept: { 'application/pdf': ['.pdf'], 'image/*': ['.jpg', '.jpeg', '.png'] },
    multiple: false
  });

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        niche: profile.niche,
        experience: profile.experience,
        skills: profile.skills,
        avatar_url: profile.avatar_url,
        bank_details: profile.bank_details,
        upi_id: profile.upi_id,
        ifsc_code: profile.ifsc_code,
        account_holder_name: profile.account_holder_name,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      console.error("Save error:", error);
      setMessage({ type: "error", text: `Failed to save: ${error.message}` });
    } else {
      setMessage({ type: "success", text: "Profile saved successfully!" });
    }
    setSaving(false);
  };

  const addSkill = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newSkill.trim()) {
      e.preventDefault();
      if (!profile.skills.includes(newSkill.trim())) {
        setProfile(prev => ({ ...prev, skills: [...prev.skills, newSkill.trim()] }));
      }
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setProfile(prev => ({ 
      ...prev, 
      skills: prev.skills.filter(s => s !== skillToRemove) 
    }));
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight">Professional Profile</h1>
          <p className="text-muted-foreground mt-2 text-lg">Build your identity to generate higher-converting proposals.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 bg-primary text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-primary-hover transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-primary/20"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save size={20} />}
          Save Profile
        </button>
      </div>

      {/* Tabs / Navigation */}
      <div className="flex items-center gap-2 border-b border-border">
        {['general', 'resume', 'skills', 'payment'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-4 text-sm font-bold capitalize transition-all border-b-2 -mb-[2px] ${
              activeTab === tab 
                ? 'border-primary text-primary' 
                : 'border-transparent text-muted hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl flex items-center gap-3 animate-slide-up ${
          message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 
          'bg-primary-light text-primary border border-primary/10'
        }`}>
          {message.type === 'error' ? <AlertCircle size={20} /> : <Check size={20} />}
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {activeTab === 'general' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-border shadow-sm">
              <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">Profile Photo</h3>
              <div {...getAvatarProps()} className="group relative w-32 h-32 mx-auto cursor-pointer">
                <div className="w-full h-full rounded-2xl bg-gray-50 border-2 border-dashed border-border group-hover:border-primary transition-colors overflow-hidden flex items-center justify-center">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon size={40} className="text-muted" />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                    Change Photo
                  </div>
                </div>
                <input {...getAvatarInput()} />
              </div>
              <p className="text-center text-[11px] text-muted mt-3">PNG, JPEG, WEBP · Max 2MB</p>
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-border shadow-sm space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground">Full Name</label>
                  <input
                    type="text"
                    value={profile.full_name}
                    onChange={e => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                    className="w-full bg-gray-50 border border-border rounded-xl px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    placeholder="e.g. Rahul Sharma"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground">Professional Niche</label>
                  <input
                    type="text"
                    value={profile.niche}
                    onChange={e => setProfile(prev => ({ ...prev, niche: e.target.value }))}
                    className="w-full bg-gray-50 border border-border rounded-xl px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    placeholder="e.g. Senior Product Designer"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">Detailed Bio / Experience</label>
                <textarea
                  value={profile.experience}
                  onChange={e => setProfile(prev => ({ ...prev, experience: e.target.value }))}
                  rows={8}
                  className="w-full bg-gray-50 border border-border rounded-xl px-4 py-4 text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none leading-relaxed"
                  placeholder="Share your professional story, major wins, and what makes you unique..."
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'resume' && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white p-10 rounded-3xl border-2 border-dashed border-border text-center space-y-6 hover:border-primary transition-colors group">
            <div {...getResumeProps()} className="cursor-pointer">
              <input {...getResumeInput()} />
              <div className="w-20 h-20 bg-primary-light rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Upload size={32} className="text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Analyze your Resume</h2>
              <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                Upload your PDF and our AI will automatically extract your niche, experience, and core skills to your profile.
              </p>
              <div className="mt-8">
                <span className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-primary/20">
                  {parsing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Select PDF File"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'skills' && (
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-border shadow-sm">
            <h3 className="text-xl font-bold text-foreground mb-6">Expertise & Skills</h3>
            <div className="flex flex-wrap gap-3 mb-8">
              {profile.skills.length > 0 ? (
                profile.skills.map(skill => (
                  <span key={skill} className="inline-flex items-center gap-2 bg-gray-50 text-foreground px-4 py-2 rounded-xl text-sm font-bold border border-border hover:border-primary transition-colors group">
                    {skill}
                    <button onClick={() => removeSkill(skill)} className="text-muted hover:text-red-500 transition-colors">
                      <Check size={14} className="rotate-45" />
                    </button>
                  </span>
                ))
              ) : (
                <p className="text-muted italic">No skills added yet. Upload a resume or add them manually.</p>
              )}
            </div>
            
            <div className="relative">
              <input
                type="text"
                value={newSkill}
                onChange={e => setNewSkill(e.target.value)}
                onKeyDown={addSkill}
                className="w-full bg-gray-50 border border-border rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                placeholder="Type a skill (e.g. React, UI Design) and press Enter"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <kbd className="px-2 py-1 bg-white border border-border rounded text-[10px] text-muted font-bold shadow-sm">ENTER</kbd>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'payment' && (
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-border shadow-sm space-y-6">
            <div>
              <h3 className="text-xl font-bold text-foreground mb-2">Payment Details</h3>
              <p className="text-sm text-muted">These details will be auto-filled when you generate invoices.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">UPI ID</label>
                <input
                  type="text"
                  value={profile.upi_id}
                  onChange={e => setProfile(prev => ({ ...prev, upi_id: e.target.value }))}
                  className="w-full bg-gray-50 border border-border rounded-xl px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="yourname@upi"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">Account Holder Name</label>
                <input
                  type="text"
                  value={profile.account_holder_name}
                  onChange={e => setProfile(prev => ({ ...prev, account_holder_name: e.target.value }))}
                  className="w-full bg-gray-50 border border-border rounded-xl px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="Full name as per bank"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">Bank Account Number</label>
                <input
                  type="text"
                  value={profile.bank_details}
                  onChange={e => setProfile(prev => ({ ...prev, bank_details: e.target.value }))}
                  className="w-full bg-gray-50 border border-border rounded-xl px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono"
                  placeholder="XXXXXXXXXXXX"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">IFSC Code</label>
                <input
                  type="text"
                  value={profile.ifsc_code}
                  onChange={e => setProfile(prev => ({ ...prev, ifsc_code: e.target.value }))}
                  className="w-full bg-gray-50 border border-border rounded-xl px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono uppercase"
                  placeholder="SBIN0001234"
                />
              </div>
            </div>

            <div className="p-4 bg-primary-light/50 rounded-2xl border border-primary/10 flex items-start gap-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6C47FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <p className="text-sm text-primary-hover font-medium">Your payment details are stored securely and only used to auto-fill your invoices. They are never shared with anyone.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
