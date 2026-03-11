import { cn } from "@/lib/utils";
import {
  BarChart3,
  HandCoins,
  LayoutDashboard,
  PiggyBank,
  Receipt,
  Users,
  Wallet,
} from "lucide-react";

export type TabId =
  | "dashboard"
  | "expenses"
  | "members"
  | "budget"
  | "analytics"
  | "wallet"
  | "settle";

const TABS: {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "dashboard", label: "Home", icon: LayoutDashboard },
  { id: "expenses", label: "Expenses", icon: Receipt },
  { id: "members", label: "Members", icon: Users },
  { id: "budget", label: "Budget", icon: PiggyBank },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "wallet", label: "Wallet", icon: Wallet },
  { id: "settle", label: "Settle", icon: HandCoins },
];

const OCID_MAP: Record<TabId, string> = {
  dashboard: "nav.dashboard.tab",
  expenses: "nav.expenses.tab",
  members: "nav.members.tab",
  budget: "nav.budget.tab",
  analytics: "nav.analytics.tab",
  wallet: "nav.wallet.tab",
  settle: "nav.settle.tab",
};

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-card border-t border-border z-50">
      <div className="flex items-stretch h-14 overflow-x-auto scrollbar-none">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              type="button"
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              data-ocid={OCID_MAP[tab.id]}
              className={cn(
                "flex-shrink-0 flex flex-col items-center justify-center gap-0.5 px-3 transition-colors relative min-w-[60px]",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 transition-transform",
                  isActive && "scale-110",
                )}
              />
              <span
                className={cn(
                  "text-[9px] font-medium leading-none whitespace-nowrap",
                  isActive && "font-semibold",
                )}
              >
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-5 h-0.5 rounded-t-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
