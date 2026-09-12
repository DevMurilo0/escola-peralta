import { db } from "@/shared/supabase/client";

export type MasterTeacher = {
  id: string;
  full_name: string;
  email: string;
  active: boolean;
  created_at: string;
  last_sign_in_at: string | null;
};

type ApiResult<T> = T & { error?: string };

async function request<T>(
  path: "status" | "teachers",
  method: "GET" | "POST",
  payload?: unknown,
  accessToken?: string,
): Promise<ApiResult<T>> {
  let token = accessToken;
  if (!token) {
    const {
      data: { session },
    } = await db().auth.getSession();
    token = session?.access_token;
  }
  if (!token)
    return { error: "Sua sessão expirou. Entre novamente." } as ApiResult<T>;

  const response = await fetch(`/api/master/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(payload ? { "Content-Type": "application/json" } : {}),
    },
    ...(payload ? { body: JSON.stringify(payload) } : {}),
  });
  if (!response.headers.get("content-type")?.includes("application/json"))
    return {
      error: "Serviço administrativo indisponível. Tente novamente.",
    } as ApiResult<T>;
  const result = (await response.json()) as ApiResult<T>;
  return response.ok
    ? result
    : ({
        error: result.error || "Não foi possível concluir a operação.",
      } as ApiResult<T>);
}

export async function masterStatus(accessToken: string) {
  const result = await request<{ isMaster: boolean }>(
    "status",
    "GET",
    undefined,
    accessToken,
  );
  return result.error ? false : result.isMaster === true;
}

export async function loadMasterTeachers() {
  const result = await request<{ teachers: MasterTeacher[] }>(
    "teachers",
    "GET",
  );
  if (result.error) throw new Error(result.error);
  return result.teachers;
}

export function createMasterTeacher(payload: {
  full_name: string;
  email: string;
  password: string;
}) {
  return request<{ success: boolean; teacher: MasterTeacher }>(
    "teachers",
    "POST",
    payload,
  );
}
