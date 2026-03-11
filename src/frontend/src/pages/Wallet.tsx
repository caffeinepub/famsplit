import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { ArrowDown, ArrowUp, Plus, Wallet as WalletIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { CategoryBadge } from "../components/CategoryBadge";
import { MemberAvatar } from "../components/MemberAvatar";
import { useApp } from "../store/AppContext";
import { CATEGORIES, type Category } from "../types";

function fmt(n: number) {
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

type SheetMode = "contribute" | "expense" | null;

export function Wallet() {
  const {
    members,
    walletContributions,
    walletExpenses,
    addWalletContribution,
    addWalletExpense,
  } = useApp();
  const [sheetMode, setSheetMode] = useState<SheetMode>(null);

  // Form state
  const [memberId, setMemberId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>("other");

  const totalIn = walletContributions.reduce((s, c) => s + c.amount, 0);
  const totalOut = walletExpenses.reduce((s, e) => s + e.amount, 0);
  const balance = totalIn - totalOut;

  // Combine and sort transactions
  const allTx = [
    ...walletContributions.map((c) => ({ ...c, type: "in" as const })),
    ...walletExpenses.map((e) => ({
      ...e,
      type: "out" as const,
      memberId: undefined,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const openSheet = (mode: SheetMode) => {
    setAmount("");
    setNote("");
    setTitle("");
    setCategory("other");
    if (mode === "contribute" && members.length > 0) setMemberId(members[0].id);
    setSheetMode(mode);
  };

  const handleContribute = (ev: React.FormEvent) => {
    ev.preventDefault();
    const amt = Number.parseFloat(amount);
    if (!amt || amt <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!memberId) {
      toast.error("Select a member");
      return;
    }
    addWalletContribution({
      memberId,
      amount: amt,
      note,
      date: new Date().toISOString().slice(0, 10),
    });
    toast.success("Contribution added!");
    setSheetMode(null);
  };

  const handleExpense = (ev: React.FormEvent) => {
    ev.preventDefault();
    const amt = Number.parseFloat(amount);
    if (!title.trim() || !amt || amt <= 0) {
      toast.error("Fill all required fields");
      return;
    }
    if (amt > balance) {
      toast.error("Insufficient wallet balance");
      return;
    }
    addWalletExpense({
      title: title.trim(),
      amount: amt,
      category,
      note,
      date: new Date().toISOString().slice(0, 10),
    });
    toast.success("Wallet expense recorded!");
    setSheetMode(null);
  };

  return (
    <div className="min-h-dvh bg-background">
      <div className="bg-primary text-primary-foreground px-4 pt-12 pb-10">
        <h1 className="font-display text-xl font-bold mb-4">Family Wallet</h1>
        <Card className="bg-primary-foreground/10 border-0 shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
                <WalletIcon className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-primary-foreground/70 text-xs">
                  Current Balance
                </p>
                <p className="font-display text-3xl font-bold">
                  ₹{fmt(balance)}
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <ArrowDown className="w-3.5 h-3.5 text-green-300" />
                <div>
                  <p className="text-[10px] text-primary-foreground/60">
                    Total In
                  </p>
                  <p className="text-sm font-semibold text-primary-foreground">
                    ₹{fmt(totalIn)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <ArrowUp className="w-3.5 h-3.5 text-primary-foreground/70" />
                <div>
                  <p className="text-[10px] text-primary-foreground/60">
                    Total Out
                  </p>
                  <p className="text-sm font-semibold text-primary-foreground">
                    ₹{fmt(totalOut)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="px-4 py-4 space-y-4 pb-20">
        {/* Action buttons */}
        <div className="flex gap-3">
          <Button
            className="flex-1"
            onClick={() => openSheet("contribute")}
            data-ocid="wallet.primary_button"
          >
            <ArrowDown className="w-4 h-4 mr-1.5" /> Add Funds
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => openSheet("expense")}
            data-ocid="wallet.secondary_button"
          >
            <ArrowUp className="w-4 h-4 mr-1.5" /> Log Expense
          </Button>
        </div>

        {/* Member contributions summary */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Contributions
          </p>
          <div className="space-y-1.5">
            {members.map((m) => {
              const contributed = walletContributions
                .filter((c) => c.memberId === m.id)
                .reduce((s, c) => s + c.amount, 0);
              return (
                <Card key={m.id} className="shadow-card border-0">
                  <CardContent className="p-3 flex items-center gap-3">
                    <MemberAvatar member={m} size="sm" />
                    <span className="flex-1 text-sm">{m.name}</span>
                    <span className="font-bold text-sm text-green-600">
                      ₹{fmt(contributed)}
                    </span>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Transaction history */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Transactions
          </p>
          {allTx.length === 0 ? (
            <div className="py-8 text-center" data-ocid="wallet.empty_state">
              <p className="text-muted-foreground text-sm">
                No transactions yet.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {allTx.slice(0, 20).map((tx, idx) => {
                const isIn = tx.type === "in";
                const member = isIn
                  ? members.find((m) => m.id === tx.memberId)
                  : undefined;
                const txWithTitle = tx as typeof tx & {
                  title?: string;
                  category?: Category;
                };
                return (
                  <Card
                    key={tx.id}
                    className="shadow-card border-0"
                    data-ocid={`wallet.item.${idx + 1}`}
                  >
                    <CardContent className="p-3 flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isIn ? "bg-green-100" : "bg-primary/10"
                        }`}
                      >
                        {isIn ? (
                          <ArrowDown className="w-4 h-4 text-green-600" />
                        ) : (
                          <ArrowUp className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {isIn
                            ? `${member?.name ?? "Member"} contribution`
                            : txWithTitle.title}
                        </p>
                        <div className="flex items-center gap-2">
                          {!isIn && txWithTitle.category && (
                            <CategoryBadge category={txWithTitle.category} />
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(tx.date).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        </div>
                        {tx.note && (
                          <p className="text-xs text-muted-foreground truncate">
                            {tx.note}
                          </p>
                        )}
                      </div>
                      <span
                        className={`font-bold text-sm ${isIn ? "text-green-600" : "text-primary"}`}
                      >
                        {isIn ? "+" : "-"}₹{fmt(tx.amount)}
                      </span>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Contribute Sheet */}
      <Sheet
        open={sheetMode === "contribute"}
        onOpenChange={(v) => !v && setSheetMode(null)}
      >
        <SheetContent
          side="bottom"
          className="rounded-t-2xl px-4 pb-8"
          data-ocid="wallet.sheet"
        >
          <SheetHeader className="mb-4">
            <SheetTitle className="font-display">
              Add Funds to Wallet
            </SheetTitle>
          </SheetHeader>
          <form onSubmit={handleContribute} className="space-y-4">
            <div>
              <Label>Member</Label>
              <Select value={memberId} onValueChange={setMemberId}>
                <SelectTrigger data-ocid="wallet.select">
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
            <div>
              <Label htmlFor="w-amount">Amount (₹)</Label>
              <Input
                id="w-amount"
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 2000"
                data-ocid="wallet.input"
              />
            </div>
            <div>
              <Label htmlFor="w-note">Note (optional)</Label>
              <Textarea
                id="w-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="resize-none h-16"
                data-ocid="wallet.textarea"
              />
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setSheetMode(null)}
                data-ocid="wallet.cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                data-ocid="wallet.submit_button"
              >
                Add Funds
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Wallet Expense Sheet */}
      <Sheet
        open={sheetMode === "expense"}
        onOpenChange={(v) => !v && setSheetMode(null)}
      >
        <SheetContent
          side="bottom"
          className="rounded-t-2xl px-4 pb-8"
          data-ocid="wallet.sheet"
        >
          <SheetHeader className="mb-4">
            <SheetTitle className="font-display">Log Wallet Expense</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleExpense} className="space-y-4">
            <div>
              <Label htmlFor="w-title">Title *</Label>
              <Input
                id="w-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Maid salary"
                data-ocid="wallet.input"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="w-exp-amount">Amount (₹)</Label>
                <Input
                  id="w-exp-amount"
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  data-ocid="wallet.input"
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select
                  value={category}
                  onValueChange={(v) => setCategory(v as Category)}
                >
                  <SelectTrigger data-ocid="wallet.select">
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
            </div>
            <div>
              <Label htmlFor="w-exp-note">Note</Label>
              <Textarea
                id="w-exp-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="resize-none h-16"
                data-ocid="wallet.textarea"
              />
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setSheetMode(null)}
                data-ocid="wallet.cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                data-ocid="wallet.submit_button"
              >
                Save
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
