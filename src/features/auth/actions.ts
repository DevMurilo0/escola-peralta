import { db } from "@/shared/supabase/client";
import { loginSchema } from "@/shared/academic/schemas";
import { invalidateResources } from "@/shared/hooks/use-resource";
export async function login(values: unknown) {
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) return { error: "Confira o e-mail e a senha." };
  const { error } = await db().auth.signInWithPassword(parsed.data);
  if (error)
    return { error: "Não foi possível entrar. Confira suas credenciais." };
  return { success: true };
}
export async function logout() {
  const { error } = await db().auth.signOut({ scope: "local" });
  if (error) throw new Error("Não foi possível sair. Tente novamente.");
  invalidateResources();
}
