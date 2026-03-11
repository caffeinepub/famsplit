import { Category } from "../backend";

export function formatINR(paise: bigint): string {
  const rupees = Number(paise) / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupees);
}

export function paiseToRupees(paise: bigint): string {
  return (Number(paise) / 100).toFixed(2);
}

export function rupeesToPaise(rupees: string): bigint {
  const val = Number.parseFloat(rupees);
  if (Number.isNaN(val)) return BigInt(0);
  return BigInt(Math.round(val * 100));
}

export const CATEGORY_CONFIG: Record<
  Category,
  { label: string; emoji: string; color: string }
> = {
  [Category.groceries]: {
    label: "Groceries",
    emoji: "🛒",
    color: "bg-green-100 text-green-800",
  },
  [Category.rent]: {
    label: "Rent",
    emoji: "🏠",
    color: "bg-blue-100 text-blue-800",
  },
  [Category.schoolFees]: {
    label: "School Fees",
    emoji: "🎓",
    color: "bg-purple-100 text-purple-800",
  },
  [Category.utilities]: {
    label: "Utilities",
    emoji: "⚡",
    color: "bg-yellow-100 text-yellow-800",
  },
  [Category.travel]: {
    label: "Travel",
    emoji: "✈️",
    color: "bg-sky-100 text-sky-800",
  },
  [Category.entertainment]: {
    label: "Entertainment",
    emoji: "🎉",
    color: "bg-pink-100 text-pink-800",
  },
  [Category.other]: {
    label: "Other",
    emoji: "📦",
    color: "bg-gray-100 text-gray-800",
  },
};

export function getCurrentMonth(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function formatMonth(month: string): string {
  const [y, m] = month.split("-");
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export interface PairwiseSettlement {
  from: string;
  to: string;
  amount: number;
}

export function calculatePairwiseSettlements(
  members: Array<{ name: string; balance: bigint }>,
): PairwiseSettlement[] {
  const pos = members
    .filter((m) => m.balance > 0)
    .map((m) => ({ name: m.name, bal: Number(m.balance) }))
    .sort((a, b) => b.bal - a.bal);

  const neg = members
    .filter((m) => m.balance < 0)
    .map((m) => ({ name: m.name, bal: Number(m.balance) }))
    .sort((a, b) => a.bal - b.bal);

  const result: PairwiseSettlement[] = [];
  let i = 0;
  let j = 0;

  while (i < pos.length && j < neg.length) {
    const amount = Math.min(pos[i].bal, -neg[j].bal);
    if (amount > 0) {
      result.push({ from: neg[j].name, to: pos[i].name, amount });
    }
    pos[i].bal -= amount;
    neg[j].bal += amount;
    if (pos[i].bal < 1) i++;
    if (neg[j].bal > -1) j++;
  }

  return result;
}
