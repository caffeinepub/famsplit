import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, HandCoins, Smartphone } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { MemberAvatar } from "../components/MemberAvatar";
import { useApp } from "../store/AppContext";

function fmt(n: number) {
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

interface Debt {
  from: string;
  to: string;
  amount: number;
}

function simplifyDebts(netBalances: Record<string, number>): Debt[] {
  const debtors = Object.entries(netBalances)
    .filter(([, v]) => v < 0)
    .map(([id, v]) => ({ id, amount: -v }))
    .sort((a, b) => b.amount - a.amount);
  const creditors = Object.entries(netBalances)
    .filter(([, v]) => v > 0)
    .map(([id, v]) => ({ id, amount: v }))
    .sort((a, b) => b.amount - a.amount);

  const debts: Debt[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].amount, creditors[j].amount);
    debts.push({
      from: debtors[i].id,
      to: creditors[j].id,
      amount: Math.round(pay),
    });
    debtors[i].amount -= pay;
    creditors[j].amount -= pay;
    if (debtors[i].amount < 0.5) i++;
    if (creditors[j].amount < 0.5) j++;
  }
  return debts.filter((d) => d.amount > 0);
}

export function Settle() {
  const { members, expenses, settlements, addSettlement } = useApp();
  const [upiDialog, setUpiDialog] = useState<Debt | null>(null);
  const [upiId, setUpiId] = useState("");
  const [upiNote, setUpiNote] = useState("");

  const netBalances: Record<string, number> = {};
  for (const m of members) {
    netBalances[m.id] = 0;
  }
  for (const e of expenses) {
    netBalances[e.paidBy] = (netBalances[e.paidBy] ?? 0) + e.amount;
    for (const s of e.splits) {
      netBalances[s.memberId] = (netBalances[s.memberId] ?? 0) - s.amount;
    }
  }

  const pendingDebts = simplifyDebts(netBalances);
  const getMember = (id: string) => members.find((m) => m.id === id);

  const handleMarkSettled = (debt: Debt) => {
    addSettlement({
      fromMember: debt.from,
      toMember: debt.to,
      amount: debt.amount,
      method: "manual",
      upiId: "",
      note: "",
      date: new Date().toISOString().slice(0, 10),
      settled: true,
    });
    toast.success("Payment marked as settled!");
  };

  const handleUpiSettle = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!upiDialog) return;
    addSettlement({
      fromMember: upiDialog.from,
      toMember: upiDialog.to,
      amount: upiDialog.amount,
      method: "upi",
      upiId,
      note: upiNote,
      date: new Date().toISOString().slice(0, 10),
      settled: false,
    });
    toast.success("UPI payment request sent!");
    setUpiDialog(null);
    setUpiId("");
    setUpiNote("");
  };

  return (
    <div className="min-h-dvh bg-background">
      <div className="bg-primary text-primary-foreground px-4 pt-12 pb-6">
        <h1 className="font-display text-xl font-bold">Settle Up</h1>
        <p className="text-primary-foreground/70 text-sm mt-0.5">
          {pendingDebts.length} pending settlement
          {pendingDebts.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="px-4 py-4 pb-20">
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="w-full mb-4">
            <TabsTrigger
              value="pending"
              className="flex-1"
              data-ocid="settle.tab"
            >
              Pending
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="flex-1"
              data-ocid="settle.tab"
            >
              History
            </TabsTrigger>
            <TabsTrigger
              value="balances"
              className="flex-1"
              data-ocid="settle.tab"
            >
              Balances
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-3">
            {pendingDebts.length === 0 ? (
              <div className="py-16 text-center" data-ocid="settle.empty_state">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="font-semibold">All settled up!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  No pending payments.
                </p>
              </div>
            ) : (
              pendingDebts.map((debt, idx) => {
                const from = getMember(debt.from);
                const to = getMember(debt.to);
                if (!from || !to) return null;
                return (
                  <motion.div
                    key={`${debt.from}-${debt.to}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08 }}
                    data-ocid={`settle.item.${idx + 1}`}
                  >
                    <Card className="shadow-card border-0">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <MemberAvatar member={from} size="md" />
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground">
                              owes
                            </p>
                            <p className="font-semibold text-sm">{from.name}</p>
                          </div>
                          <div className="text-center">
                            <p className="font-display text-xl font-bold text-primary">
                              ₹{fmt(debt.amount)}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              to pay
                            </p>
                          </div>
                          <div className="flex-1 text-right">
                            <p className="text-xs text-muted-foreground">to</p>
                            <p className="font-semibold text-sm">{to.name}</p>
                          </div>
                          <MemberAvatar member={to} size="md" />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 h-8 text-xs"
                            onClick={() => {
                              setUpiDialog(debt);
                              setUpiId("");
                            }}
                            data-ocid={`settle.secondary_button.${idx + 1}`}
                          >
                            <Smartphone className="w-3 h-3 mr-1" /> UPI
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 h-8 text-xs"
                            onClick={() => handleMarkSettled(debt)}
                            data-ocid={`settle.primary_button.${idx + 1}`}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" /> Mark
                            Settled
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-2">
            {settlements.length === 0 ? (
              <div className="py-12 text-center" data-ocid="settle.empty_state">
                <p className="text-muted-foreground text-sm">
                  No settlement history.
                </p>
              </div>
            ) : (
              settlements.map((s, idx) => {
                const from = getMember(s.fromMember);
                const to = getMember(s.toMember);
                return (
                  <Card
                    key={s.id}
                    className="shadow-card border-0"
                    data-ocid={`settle.item.${idx + 1}`}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        {from && <MemberAvatar member={from} size="sm" />}
                        <div className="flex-1">
                          <p className="text-sm">
                            <span className="font-semibold">{from?.name}</span>
                            {" → "}
                            <span className="font-semibold">{to?.name}</span>
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge
                              variant={s.settled ? "default" : "secondary"}
                              className="text-[10px] py-0 h-4"
                            >
                              {s.settled
                                ? "Settled"
                                : s.method === "upi"
                                  ? "UPI Pending"
                                  : "Pending"}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {s.date}
                            </span>
                          </div>
                        </div>
                        <p className="font-bold text-sm">₹{fmt(s.amount)}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="balances" className="space-y-2">
            {members.map((m, idx) => {
              const balance = netBalances[m.id] ?? 0;
              return (
                <Card
                  key={m.id}
                  className="shadow-card border-0"
                  data-ocid={`settle.item.${idx + 1}`}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <MemberAvatar member={m} size="md" />
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{m.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {balance >= 0 ? "Gets back" : "Owes"} ₹
                        {fmt(Math.abs(balance))}
                      </p>
                    </div>
                    <span
                      className={`font-bold text-base ${balance >= 0 ? "text-green-600" : "text-primary"}`}
                    >
                      {balance >= 0 ? "+" : ""}₹{fmt(Math.abs(balance))}
                    </span>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!upiDialog} onOpenChange={(v) => !v && setUpiDialog(null)}>
        <DialogContent data-ocid="settle.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">Pay via UPI</DialogTitle>
          </DialogHeader>
          {upiDialog &&
            (() => {
              const from = getMember(upiDialog.from);
              const to = getMember(upiDialog.to);
              return (
                <form onSubmit={handleUpiSettle} className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-secondary rounded-xl">
                    <div className="flex items-center gap-2">
                      {from && <MemberAvatar member={from} size="sm" />}
                      <span className="text-sm font-medium">{from?.name}</span>
                    </div>
                    <span className="font-display text-lg font-bold text-primary">
                      ₹{fmt(upiDialog.amount)}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{to?.name}</span>
                      {to && <MemberAvatar member={to} size="sm" />}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="upi-id">UPI ID of {to?.name}</Label>
                    <Input
                      id="upi-id"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="example@upi"
                      data-ocid="settle.input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="upi-note">Note (optional)</Label>
                    <Textarea
                      id="upi-note"
                      value={upiNote}
                      onChange={(e) => setUpiNote(e.target.value)}
                      className="resize-none h-16"
                      data-ocid="settle.textarea"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setUpiDialog(null)}
                      data-ocid="settle.cancel_button"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      data-ocid="settle.confirm_button"
                    >
                      <HandCoins className="w-4 h-4 mr-1.5" /> Send Request
                    </Button>
                  </div>
                </form>
              );
            })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
