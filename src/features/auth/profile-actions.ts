import { requireSession } from "@/shared/services/session";
import { db } from "@/shared/supabase/client";
import { z } from "zod";

const avatarTypes = ["image/jpeg", "image/png", "image/webp"] as const;
const avatarInputMaxBytes = 12 * 1024 * 1024;
const avatarOutputMaxBytes = 3 * 1024 * 1024;
const avatarMaxDimension = 512;
const avatarWebpQuality = 0.82;

function loadAvatarImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível ler a imagem."));
    };
    image.src = url;
  });
}

async function optimizeAvatar(file: File) {
  const image = await loadAvatarImage(file);
  const longestSide = Math.max(image.naturalWidth, image.naturalHeight);
  if (!longestSide)
    throw new Error("A imagem selecionada não possui dimensões válidas.");

  const scale = Math.min(1, avatarMaxDimension / longestSide);
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", { alpha: true });
  if (!context)
    throw new Error("Não foi possível preparar a imagem para envio.");

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", avatarWebpQuality),
  );

  if (!blob || blob.type !== "image/webp")
    throw new Error("Seu navegador não conseguiu converter a foto para WebP.");
  if (blob.size > avatarOutputMaxBytes)
    throw new Error("A foto otimizada ficou maior que o limite permitido.");

  return { blob, width, height };
}

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
  if (!avatarTypes.includes(file.type as (typeof avatarTypes)[number]))
    return { error: "Use uma imagem JPG, PNG ou WebP." };
  if (!file.size || file.size > avatarInputMaxBytes)
    return { error: "A foto original deve ter no máximo 12 MB." };

  let optimized: Awaited<ReturnType<typeof optimizeAvatar>>;
  try {
    optimized = await optimizeAvatar(file);
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível otimizar a foto.",
    };
  }

  const { client, user } = await requireSession();
  const path = `${user.id}/${Date.now()}.webp`;

  const uploaded = await client.storage
    .from("profile-avatars")
    .upload(path, optimized.blob, {
      cacheControl: "3600",
      contentType: "image/webp",
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

  return {
    success: true,
    path,
    originalBytes: file.size,
    optimizedBytes: optimized.blob.size,
    width: optimized.width,
    height: optimized.height,
  };
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
