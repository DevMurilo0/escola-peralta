import { useEffect, useState } from "react";
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
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [path]);
  const url = path && !broken ? profileAvatarUrl(path) : "";

  return (
    <div className={`avatar profile-avatar profile-avatar-${size}`}>
      {url ? (
        <img
          src={url}
          alt={`Foto de perfil de ${name}`}
          decoding="async"
          onError={() => setBroken(true)}
        />
      ) : (
        <span aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span>
      )}
    </div>
  );
}
