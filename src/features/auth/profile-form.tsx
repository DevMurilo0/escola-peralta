import { useRef, useState, useTransition } from "react";
import {
  changePassword,
  removeProfileAvatar,
  updateProfileName,
  uploadProfileAvatar,
} from "./profile-actions";
import { useAuth } from "./auth-context";
import { Feedback } from "@/shared/components/feedback";
import { Camera, Trash2 } from "lucide-react";

export function ProfileForm() {
  const { profile, retry } = useAuth();
  const fileInput = useRef<HTMLInputElement>(null);
  const [identityMessage, setIdentityMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [identityPending, startIdentity] = useTransition();
  const [passwordPending, startPassword] = useTransition();

  if (!profile) return null;
  const currentAvatarPath = profile.avatar_path;

  async function selectAvatar(file?: File) {
    if (!file) return;
    setUploading(true);
    setIdentityMessage("Enviando foto…");
    try {
      const result = await uploadProfileAvatar(file, currentAvatarPath);
      setIdentityMessage(result.error || "Foto de perfil atualizada.");
      if (!result.error) retry();
    } catch {
      setIdentityMessage("Erro ao enviar a foto. Tente novamente.");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function removeAvatar() {
    setUploading(true);
    setIdentityMessage("Removendo foto…");
    try {
      const result = await removeProfileAvatar(currentAvatarPath);
      setIdentityMessage(result.error || "Foto de perfil removida.");
      if (!result.error) retry();
    } catch {
      setIdentityMessage("Erro ao remover a foto. Tente novamente.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="profile-settings">
      <section className="profile-identity-section">
        <div className="profile-photo-editor">
          <div className="profile-photo-copy">
            <strong>Foto de perfil</strong>
            <p className="small muted">
              JPG, PNG ou WebP. Tamanho máximo de 3 MB.
            </p>
            <div className="actions profile-photo-actions">
              <input
                ref={fileInput}
                className="profile-photo-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                aria-label="Escolher foto de perfil"
                onChange={(event) => void selectAvatar(event.target.files?.[0])}
              />
              <button
                type="button"
                className="secondary"
                disabled={uploading}
                onClick={() => fileInput.current?.click()}
              >
                <Camera size={17} aria-hidden="true" />
                {uploading ? "Enviando…" : "Escolher foto"}
              </button>
              {profile.avatar_path && (
                <button
                  type="button"
                  className="secondary"
                  disabled={uploading}
                  onClick={() => void removeAvatar()}
                >
                  <Trash2 size={16} aria-hidden="true" />
                  Remover foto
                </button>
              )}
            </div>
          </div>
        </div>

        <form
          className="stack narrow profile-name-form"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            startIdentity(async () => {
              try {
                const result = await updateProfileName(data.get("full_name"));
                setIdentityMessage(result.error || "Nome atualizado.");
                if (!result.error) retry();
              } catch {
                setIdentityMessage("Erro ao atualizar o nome. Tente novamente.");
              }
            });
          }}
        >
          <label>
            Nome
            <input
              name="full_name"
              defaultValue={profile.full_name}
              minLength={3}
              maxLength={150}
              autoComplete="name"
              required
            />
          </label>
          <button disabled={identityPending || uploading}>
            {identityPending ? "Salvando…" : "Salvar nome"}
          </button>
        </form>
        <Feedback message={identityMessage} />
      </section>

      <section className="profile-security-section">
        <div>
          <span className="eyebrow">SEGURANÇA</span>
          <h3>Definir ou alterar senha</h3>
          <p className="small muted">
            A nova senha deve ter pelo menos 12 caracteres.
          </p>
        </div>
        <form
          className="stack narrow"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const data = new FormData(form);
            if (data.get("password") !== data.get("confirm")) {
              setPasswordMessage("As senhas precisam ser iguais.");
              return;
            }
            startPassword(async () => {
              try {
                const result = await changePassword(data.get("password"));
                setPasswordMessage(result.error || "Senha atualizada.");
                if (!result.error) form.reset();
              } catch {
                setPasswordMessage(
                  "Erro ao atualizar a senha. Tente novamente.",
                );
              }
            });
          }}
        >
          <label>
            Nova senha
            <input
              name="password"
              type="password"
              minLength={12}
              maxLength={128}
              autoComplete="new-password"
              required
            />
          </label>
          <label>
            Confirmar nova senha
            <input
              name="confirm"
              type="password"
              minLength={12}
              maxLength={128}
              autoComplete="new-password"
              required
            />
          </label>
          <button disabled={passwordPending}>
            {passwordPending ? "Salvando…" : "Definir senha"}
          </button>
          <Feedback message={passwordMessage} />
        </form>
      </section>
    </div>
  );
}
