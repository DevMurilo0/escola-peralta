import { useAuth } from "@/features/auth/auth-context";
import { ProfileForm } from "@/features/auth/profile-form";
export default function Profile() {
  const { profile } = useAuth();
  if (!profile) return null;
  return (
    <>
      <span className="eyebrow">SUA CONTA</span>
      <h1>Perfil</h1>
      <section className="panel">
        <h2>{profile.full_name}</h2>
        <p>{profile.email}</p>
        <p className="muted">
          {profile.role === "admin" ? "Administrador(a)" : "Professor(a)"} ·
          Conta ativa
        </p>
        <h3>Definir ou alterar senha</h3>
        <ProfileForm />
      </section>
    </>
  );
}
