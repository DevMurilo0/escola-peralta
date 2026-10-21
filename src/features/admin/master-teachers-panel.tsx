import { useEffect, useState } from "react";
import { useResource } from "@/shared/hooks/use-resource";
import {
  loadMasterTeachers,
  type MasterTeacher,
} from "@/shared/services/master-api";
import { QueryState } from "@/shared/components/query-state";

function lastAccess(value: string | null) {
  if (!value) return "Nunca acessou";
  return `Último acesso: ${new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Recife",
  }).format(new Date(value))}`;
}

export function TeacherAccessLink({
  link,
  onHide,
}: {
  link: string;
  onHide: () => void;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCopied(false);
  }, [link]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="teacher-access-link">
      <div>
        <strong>Link de acesso de uso único</strong>
        <small>Envie este link somente para este professor.</small>
      </div>
      <div className="teacher-access-link-row">
        <input
          aria-label="Link de acesso"
          readOnly
          value={link}
          onFocus={(event) => event.target.select()}
        />
        <button className="secondary" type="button" onClick={copyLink}>
          {copied ? "Copiado!" : "Copiar"}
        </button>
        <button className="secondary" type="button" onClick={onHide}>
          Ocultar
        </button>
      </div>
    </div>
  );
}

export function MasterTeachersPanel({
  pending,
  onAdd,
  onEdit,
  onAccessLink,
  onToggle,
  onDelete,
  accessLink,
  onHideAccessLink,
}: {
  pending: boolean;
  onAdd: () => void;
  onEdit: (teacher: MasterTeacher) => void;
  onAccessLink: (teacher: MasterTeacher) => void;
  onToggle: (teacher: MasterTeacher) => void;
  onDelete: (teacher: MasterTeacher) => void;
  accessLink: { teacherId: string; value: string } | null;
  onHideAccessLink: () => void;
}) {
  const resource = useResource("master:teachers", loadMasterTeachers);
  if (!resource.data || resource.error) return <QueryState {...resource} />;
  const teachers = resource.data;
  return (
    <section className="panel">
      <div className="page-heading">
        <div>
          <h2>Professores</h2>
          <p className="muted small">
            Contas do Supabase Auth prontas para acesso ao Portal do Professor.
          </p>
        </div>
        <button onClick={onAdd}>+ Criar professor</button>
      </div>
      {!teachers.length && (
        <div className="empty">Nenhum professor cadastrado.</div>
      )}
      <div className="master-teacher-list">
        {teachers.map((teacher) => (
          <article
            className="list-row wrap master-teacher-card"
            key={teacher.id}
          >
            <div>
              <h3>{teacher.full_name}</h3>
              <p>{teacher.email}</p>
              <span className={teacher.active ? "status-active" : "muted"}>
                {teacher.active ? "Ativo" : "Inativo"}
              </span>
              <small>{lastAccess(teacher.last_sign_in_at)}</small>
            </div>
            <div className="actions">
              <button className="secondary" onClick={() => onEdit(teacher)}>
                Editar
              </button>
              <button
                className="secondary"
                disabled={pending || !teacher.active}
                onClick={() => onAccessLink(teacher)}
              >
                Link de acesso
              </button>
              <button className="secondary" onClick={() => onToggle(teacher)}>
                {teacher.active ? "Desativar" : "Reativar"}
              </button>
              <button
                className="secondary class-delete-button"
                disabled={pending}
                onClick={() => onDelete(teacher)}
              >
                Excluir conta
              </button>
            </div>
            {accessLink?.teacherId === teacher.id && (
              <TeacherAccessLink
                link={accessLink.value}
                onHide={onHideAccessLink}
              />
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
