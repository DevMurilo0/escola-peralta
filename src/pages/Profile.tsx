import { useAuth } from "@/features/auth/auth-context";
import { ProfileAvatar } from "@/features/auth/profile-avatar";
import { ProfileForm } from "@/features/auth/profile-form";

export default function Profile() {
  const { profile } = useAuth();
  if (!profile) return null;

  return (
    <>
      <span className="eyebrow">SUA CONTA</span>
      <h1>Perfil</h1>
      <section className="panel profile-panel">
        <header className="profile-summary">
          <ProfileAvatar
            name={profile.full_name}
            path={profile.avatar_path}
            size="large"
          />
          <div>
            <h2>{profile.full_name}</h2>
            <p>{profile.email}</p>
            <p className="muted">
              {profile.role === "admin" ? "Administrador(a)" : "Professor(a)"} ·
              Conta ativa
            </p>
          </div>
        </header>
        <ProfileForm />
      </section>
    </>
  );
}
