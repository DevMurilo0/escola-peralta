import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/schemas/academic";
import { login } from "./actions";
import { Feedback } from "@/components/feedback";
export function LoginForm({ enabled }: { enabled: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [message, setMessage] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ email: string; password: string }>({
    resolver: zodResolver(loginSchema),
  });
  return (
    <form
      onSubmit={handleSubmit(async (values) => {
        setMessage("");
        try {
          const result = await login(values);
          if (result?.error) setMessage(result.error);
          else {
            const from = location.state?.from;
            navigate(
              typeof from === "string" &&
                from.startsWith("/portal") &&
                !from.startsWith("//")
                ? from
                : "/portal",
              { replace: true },
            );
          }
        } catch {
          setMessage("Não foi possível conectar. Tente novamente.");
        }
      })}
      className="stack"
    >
      <label>
        E-mail
        <input type="email" autoComplete="username" {...register("email")} />
      </label>
      {errors.email && <p role="alert">{errors.email.message}</p>}
      <label>
        Senha
        <input
          type="password"
          autoComplete="current-password"
          {...register("password")}
        />
      </label>
      {errors.password && <p role="alert">{errors.password.message}</p>}
      <button disabled={!enabled || isSubmitting}>
        {isSubmitting ? "Entrando…" : "Entrar no portal →"}
      </button>
      <Feedback message={message} />
      <p className="muted small">
        Precisa de acesso ou esqueceu sua senha? Procure a administração da
        escola para receber um link de recuperação.
      </p>
    </form>
  );
}
