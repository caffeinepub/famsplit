export type MemberRole = "admin" | "member";

export interface Member {
  id: string;
  name: string;
  phone: string;
  role: MemberRole;
  color: string;
}

export type Category =
  | "groceries"
  | "rent"
  | "utilities"
  | "medical"
  | "travel"
  | "education"
  | "entertainment"
  | "other";

export type SplitType = "equal" | "percentage" | "custom";

export interface ExpenseSplit {
  memberId: string;
  amount: number;
  percentage?: number;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: Category;
  paidBy: string;
  date: string;
  notes: string;
  splitType: SplitType;
  splits: ExpenseSplit[];
}

export interface Settlement {
  id: string;
  fromMember: string;
  toMember: string;
  amount: number;
  method: "upi" | "manual";
  upiId: string;
  note: string;
  date: string;
  settled: boolean;
}

export interface Budget {
  id: string;
  category: Category;
  amount: number;
  month: number;
  year: number;
}

export interface WalletContribution {
  id: string;
  memberId: string;
  amount: number;
  note: string;
  date: string;
}

export interface WalletExpense {
  id: string;
  title: string;
  amount: number;
  category: Category;
  note: string;
  date: string;
}

export const CATEGORIES: {
  value: Category;
  label: string;
  color: string;
  bgClass: string;
}[] = [
  {
    value: "groceries",
    label: "Groceries",
    color: "oklch(0.55 0.18 145)",
    bgClass: "category-groceries",
  },
  {
    value: "rent",
    label: "Rent",
    color: "oklch(0.55 0.18 260)",
    bgClass: "category-rent",
  },
  {
    value: "utilities",
    label: "Utilities",
    color: "oklch(0.72 0.18 80)",
    bgClass: "category-utilities",
  },
  {
    value: "medical",
    label: "Medical",
    color: "oklch(0.57 0.22 27)",
    bgClass: "category-medical",
  },
  {
    value: "travel",
    label: "Travel",
    color: "oklch(0.60 0.20 300)",
    bgClass: "category-travel",
  },
  {
    value: "education",
    label: "Education",
    color: "oklch(0.60 0.18 220)",
    bgClass: "category-education",
  },
  {
    value: "entertainment",
    label: "Entertainment",
    color: "oklch(0.65 0.20 340)",
    bgClass: "category-entertainment",
  },
  {
    value: "other",
    label: "Other",
    color: "oklch(0.55 0.01 250)",
    bgClass: "category-other",
  },
];

export const MEMBER_COLORS = [
  "oklch(0.62 0.19 27)",
  "oklch(0.55 0.18 260)",
  "oklch(0.55 0.18 145)",
  "oklch(0.60 0.20 300)",
  "oklch(0.72 0.18 80)",
  "oklch(0.60 0.18 220)",
  "oklch(0.65 0.20 340)",
  "oklch(0.57 0.22 27)",
];
