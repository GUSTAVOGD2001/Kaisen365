export const API = import.meta.env.VITE_API_URL as string;

export async function apiReq(path: string, opts: RequestInit = {}, token?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((opts.headers || {}) as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let body = opts.body;
  if (body && typeof body !== "string" && !(body instanceof FormData) && !(body instanceof Blob)) {
    body = JSON.stringify(body);
  }

  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers,
    body,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || (data && typeof data === "object" && (data as any).ok === false)) {
    throw new Error((data as any)?.error || `HTTP ${res.status}`);
  }

  return data;
}

export const api = {
  signUp(payload: { username: string; email: string; password: string }) {
    return apiReq("/auth/signup", { method: "POST", body: payload });
  },
  login(payload: { email: string; password: string }) {
    return apiReq("/auth/login", { method: "POST", body: payload });
  },
  listHabits(token: string) {
    return apiReq("/habits", { method: "GET" }, token);
  },
  createHabit(token: string, body: { name: string; color?: string; icon?: string }) {
    return apiReq("/habits", { method: "POST", body }, token);
  },
  upsertEntry(token: string, body: { habit_id: number; entry_date: string; value?: boolean; note?: string }) {
    return apiReq("/entries", { method: "POST", body }, token);
  },
  currentStreak(token: string, habitId: number) {
    return apiReq(`/habits/${habitId}/streak`, { method: "GET" }, token);
  },
};
