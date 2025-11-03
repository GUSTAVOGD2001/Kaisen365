import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { auth } from "@/lib/auth";

type Mode = "login" | "signup";

type Credentials = {
  username: string;
  email: string;
  password: string;
};

const initialCredentials: Credentials = {
  username: "",
  email: "",
  password: "",
};

const Login = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [credentials, setCredentials] = useState<Credentials>(initialCredentials);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const session = auth.get();
    if (session?.token) {
      navigate("/habits", { replace: true });
    }
  }, [navigate]);

  const handleChange = (field: keyof Credentials) => (event: ChangeEvent<HTMLInputElement>) => {
    setCredentials((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const toggleMode = () => {
    setMode((current) => (current === "login" ? "signup" : "login"));
    setError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload =
        mode === "signup"
          ? await api.signUp({
              username: credentials.username,
              email: credentials.email,
              password: credentials.password,
            })
          : await api.login({
              email: credentials.email,
              password: credentials.password,
            });

      const { token, user } = (payload as { token: string; user?: { id: string; username: string } }) ?? {};
      if (!token) {
        throw new Error("Token no recibido");
      }

      auth.set({ token, user: user ?? null });
      navigate("/habits", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">
            {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
          </h1>
          <p className="text-sm text-slate-500">
            {mode === "login"
              ? "Bienvenido de nuevo, ingresa tus credenciales."
              : "Crea una cuenta para seguir tus hábitos."}
          </p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {mode === "signup" && (
            <div className="space-y-1">
              <label htmlFor="username" className="text-sm font-medium text-slate-700">
                Nombre de usuario
              </label>
              <input
                id="username"
                type="text"
                value={credentials.username}
                onChange={handleChange("username")}
                required={mode === "signup"}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                placeholder="tu_usuario"
                autoComplete="username"
              />
            </div>
          )}
          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium text-slate-700">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              value={credentials.email}
              onChange={handleChange("email")}
              required
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              placeholder="tu@email.com"
              autoComplete="email"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium text-slate-700">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={credentials.password}
              onChange={handleChange("password")}
              required
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              placeholder="••••••••"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-slate-900 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Procesando..." : mode === "login" ? "Entrar" : "Registrarme"}
          </button>
        </form>
        <p className="text-center text-sm text-slate-500">
          {mode === "login" ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
          <button
            type="button"
            onClick={toggleMode}
            className="font-medium text-slate-900 hover:underline"
          >
            {mode === "login" ? "Regístrate" : "Inicia sesión"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
