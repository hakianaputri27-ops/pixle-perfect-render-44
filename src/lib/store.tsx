import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { emptyDB, type DB, type Settings } from "./types";

type Coll = "properties" | "rooms" | "tenants" | "payments" | "expenses" | "assets" | "maintenance";

const KEYS: Coll[] = [
  "properties",
  "rooms",
  "tenants",
  "payments",
  "expenses",
  "assets",
  "maintenance",
];

function load(): DB {
  const db: DB = { ...emptyDB, settings: { ...emptyDB.settings } };
  try {
    for (const k of KEYS) {
      const raw = localStorage.getItem(`kelolakost.${k}`);
      if (raw) (db[k] as unknown[]) = JSON.parse(raw);
    }
    const s = localStorage.getItem("kelolakost.settings");
    if (s) db.settings = { ...db.settings, ...JSON.parse(s) };
  } catch {
    /* ignore corrupt storage */
  }
  return db;
}

function persist(db: DB) {
  try {
    for (const k of KEYS) localStorage.setItem(`kelolakost.${k}`, JSON.stringify(db[k]));
    localStorage.setItem("kelolakost.settings", JSON.stringify(db.settings));
  } catch {
    /* storage full / unavailable */
  }
}

export const newId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

interface StoreValue {
  db: DB;
  ready: boolean;
  activePropertyId?: string | undefined;
  add: <K extends Coll>(coll: K, item: Omit<DB[K][number], "id">) => DB[K][number];
  update: <K extends Coll>(coll: K, id: string, patch: Partial<DB[K][number]>) => void;
  remove: (coll: Coll, id: string) => void;
  setSettings: (patch: Partial<Settings>) => void;
  replaceAll: (db: Partial<DB>) => void;
  reset: () => void;
}

const StoreCtx = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(emptyDB);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setDb(load());
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) persist(db);
  }, [db, ready]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", db.settings.theme === "dark");
  }, [db.settings.theme]);

  const add = useCallback(<K extends Coll>(coll: K, item: Omit<DB[K][number], "id">) => {
    const created = { ...(item as object), id: newId() } as DB[K][number];
    setDb((prev) => ({ ...prev, [coll]: [...(prev[coll] as unknown[]), created] }) as DB);
    return created;
  }, []);

  const update = useCallback(
    <K extends Coll>(coll: K, id: string, patch: Partial<DB[K][number]>) => {
      setDb(
        (prev) =>
          ({
            ...prev,
            [coll]: (prev[coll] as { id: string }[]).map((it) =>
              it.id === id ? { ...it, ...patch } : it,
            ),
          }) as DB,
      );
    },
    [],
  );

  const remove = useCallback((coll: Coll, id: string) => {
    setDb(
      (prev) =>
        ({
          ...prev,
          [coll]: (prev[coll] as { id: string }[]).filter((it) => it.id !== id),
        }) as DB,
    );
  }, []);

  const setSettings = useCallback((patch: Partial<Settings>) => {
    setDb((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }));
  }, []);

  const replaceAll = useCallback((incoming: Partial<DB>) => {
    setDb((prev) => ({
      ...emptyDB,
      ...incoming,
      settings: { ...prev.settings, ...(incoming.settings ?? {}) },
    }));
  }, []);

  const reset = useCallback(() => {
    setDb({ ...emptyDB, settings: { ...emptyDB.settings } });
  }, []);

  const activePropertyId = db.settings.activePropertyId ?? db.properties[0]?.id;

  const value = useMemo<StoreValue>(
    () => ({ db, ready, activePropertyId, add, update, remove, setSettings, replaceAll, reset }),
    [db, ready, activePropertyId, add, update, remove, setSettings, replaceAll, reset],
  );

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore harus dipakai di dalam StoreProvider");
  return ctx;
}

/** Data milik properti aktif saja. */
export function useActiveData() {
  const { db, activePropertyId } = useStore();
  return useMemo(() => {
    const p = (x: { propertyId: string }) => x.propertyId === activePropertyId;
    return {
      property: db.properties.find((x) => x.id === activePropertyId),
      rooms: db.rooms.filter(p),
      tenants: db.tenants.filter(p),
      payments: db.payments.filter(p),
      expenses: db.expenses.filter(p),
      assets: db.assets.filter(p),
      maintenance: db.maintenance.filter(p),
    };
  }, [db, activePropertyId]);
}
