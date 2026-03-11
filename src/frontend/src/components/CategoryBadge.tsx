import { cn } from "@/lib/utils";
import { CATEGORIES, type Category } from "../types";

const STYLE_MAP: Record<Category, string> = {
  groceries: "bg-emerald-100 text-emerald-800",
  rent: "bg-blue-100 text-blue-800",
  utilities: "bg-amber-100 text-amber-800",
  medical: "bg-red-100 text-red-800",
  travel: "bg-purple-100 text-purple-800",
  education: "bg-sky-100 text-sky-800",
  entertainment: "bg-pink-100 text-pink-800",
  other: "bg-gray-100 text-gray-700",
};

export function CategoryBadge({
  category,
  className,
}: { category: Category; className?: string }) {
  const cat = CATEGORIES.find((c) => c.value === category);
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase",
        STYLE_MAP[category],
        className,
      )}
    >
      {cat?.label ?? category}
    </span>
  );
}

export function getCategoryColor(category: Category): string {
  return (
    CATEGORIES.find((c) => c.value === category)?.color ??
    "oklch(0.55 0.01 250)"
  );
}

export function getCategoryBorderColor(category: Category): string {
  const colors: Record<Category, string> = {
    groceries: "#16a34a",
    rent: "#2563eb",
    utilities: "#d97706",
    medical: "#dc2626",
    travel: "#9333ea",
    education: "#0284c7",
    entertainment: "#db2777",
    other: "#6b7280",
  };
  return colors[category];
}
