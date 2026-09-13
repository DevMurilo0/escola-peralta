import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { SchoolClass } from "@/shared/academic/types";
import { Feedback } from "@/shared/components/feedback";
import { StudentDetails } from "./student-details";
import { currentEnrollment, type AdminStudent } from "./types";

function normalized(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");
}

function birthDate(value: string) {
  return value.split("-").reverse().join("/");
}

export function AdminStudentsPanel({
  students,
  classes,
  schoolYear,
}: {
  students: AdminStudent[];
  classes: SchoolClass[];
  schoolYear: number;
}) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const selected = students.find((student) => student.id === selectedId);
  const visible = useMemo(() => {
    const term = normalized(deferredQuery);
    if (!term) return students;
    return students.filter((student) =>
      normalized(student.full_name).includes(term),
    );
  }, [deferredQuery, students]);

  useEffect(() => {
    if (selectedId && !selected) setSelectedId(null);
  }, [selected, selectedId]);

  if (selected)
    return (
      <StudentDetails
        student={selected}
        classes={classes}
        schoolYear={schoolYear}
        onBack={() => setSelectedId(null)}
        onArchived={() => {
          setSelectedId(null);
          setMessage("Cadastro do aluno removido.");
        }}
      />
    );

  return (
    <section className="panel admin-students-panel">
      <div className="page-heading">
        <div>
          <h2>Alunos · {students.length}</h2>
          <p className="muted small">
            Consulte dados atuais e históricos dos alunos ativos.
          </p>
        </div>
      </div>
      <Feedback message={message} />
      <label className="student-search">
        <span className="sr-only">Pesquisar aluno por nome</span>
        <Search size={19} aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Pesquisar aluno por nome..."
        />
      </label>
      <div className="admin-student-list">
        {visible.map((student) => {
          const current = currentEnrollment(student, schoolYear);
          const className = current.inconsistent
            ? "Matrículas ativas inconsistentes"
            : current.enrollment?.classes?.name || "Sem turma atual";
          return (
            <button
              className="admin-student-row"
              key={student.id}
              onClick={() => setSelectedId(student.id)}
            >
              <strong>{student.full_name}</strong>
              <span>
                <small>Nascimento</small>
                {birthDate(student.birth_date)}
              </span>
              <span>
                <small>Turma</small>
                {className}
              </span>
              <span className="student-row-link">Ver aluno →</span>
            </button>
          );
        })}
      </div>
      {!visible.length && (
        <div className="empty">Nenhum aluno encontrado.</div>
      )}
    </section>
  );
}
