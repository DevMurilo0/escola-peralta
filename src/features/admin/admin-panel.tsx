import { useState, useTransition } from "react";
import { invalidateResources } from "@/shared/hooks/use-resource";
import { Link } from "react-router-dom";
import { adminAction } from "./actions";
import { Feedback, Modal } from "@/shared/components/feedback";
import type { SchoolClass } from "@/shared/academic/types";
import { MasterTeachersPanel } from "./master-teachers-panel";
import { AdminStudentsPanel } from "./students/admin-students-panel";
import type { AdminStudent } from "./students/types";
type Teacher = {
  id: string;
  full_name: string;
  email: string;
  active: boolean;
};
type Association = {
  id: string;
  teacher_id: string;
  class_id: string;
  can_manage_students: boolean;
};
type Class = SchoolClass & { enrollments: { id: string; status: string }[] };
export function AdminPanel({
  teachers,
  classes,
  associations,
  students,
  settings,
  isMaster,
  masterError,
}: {
  teachers: Teacher[];
  classes: Class[];
  associations: Association[];
  students: AdminStudent[];
  settings: { school_year: number; passing_grade: number };
  isMaster: boolean;
  masterError?: string;
}) {
  const [tab, setTab] = useState("classes");
  const [modal, setModal] = useState<"class" | "teacher" | null>(null);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [confirm, setConfirm] = useState<{
    title: string;
    kind: string;
    values: unknown;
  } | null>(null);
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, start] = useTransition();
  function run(kind: string, values: unknown) {
    start(async () => {
      setMessage("Salvando…");
      try {
        const r = await adminAction(kind, values);
        setMessage(
          r.error ||
            (kind === "master-teacher-create"
              ? "Professor criado com sucesso. A conta já pode acessar /portal/login."
              : "Operação concluída."),
        );
        if (!r.error) {
          setModal(null);
          setShowPassword(false);
          setConfirm(null);
          if (r.link) setLink(r.link);
          invalidateResources();
        }
      } catch {
        setMessage("Erro de conexão. Tente novamente.");
      }
    });
  }
  return (
    <>
      <span className="eyebrow">GESTÃO ESCOLAR</span>
      <h1>Administração</h1>
      <p className="muted">
        Pessoas, turmas e configurações da Escola Peralta.
      </p>
      <div className="tabs">
        {[
          ["classes", "Turmas"],
          ["teachers", "Professores"],
          ["students", "Alunos"],
          ["settings", "Ano letivo"],
        ].map(([k, l]) => (
          <button key={k} aria-pressed={tab === k} onClick={() => setTab(k)}>
            {l}
          </button>
        ))}
      </div>
      <Feedback message={message} />
      {link && (
        <div className="panel">
          <h3>Link de acesso de uso único</h3>
          <p>
            Entregue este link ao professor por um canal privado. Ele permite
            definir a senha. Nenhuma mensagem foi enviada automaticamente.
          </p>
          <input
            aria-label="Link de acesso"
            readOnly
            value={link}
            onFocus={(e) => e.target.select()}
          />
          <button className="secondary" onClick={() => setLink("")}>
            Ocultar link
          </button>
        </div>
      )}
      {tab === "classes" && (
        <section className="panel">
          <div className="page-heading">
            <h2>Turmas</h2>
            <button
              onClick={() => {
                setEditingClass(null);
                setModal("class");
              }}
            >
              + Criar turma
            </button>
          </div>
          {!classes.length && (
            <div className="empty">Crie sua primeira turma para começar.</div>
          )}
          <div className="admin-class-list">
            {classes.map((c) => {
              const classAssociations = associations.filter(
                (association) => association.class_id === c.id,
              );
              return (
                <article className="admin-class" key={c.id}>
                  <div className="row admin-class-heading">
                    <div>
                      <Link to={`/portal/turmas/${c.id}`}>
                        <h3>{c.name} ↗</h3>
                      </Link>
                      <p>
                        {c.school_year} · {c.shift} ·{" "}
                        {
                          c.enrollments.filter((e) => e.status === "active")
                            .length
                        }{" "}
                        alunos · {c.active ? "Ativa" : "Arquivada"}
                      </p>
                    </div>
                    <div className="actions">
                      <button
                        className="secondary"
                        onClick={() => {
                          setEditingClass(c);
                          setModal("class");
                        }}
                      >
                        Editar
                      </button>
                      <button
                        className="secondary"
                        onClick={() =>
                          setConfirm({
                            title: c.active
                              ? "Arquivar turma?"
                              : "Reativar turma?",
                            kind: "class",
                            values: { ...c, active: !c.active },
                          })
                        }
                      >
                        {c.active ? "Arquivar" : "Reativar"}
                      </button>
                    </div>
                  </div>
                  <section className="admin-class-teachers">
                    <h4>Professores vinculados</h4>
                    {!classAssociations.length && (
                      <p className="muted small">Nenhum professor vinculado.</p>
                    )}
                    <div className="associations">
                      {classAssociations.map((a) => (
                        <div className="row" key={a.id}>
                          <span>
                            {
                              teachers.find((t) => t.id === a.teacher_id)
                                ?.full_name
                            }{" "}
                            ·{" "}
                            {a.can_manage_students
                              ? "Gerencia alunos"
                              : "Notas e frequência"}
                          </span>
                          <button
                            className="secondary"
                            onClick={() =>
                              setConfirm({
                                title: "Remover associação do professor?",
                                kind: "unlink",
                                values: { id: a.id },
                              })
                            }
                          >
                            Remover vínculo
                          </button>
                        </div>
                      ))}
                    </div>
                  </section>
                  {c.active && (
                    <section className="admin-class-associate">
                      <h4>Adicionar professor</h4>
                      <form
                        className="inline-form"
                        onSubmit={(e) => {
                          e.preventDefault();
                          const f = new FormData(e.currentTarget);
                          run("association", {
                            class_id: c.id,
                            teacher_id: f.get("teacher_id"),
                            can_manage_students: f.get("manage") === "on",
                          });
                        }}
                      >
                        <label>
                          Professor
                          <select name="teacher_id" required defaultValue="">
                            <option value="" disabled>
                              Selecionar professor
                            </option>
                            {teachers
                              .filter(
                                (t) =>
                                  t.active &&
                                  !associations.some(
                                    (a) =>
                                      a.class_id === c.id &&
                                      a.teacher_id === t.id,
                                  ),
                              )
                              .map((t) => (
                                <option value={t.id} key={t.id}>
                                  {t.full_name}
                                </option>
                              ))}
                          </select>
                        </label>
                        <label className="checkbox">
                          <input type="checkbox" name="manage" defaultChecked />
                          Pode gerenciar alunos
                        </label>
                        <button disabled={pending}>Associar</button>
                      </form>
                    </section>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}
      {tab === "teachers" && isMaster && (
        <MasterTeachersPanel
          pending={pending}
          onAdd={() => {
            setEditingTeacher(null);
            setShowPassword(false);
            setModal("teacher");
          }}
          onEdit={(teacher) => {
            setEditingTeacher(teacher);
            setModal("teacher");
          }}
          onAccessLink={(teacher) => run("teacher-link", { id: teacher.id })}
          onToggle={(teacher) =>
            setConfirm({
              title: teacher.active
                ? "Desativar professor?"
                : "Reativar professor?",
              kind: "teacher-edit",
              values: { ...teacher, active: !teacher.active },
            })
          }
        />
      )}
      {tab === "teachers" && !isMaster && (
        <section className="panel">
          <div className="page-heading">
            <h2>Professores</h2>
          </div>
          <p
            className={masterError ? "feedback error" : "muted small"}
            role={masterError ? "alert" : undefined}
          >
            {masterError ||
              "Somente a direção Master pode criar novas contas de professores."}
          </p>
          {!teachers.length && (
            <div className="empty">Nenhum professor cadastrado.</div>
          )}
          {teachers.map((t) => (
            <div className="list-row wrap" key={t.id}>
              <div>
                <h3>{t.full_name}</h3>
                <p>
                  {t.email} · {t.active ? "Ativo" : "Inativo"}
                </p>
                <small>
                  {associations
                    .filter((a) => a.teacher_id === t.id)
                    .map((a) => classes.find((c) => c.id === a.class_id)?.name)
                    .join(", ") || "Sem turmas associadas"}
                </small>
              </div>
              <div className="actions">
                <button
                  className="secondary"
                  onClick={() => {
                    setEditingTeacher(t);
                    setModal("teacher");
                  }}
                >
                  Editar
                </button>
                <button
                  className="secondary"
                  disabled={pending || !t.active}
                  onClick={() => run("teacher-link", { id: t.id })}
                >
                  Link de acesso
                </button>
                <button
                  className="secondary"
                  onClick={() =>
                    setConfirm({
                      title: t.active
                        ? "Desativar professor?"
                        : "Reativar professor?",
                      kind: "teacher-edit",
                      values: { ...t, active: !t.active },
                    })
                  }
                >
                  {t.active ? "Desativar" : "Reativar"}
                </button>
              </div>
            </div>
          ))}
        </section>
      )}
      {tab === "students" && (
        <AdminStudentsPanel
          students={students}
          classes={classes}
          schoolYear={settings.school_year}
        />
      )}
      {tab === "settings" && (
        <section className="panel">
          <h2>Configurações acadêmicas</h2>
          <form
            className="stack narrow"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              run("settings", {
                school_year: Number(f.get("year")),
                passing_grade: Number(f.get("grade")),
              });
            }}
          >
            <label>
              Ano letivo padrão
              <input
                name="year"
                type="number"
                min="2000"
                max="2200"
                defaultValue={settings.school_year}
                required
              />
            </label>
            <label>
              Média mínima de referência
              <input
                name="grade"
                type="number"
                min="0"
                max="10"
                step="any"
                defaultValue={settings.passing_grade}
                required
              />
            </label>
            <p className="muted small">
              A média mínima é uma referência configurável, não um resultado
              oficial de aprovação anual. Alterá-la muda a indicação em todos os
              bimestres.
            </p>
            <button disabled={pending}>Salvar configurações</button>
          </form>
        </section>
      )}
      {modal === "class" && (
        <Modal
          title={editingClass ? "Editar turma" : "Criar turma"}
          onClose={() => !pending && setModal(null)}
        >
          <form
            className="stack"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              run("class", {
                id: editingClass?.id,
                name: f.get("name"),
                grade_level: f.get("grade"),
                shift: f.get("shift"),
                school_year: Number(f.get("year")),
                active: editingClass?.active ?? true,
              });
            }}
          >
            <label>
              Nome / identificador
              <input
                name="name"
                required
                minLength={2}
                maxLength={100}
                defaultValue={editingClass?.name}
              />
            </label>
            <label>
              Ano / série
              <input
                name="grade"
                required
                minLength={2}
                maxLength={80}
                defaultValue={editingClass?.grade_level}
              />
            </label>
            <label>
              Turno
              <select
                name="shift"
                defaultValue={editingClass?.shift || "Manhã"}
              >
                {["Manhã", "Tarde", "Integral"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label>
              Ano letivo
              <input
                name="year"
                type="number"
                required
                min="2000"
                max="2200"
                defaultValue={editingClass?.school_year || settings.school_year}
              />
            </label>
            <Feedback message={message} />
            <button disabled={pending}>Salvar turma</button>
          </form>
        </Modal>
      )}
      {modal === "teacher" && (
        <Modal
          title={
            editingTeacher
              ? "Editar professor"
              : isMaster
                ? "Adicionar professor"
                : "Criar professor"
          }
          onClose={() => {
            if (!pending) {
              setModal(null);
              setShowPassword(false);
            }
          }}
        >
          <form
            className="stack"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              if (editingTeacher) {
                run("teacher-edit", {
                  id: editingTeacher.id,
                  full_name: f.get("name"),
                  active: editingTeacher.active,
                });
                return;
              }
              if (isMaster) {
                const password = String(f.get("password") || "");
                if (password !== String(f.get("password_confirmation") || "")) {
                  setMessage("As senhas informadas não coincidem.");
                  return;
                }
                run("master-teacher-create", {
                  full_name: f.get("name"),
                  email: f.get("email"),
                  password,
                });
                return;
              }
              setMessage(
                "Somente a direção Master pode criar novas contas de professores.",
              );
            }}
          >
            <label>
              Nome completo
              <input
                name="name"
                required
                minLength={3}
                maxLength={150}
                defaultValue={editingTeacher?.full_name}
              />
            </label>
            {!editingTeacher && (
              <label>
                E-mail
                <input
                  type="email"
                  name="email"
                  placeholder={isMaster ? "nome@peralta.com" : undefined}
                  required
                />
              </label>
            )}
            {!editingTeacher && isMaster && (
              <>
                <label>
                  Senha inicial
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    minLength={12}
                    maxLength={128}
                    autoComplete="new-password"
                    required
                  />
                </label>
                <label>
                  Confirmar senha
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password_confirmation"
                    minLength={12}
                    maxLength={128}
                    autoComplete="new-password"
                    required
                  />
                </label>
                <label className="inline-check password-toggle">
                  <input
                    type="checkbox"
                    checked={showPassword}
                    onChange={(event) => setShowPassword(event.target.checked)}
                  />
                  Mostrar senha
                </label>
                <p className="small muted">
                  A senha é usada somente para criar a conta e não será exibida
                  novamente.
                </p>
              </>
            )}
            <Feedback message={message} />
            <button disabled={pending}>
              {pending
                ? "Salvando…"
                : !editingTeacher && isMaster
                  ? "Criar professor"
                  : "Salvar professor"}
            </button>
          </form>
        </Modal>
      )}
      {confirm && (
        <Modal
          title={confirm.title}
          onClose={() => !pending && setConfirm(null)}
        >
          <p>
            O histórico acadêmico será preservado. Esta ação altera o acesso ou
            o status do registro.
          </p>
          <Feedback message={message} />
          <button
            disabled={pending}
            onClick={() => run(confirm.kind, confirm.values)}
          >
            Confirmar
          </button>
        </Modal>
      )}
    </>
  );
}
