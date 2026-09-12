import { db } from "@/lib/supabase/client";
export async function adminApi(
  path: "teachers" | "teachers/access-link",
  payload: unknown,
): Promise<{ success?: boolean; error?: string; link?: string }> {
  const {
    data: { session },
  } = await db().auth.getSession();
  if (!session) return { error: "Sua sessão expirou. Entre novamente." };
  const response = await fetch(`/api/admin/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!response.headers.get("content-type")?.includes("application/json"))
    return { error: "Serviço administrativo indisponível. Tente novamente." };
  const result = await response.json();
  return response.ok
    ? result
    : { error: result.error || "Não foi possível concluir a operação." };
}
