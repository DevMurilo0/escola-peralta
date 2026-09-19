import { useState } from "react";
import { profileAvatarUrl } from "./profile-actions";

export function ProfileAvatar({
  name,
  path,
  size = "small",
}: {
  name: string;
  path?: string | null;
  size?: "small" | "large";
}) {
  const [failedPath, setFailedPath] = useState<string | null>(null);
  const url =
    path && failedPath !== path ? profileAvatarUrl(path) : "";

  return (
    <div className={`avatar profile-avatar profile-avatar-${size}`}>
      {url ? (
        <img
          src={url}
          alt={`Foto de perfil de ${name}`}
          decoding="async"
          onError={() => setFailedPath(path ?? null)}
        />
      ) : (
        <span aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span>
      )}
    </div>
  );
}
