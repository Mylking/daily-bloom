import { AppData, Habit, INITIAL_HABITS, ThemeName } from "./habit-types";

const KEY = "habit-tracker-v1";
const VERSION = "1.0.0";

function uuid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function seed(): AppData {
  const habits: Habit[] = INITIAL_HABITS.map((name) => ({
    id: uuid(),
    name,
    timeTrackingEnabled: false,
    createdAt: new Date().toISOString(),
    completions: {},
  }));
  return {
    habits,
    achievements: [],
    settings: {
      theme: "obsidian",
      globalTimeTracking: false,
      lastVisited: new Date().toISOString(),
    },
    version: VERSION,
  };
}

export function initialData(): AppData {
  return seed();
}

export function loadData(): AppData {
  if (typeof window === "undefined") return seed();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const s = seed();
      localStorage.setItem(KEY, JSON.stringify(s));
      return s;
    }
    const parsed = JSON.parse(raw) as AppData;
    if (!parsed.settings) parsed.settings = seed().settings;
    if (!parsed.achievements) parsed.achievements = [];
    return parsed;
  } catch {
    return seed();
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
export function saveData(data: AppData) {
  if (typeof window === "undefined") return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    localStorage.setItem(KEY, JSON.stringify(data));
  }, 300);
}

export function saveDataNow(data: AppData) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function newHabit(name: string, timeTracking = false): Habit {
  return {
    id: uuid(),
    name,
    timeTrackingEnabled: timeTracking,
    createdAt: new Date().toISOString(),
    completions: {},
  };
}

export function newId() {
  return uuid();
}

export function applyTheme(theme: ThemeName) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
}
