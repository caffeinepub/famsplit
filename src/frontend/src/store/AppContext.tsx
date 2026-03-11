import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type {
  Budget,
  Expense,
  Member,
  Settlement,
  WalletContribution,
  WalletExpense,
} from "../types";
import { MEMBER_COLORS } from "../types";

interface AppState {
  members: Member[];
  expenses: Expense[];
  settlements: Settlement[];
  budgets: Budget[];
  walletContributions: WalletContribution[];
  walletExpenses: WalletExpense[];
}

interface AppContextValue extends AppState {
  addMember: (m: Omit<Member, "id" | "color">) => void;
  removeMember: (id: string) => void;
  addExpense: (e: Omit<Expense, "id">) => void;
  removeExpense: (id: string) => void;
  addSettlement: (s: Omit<Settlement, "id">) => void;
  markSettled: (id: string) => void;
  setBudget: (b: Omit<Budget, "id">) => void;
  removeBudget: (id: string) => void;
  addWalletContribution: (c: Omit<WalletContribution, "id">) => void;
  addWalletExpense: (e: Omit<WalletExpense, "id">) => void;
}

const STORAGE_KEY = "famsplit_data";

const DEFAULT_MEMBERS: Member[] = [
  {
    id: "m1",
    name: "Raj Sharma",
    phone: "9876543210",
    role: "admin",
    color: MEMBER_COLORS[0],
  },
  {
    id: "m2",
    name: "Priya Sharma",
    phone: "9876543211",
    role: "member",
    color: MEMBER_COLORS[1],
  },
  {
    id: "m3",
    name: "Arjun Sharma",
    phone: "9876543212",
    role: "member",
    color: MEMBER_COLORS[2],
  },
];

const now = new Date();
const m = now.getMonth() + 1;
const y = now.getFullYear();
const pad = (n: number) => String(n).padStart(2, "0");

const DEFAULT_EXPENSES: Expense[] = [
  {
    id: "e1",
    title: "Monthly Groceries",
    amount: 4200,
    category: "groceries",
    paidBy: "m1",
    date: `${y}-${pad(m)}-05`,
    notes: "Big Bazaar shopping",
    splitType: "equal",
    splits: [
      { memberId: "m1", amount: 1400 },
      { memberId: "m2", amount: 1400 },
      { memberId: "m3", amount: 1400 },
    ],
  },
  {
    id: "e2",
    title: "House Rent",
    amount: 18000,
    category: "rent",
    paidBy: "m1",
    date: `${y}-${pad(m)}-01`,
    notes: "Monthly rent",
    splitType: "percentage",
    splits: [
      { memberId: "m1", amount: 9000, percentage: 50 },
      { memberId: "m2", amount: 7200, percentage: 40 },
      { memberId: "m3", amount: 1800, percentage: 10 },
    ],
  },
  {
    id: "e3",
    title: "Electricity Bill",
    amount: 1850,
    category: "utilities",
    paidBy: "m2",
    date: `${y}-${pad(m)}-08`,
    notes: "",
    splitType: "equal",
    splits: [
      { memberId: "m1", amount: 617 },
      { memberId: "m2", amount: 617 },
      { memberId: "m3", amount: 616 },
    ],
  },
  {
    id: "e4",
    title: "Doctor Visit",
    amount: 750,
    category: "medical",
    paidBy: "m2",
    date: `${y}-${pad(m)}-10`,
    notes: "Priya's checkup",
    splitType: "custom",
    splits: [
      { memberId: "m1", amount: 0 },
      { memberId: "m2", amount: 750 },
      { memberId: "m3", amount: 0 },
    ],
  },
  {
    id: "e5",
    title: "Weekend Trip to Lonavala",
    amount: 6500,
    category: "travel",
    paidBy: "m1",
    date: `${y}-${pad(m)}-12`,
    notes: "Hotel + food",
    splitType: "equal",
    splits: [
      { memberId: "m1", amount: 2167 },
      { memberId: "m2", amount: 2167 },
      { memberId: "m3", amount: 2166 },
    ],
  },
];

const DEFAULT_BUDGETS: Budget[] = [
  { id: "b1", category: "groceries", amount: 6000, month: m, year: y },
  { id: "b2", category: "rent", amount: 18000, month: m, year: y },
  { id: "b3", category: "utilities", amount: 3000, month: m, year: y },
  { id: "b4", category: "medical", amount: 2000, month: m, year: y },
  { id: "b5", category: "travel", amount: 5000, month: m, year: y },
];

const DEFAULT_WALLET_CONTRIBUTIONS: WalletContribution[] = [
  {
    id: "wc1",
    memberId: "m1",
    amount: 5000,
    note: "Monthly household fund",
    date: `${y}-${pad(m)}-01`,
  },
  {
    id: "wc2",
    memberId: "m2",
    amount: 3000,
    note: "Contribution",
    date: `${y}-${pad(m)}-02`,
  },
];

const DEFAULT_WALLET_EXPENSES: WalletExpense[] = [
  {
    id: "we1",
    title: "Maid Salary",
    amount: 2500,
    category: "other",
    note: "Monthly",
    date: `${y}-${pad(m)}-05`,
  },
  {
    id: "we2",
    title: "Newspaper Subscription",
    amount: 300,
    category: "other",
    note: "",
    date: `${y}-${pad(m)}-06`,
  },
];

const DEFAULT_STATE: AppState = {
  members: DEFAULT_MEMBERS,
  expenses: DEFAULT_EXPENSES,
  settlements: [],
  budgets: DEFAULT_BUDGETS,
  walletContributions: DEFAULT_WALLET_CONTRIBUTIONS,
  walletExpenses: DEFAULT_WALLET_EXPENSES,
};

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AppState;
  } catch {}
  return DEFAULT_STATE;
}

function saveState(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const update = useCallback((updater: (prev: AppState) => AppState) => {
    setState((prev) => {
      const next = updater(prev);
      saveState(next);
      return next;
    });
  }, []);

  const addMember = useCallback(
    (m: Omit<Member, "id" | "color">) => {
      update((s) => ({
        ...s,
        members: [
          ...s.members,
          {
            ...m,
            id: uid(),
            color: MEMBER_COLORS[s.members.length % MEMBER_COLORS.length],
          },
        ],
      }));
    },
    [update],
  );

  const removeMember = useCallback(
    (id: string) => {
      update((s) => ({ ...s, members: s.members.filter((m) => m.id !== id) }));
    },
    [update],
  );

  const addExpense = useCallback(
    (e: Omit<Expense, "id">) => {
      update((s) => ({ ...s, expenses: [{ ...e, id: uid() }, ...s.expenses] }));
    },
    [update],
  );

  const removeExpense = useCallback(
    (id: string) => {
      update((s) => ({
        ...s,
        expenses: s.expenses.filter((e) => e.id !== id),
      }));
    },
    [update],
  );

  const addSettlement = useCallback(
    (s: Omit<Settlement, "id">) => {
      update((prev) => ({
        ...prev,
        settlements: [{ ...s, id: uid() }, ...prev.settlements],
      }));
    },
    [update],
  );

  const markSettled = useCallback(
    (id: string) => {
      update((s) => ({
        ...s,
        settlements: s.settlements.map((st) =>
          st.id === id ? { ...st, settled: true } : st,
        ),
      }));
    },
    [update],
  );

  const setBudget = useCallback(
    (b: Omit<Budget, "id">) => {
      update((s) => {
        const existing = s.budgets.findIndex(
          (x) =>
            x.category === b.category &&
            x.month === b.month &&
            x.year === b.year,
        );
        if (existing >= 0) {
          const updated = [...s.budgets];
          updated[existing] = { ...b, id: updated[existing].id };
          return { ...s, budgets: updated };
        }
        return { ...s, budgets: [...s.budgets, { ...b, id: uid() }] };
      });
    },
    [update],
  );

  const removeBudget = useCallback(
    (id: string) => {
      update((s) => ({ ...s, budgets: s.budgets.filter((b) => b.id !== id) }));
    },
    [update],
  );

  const addWalletContribution = useCallback(
    (c: Omit<WalletContribution, "id">) => {
      update((s) => ({
        ...s,
        walletContributions: [{ ...c, id: uid() }, ...s.walletContributions],
      }));
    },
    [update],
  );

  const addWalletExpense = useCallback(
    (e: Omit<WalletExpense, "id">) => {
      update((s) => ({
        ...s,
        walletExpenses: [{ ...e, id: uid() }, ...s.walletExpenses],
      }));
    },
    [update],
  );

  return (
    <AppContext.Provider
      value={{
        ...state,
        addMember,
        removeMember,
        addExpense,
        removeExpense,
        addSettlement,
        markSettled,
        setBudget,
        removeBudget,
        addWalletContribution,
        addWalletExpense,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
