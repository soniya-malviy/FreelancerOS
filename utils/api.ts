export const getApiUrl = (path: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
  // Ensure we don't have double slashes
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

export const getAuthHeaders = async (supabase: any) => {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    "Content-Type": "application/json",
    ...(session?.access_token ? { "Authorization": `Bearer ${session.access_token}` } : {}),
  };
};
