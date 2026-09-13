import { z } from "zod";
import { db } from "@/shared/supabase/client";
import { studentSchema } from "@/shared/academic/schemas";
import { invalidateResources } from "@/shared/hooks/use-resource";

export async function studentAdminAction(
  kind: "update" | "transfer" | "archive",
  input: unknown,
) {
  try {
    let result;
    if (kind === "update") {
      const values = studentSchema
        .extend({ student_id: z.uuid() })
        .parse(input);
      result = await db().rpc("admin_update_student", {
        p_student: values.student_id,
        p_name: values.full_name,
        p_birth: values.birth_date,
      });
    } else if (kind === "transfer") {
      const values = z
        .object({ student_id: z.uuid(), target_class_id: z.uuid() })
        .parse(input);
      result = await db().rpc("admin_transfer_student", {
        p_student: values.student_id,
        p_target_class: values.target_class_id,
      });
    } else {
      const values = z.object({ student_id: z.uuid() }).parse(input);
      result = await db().rpc("admin_archive_student", {
        p_student: values.student_id,
      });
    }
    if (result.error)
      return {
        error:
          result.error.code === "P0001"
            ? result.error.message
            : "Não foi possível concluir a operação.",
      };
    invalidateResources();
    return { success: true };
  } catch {
    return { error: "Confira os dados informados." };
  }
}
