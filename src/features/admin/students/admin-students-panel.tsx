import { useDeferredValue, useMemo, useState } from "react";
import { ArrowRight, Search, Users } from "lucide-react";
import type { SchoolClass } from "@/shared/academic/types";
import { Feedback } from "@/shared/components/feedback";
import { StudentDetails } from "./student-details";
import { currentEnrollment, type AdminStudent } from "./types";

type Teacher = { id: string; full_name: string; active: boolean };
type Association = { teacher_id: string; class_id: string };

const WITHOUT_CLASS = "__without_class__";
const INCONSISTENT = "__inconsistent__";

function normalize(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");
}
function formatBirth(value: string) {
  return value.split("-").reverse().join("/");
}
function countLabel(count: number) {
  return count + " " + (count === 1 ? "aluno" : "alunos");
}

export function AdminStudentsPanel({
  students,
  classes,
  teachers,
  associations,
  schoolYear,
}: {
  students: AdminStudent[];
  classes: SchoolClass[];
  teachers: Teacher[];
  associations: Association[];
  schoolYear: number;
}) {
  const [query, setQuery] = useState("");
  const [classQuery, setClassQuery] = useState("");
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const deferredQuery = useDeferredValue(query);
  const deferredClassQuery = useDeferredValue(classQuery);
  const selected = students.find((student) => student.id === selectedId);

  const teachersByClass = useMemo(() => {
    const result: Record<string, string[]> = {};
    for (const association of associations) {
      const teacher = teachers.find((item) => item.id === association.teacher_id);
      if (!teacher) continue;
      result[association.class_id] ??= [];
      if (!result[association.class_id].includes(teacher.full_name))
        result[association.class_id].push(teacher.full_name);
    }
    return result;
  }, [associations, teachers]);

  const currentClasses = useMemo(
    () =>
      classes
        .filter((item) => item.active && item.school_year === schoolYear)
        .sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    [classes, schoolYear],
  );

  const groups = useMemo(() => {
    const result = new Map<string, AdminStudent[]>();
    currentClasses.forEach((item) => result.set(item.id, []));
    result.set(WITHOUT_CLASS, []);
    result.set(INCONSISTENT, []);
    students.forEach((student) => {
      const current = currentEnrollment(student, schoolYear);
      const key = current.inconsistent
        ? INCONSISTENT
        : current.enrollment && result.has(current.enrollment.class_id)
          ? current.enrollment.class_id
          : WITHOUT_CLASS;
      result.get(key)?.push(student);
    });
    return result;
  }, [currentClasses, schoolYear, students]);

  function context(student: AdminStudent) {
    const active = student.enrollments.filter(
      (item) => item.status === "active" && item.school_year === schoolYear,
    );
    if (active.length > 1) {
      return {
        className: "Matrículas ativas inconsistentes",
        teachers: Array.from(
          new Set(active.flatMap((item) => teachersByClass[item.class_id] ?? [])),
        ),
      };
    }
    const enrollment = active[0];
    if (!enrollment) return { className: "Sem turma atual", teachers: [] };
    return {
      className:
        classes.find((item) => item.id === enrollment.class_id)?.name ||
        enrollment.classes?.name ||
        "Turma indisponível",
      teachers: teachersByClass[enrollment.class_id] ?? [],
    };
  }

  const globalResults = useMemo(() => {
    const term = normalize(deferredQuery);
    return term
      ? students.filter((student) => normalize(student.full_name).includes(term))
      : [];
  }, [deferredQuery, students]);

  const selectedClass = currentClasses.find((item) => item.id === selectedClassId);
  const groupStudents = groups.get(selectedClassId || "") ?? [];
  const classResults = useMemo(() => {
    const term = normalize(deferredClassQuery);
    return term
      ? groupStudents.filter((student) => normalize(student.full_name).includes(term))
      : groupStudents;
  }, [deferredClassQuery, groupStudents]);

  const openGroup = (id: string) => {
    setQuery("");
    setClassQuery("");
    setSelectedClassId(id);
  };

  if (selected) {
    const backLabel =
      selectedClassId === WITHOUT_CLASS
        ? "Voltar para alunos sem turma"
        : selectedClassId === INCONSISTENT
          ? "Voltar para matrículas inconsistentes"
          : selectedClass
            ? "Voltar para " + selectedClass.name
            : "Voltar para alunos";
    return (
      <StudentDetails
        student={selected}
        classes={classes}
        schoolYear={schoolYear}
        teachersByClass={teachersByClass}
        backLabel={backLabel}
        onBack={() => setSelectedId(null)}
        onArchived={() => {
          setSelectedId(null);
          setMessage("Cadastro do aluno removido.");
        }}
      />
    );
  }

  const renderStudentRow = (student: AdminStudent) => {
    const item = context(student);
    return (
      <button
        className="admin-student-row"
        key={student.id}
        onClick={() => setSelectedId(student.id)}
      >
        <span className="student-row-primary">
          <strong>{student.full_name}</strong>
          <small>Nascimento: {formatBirth(student.birth_date)}</small>
        </span>
        <span>
          <small>Turma</small>
          {item.className}
        </span>
        <span>
          <small>Professor(es)</small>
          {item.teachers.join(", ") || "Nenhum professor vinculado"}
        </span>
        <span className="student-row-link">Ver aluno →</span>
      </button>
    );
  };

  const selectedTitle =
    selectedClassId === WITHOUT_CLASS
      ? "Alunos sem turma"
      : selectedClassId === INCONSISTENT
        ? "Matrículas inconsistentes"
        : selectedClass?.name || "";
  const selectedMeta =
    selectedClassId === WITHOUT_CLASS
      ? "Alunos ativos sem matrícula ativa no ano letivo atual."
      : selectedClassId === INCONSISTENT
        ? "Alunos com mais de uma matrícula ativa no mesmo ano letivo."
        : selectedClass
          ? selectedClass.grade_level + " · " + selectedClass.shift + " · " + selectedClass.school_year
          : "";

  return (
    <section className="panel admin-students-panel">
      <div className="page-heading">
        <div>
          <h2>Alunos</h2>
          <p className="muted small">
            Consulte alunos por turma ou pesquise diretamente pelo nome.
          </p>
        </div>
      </div>
      <Feedback message={message} />

      {!selectedClassId && (
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
      )}

      {normalize(deferredQuery) ? (
        <section className="admin-student-results" aria-live="polite">
          <div className="student-results-heading">
            <div>
              <span className="eyebrow">PESQUISA GLOBAL</span>
              <h3>Resultados</h3>
            </div>
            <span className="muted small">{countLabel(globalResults.length)}</span>
          </div>
          <div className="admin-student-list">
            {globalResults.map(renderStudentRow)}
          </div>
          {!globalResults.length && <div className="empty">Nenhum aluno encontrado.</div>}
        </section>
      ) : selectedClassId ? (
        <section className="admin-class-students-view">
          <button
            className="back-button"
            onClick={() => {
              setSelectedClassId(null);
              setClassQuery("");
            }}
          >
            ← Voltar para turmas
          </button>
          <div className="student-group-heading">
            <div>
              <span className="eyebrow">{selectedClass ? "TURMA" : "ORGANIZAÇÃO"}</span>
              <h3>{selectedTitle}</h3>
              <p className="muted">{selectedMeta}</p>
              {selectedClass && (
                <p className="student-group-teachers">
                  <strong>Professor(es):</strong>{" "}
                  {(teachersByClass[selectedClass.id] ?? []).join(", ") ||
                    "Nenhum professor vinculado"}
                </p>
              )}
            </div>
            <span className="student-group-count">
              <Users size={18} aria-hidden="true" />
              {countLabel(groupStudents.length)}
            </span>
          </div>
          <label className="student-search class-student-search">
            <span className="sr-only">Pesquisar aluno nesta turma</span>
            <Search size={19} aria-hidden="true" />
            <input
              type="search"
              value={classQuery}
              onChange={(event) => setClassQuery(event.target.value)}
              placeholder="Pesquisar aluno nesta turma..."
            />
          </label>
          <div className="admin-student-list">
            {classResults.map(renderStudentRow)}
          </div>
          {!classResults.length && (
            <div className="empty">
              {normalize(deferredClassQuery)
                ? "Nenhum aluno encontrado nesta turma."
                : "Nenhum aluno nesta turma."}
            </div>
          )}
        </section>
      ) : (
        <section className="admin-student-directory">
          <div className="student-directory-heading">
            <span className="eyebrow">TURMAS</span>
            <h3>Alunos por turma</h3>
            <p className="muted small">
              Selecione uma turma para consultar apenas os alunos vinculados a ela.
            </p>
          </div>
          <div className="admin-student-class-grid">
            {currentClasses.map((schoolClass) => {
              const amount = groups.get(schoolClass.id)?.length ?? 0;
              const linked = teachersByClass[schoolClass.id] ?? [];
              return (
                <button
                  className="admin-student-class-card"
                  key={schoolClass.id}
                  onClick={() => openGroup(schoolClass.id)}
                  aria-label={"Abrir " + schoolClass.name + ", " + countLabel(amount)}
                >
                  <span className="student-class-card-top">
                    <span>
                      <small>{schoolClass.grade_level}</small>
                      <strong>{schoolClass.name}</strong>
                    </span>
                    <span className="student-class-status">Ativa</span>
                  </span>
                  <span className="student-class-meta">
                    {schoolClass.shift} · {schoolClass.school_year}
                  </span>
                  <span className="student-class-teachers">
                    <small>Professor(es)</small>
                    {linked.join(", ") || "Nenhum professor vinculado"}
                  </span>
                  <span className="student-class-footer">
                    <span><Users size={17} aria-hidden="true" />{countLabel(amount)}</span>
                    <span>Ver alunos <ArrowRight size={16} aria-hidden="true" /></span>
                  </span>
                </button>
              );
            })}

            {(groups.get(WITHOUT_CLASS)?.length ?? 0) > 0 && (
              <button
                className="admin-student-class-card student-special-group"
                onClick={() => openGroup(WITHOUT_CLASS)}
              >
                <span className="student-class-card-top">
                  <span><small>ORGANIZAÇÃO</small><strong>Sem turma</strong></span>
                </span>
                <span className="student-class-meta">Matrícula atual não encontrada.</span>
                <span className="student-class-footer">
                  <span><Users size={17} aria-hidden="true" />{countLabel(groups.get(WITHOUT_CLASS)?.length ?? 0)}</span>
                  <span>Ver alunos <ArrowRight size={16} aria-hidden="true" /></span>
                </span>
              </button>
            )}

            {(groups.get(INCONSISTENT)?.length ?? 0) > 0 && (
              <button
                className="admin-student-class-card student-special-group student-inconsistent-group"
                onClick={() => openGroup(INCONSISTENT)}
              >
                <span className="student-class-card-top">
                  <span><small>ATENÇÃO</small><strong>Matrículas inconsistentes</strong></span>
                </span>
                <span className="student-class-meta">Mais de uma matrícula ativa no mesmo ano letivo.</span>
                <span className="student-class-footer">
                  <span><Users size={17} aria-hidden="true" />{countLabel(groups.get(INCONSISTENT)?.length ?? 0)}</span>
                  <span>Ver alunos <ArrowRight size={16} aria-hidden="true" /></span>
                </span>
              </button>
            )}
          </div>

          {!currentClasses.length &&
            !(groups.get(WITHOUT_CLASS)?.length ?? 0) &&
            !(groups.get(INCONSISTENT)?.length ?? 0) && (
              <div className="empty">Nenhuma turma ativa neste ano letivo.</div>
            )}
        </section>
      )}
    </section>
  );
}
