import { db } from "@/shared/supabase/client";
import {
  studentSchema,
  termSchema,
  gradeSchema,
  attendanceSchema,
  dateSchema,
} from "@/shared/academic/schemas";
import { z } from "zod";
import { invalidateResources } from "@/shared/hooks/use-resource";
export async function academicAction(
  kind: "student" | "enrollment" | "grades" | "attendance",
  input: unknown,
) {
  try {
    const client = db();
    const base = z.object({ class_id: z.uuid() }).parse(input);
    let result;
    if (kind === "student") {
      const p = studentSchema
        .extend({ student_id: z.uuid().nullable() })
        .parse(input);
      result = await client.rpc("save_student", {
        p_class: base.class_id,
        p_name: p.full_name,
        p_birth: p.birth_date,
        p_student: p.student_id,
      });
    } else if (kind === "enrollment") {
      const p = z
        .object({
          student_id: z.uuid(),
          status: z.enum(["active", "inactive"]),
        })
        .parse(input);
      result = await client.rpc("set_enrollment", {
        p_class: base.class_id,
        p_student: p.student_id,
        p_status: p.status,
      });
    } else if (kind === "grades") {
      const p = z
        .object({ term: termSchema, rows: z.array(gradeSchema).max(500) })
        .parse(input);
      result = await client.rpc("save_grades", {
        p_class: base.class_id,
        p_term: p.term,
        p_rows: p.rows,
      });
    } else {
      const p = z
        .object({
          term: termSchema,
          date: dateSchema,
          rows: z.array(attendanceSchema).min(1).max(500),
          expected: z.string().nullable(),
        })
        .parse(input);
      result = await client.rpc("save_attendance", {
        p_class: base.class_id,
        p_term: p.term,
        p_date: p.date,
        p_rows: p.rows,
        p_expected: p.expected,
      });
    }
    if (result.error)
      return {
        error:
          result.error.code === "P0001"
            ? result.error.message
            : "Não foi possível salvar. Verifique os dados e sua permissão.",
      };
    let savedSession;
    if (kind === "attendance" && result.data) {
      const refreshed = await client.from("attendance_sessions")
        .select("*,attendance_records(*)").eq("id", result.data).single();
      if (refreshed.error) {
        invalidateResources();
        return { error: "Frequência gravada, mas não foi possível recarregá-la. Reabra a data antes de editar novamente." };
      }
      savedSession = refreshed.data;
    }
    invalidateResources();
    return { success: true, savedSession };
  } catch {
    return { error: "Dados inválidos. Confira os campos antes de salvar." };
  }
}
