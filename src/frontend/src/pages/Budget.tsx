import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AlertTriangle, CheckCircle, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { CategoryBadge } from "../components/CategoryBadge";
import { useApp } from "../store/AppContext";
import { CATEGORIES, type Category } from "../types";

function fmt(n: number) {
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function Budget() {
  const { budgets, expenses, setBudget, removeBudget } = useApp();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [category, setCategory] = useState<Category>("groceries");
  const [amount, setAmount] = useState("");

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const monthName = now.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const currentBudgets = budgets.filter(
    (b) => b.month === currentMonth && b.year === currentYear,
  );

  const getSpending = (cat: Category) =>
    expenses
      .filter((e) => {
        const d = new Date(e.date);
        return (
          e.category === cat &&
          d.getMonth() + 1 === currentMonth &&
          d.getFullYear() === currentYear
        );
      })
      .reduce((s, e) => s + e.amount, 0);

  const totalBudget = currentBudgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = currentBudgets.reduce(
    (s, b) => s + getSpending(b.category),
    0,
  );

  const handleSave = (ev: React.FormEvent) => {
    ev.preventDefault();
    const amt = Number.parseFloat(amount);
    if (!amt || amt <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setBudget({
      category,
      amount: amt,
      month: currentMonth,
      year: currentYear,
    });
    toast.success(`Budget set for ${category}`);
    setAmount("");
    setCategory("groceries");
    setSheetOpen(false);
  };

  return (
    <div className="min-h-dvh bg-background">
      <div className="bg-primary text-primary-foreground px-4 pt-12 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-bold">Monthly Budget</h1>
            <p className="text-primary-foreground/70 text-sm mt-0.5">
              {monthName}
            </p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setSheetOpen(true)}
            className="rounded-full"
            data-ocid="budget.primary_button"
          >
            <Plus className="w-4 h-4 mr-1" /> Set Budget
          </Button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4 pb-20">
        {/* Overview */}
        <Card className="shadow-card border-0">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">
              Overall Budget Usage
            </p>
            <div className="flex items-end justify-between mb-2">
              <span className="font-display text-2xl font-bold">
                ₹{fmt(totalSpent)}
              </span>
              <span className="text-sm text-muted-foreground">
                of ₹{fmt(totalBudget)}
              </span>
            </div>
            <Progress
              value={totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0}
              className="h-2"
              data-ocid="budget.loading_state"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {totalBudget > 0
                ? `${Math.round((totalSpent / totalBudget) * 100)}% used`
                : "No budget set"}
            </p>
          </CardContent>
        </Card>

        {/* Category budgets */}
        {currentBudgets.length === 0 ? (
          <div className="py-12 text-center" data-ocid="budget.empty_state">
            <p className="text-muted-foreground text-sm">
              No budgets set for this month.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Tap "Set Budget" to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {currentBudgets.map((b, idx) => {
              const spent = getSpending(b.category);
              const pct = Math.min((spent / b.amount) * 100, 100);
              const isOver = spent > b.amount;
              const isWarning = !isOver && pct >= 80;
              return (
                <Card
                  key={b.id}
                  className="shadow-card border-0"
                  data-ocid={`budget.item.${idx + 1}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <CategoryBadge category={b.category} />
                        {isOver ? (
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                        ) : isWarning ? (
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          removeBudget(b.id);
                          toast.success("Budget removed");
                        }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        data-ocid={`budget.delete_button.${idx + 1}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <Progress
                      value={pct}
                      className={`h-2 mb-2 ${
                        isOver
                          ? "[&>div]:bg-amber-500"
                          : isWarning
                            ? "[&>div]:bg-amber-500"
                            : ""
                      }`}
                    />
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-sm font-semibold ${isOver ? "text-amber-600" : "text-foreground"}`}
                      >
                        ₹{fmt(spent)} spent
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Budget: ₹{fmt(b.amount)}
                      </span>
                    </div>
                    {isOver && (
                      <p className="text-xs text-amber-600 mt-1 font-medium">
                        Over by ₹{fmt(spent - b.amount)}!
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Untracked categories */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Spending Without Budget
          </p>
          {CATEGORIES.filter(
            (c) => !currentBudgets.some((b) => b.category === c.value),
          ).map((c) => {
            const spent = getSpending(c.value);
            if (spent === 0) return null;
            return (
              <Card
                key={c.value}
                className="shadow-card border-0 mb-2 opacity-70"
              >
                <CardContent className="p-3 flex items-center justify-between">
                  <CategoryBadge category={c.value} />
                  <span className="text-sm font-bold">₹{fmt(spent)}</span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Set Budget Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl px-4 pb-8"
          data-ocid="budget.sheet"
        >
          <SheetHeader className="mb-4">
            <SheetTitle className="font-display text-lg">
              Set Monthly Budget
            </SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <Label>Category</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as Category)}
              >
                <SelectTrigger data-ocid="budget.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="b-amount">Budget Amount (₹)</Label>
              <Input
                id="b-amount"
                type="number"
                min="1"
                step="100"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 5000"
                data-ocid="budget.input"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setSheetOpen(false)}
                data-ocid="budget.cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                data-ocid="budget.submit_button"
              >
                Save Budget
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
