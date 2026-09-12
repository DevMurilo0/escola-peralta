import { z } from "zod";
import { useCallback } from "react";
import { useParams } from "react-router-dom";
import NotFound from "./NotFound";
import { useResource } from "@/shared/hooks/use-resource";
import { QueryState } from "@/shared/components/query-state";
import { db } from "@/shared/supabase/client";
import { useAuth } from "@/features/auth/auth-context";
import { ClassWorkspace } from "@/features/classes/class-workspace";
import type { Enrollment, Grade, AttendanceSession } from "@/shared/academic/types";
async function loadClass(id: string) {
  const client = db();
  const results = await Promise.all([
    client.from("classes").select("*").eq("id", id).maybeSingle(),
    client.from("enrollments").select("*,students(*)").eq("class_id", id),
    client.from("grades").select("*").eq("class_id", id),
    client
      .from("attendance_sessions")
      .select("*,attendance_records(*)")
      .eq("class_id", id),
    client.from("school_settings").select("*").single(),
    client
      .from("teacher_classes")
      .select("*,profiles(full_name)")
      .eq("class_id", id),
  ]);
  if (results.some((r) => r.error))
    throw new Error("Não foi possível carregar a turma.");
  return results;
}
export default function ClassPage() {
  const { id = "" } = useParams();
  const { profile, session } = useAuth();
  const user = session!.user;
  const validId = z.uuid().safeParse(id).success;
  const loader = useCallback(
    () => (validId ? loadClass(id) : Promise.resolve(null)),
    [id, validId],
  );
  const resource = useResource(`class:${user.id}:${id}`, loader);
  if (!validId || resource.data === null) return <NotFound />;
  if (!resource.data || resource.error) return <QueryState {...resource} />;
  const [c, e, g, a, s, t] = resource.data;
  if (!c.data) return <NotFound />;
  return (
    <ClassWorkspace
      key={id}
      schoolClass={c.data}
      enrollments={(e.data || []) as unknown as Enrollment[]}
      grades={(g.data || []) as Grade[]}
      sessions={(a.data || []) as AttendanceSession[]}
      minimum={s.data.passing_grade}
      teachers={(t.data || [])
        .map((t) => t.profiles?.full_name)
        .filter(Boolean)
        .join(", ")}
      canManage={
        profile!.role === "admin" ||
        !!t.data?.some((t) => t.teacher_id === user.id && t.can_manage_students)
      }
    />
  );
}
