import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../store/AppContext";
import type { Category, SplitType } from "../types";
import { CATEGORIES } from "../types";
import { MemberAvatar } from "./MemberAvatar";

interface Props {
  open: boolean;
  onClose: () => void;
  prefillAmount?: number;
  prefillImageUrl?: string;
}

export function AddExpenseSheet({
  open,
  onClose,
  prefillAmount,
  prefillImageUrl,
}: Props) {
  const { members, expenses, budgets, addExpense } = useApp();

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Category>("groceries");
  const [paidBy, setPaidBy] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [splitType, setSplitType] = useState<SplitType>("equal");
  const [customSplits, setCustomSplits] = useState<Record<string, number>>({});
  const [percentages, setPercentages] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!open) return;
    if (prefillAmount) setAmount(String(prefillAmount));
    if (members.length > 0) setPaidBy((prev) => prev || members[0].id);
    const even = Math.floor(100 / Math.max(members.length, 1));
    const percs: Record<string, number> = {};
    for (let i = 0; i < members.length; i++) {
      percs[members[i].id] = i === 0 ? 100 - even * (members.length - 1) : even;
    }
    setPercentages(percs);
    const splits: Record<string, number> = {};
    for (const m of members) {
      splits[m.id] = 0;
    }
    setCustomSplits(splits);
  }, [open, members, prefillAmount]);

  const totalAmount = Number.parseFloat(amount) || 0;

  const computedSplits = () => {
    if (splitType === "equal") {
      const perPerson = totalAmount / Math.max(members.length, 1);
      return members.map((m, i) => ({
        memberId: m.id,
        amount:
          i === members.length - 1
            ? totalAmount -
              (Math.floor(perPerson * 100) / 100) * (members.length - 1)
            : Math.floor(perPerson * 100) / 100,
      }));
    }
    if (splitType === "percentage") {
      return members.map((m) => ({
        memberId: m.id,
        amount:
          Math.round(((percentages[m.id] ?? 0) / 100) * totalAmount * 100) /
          100,
        percentage: percentages[m.id] ?? 0,
      }));
    }
    return members.map((m) => ({
      memberId: m.id,
      amount: customSplits[m.id] ?? 0,
    }));
  };

  const totalPercentage = members.reduce(
    (s, m) => s + (percentages[m.id] ?? 0),
    0,
  );
  const totalCustom = members.reduce(
    (s, m) => s + (customSplits[m.id] ?? 0),
    0,
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount || !paidBy) {
      toast.error("Please fill all required fields");
      return;
    }
    if (splitType === "percentage" && totalPercentage !== 100) {
      toast.error("Percentages must add up to 100%");
      return;
    }
    if (splitType === "custom" && Math.abs(totalCustom - totalAmount) > 0.5) {
      toast.error(`Custom splits must add up to ₹${totalAmount.toFixed(2)}`);
      return;
    }

    const splits = computedSplits();
    addExpense({
      title: title.trim(),
      amount: totalAmount,
      category,
      paidBy,
      date,
      notes,
      splitType,
      splits,
    });

    const now = new Date();
    const mon = now.getMonth() + 1;
    const yr = now.getFullYear();
    const budget = budgets.find(
      (b) => b.category === category && b.month === mon && b.year === yr,
    );
    if (budget) {
      const spent = expenses
        .filter((ex) => {
          const d = new Date(ex.date);
          return (
            ex.category === category &&
            d.getMonth() + 1 === mon &&
            d.getFullYear() === yr
          );
        })
        .reduce((s, ex) => s + ex.amount, 0);
      if (spent + totalAmount > budget.amount) {
        toast.warning(
          `⚠️ Budget exceeded for ${category}! ₹${(spent + totalAmount).toLocaleString("en-IN")} / ₹${budget.amount.toLocaleString("en-IN")}`,
        );
      } else if (spent + totalAmount > budget.amount * 0.8) {
        toast.warning(`⚠️ 80% of ${category} budget used!`);
      }
    }

    toast.success("Expense added!");
    setTitle("");
    setAmount("");
    setNotes("");
    setCategory("groceries");
    setSplitType("equal");
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="max-h-[92dvh] overflow-y-auto rounded-t-2xl px-4 pb-8"
        data-ocid="expense.sheet"
      >
        <SheetHeader className="mb-4">
          <SheetTitle className="font-display text-lg">Add Expense</SheetTitle>
        </SheetHeader>

        {prefillImageUrl && (
          <div className="mb-4 rounded-xl overflow-hidden border border-border">
            <img
              src={prefillImageUrl}
              alt="Bill"
              className="w-full max-h-48 object-contain bg-muted"
            />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label htmlFor="exp-title">Title *</Label>
              <Input
                id="exp-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Grocery run, Rent..."
                data-ocid="expense.input"
              />
            </div>
            <div>
              <Label htmlFor="exp-amount">Amount (₹) *</Label>
              <Input
                id="exp-amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                data-ocid="expense.input"
              />
            </div>
            <div>
              <Label htmlFor="exp-date">Date</Label>
              <Input
                id="exp-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as Category)}
              >
                <SelectTrigger data-ocid="expense.select">
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
              <Label>Paid by</Label>
              <Select value={paidBy} onValueChange={setPaidBy}>
                <SelectTrigger data-ocid="expense.select">
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Split Type</Label>
            <div className="flex gap-2 mt-1">
              {(["equal", "percentage", "custom"] as SplitType[]).map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setSplitType(t)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    splitType === t
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border text-muted-foreground"
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {totalAmount > 0 && (
            <div className="bg-secondary rounded-xl p-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Split Preview
              </p>
              {members.map((m) => {
                const splits = computedSplits();
                const split = splits.find((s) => s.memberId === m.id);
                return (
                  <div key={m.id} className="flex items-center gap-2">
                    <MemberAvatar member={m} size="sm" />
                    <span className="text-sm flex-1 truncate">{m.name}</span>
                    {splitType === "percentage" ? (
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[percentages[m.id] ?? 0]}
                          onValueChange={([v]) =>
                            setPercentages((p) => ({ ...p, [m.id]: v }))
                          }
                          max={100}
                          min={0}
                          step={1}
                          className="w-20"
                        />
                        <span className="text-xs w-8 text-right">
                          {percentages[m.id] ?? 0}%
                        </span>
                      </div>
                    ) : splitType === "custom" ? (
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={customSplits[m.id] ?? ""}
                        onChange={(e) =>
                          setCustomSplits((p) => ({
                            ...p,
                            [m.id]: Number.parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="w-24 h-7 text-xs text-right"
                      />
                    ) : null}
                    <span className="text-sm font-semibold w-20 text-right">
                      ₹
                      {(split?.amount ?? 0).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                );
              })}
              {splitType === "percentage" && (
                <p
                  className={`text-xs text-right font-medium ${totalPercentage === 100 ? "text-green-600" : "text-amber-600"}`}
                >
                  Total: {totalPercentage}%
                </p>
              )}
              {splitType === "custom" && (
                <p
                  className={`text-xs text-right font-medium ${Math.abs(totalCustom - totalAmount) < 0.5 ? "text-green-600" : "text-amber-600"}`}
                >
                  ₹{totalCustom.toFixed(2)} / ₹{totalAmount.toFixed(2)}
                </p>
              )}
            </div>
          )}

          <div>
            <Label htmlFor="exp-notes">Notes</Label>
            <Textarea
              id="exp-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
              className="resize-none h-16"
              data-ocid="expense.textarea"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              data-ocid="expense.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              data-ocid="expense.submit_button"
            >
              Save Expense
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
