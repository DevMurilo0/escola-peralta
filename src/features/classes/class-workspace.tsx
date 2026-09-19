import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  LibraryBig,
  Users,
} from "lucide-react";
import { AttendancePanel } from "@/features/attendance/attendance-panel";
import CurriculumPanel from "@/features/curriculum/curriculum-panel";
import FinalResults from "@/features/grades/final-results";
import { GradesEditor } from "@/features/grades/grades-editor";
import { StudentsPanel } from "@/features/students/students-panel";
import { invalidateResources } from "@/shared/hooks/use-resource";
import { useUnsaved } from "@/shared/hooks/use-unsaved";
import type {
  AttendanceSession,
  Enrollment,
  Grade,
  SchoolClass,
} from "@/shared/academic/types";

const termLabels = ["I Bimestre", "II Bimestre", "III Bimestre", "IV Bimestre"];
const modules = {
  grades: {
    title: "Notas por atividade",
    description: "1ª nota, 2ª nota e média do bimestre",
    icon: BookOpen,
  },
  attendance: {
    title: "Frequência diária",
    description: "Registre e consulte a chamada da turma",
    icon: CalendarDays,
  },
  curriculum: {
    title: "Registro dos conteúdos curriculares trabalhados",
    description: "Registre os conteúdos trabalhados em aula",
    icon: LibraryBig,
  },
} as const;
type AcademicModule = keyof typeof modules;
type ClassSection = "students" | "results";

export function ClassWorkspace({
  schoolClass: c,
  enrollments,
  grades,
  sessions,
  minimum,
  teachers,
  canManage,
}: {
  schoolClass: SchoolClass;
  enrollments: Enrollment[];
  grades: Grade[];
  sessions: AttendanceSession[];
  minimum: number;
  teachers: string;
  canManage: boolean;
}) {
  const [query, setSearchParams] = useSearchParams();
  const legacyTab = query.get("tab");
  const requestedSection = query.get("section") || legacyTab;
  const section = requestedSection === "students" || requestedSection === "results"
    ? requestedSection as ClassSection
    : null;
  const selectedTerm = Number(query.get("term"));
  const term = !section && [1, 2, 3, 4].includes(selectedTerm)
    ? selectedTerm
    : null;
  const requestedModule = query.get("module") || legacyTab;
  const module = !section && requestedModule && requestedModule in modules
    ? requestedModule as AcademicModule
    : null;
  const activeEnrollments = enrollments.filter((e) => e.status === "active");
  const [dirty, setDirty] = useState(false);
  useUnsaved(dirty);

  function navigate(next: Record<string, string>) {
    if (
      dirty &&
      !window.confirm("Existem alterações não salvas. Deseja descartá-las?")
    ) return;
    setDirty(false);
    setSearchParams(next);
  }

  const termLabel = term ? termLabels[term - 1] : "";
  const isOverview = !term && !section;

  return (
    <div className="class-workspace">
      <nav className="class-breadcrumb" aria-label="Trilha da turma">
        <Link to="/portal/turmas">Minhas turmas</Link>
        <ChevronRight aria-hidden="true" />
        {isOverview ? (
          <strong>{c.name}</strong>
        ) : (
          <button onClick={() => navigate({})}>{c.name}</button>
        )}
        {term && (
          <>
            <ChevronRight aria-hidden="true" />
            {module ? (
              <button onClick={() => navigate({ term: String(term) })}>
                {termLabel}
              </button>
            ) : (
              <strong>{termLabel}</strong>
            )}
          </>
        )}
        {term && module && (
          <>
            <ChevronRight aria-hidden="true" />
            <strong>{modules[module].title}</strong>
          </>
        )}
        {section && (
          <>
            <ChevronRight aria-hidden="true" />
            <strong>{section === "students" ? "Alunos" : "Resultado final"}</strong>
          </>
        )}
      </nav>

      <div className="workspace-stage" key={`${term || "class"}-${module || section || "overview"}`}>
        {isOverview && (
          <>
            <section className="class-overview-card">
              <div>
                <span className="eyebrow">TURMA</span>
                <h1>{c.name}</h1>
                <p className="class-teacher">{teachers || "Sem professor associado"}</p>
                <div className="class-metadata">
                  <span><strong>{activeEnrollments.length}</strong> alunos</span>
                  <span>{c.grade_level}</span>
                  <span>{c.shift}</span>
                  <span>Ano letivo {c.school_year}</span>
                </div>
              </div>
              <span className="pill">
                {c.active ? "Turma ativa" : "Turma arquivada · somente consulta"}
              </span>
            </section>

            <div className="class-quick-actions" aria-label="Ações da turma">
              <button className="secondary" onClick={() => navigate({ section: "students" })}>
                <Users size={18} />
                <span>Alunos <small>{activeEnrollments.length}</small></span>
                <ChevronRight size={17} />
              </button>
            </div>

            <section className="class-navigation-section" aria-labelledby="terms-title">
              <div className="section-heading compact-heading">
                <div>
                  <span className="eyebrow">ETAPAS DO ANO</span>
                  <h2 id="terms-title">Bimestres</h2>
                </div>
                <p className="muted">Escolha um bimestre para acessar seus módulos.</p>
              </div>
              <div className="term-cards">
                {termLabels.map((label, index) => (
                  <button
                    className="term-card"
                    key={label}
                    onClick={() => navigate({ term: String(index + 1) })}
                    aria-label={`Abrir ${label}`}
                  >
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{label}</strong>
                    <ChevronRight />
                  </button>
                ))}
              </div>
            </section>

            <section className="final-result-access" aria-labelledby="final-access-title">
              <button onClick={() => navigate({ section: "results" })}>
                <span className="module-icon"><ClipboardCheck /></span>
                <span>
                  <small>VISÃO ANUAL</small>
                  <strong id="final-access-title">Resultado final</strong>
                  <span>Acompanhe os quatro bimestres, a média anual e a situação.</span>
                </span>
                <ChevronRight />
              </button>
            </section>
          </>
        )}

        {term && !module && !section && (
          <>
            <button className="workspace-back secondary" onClick={() => navigate({})}>
              <ArrowLeft size={17} /> Voltar para a turma
            </button>
            <header className="module-selection-heading">
              <span className="eyebrow">{termLabel.toUpperCase()}</span>
              <h1>Selecione o módulo</h1>
              <p className="muted">O que você deseja fazer neste bimestre?</p>
            </header>
            <div className="module-cards">
              {(Object.entries(modules) as [AcademicModule, typeof modules[AcademicModule]][]).map(
                ([key, item]) => {
                  const Icon = item.icon;
                  return (
                    <button
                      className="module-card"
                      key={key}
                      onClick={() => navigate({ term: String(term), module: key })}
                    >
                      <span className="module-icon"><Icon /></span>
                      <span>
                        <strong>{item.title}</strong>
                        <small>{item.description}</small>
                      </span>
                      <ChevronRight />
                    </button>
                  );
                },
              )}
            </div>
          </>
        )}

        {term && module && !section && (
          <>
            <button
              className="workspace-back secondary"
              onClick={() => navigate({ term: String(term) })}
            >
              <ArrowLeft size={17} /> Voltar aos módulos
            </button>
            <span className="module-term-label">{termLabel}</span>
            {module === "attendance" ? (
              <AttendancePanel
                classId={c.id}
                year={c.school_year}
                term={term}
                enrollments={enrollments}
                sessions={sessions}
                disabled={!c.active}
                onDirty={setDirty}
                onSaved={() => invalidateResources()}
              />
            ) : module === "curriculum" ? (
              <CurriculumPanel
                classId={c.id}
                term={term}
                year={c.school_year}
                disabled={!c.active}
              />
            ) : (
              <GradesEditor
                classId={c.id}
                term={term}
                enrollments={enrollments}
                grades={grades.filter((g) => g.term === term)}
                minimum={minimum}
                disabled={!c.active}
                onDirty={setDirty}
              />
            )}
          </>
        )}

        {section === "students" && (
          <>
            <button className="workspace-back secondary" onClick={() => navigate({})}>
              <ArrowLeft size={17} /> Voltar para a turma
            </button>
            <StudentsPanel
              classId={c.id}
              enrollments={enrollments}
              canManage={canManage && c.active}
            />
          </>
        )}

        {section === "results" && (
          <>
            <button className="workspace-back secondary" onClick={() => navigate({})}>
              <ArrowLeft size={17} /> Voltar para a turma
            </button>
            <FinalResults enrollments={enrollments} grades={grades} />
          </>
        )}
      </div>

    </div>
  );
}
