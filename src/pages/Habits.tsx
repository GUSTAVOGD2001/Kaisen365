import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { auth, AuthState } from "@/lib/auth";

type Habit = {
  id: number;
  name: string;
  color?: string | null;
  icon?: string | null;
};

type HabitsResponse = Habit[] | { habits: Habit[] } | null | undefined;

type StreakResponse = number | { streak?: number } | null | undefined;

const today = () => new Date().toISOString().slice(0, 10);

const StreakBadge = ({ token, habitId, refreshKey }: { token: string; habitId: number; refreshKey: number }) => {
  const [streak, setStreak] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setError(null);
    api
      .currentStreak(token, habitId)
      .then((response: StreakResponse) => {
        if (!active) return;
        const value =
          typeof response === "number"
            ? response
            : response && typeof response === "object" && "streak" in response
            ? Number((response as { streak?: number }).streak ?? 0)
            : 0;
        setStreak(Number.isNaN(value) ? 0 : value);
      })
      .catch((err: Error) => {
        if (!active) return;
        setError(err.message);
      });

    return () => {
      active = false;
    };
  }, [token, habitId, refreshKey]);

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-1 text-xs font-semibold text-orange-700">
      <span role="img" aria-label="racha">
        🔥
      </span>
      {error ? "-" : streak ?? "..."}
    </span>
  );
};

const Habits = () => {
  const navigate = useNavigate();
  const [token] = useState<string | null>(() => {
    const stored = auth.get() as AuthState & { token?: string | null };
    return stored && typeof stored === "object" && "token" in stored ? stored.token ?? null : null;
  });
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newHabit, setNewHabit] = useState<{ name: string; color?: string; icon?: string }>({ name: "" });
  const [creating, setCreating] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      navigate("/", { replace: true });
    }
  }, [token, navigate]);

  useEffect(() => {
    if (!token) return;

    let active = true;
    setLoading(true);
    setError(null);

    api
      .listHabits(token)
      .then((response: HabitsResponse) => {
        if (!active) return;
        const items = Array.isArray(response)
          ? response
          : response && typeof response === "object" && "habits" in response
          ? (response as { habits: Habit[] }).habits
          : [];
        setHabits(items);
      })
      .catch((err: Error) => {
        if (!active) return;
        setError(err.message);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  const handleCreateHabit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    const name = newHabit.name.trim();
    const color = newHabit.color?.trim() || undefined;
    const icon = newHabit.icon?.trim() || undefined;

    if (!name) return;

    setCreating(true);
    setError(null);
    setMessage(null);

    try {
      const payload = await api.createHabit(token, {
        name,
        color,
        icon,
      });

      const created =
        payload && typeof payload === "object"
          ? (payload as Habit)
          : Array.isArray(payload)
          ? (payload as Habit[])[payload.length - 1]
          : undefined;

      setHabits((prev) => {
        if (created && typeof created === "object" && "id" in created) {
          const habit = created as Habit;
          if (!prev.some((item) => item.id === habit.id)) {
            return [...prev, habit];
          }
        }
        return [...prev, { id: Date.now(), name, color, icon }];
      });
      setNewHabit({ name: "", color: "", icon: "" });
      setMessage("Hábito creado correctamente");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el hábito");
    } finally {
      setCreating(false);
    }
  };

  const handleLogToday = async (habitId: number) => {
    if (!token) return;

    setMessage(null);
    setError(null);

    try {
      await api.upsertEntry(token, {
        habit_id: habitId,
        entry_date: today(),
        value: true,
      });
      setMessage("Registro de hoy guardado");
      setRefreshKey((key) => key + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar el hábito");
    }
  };

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-slate-900">Tus hábitos</h1>
          <p className="text-sm text-slate-500">Lleva el control diario y mantén tu racha encendida.</p>
        </header>

        <form
          onSubmit={handleCreateHabit}
          className="flex flex-col gap-3 rounded-2xl bg-white p-6 shadow"
        >
          <h2 className="text-lg font-semibold text-slate-900">Crear nuevo hábito</h2>
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <input
              type="text"
              value={newHabit.name}
              onChange={(event) => setNewHabit((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Nombre del hábito"
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              required
            />
            <input
              type="text"
              value={newHabit.icon ?? ""}
              onChange={(event) => setNewHabit((prev) => ({ ...prev, icon: event.target.value }))}
              placeholder="Icono (opcional)"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 md:w-32"
            />
            <input
              type="text"
              value={newHabit.color ?? ""}
              onChange={(event) => setNewHabit((prev) => ({ ...prev, color: event.target.value }))}
              placeholder="Color (opcional)"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 md:w-32"
            />
            <button
              type="submit"
              disabled={creating}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {creating ? "Creando..." : "Agregar"}
            </button>
          </div>
        </form>

        {message && <p className="text-sm font-medium text-emerald-600">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        <section className="rounded-2xl bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-slate-900">Lista de hábitos</h2>
          {loading ? (
            <p className="mt-4 text-sm text-slate-500">Cargando hábitos...</p>
          ) : habits.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">Aún no tienes hábitos. ¡Crea el primero!</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {habits.map((habit) => (
                <li
                  key={habit.id}
                  className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-base font-semibold text-slate-900">
                      {habit.icon && <span>{habit.icon}</span>}
                      <span>{habit.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <StreakBadge token={token} habitId={habit.id} refreshKey={refreshKey} />
                      {habit.color && (
                        <span className="inline-flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: habit.color ?? undefined }} />
                          {habit.color}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleLogToday(habit.id)}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-900 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-900 hover:text-white"
                  >
                    Hoy ✔
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};

export default Habits;
