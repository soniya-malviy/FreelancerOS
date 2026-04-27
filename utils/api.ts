export const getApiUrl = (path: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
  // Ensure we don't have double slashes
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

export const getAuthHeaders = async (supabase: any): Promise<Record<string, string>> => {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }
  
  return headers;
};
