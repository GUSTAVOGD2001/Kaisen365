export type AuthState = {
  token: string | null;
  user?: { id: string; username: string } | null;
};

const key = "auth_v1";

export const auth = {
  get(): AuthState {
    try {
      return JSON.parse(localStorage.getItem(key) || "{}");
    } catch {
      return {} as AuthState;
    }
  },
  set(state: AuthState) {
    localStorage.setItem(key, JSON.stringify(state));
  },
  clear() {
    localStorage.removeItem(key);
  },
};
