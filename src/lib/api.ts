const API = import.meta.env.VITE_API_URL as string;

async function req(path: string, opts: RequestInit = {}, token?: string) {
  const headers = new Headers(opts.headers ?? {});
  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let body = opts.body;
  if (body && typeof body !== "string" && !(body instanceof FormData) && !(body instanceof Blob)) {
    body = JSON.stringify(body);
  }

  const response = await fetch(`${API}${path}`, {
    ...opts,
    headers,
    body,
  });

  const text = await response.text();
  let data: any = undefined;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = undefined;
    }
  }

  if (!response.ok || (data && typeof data === "object" && (data as any).ok === false)) {
    const errorMessage =
      data && typeof data === "object" && "error" in data ? (data as any).error : `HTTP ${response.status}`;
    throw new Error(errorMessage);
  }

  return data;
}

export const api = {
  signUp(payload: { username: string; email: string; password: string }) {
    return req("/auth/signup", { method: "POST", body: payload });
  },
  login(payload: { email: string; password: string }) {
    return req("/auth/login", { method: "POST", body: payload });
  },
  listHabits(token: string) {
    return req("/habits", { method: "GET" }, token);
  },
  createHabit(token: string, body: { name: string; color?: string; icon?: string }) {
    return req("/habits", { method: "POST", body }, token);
  },
  upsertEntry(token: string, body: { habit_id: number; entry_date: string; value?: boolean; note?: string }) {
    return req("/entries", { method: "POST", body }, token);
  },
  currentStreak(token: string, habitId: number) {
    return req(`/habits/${habitId}/streak`, { method: "GET" }, token);
  },
};

export { API };
