import { useResource } from "@/shared/hooks/use-resource";
import { QueryState } from "@/shared/components/query-state";
import { db } from "@/shared/supabase/client";
import { useAuth } from "@/features/auth/auth-context";
import { AdminPanel } from "@/features/admin/admin-panel";
import type { AdminStudent } from "@/features/admin/students/types";
async function loadAdmin() {
  const client = db();
  const results = await Promise.all([
    client
      .from("profiles")
      .select("*")
      .eq("role", "teacher")
      .is("deleted_at", null)
      .order("full_name"),
    client
      .from("classes")
      .select("*,enrollments(id,status)")
      .order("school_year", { ascending: false })
      .order("name"),
    client.from("teacher_classes").select("*"),
    client
      .from("students")
      .select(
        "id,full_name,birth_date,active,enrollments(id,student_id,class_id,school_year,status,enrolled_at,classes(id,name,school_year,active))",
      )
      .eq("active", true)
      .order("full_name"),
    client.from("school_settings").select("*").single(),
  ]);
  if (results.some((r) => r.error))
    throw new Error("Falha ao carregar administração.");
  return results;
}
export default function Admin() {
  const { profile, isMaster, masterError } = useAuth();
  const resource = useResource(`admin:${profile!.id}`, loadAdmin);
  if (!resource.data || resource.error) return <QueryState {...resource} />;
  const results = resource.data;
  return (
    <AdminPanel
      teachers={results[0].data || []}
      classes={results[1].data || []}
      associations={results[2].data || []}
      students={(results[3].data || []) as unknown as AdminStudent[]}
      settings={results[4].data}
      isMaster={isMaster}
      masterError={masterError}
    />
  );
}
