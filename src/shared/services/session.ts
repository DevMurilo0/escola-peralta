import { db } from "@/shared/supabase/client";

// UX check; the database independently authorizes every request through RLS.
export async function requireSession(admin = false) {
  const client = db();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user) throw new Error("Sua sessão expirou. Entre novamente.");
  const { data: profile } = await client
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (!profile?.active || (admin && profile.role !== "admin"))
    throw new Error("Acesso não autorizado.");
  return { client, user, profile };
}
