import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  CalendarDays,
  Plus,
  Receipt,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { AddExpenseSheet } from "../components/AddExpenseSheet";
import type { TabId } from "../components/BottomNav";
import { CategoryBadge } from "../components/CategoryBadge";
import { MemberAvatar } from "../components/MemberAvatar";
import { useApp } from "../store/AppContext";
import type { Expense, Member } from "../types";

function fmt(n: number) {
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function computeBalances(expenses: Expense[], members: Member[]) {
  const paid: Record<string, number> = {};
  const owed: Record<string, number> = {};
  for (const m of members) {
    paid[m.id] = 0;
    owed[m.id] = 0;
  }
  for (const e of expenses) {
    paid[e.paidBy] = (paid[e.paidBy] ?? 0) + e.amount;
    for (const s of e.splits) {
      owed[s.memberId] = (owed[s.memberId] ?? 0) + s.amount;
    }
  }
  const net: Record<string, number> = {};
  for (const m of members) {
    net[m.id] = (paid[m.id] ?? 0) - (owed[m.id] ?? 0);
  }
  return net;
}

export function Dashboard({
  onTabChange,
}: { onTabChange?: (tab: TabId) => void }) {
  const { members, expenses, walletContributions, walletExpenses } = useApp();
  const [addOpen, setAddOpen] = useState(false);
  const [monthSheetOpen, setMonthSheetOpen] = useState(false);
  const [walletSheetOpen, setWalletSheetOpen] = useState(false);
  const [membersSheetOpen, setMembersSheetOpen] = useState(false);
  const [maxOwedSheetOpen, setMaxOwedSheetOpen] = useState(false);

  const now = new Date();
  const thisMonth = expenses.filter((e) => {
    const d = new Date(e.date);
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  });
  const totalSpent = thisMonth.reduce((s, e) => s + e.amount, 0);
  const totalWalletIn = walletContributions.reduce((s, c) => s + c.amount, 0);
  const totalWalletOut = walletExpenses.reduce((s, e) => s + e.amount, 0);
  const walletBalance = totalWalletIn - totalWalletOut;

  const net = computeBalances(expenses, members);
  const maxOwed = Math.max(0, ...Object.values(net).map((v) => -v));
  const recentExpenses = expenses.slice(0, 5);
  const monthName = now.toLocaleString("default", { month: "long" });

  const sortedMonthExpenses = [...thisMonth].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const categoryTotals = thisMonth.reduce(
    (acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + e.amount;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Wallet transactions combined & sorted
  const walletTransactions = [
    ...walletContributions.map((c) => ({
      id: c.id,
      type: "in" as const,
      label: members.find((m) => m.id === c.memberId)?.name ?? "Member",
      note: c.note,
      amount: c.amount,
      date: c.date,
    })),
    ...walletExpenses.map((e) => ({
      id: e.id,
      type: "out" as const,
      label: e.title,
      note: e.note,
      amount: e.amount,
      date: e.date,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  // Balance breakdowns
  const membersOwed = members
    .filter((m) => (net[m.id] ?? 0) < 0)
    .sort((a, b) => (net[a.id] ?? 0) - (net[b.id] ?? 0));
  const membersToReceive = members
    .filter((m) => (net[m.id] ?? 0) > 0)
    .sort((a, b) => (net[b.id] ?? 0) - (net[a.id] ?? 0));

  // Per-member total paid
  const totalPaid: Record<string, number> = {};
  for (const m of members) totalPaid[m.id] = 0;
  for (const e of expenses)
    totalPaid[e.paidBy] = (totalPaid[e.paidBy] ?? 0) + e.amount;

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.07 } },
  };
  const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="min-h-dvh bg-background">
      <div className="bg-primary text-primary-foreground px-4 pt-12 pb-16">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-primary-foreground/70 text-sm">Welcome back!</p>
            <h1 className="font-display text-2xl font-bold">Spendly</h1>
            <p className="text-primary-foreground/80 text-xs font-medium">
              Manage Money Smartly
            </p>
          </div>
          <div className="flex -space-x-2">
            {members.slice(0, 4).map((m) => (
              <MemberAvatar
                key={m.id}
                member={m}
                size="sm"
                className="ring-2 ring-primary"
              />
            ))}
            {members.length > 4 && (
              <div className="w-7 h-7 rounded-full bg-primary-foreground/20 flex items-center justify-center text-[10px] font-bold ring-2 ring-primary">
                +{members.length - 4}
              </div>
            )}
          </div>
        </div>
        <p className="text-primary-foreground/60 text-xs mt-1">
          {monthName} {now.getFullYear()} • {members.length} members
        </p>
      </div>

      <div className="px-4 -mt-10 pb-6 space-y-4">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 gap-3"
        >
          {/* Month Spent card */}
          <motion.div variants={item}>
            <Card
              className="shadow-card border-0 cursor-pointer hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              onClick={() => setMonthSheetOpen(true)}
              data-ocid="dashboard.month_spent.card"
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-destructive" />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Month Spent
                  </span>
                </div>
                <p className="font-display text-xl font-bold">
                  ₹{fmt(totalSpent)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {thisMonth.length} expenses
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Wallet card — clickable */}
          <motion.div variants={item}>
            <Card
              className="shadow-card border-0 cursor-pointer hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              onClick={() => setWalletSheetOpen(true)}
              data-ocid="dashboard.wallet.card"
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                    <Wallet className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-xs text-muted-foreground">Wallet</span>
                </div>
                <p className="font-display text-xl font-bold">
                  ₹{fmt(walletBalance)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Shared balance
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Members card — clickable */}
          <motion.div variants={item}>
            <Card
              className="shadow-card border-0 cursor-pointer hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              onClick={() => setMembersSheetOpen(true)}
              data-ocid="dashboard.members.card"
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground">Members</span>
                </div>
                <p className="font-display text-xl font-bold">
                  {members.length}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Family group
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Max Owed card — clickable */}
          <motion.div variants={item}>
            <Card
              className="shadow-card border-0 cursor-pointer hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              onClick={() => setMaxOwedSheetOpen(true)}
              data-ocid="dashboard.max_owed.card"
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                    <TrendingDown className="w-4 h-4 text-amber-600" />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Max Owed
                  </span>
                </div>
                <p className="font-display text-xl font-bold">
                  ₹{fmt(maxOwed)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Settle up
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-display font-semibold text-base">
              Member Balances
            </h2>
            <button
              type="button"
              onClick={() => onTabChange?.("settle")}
              className="text-xs text-primary flex items-center gap-0.5"
            >
              Settle up <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <Card className="shadow-card border-0">
            <CardContent className="p-3 divide-y divide-border">
              {members.map((m) => {
                const balance = net[m.id] ?? 0;
                return (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                  >
                    <MemberAvatar member={m} size="sm" />
                    <span className="flex-1 text-sm font-medium truncate">
                      {m.name}
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        balance >= 0 ? "text-green-600" : "text-destructive"
                      }`}
                    >
                      {balance >= 0 ? "+" : ""}₹{fmt(Math.abs(balance))}
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-display font-semibold text-base">
              Recent Expenses
            </h2>
            <button
              type="button"
              onClick={() => onTabChange?.("expenses")}
              className="text-xs text-primary flex items-center gap-0.5"
            >
              All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {recentExpenses.length === 0 ? (
            <Card className="shadow-card border-0">
              <CardContent
                className="p-8 text-center"
                data-ocid="dashboard.empty_state"
              >
                <p className="text-muted-foreground text-sm">
                  No expenses yet. Add your first expense!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {recentExpenses.map((e, idx) => {
                const payer = members.find((m) => m.id === e.paidBy);
                return (
                  <Card
                    key={e.id}
                    className="shadow-card border-0 overflow-hidden"
                    data-ocid={`expense.item.${idx + 1}`}
                  >
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {e.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <CategoryBadge category={e.category} />
                          <span className="text-xs text-muted-foreground">
                            {payer?.name}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm">₹{fmt(e.amount)}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(e.date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </motion.div>

        <Button
          onClick={() => setAddOpen(true)}
          className="fixed bottom-20 right-4 rounded-full shadow-fab w-12 h-12 p-0 z-40"
          data-ocid="dashboard.primary_button"
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      <AddExpenseSheet open={addOpen} onClose={() => setAddOpen(false)} />

      {/* Month Spent Sheet */}
      <Sheet open={monthSheetOpen} onOpenChange={setMonthSheetOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl px-0 pb-0 max-h-[85dvh] flex flex-col"
          data-ocid="dashboard.month_spent.panel"
        >
          <SheetHeader className="px-4 pt-2 pb-3 border-b">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                <CalendarDays className="w-4 h-4 text-destructive" />
              </div>
              <div>
                <SheetTitle className="text-base font-display">
                  Month Spent — {monthName}
                </SheetTitle>
                <p className="text-xs text-muted-foreground">
                  {thisMonth.length} expense{thisMonth.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="ml-auto text-right">
                <p className="font-display text-xl font-bold text-destructive">
                  ₹{fmt(totalSpent)}
                </p>
                <p className="text-[10px] text-muted-foreground">total</p>
              </div>
            </div>
            {Object.keys(categoryTotals).length > 0 && (
              <div className="flex gap-1.5 flex-wrap pt-2">
                {Object.entries(categoryTotals)
                  .sort(([, a], [, b]) => b - a)
                  .map(([cat, amt]) => (
                    <Badge
                      key={cat}
                      variant="secondary"
                      className="text-[10px] px-2 py-0.5 capitalize"
                    >
                      {cat} · ₹{fmt(amt)}
                    </Badge>
                  ))}
              </div>
            )}
          </SheetHeader>
          <ScrollArea className="flex-1 overflow-y-auto">
            {sortedMonthExpenses.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-16 text-center px-4"
                data-ocid="dashboard.month_spent.empty_state"
              >
                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
                  <Receipt className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="font-medium text-sm">No expenses this month</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Add an expense to start tracking your spending.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border px-4">
                {sortedMonthExpenses.map((e, idx) => {
                  const payer = members.find((m) => m.id === e.paidBy);
                  return (
                    <motion.div
                      key={e.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="flex items-center gap-3 py-3"
                      data-ocid={`dashboard.month_spent.item.${idx + 1}`}
                    >
                      <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                        <Receipt className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {e.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <CategoryBadge category={e.category} />
                          <span className="text-[11px] text-muted-foreground">
                            by {payer?.name ?? "Unknown"}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-sm">₹{fmt(e.amount)}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(e.date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
            <div className="h-6" />
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Wallet Sheet */}
      <Sheet open={walletSheetOpen} onOpenChange={setWalletSheetOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl px-0 pb-0 max-h-[85dvh] flex flex-col"
          data-ocid="dashboard.wallet.panel"
        >
          <SheetHeader className="px-4 pt-2 pb-3 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <SheetTitle className="text-base font-display">
                  Family Wallet
                </SheetTitle>
                <p className="text-xs text-muted-foreground">
                  Shared household fund
                </p>
              </div>
              <div className="text-right">
                <p className="font-display text-2xl font-bold text-green-600">
                  ₹{fmt(walletBalance)}
                </p>
                <p className="text-[10px] text-muted-foreground">balance</p>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <div className="flex-1 bg-green-50 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <ArrowDown className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-xs text-muted-foreground">
                    Total In
                  </span>
                </div>
                <p className="font-bold text-green-600">
                  ₹{fmt(totalWalletIn)}
                </p>
              </div>
              <div className="flex-1 bg-red-50 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <ArrowUp className="w-3.5 h-3.5 text-destructive" />
                  <span className="text-xs text-muted-foreground">
                    Total Out
                  </span>
                </div>
                <p className="font-bold text-destructive">
                  ₹{fmt(totalWalletOut)}
                </p>
              </div>
            </div>
          </SheetHeader>
          <ScrollArea className="flex-1 overflow-y-auto">
            <div className="px-4 pt-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Recent Transactions
              </p>
              {walletTransactions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No transactions yet.
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {walletTransactions.map((t, idx) => (
                    <div
                      key={t.id}
                      className="flex items-center gap-3 py-3"
                      data-ocid={`dashboard.wallet.item.${idx + 1}`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${t.type === "in" ? "bg-green-100" : "bg-red-100"}`}
                      >
                        {t.type === "in" ? (
                          <ArrowDown className="w-4 h-4 text-green-600" />
                        ) : (
                          <ArrowUp className="w-4 h-4 text-destructive" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {t.label}
                        </p>
                        {t.note && (
                          <p className="text-xs text-muted-foreground truncate">
                            {t.note}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p
                          className={`font-bold text-sm ${t.type === "in" ? "text-green-600" : "text-destructive"}`}
                        >
                          {t.type === "in" ? "+" : "-"}₹{fmt(t.amount)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(t.date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="h-6" />
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Members Sheet */}
      <Sheet open={membersSheetOpen} onOpenChange={setMembersSheetOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl px-0 pb-0 max-h-[85dvh] flex flex-col"
          data-ocid="dashboard.members.panel"
        >
          <SheetHeader className="px-4 pt-2 pb-3 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-base font-display">
                  Family Members
                </SheetTitle>
                <p className="text-xs text-muted-foreground">
                  {members.length} member{members.length !== 1 ? "s" : ""} in
                  group
                </p>
              </div>
            </div>
          </SheetHeader>
          <ScrollArea className="flex-1 overflow-y-auto">
            <div className="divide-y divide-border px-4">
              {members.map((m, idx) => {
                const balance = net[m.id] ?? 0;
                const paid = totalPaid[m.id] ?? 0;
                return (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 py-4"
                    data-ocid={`dashboard.members.item.${idx + 1}`}
                  >
                    <MemberAvatar member={m} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{m.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {m.role} • Total paid ₹{fmt(paid)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-bold text-sm ${balance >= 0 ? "text-green-600" : "text-destructive"}`}
                      >
                        {balance >= 0 ? "+" : ""}₹{fmt(Math.abs(balance))}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {balance >= 0 ? "to receive" : "owes"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="h-6" />
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Max Owed Sheet */}
      <Sheet open={maxOwedSheetOpen} onOpenChange={setMaxOwedSheetOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl px-0 pb-0 max-h-[85dvh] flex flex-col"
          data-ocid="dashboard.max_owed.panel"
        >
          <SheetHeader className="px-4 pt-2 pb-3 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <SheetTitle className="text-base font-display">
                  Outstanding Balances
                </SheetTitle>
                <p className="text-xs text-muted-foreground">
                  Who owes & who gets paid back
                </p>
              </div>
            </div>
          </SheetHeader>
          <ScrollArea className="flex-1 overflow-y-auto">
            <div className="px-4 pt-3 space-y-4">
              {membersToReceive.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2">
                    To Receive
                  </p>
                  <div className="divide-y divide-border">
                    {membersToReceive.map((m, idx) => (
                      <div
                        key={m.id}
                        className="flex items-center gap-3 py-3"
                        data-ocid={`dashboard.max_owed.item.${idx + 1}`}
                      >
                        <MemberAvatar member={m} size="sm" />
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{m.name}</p>
                          <p className="text-xs text-muted-foreground">
                            is owed money
                          </p>
                        </div>
                        <p className="font-bold text-green-600">
                          +₹{fmt(net[m.id] ?? 0)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {membersOwed.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-destructive uppercase tracking-wide mb-2">
                    Owes Money
                  </p>
                  <div className="divide-y divide-border">
                    {membersOwed.map((m, idx) => (
                      <div
                        key={m.id}
                        className="flex items-center gap-3 py-3"
                        data-ocid={`dashboard.max_owed.owed.item.${idx + 1}`}
                      >
                        <MemberAvatar member={m} size="sm" />
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{m.name}</p>
                          <p className="text-xs text-muted-foreground">
                            needs to pay
                          </p>
                        </div>
                        <p className="font-bold text-destructive">
                          -₹{fmt(Math.abs(net[m.id] ?? 0))}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {membersOwed.length === 0 && membersToReceive.length === 0 && (
                <div
                  className="text-center py-12"
                  data-ocid="dashboard.max_owed.empty_state"
                >
                  <p className="font-medium text-sm">All settled up! 🎉</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    No outstanding balances.
                  </p>
                </div>
              )}
            </div>
            <div className="px-4 py-4">
              <Button
                className="w-full"
                onClick={() => {
                  setMaxOwedSheetOpen(false);
                  onTabChange?.("settle");
                }}
                data-ocid="dashboard.max_owed.primary_button"
              >
                Go to Settle Up <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Footer */}
      <footer className="px-4 py-6 text-center">
        <p className="text-[11px] text-muted-foreground">
          &copy; {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
