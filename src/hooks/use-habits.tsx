import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AppData, Habit, ThemeName } from "@/lib/habit-types";
import { applyTheme, loadData, newHabit, saveData, saveDataNow } from "@/lib/habit-storage";
import { checkAchievements, monthKey } from "@/lib/habit-calc";
import { ACHIEVEMENT_META } from "@/lib/habit-types";
import { toast } from "sonner";

const INITIAL_DATA: AppData = {
  habits: [],
  achievements: [],
  settings: { theme: "obsidian", globalTimeTracking: false, lastVisited: "" },
  version: "1.0.0",
};

interface Ctx {
  data: AppData;
  setTheme: (t: ThemeName) => void;
  toggleCompletion: (habitId: string, mk: string, day: number) => void;
  addHabit: (name: string, timeTracking?: boolean) => void;
  updateHabit: (id: string, patch: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  importAll: (data: AppData) => void;
  clearAll: () => void;
  setGlobalTimeTracking: (v: boolean) => void;
}

const HabitsCtx = createContext<Ctx | null>(null);

export function HabitsProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(INITIAL_DATA);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // re-hydrate on client to ensure localStorage data loads
    setData(loadData());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) applyTheme(data.settings.theme);
  }, [data.settings.theme, hydrated]);

  useEffect(() => {
    if (hydrated) saveData(data);
  }, [data, hydrated]);

  const update = useCallback((fn: (d: AppData) => AppData) => {
    setData((prev) => {
      const next = fn(prev);
      // achievements
      const newOnes = checkAchievements(next.habits, next.achievements);
      if (newOnes.length) {
        newOnes.forEach((a) =>
          toast.success("Achievement unlocked", {
            description: `${ACHIEVEMENT_META[a.type].emoji} ${ACHIEVEMENT_META[a.type].name}`,
          }),
        );
        next.achievements = [...next.achievements, ...newOnes];
      }
      return next;
    });
  }, []);

  const ctx: Ctx = useMemo(
    () => ({
      data,
      setTheme: (t) => update((d) => ({ ...d, settings: { ...d.settings, theme: t } })),
      toggleCompletion: (habitId, mk, day) =>
        update((d) => ({
          ...d,
          habits: d.habits.map((h) => {
            if (h.id !== habitId) return h;
            const list = h.completions[mk] || [];
            const has = list.includes(day);
            const next = has ? list.filter((x) => x !== day) : [...list, day].sort((a, b) => a - b);
            return { ...h, completions: { ...h.completions, [mk]: next } };
          }),
        })),
      addHabit: (name, tt) => {
        update((d) => ({ ...d, habits: [...d.habits, newHabit(name, tt)] }));
        toast.success("Habit added", { description: name });
      },
      updateHabit: (id, patch) =>
        update((d) => ({ ...d, habits: d.habits.map((h) => (h.id === id ? { ...h, ...patch } : h)) })),
      deleteHabit: (id) => {
        const name = data.habits.find((h) => h.id === id)?.name || "Habit";
        update((d) => ({ ...d, habits: d.habits.filter((h) => h.id !== id) }));
        toast.success("Habit deleted", { description: `${name} removed` });
      },
      importAll: (incoming) => {
        setData(incoming);
        saveDataNow(incoming);
        toast.success("Data imported");
      },
      clearAll: () => {
        const fresh: AppData = {
          habits: [],
          achievements: [],
          settings: data.settings,
          version: data.version,
        };
        setData(fresh);
        saveDataNow(fresh);
      },
      setGlobalTimeTracking: (v) =>
        update((d) => ({ ...d, settings: { ...d.settings, globalTimeTracking: v } })),
    }),
    [data, update],
  );

  return <HabitsCtx.Provider value={ctx}>{children}</HabitsCtx.Provider>;
}

export function useHabits() {
  const c = useContext(HabitsCtx);
  if (!c) throw new Error("useHabits outside provider");
  return c;
}

export function useCurrentMonth(initial?: string) {
  const [mk, setMk] = useState(initial || monthKey(new Date()));
  return { mk, setMk };
}
