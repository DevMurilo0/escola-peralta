import { requireSession } from "@/shared/services/session";
import { db } from "@/shared/supabase/client";
import { z } from "zod";

const avatarTypes = ["image/jpeg", "image/png", "image/webp"] as const;
const avatarMaxBytes = 3 * 1024 * 1024;

export function profileAvatarUrl(path?: string | null) {
  if (!path) return "";
  return db().storage.from("profile-avatars").getPublicUrl(path).data.publicUrl;
}

export async function updateProfileName(input: unknown) {
  const { client } = await requireSession();
  const parsed = z.string().trim().min(3).max(150).safeParse(input);
  if (!parsed.success)
    return { error: "Informe um nome entre 3 e 150 caracteres." };

  const { error } = await client.rpc("update_own_profile_name", {
    p_full_name: parsed.data,
  });
  return error
    ? { error: "Não foi possível atualizar seu nome. Tente novamente." }
    : { success: true };
}

export async function uploadProfileAvatar(
  file: File,
  currentPath?: string | null,
) {
  const { client, user } = await requireSession();
  if (!avatarTypes.includes(file.type as (typeof avatarTypes)[number]))
    return { error: "Use uma imagem JPG, PNG ou WebP." };
  if (!file.size || file.size > avatarMaxBytes)
    return { error: "A foto deve ter no máximo 3 MB." };

  const extension =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : "jpg";
  const path = `${user.id}/${Date.now()}.${extension}`;

  const uploaded = await client.storage
    .from("profile-avatars")
    .upload(path, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });
  if (uploaded.error)
    return {
      error:
        "Não foi possível enviar a foto. Verifique se a migration do perfil foi aplicada.",
    };

  const updated = await client.rpc("update_own_profile_avatar", {
    p_avatar_path: path,
  });
  if (updated.error) {
    await client.storage.from("profile-avatars").remove([path]);
    return { error: "A foto foi enviada, mas não pôde ser salva no perfil." };
  }

  if (currentPath && currentPath !== path)
    await client.storage.from("profile-avatars").remove([currentPath]);

  return { success: true, path };
}

export async function removeProfileAvatar(currentPath?: string | null) {
  const { client } = await requireSession();
  const updated = await client.rpc("update_own_profile_avatar", {
    p_avatar_path: null,
  });
  if (updated.error)
    return { error: "Não foi possível remover a foto do perfil." };

  if (currentPath)
    await client.storage.from("profile-avatars").remove([currentPath]);

  return { success: true };
}

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
