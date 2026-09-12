import { useState } from "react";
import { ClassForm, ArchiveClass } from "@/features/classes/class-form";
import { Feedback } from "@/shared/components/feedback";
import type { SchoolClass } from "@/shared/academic/types";
import { Link, useNavigate } from "react-router-dom";
import { useResource } from "@/shared/hooks/use-resource";
import { QueryState } from "@/shared/components/query-state";
import { db } from "@/shared/supabase/client";
import { useAuth } from "@/features/auth/auth-context";
import { todayRecife } from "@/shared/academic/utils";
import { ArrowUpRight, BookOpen, CheckCircle, Clock } from "lucide-react";
async function loadDashboard() {
  const client = db();
  const [{ data: classes, error }, { data: sessions, error: sessionError }] =
    await Promise.all([
      client
        .from("classes")
        .select("*,enrollments(id,status),teacher_classes(teacher_id,can_manage_students)")
        .order("school_year", { ascending: false })
        .order("name"),
      client
        .from("attendance_sessions")
        .select("class_id")
        .eq("date", todayRecife()),
    ]);
  if (error || sessionError)
    throw new Error("Não foi possível carregar suas turmas.");
  return { classes, sessions };
}
export default function Dashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState<SchoolClass | null | undefined>();
  const [archiving, setArchiving] = useState<SchoolClass | null>(null);
  const [message, setMessage] = useState("");
  const resource = useResource(`dashboard:${profile!.id}`, loadDashboard);
  if (!resource.data || resource.error) return <QueryState {...resource} />;
  const { classes, sessions } = resource.data;
  const active = classes?.filter((c) => c.active) || [];
  const current = active.filter(
    (c) => c.school_year === Number(todayRecife().slice(0, 4)),
  );
  const done = current.filter((c) =>
    sessions?.some((s) => s.class_id === c.id),
  ).length;
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">SEU DIA NA PERALTA</span>
          <h1>Olá, {profile!.full_name.split(" ")[0]}.</h1>
          <p className="muted">Vamos acompanhar mais um dia de descobertas?</p>
        </div>
        <span className="pill">
          {new Intl.DateTimeFormat("pt-BR", {
            dateStyle: "long",
            timeZone: "America/Recife",
          }).format(new Date())}
        </span>
      </div>
      <div className="stats">
        <div>
          <BookOpen />
          <strong>{active.length}</strong>
          <span>Turmas ativas</span>
        </div>
        <div>
          <CheckCircle />
          <strong>{done}</strong>
          <span>Chamadas de hoje</span>
        </div>
        <div>
          <Clock />
          <strong>{current.length - done}</strong>
          <span>Turmas sem chamada hoje*</span>
        </div>
      </div>
      <p className="small muted">
        *Sem calendário de dias letivos configurado; este indicador não
        representa atraso.
      </p>
      <div className="actions dashboard-shortcuts">
        <Link className="secondary button" to="/portal/calendario">
          Chamadas recentes →
        </Link>
        <Link className="secondary button" to="/portal/perfil">
          Meu perfil →
        </Link>
      </div>
      <Feedback message={message} />
      <section id="turmas">
        <div className="page-heading">
          <h2>
            {profile!.role === "admin" ? "Turmas da escola" : "Minhas turmas"}
          </h2>
          <button onClick={() => setEditing(null)}>+ Nova turma</button>
        </div>
        <div className="class-grid">
          {classes?.map((c) => (
            <article
              className="class-card"
              key={c.id}
            >
              <span className="class-icon">
                <BookOpen />
              </span>
              <span className="pill">
                {c.school_year}
                {!c.active ? " · Arquivada" : ""}
              </span>
              <h3>{c.name}</h3>
              <p>
                {c.grade_level} · {c.shift}
              </p>
              <div className="row">
                <span>
                  {
                    c.enrollments.filter(
                      (e: { status: string }) => e.status === "active",
                    ).length
                  }{" "}
                  alunos
                </span>
                <Link to={`/portal/turmas/${c.id}`} className="button secondary">
                  Acessar turma <ArrowUpRight size={16} />
                </Link>
              </div>
              {c.active && (profile!.role === "admin" || c.teacher_classes?.some((t: {teacher_id: string; can_manage_students: boolean}) => t.teacher_id === profile!.id && t.can_manage_students)) && <div className="actions class-actions">
                <button className="secondary" onClick={() => setEditing(c)}>Editar turma</button>
                <button className="secondary" onClick={() => setArchiving(c)}>Arquivar turma</button>
              </div>}
            </article>
          ))}
        </div>
        {!classes?.length && (
          <div className="empty">
            <BookOpen />
            <h3>Nenhuma turma criada ainda.</h3>
            <p>Crie sua primeira turma para começar.</p>
            <button onClick={() => setEditing(null)}>Criar minha primeira turma</button>
          </div>
        )}
      </section>
      {editing !== undefined && <ClassForm schoolClass={editing || undefined} onClose={() => setEditing(undefined)} onSaved={id => {
        setEditing(undefined);
        if (editing) setMessage("Turma atualizada com sucesso.");
        else navigate(`/portal/turmas/${id}`, { state: { message: "Turma criada com sucesso." } });
      }} />}
      {archiving && <ArchiveClass schoolClass={archiving} onClose={() => setArchiving(null)} onSaved={() => { setArchiving(null); setMessage("Turma arquivada. Histórico preservado."); }} />}
    </>
  );
}
