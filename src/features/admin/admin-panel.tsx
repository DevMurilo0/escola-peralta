import { useState, useTransition } from "react";
import { invalidateResources } from "@/shared/hooks/use-resource";
import { Link } from "react-router-dom";
import { adminAction } from "./actions";
import { Feedback, Modal } from "@/shared/components/feedback";
import type { SchoolClass, Student } from "@/shared/academic/types";
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
}: {
  teachers: Teacher[];
  classes: Class[];
  associations: Association[];
  students: Student[];
  settings: { school_year: number; passing_grade: number };
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
  const [pending, start] = useTransition();
  function run(kind: string, values: unknown) {
    start(async () => {
      setMessage("Salvando…");
      try {
        const r = await adminAction(kind, values);
        setMessage(r.error || "Operação concluída.");
        if (!r.error) {
          setModal(null);
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
            <h2>Turmas · {classes.length}</h2>
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
          {classes.map((c) => (
            <div className="admin-class" key={c.id}>
              <div className="row">
                <div>
                  <Link to={`/portal/turmas/${c.id}`}>
                    <h3>{c.name} ↗</h3>
                  </Link>
                  <p>
                    {c.school_year} · {c.shift} ·{" "}
                    {c.enrollments.filter((e) => e.status === "active").length}{" "}
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
                        title: c.active ? "Arquivar turma?" : "Reativar turma?",
                        kind: "class",
                        values: { ...c, active: !c.active },
                      })
                    }
                  >
                    {c.active ? "Arquivar" : "Reativar"}
                  </button>
                </div>
              </div>
              <div className="associations">
                {associations
                  .filter((a) => a.class_id === c.id)
                  .map((a) => (
                    <div className="row" key={a.id}>
                      <span>
                        {teachers.find((t) => t.id === a.teacher_id)?.full_name}{" "}
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
              {c.active && (
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
                                a.class_id === c.id && a.teacher_id === t.id,
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
              )}
            </div>
          ))}
        </section>
      )}
      {tab === "teachers" && (
        <section className="panel">
          <div className="page-heading">
            <h2>Professores · {teachers.length}</h2>
            <button
              onClick={() => {
                setEditingTeacher(null);
                setModal("teacher");
              }}
            >
              + Criar professor
            </button>
          </div>
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
        <section className="panel">
          <h2>Alunos · {students.length}</h2>
          <p className="muted">
            Cadastre e edite alunos dentro da turma. Para matricular um aluno já
            existente em outra turma, use o formulário abaixo.
          </p>
          <form
            className="inline-form"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              run("enroll-existing", {
                student_id: f.get("student"),
                class_id: f.get("class"),
              });
            }}
          >
            <label>
              Aluno
              <select required name="student" defaultValue="">
                <option value="" disabled>
                  Selecionar
                </option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Turma de destino
              <select required name="class" defaultValue="">
                <option value="" disabled>
                  Selecionar
                </option>
                {classes
                  .filter((c) => c.active)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} · {c.school_year}
                    </option>
                  ))}
              </select>
            </label>
            <button disabled={pending || !students.length}>Matricular</button>
          </form>
          <p className="small muted">
            A matrícula anterior permanece preservada. Se necessário, inative-a
            na turma de origem.
          </p>
          {students.map((s) => (
            <div className="list-row" key={s.id}>
              <strong>{s.full_name}</strong>
              <span>{s.birth_date.split("-").reverse().join("/")}</span>
            </div>
          ))}
          {!students.length && (
            <div className="empty">Nenhum aluno cadastrado.</div>
          )}
        </section>
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
          title={editingTeacher ? "Editar professor" : "Criar professor"}
          onClose={() => !pending && setModal(null)}
        >
          <form
            className="stack"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              run(
                editingTeacher ? "teacher-edit" : "teacher-create",
                editingTeacher
                  ? {
                      id: editingTeacher.id,
                      full_name: f.get("name"),
                      active: editingTeacher.active,
                    }
                  : { full_name: f.get("name"), email: f.get("email") },
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
                <input type="email" name="email" required />
              </label>
            )}
            <p className="small muted">
              O professor definirá a própria senha por um link de uso único.
            </p>
            <Feedback message={message} />
            <button disabled={pending}>
              {pending ? "Salvando…" : "Salvar professor"}
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
