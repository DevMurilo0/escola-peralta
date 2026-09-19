import { useDeferredValue, useMemo, useState, useTransition } from "react";
import { invalidateResources } from "@/shared/hooks/use-resource";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { adminAction } from "./actions";
import { Feedback, Modal } from "@/shared/components/feedback";
import type { SchoolClass } from "@/shared/academic/types";
import { MasterTeachersPanel, TeacherAccessLink } from "./master-teachers-panel";
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

const CLASS_LEVELS = [
  "Infantil",
  "Jardim",
  "1º Ano",
  "2º Ano",
  "3º Ano",
  "4º Ano",
  "5º Ano",
] as const;
const CLASS_GROUPS = ["1", "2", "3", "A", "B", "C"] as const;

function classGroup(schoolClass: Class | null) {
  if (!schoolClass) return "A";
  const suffix = schoolClass.name
    .slice(schoolClass.grade_level.length)
    .trim()
    .toUpperCase();
  return CLASS_GROUPS.includes(suffix as (typeof CLASS_GROUPS)[number])
    ? suffix
    : "A";
}
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
  const [accessLink, setAccessLink] = useState<{ teacherId: string; value: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [classQuery, setClassQuery] = useState("");
  const deferredClassQuery = useDeferredValue(classQuery);
  const [pending, start] = useTransition();
  const visibleClasses = useMemo(() => {
    const term = deferredClassQuery
      .trim()
      .replace(/\s+/g, " ")
      .toLocaleLowerCase("pt-BR");
    if (!term) return classes;
    return classes.filter((schoolClass) => {
      const classMatches = schoolClass.name
        .toLocaleLowerCase("pt-BR")
        .includes(term);
      if (classMatches) return true;
      return associations
        .filter((association) => association.class_id === schoolClass.id)
        .some((association) =>
          (teachers.find((teacher) => teacher.id === association.teacher_id)
            ?.full_name || "")
            .toLocaleLowerCase("pt-BR")
            .includes(term),
        );
    });
  }, [associations, classes, deferredClassQuery, teachers]);
  function run(kind: string, values: unknown) {
    start(async () => {
      setMessage("Salvando…");
      try {
        const r = await adminAction(kind, values);
        setMessage(
          r.error ||
            (kind === "master-teacher-create"
              ? "Professor criado com sucesso. A conta já pode acessar /portal/login."
              : kind === "master-teacher-update"
                ? "Professor atualizado com sucesso."
                : "Operação concluída."),
        );
        if (!r.error) {
          setModal(null);
          setShowPassword(false);
          setConfirm(null);
          if (r.link && kind === "teacher-link") {
            const teacherId = (values as { id?: string }).id;
            if (teacherId)
              setAccessLink({ teacherId, value: r.link });
          }
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
      {tab === "classes" && (
        <section className="panel admin-classes-panel">
          <div className="page-heading">
            <div>
              <h2>Turmas</h2>
              <p className="muted small">
                A direção cria as turmas e define o professor responsável.
              </p>
            </div>
            {isMaster && (
              <button
                onClick={() => {
                  setEditingClass(null);
                  setModal("class");
                }}
              >
                + Criar turma
              </button>
            )}
          </div>
          <label className="student-search class-search">
            <span className="sr-only">Pesquisar turma ou professor</span>
            <Search size={19} aria-hidden="true" />
            <input
              type="search"
              value={classQuery}
              onChange={(event) => setClassQuery(event.target.value)}
              placeholder="Pesquisar turma ou professor..."
            />
          </label>
          {!classes.length && (
            <div className="empty">Crie sua primeira turma para começar.</div>
          )}
          {!!classes.length && !visibleClasses.length && (
            <div className="empty">Nenhuma turma ou professor encontrado.</div>
          )}
          <div className="admin-class-list">
            {visibleClasses.map((c) => {
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
                    {isMaster && (
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
                    )}
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
                          {isMaster && (
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
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                  {c.active && isMaster && (
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
            setShowPassword(false);
            setMessage("");
            setModal("teacher");
          }}
          onAccessLink={(teacher) => run("teacher-link", { id: teacher.id })}
          accessLink={accessLink}
          onHideAccessLink={() => setAccessLink(null)}
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
              {accessLink?.teacherId === t.id && (
                <TeacherAccessLink
                  link={accessLink.value}
                  onHide={() => setAccessLink(null)}
                />
              )}
            </div>
          ))}
        </section>
      )}
      {tab === "students" && (
        <AdminStudentsPanel
          students={students}
          classes={classes}
          teachers={teachers}
          associations={associations}
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
      {modal === "class" && isMaster && (
        <Modal
          title={editingClass ? "Editar turma" : "Criar turma"}
          onClose={() => !pending && setModal(null)}
        >
          <form
            className="stack"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const gradeLevel = String(f.get("grade"));
              const group = String(f.get("group"));
              run("class", {
                id: editingClass?.id,
                name: `${gradeLevel} ${group}`,
                grade_level: gradeLevel,
                group,
                shift: f.get("shift"),
                school_year: Number(f.get("year")),
                active: editingClass?.active ?? true,
                teacher_id: editingClass ? undefined : f.get("teacher_id"),
              });
            }}
          >
            <div className="class-identity-grid">
              <label>
                Série/Ano
                <select
                  name="grade"
                  defaultValue={editingClass?.grade_level || "Infantil"}
                  required
                >
                  {CLASS_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Turma
                <select
                  name="group"
                  defaultValue={classGroup(editingClass)}
                  required
                >
                  {CLASS_GROUPS.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
              </label>
            </div>
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
            {!editingClass && (
              <label>
                Professor responsável
                <select name="teacher_id" required defaultValue="">
                  <option value="" disabled>
                    Selecionar professor
                  </option>
                  {teachers
                    .filter((teacher) => teacher.active)
                    .map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.full_name}
                      </option>
                    ))}
                </select>
              </label>
            )}
            {!editingClass && !teachers.some((teacher) => teacher.active) && (
              <p className="feedback error" role="alert">
                Cadastre ou reative um professor antes de criar a turma.
              </p>
            )}
            <Feedback message={message} />
            <button
              disabled={
                pending ||
                (!editingClass && !teachers.some((teacher) => teacher.active))
              }
            >
              {pending
                ? "Salvando…"
                : editingClass
                  ? "Salvar turma"
                  : "Criar turma"}
            </button>
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
              setMessage("");
            }
          }}
        >
          <form
            className="stack"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);

              if (editingTeacher && isMaster) {
                const password = String(f.get("password") || "");
                const confirmation = String(
                  f.get("password_confirmation") || "",
                );
                if (password !== confirmation) {
                  setMessage("As senhas informadas não coincidem.");
                  return;
                }
                run("master-teacher-update", {
                  id: editingTeacher.id,
                  full_name: f.get("name"),
                  email: f.get("email"),
                  ...(password ? { password } : {}),
                });
                return;
              }

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

            {(!editingTeacher || isMaster) && (
              <label>
                E-mail
                <input
                  type="email"
                  name="email"
                  placeholder={
                    editingTeacher ? undefined : "nome@peralta.com"
                  }
                  defaultValue={editingTeacher?.email}
                  required
                />
              </label>
            )}

            {isMaster && (
              <>
                <label>
                  {editingTeacher ? "Nova senha" : "Senha inicial"}
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    minLength={12}
                    maxLength={128}
                    autoComplete="new-password"
                    placeholder={
                      editingTeacher
                        ? "Deixe em branco para manter a senha atual"
                        : undefined
                    }
                    required={!editingTeacher}
                  />
                </label>
                <label>
                  {editingTeacher
                    ? "Confirmar nova senha"
                    : "Confirmar senha"}
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password_confirmation"
                    minLength={12}
                    maxLength={128}
                    autoComplete="new-password"
                    required={!editingTeacher}
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
                  {editingTeacher
                    ? "Para manter a senha atual, deixe os dois campos de senha vazios. A senha existente nunca é exibida."
                    : "A senha é usada somente para criar a conta e não será exibida novamente."}
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
