import { requireSession } from "@/services/session";
import { z } from "zod";
export async function changePassword(input: unknown) {
  const { client } = await requireSession();
  const p = z.string().min(12).max(128).safeParse(input);
  if (!p.success) return { error: "Use de 12 a 128 caracteres." };
  const { error } = await client.auth.updateUser({ password: p.data });
  return error
    ? {
        error:
          "Não foi possível alterar a senha. Entre novamente e tente outra senha.",
      }
    : { success: true };
}
