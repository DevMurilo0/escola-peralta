import { BrowserRouter } from "react-router-dom";
import { createRoot } from "react-dom/client";
import { PortalShell } from "@/components/portal-shell";
import { ClassWorkspace } from "@/features/classes/class-workspace";
import { todayRecife } from "@/utils/academic";
const today = todayRecife();
const enrollments = ["Alice Exemplo", "Bruno Exemplo", "Clara Exemplo"].map(
  (full_name, i) => ({
    id: `e${i}`,
    student_id: `10000000-0000-4000-8000-00000000000${i + 1}`,
    status: "active",
    students: {
      id: `10000000-0000-4000-8000-00000000000${i + 1}`,
      full_name,
      birth_date: "2018-03-15",
      active: true,
    },
  }),
);
createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <PortalShell name="Ana Oliveira (Teste)" admin={true}>
      <ClassWorkspace
        schoolClass={{
          id: "20000000-0000-4000-8000-000000000001",
          name: "3º Ano A",
          grade_level: "3º Ano",
          shift: "Manhã",
          school_year: Number(today.slice(0, 4)),
          active: true,
        }}
        enrollments={enrollments}
        grades={[]}
        sessions={[]}
        minimum={6}
        teachers="Ana Oliveira (Teste)"
        canManage
      />
    </PortalShell>
  </BrowserRouter>,
);
