import { db } from "@/shared/supabase/client";

export type MasterTeacher = {
  id: string;
  full_name: string;
  email: string;
  active: boolean;
  created_at: string;
  last_sign_in_at: string | null;
};

type ApiResult<T> = T & {
  error?: string;
  code?: string;
  httpStatus?: number;
};

async function request<T>(
  path: "status" | "teachers" | "teachers/update" | "classes",
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
    return {
      error: "Sua sessão expirou. Entre novamente.",
      code: "SESSION_INVALID",
      httpStatus: 401,
    } as ApiResult<T>;

  let response: Response;
  try {
    response = await fetch(`/api/master/${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(payload ? { "Content-Type": "application/json" } : {}),
      },
      ...(payload ? { body: JSON.stringify(payload) } : {}),
    });
  } catch {
    return {
      error: "Não foi possível conectar ao serviço administrativo.",
      code: "NETWORK_ERROR",
    } as ApiResult<T>;
  }
  if (!response.headers.get("content-type")?.includes("application/json"))
    return {
      error: "Serviço administrativo indisponível. Tente novamente.",
      code: "INVALID_RESPONSE",
      httpStatus: response.status,
    } as ApiResult<T>;
  const result = (await response.json()) as ApiResult<T>;
  return response.ok
    ? { ...result, httpStatus: response.status }
    : ({
        error: result.error || "Não foi possível concluir a operação.",
        code: result.code,
        httpStatus: response.status,
      } as ApiResult<T>);
}

export async function masterStatus(accessToken: string) {
  const result = await request<{ isMaster: boolean }>(
    "status",
    "GET",
    undefined,
    accessToken,
  );
  return {
    isMaster: !result.error && result.isMaster === true,
    error: (() => {
      if (!result.error || result.httpStatus === 403) return undefined;
      if (result.code === "MASTER_CONFIG_MISSING")
        return "Configuração Master indisponível no servidor.";
      if (result.httpStatus === 401)
        return "Sua sessão não pôde ser validada. Entre novamente.";
      if (result.code === "NETWORK_ERROR")
        return "Não foi possível verificar a configuração Master. Verifique sua conexão.";
      return "Não foi possível verificar a configuração Master. Tente novamente.";
    })(),
  };
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

export function updateMasterTeacher(payload: {
  id: string;
  full_name: string;
  email: string;
  password?: string;
}) {
  return request<{ success: boolean }>(
    "teachers/update",
    "POST",
    payload,
  );
}


export function createMasterClass(payload: {
  grade_level:
    | "Infantil"
    | "Jardim"
    | "1º Ano"
    | "2º Ano"
    | "3º Ano"
    | "4º Ano"
    | "5º Ano";
  group: "1" | "2" | "3" | "A" | "B" | "C";
  shift: "Manhã" | "Tarde" | "Integral";
  school_year: number;
  teacher_id: string;
}) {
  return request<{
    success: boolean;
    schoolClass: {
      id: string;
      name: string;
      grade_level: string;
      shift: string;
      school_year: number;
      active: boolean;
    };
  }>("classes", "POST", payload);
}
