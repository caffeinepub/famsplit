import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Category, SplitType } from "../backend";
import type { Member } from "../backend";
import { useAddExpense } from "../hooks/useQueries";
import { CATEGORY_CONFIG, rupeesToPaise } from "../utils/format";

interface AddExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: Member[];
}

export function AddExpenseModal({
  open,
  onOpenChange,
  members,
}: AddExpenseModalProps) {
  const today = new Date().toISOString().split("T")[0];

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Category>(Category.other);
  const [paidBy, setPaidBy] = useState("");
  const [splitAmong, setSplitAmong] = useState<string[]>([]);
  const [date, setDate] = useState(today);

  const addExpense = useAddExpense();

  const toggleSplit = (name: string) => {
    setSplitAmong((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );
  };

  const selectAll = () => {
    setSplitAmong(members.map((m) => m.name));
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast.error("Please enter a description");
      return;
    }
    if (
      !amount ||
      Number.isNaN(Number.parseFloat(amount)) ||
      Number.parseFloat(amount) <= 0
    ) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!paidBy) {
      toast.error("Please select who paid");
      return;
    }
    if (splitAmong.length === 0) {
      toast.error("Please select at least one member to split among");
      return;
    }

    try {
      // Build equal split details
      const splitCount = splitAmong.length;
      const totalPaise = rupeesToPaise(amount);
      const perPersonPaise = totalPaise / BigInt(splitCount);
      const splitDetails: [string, bigint][] = splitAmong.map((name) => [
        name,
        perPersonPaise,
      ]);
      await addExpense.mutateAsync({
        description: description.trim(),
        amount: totalPaise,
        category,
        paidBy,
        splitType: SplitType.equal,
        splitDetails,
        date,
      });
      toast.success("Expense added!");
      onOpenChange(false);
      setDescription("");
      setAmount("");
      setCategory(Category.other);
      setPaidBy("");
      setSplitAmong([]);
      setDate(today);
    } catch {
      toast.error("Failed to add expense");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[92vw] max-h-[90dvh] overflow-y-auto rounded-2xl"
        data-ocid="expense.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Add Expense
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 pt-1">
          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="exp-desc">Description</Label>
            <Input
              id="exp-desc"
              placeholder="e.g. Grocery shopping"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              data-ocid="expense.description.input"
            />
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="exp-amount">Amount (₹)</Label>
            <Input
              id="exp-amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              data-ocid="expense.amount.input"
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as Category)}
            >
              <SelectTrigger data-ocid="expense.category.select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.values(Category) as Category[]).map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {CATEGORY_CONFIG[cat].emoji} {CATEGORY_CONFIG[cat].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Paid By */}
          <div className="space-y-1.5">
            <Label>Paid By</Label>
            <Select value={paidBy} onValueChange={setPaidBy}>
              <SelectTrigger data-ocid="expense.paidby.select">
                <SelectValue placeholder="Select member" />
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.name} value={m.name}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Split Among */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Split Among</Label>
              <button
                type="button"
                onClick={selectAll}
                className="text-xs text-primary font-medium hover:underline"
              >
                Select All
              </button>
            </div>
            <div className="space-y-2 rounded-xl border border-border p-3 bg-muted/30">
              {members.map((m) => {
                const checkId = `split-${m.name}`;
                return (
                  <div key={m.name} className="flex items-center gap-3">
                    <Checkbox
                      id={checkId}
                      checked={splitAmong.includes(m.name)}
                      onCheckedChange={() => toggleSplit(m.name)}
                    />
                    <Label
                      htmlFor={checkId}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {m.name}
                    </Label>
                  </div>
                );
              })}
              {members.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-1">
                  No members added yet
                </p>
              )}
            </div>
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label htmlFor="exp-date">Date</Label>
            <Input
              id="exp-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              data-ocid="expense.date.input"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              data-ocid="expense.cancel_button"
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={addExpense.isPending}
              data-ocid="expense.submit_button"
            >
              {addExpense.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                "Add Expense"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
