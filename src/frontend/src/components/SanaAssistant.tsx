import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Send, Sparkles, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useApp } from "../store/AppContext";
import type { Expense, Member } from "../types";

function fmt(n: number) {
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function computeNet(expenses: Expense[], members: Member[]) {
  const paid: Record<string, number> = {};
  const owed: Record<string, number> = {};
  for (const m of members) {
    paid[m.id] = 0;
    owed[m.id] = 0;
  }
  for (const e of expenses) {
    paid[e.paidBy] = (paid[e.paidBy] ?? 0) + e.amount;
    for (const s of e.splits)
      owed[s.memberId] = (owed[s.memberId] ?? 0) + s.amount;
  }
  const net: Record<string, number> = {};
  for (const m of members) net[m.id] = (paid[m.id] ?? 0) - (owed[m.id] ?? 0);
  return net;
}

interface Message {
  id: string;
  role: "sana" | "user";
  text: string;
  ts: number;
}

const GREETING: Message = {
  id: "greeting",
  role: "sana",
  text: "Hi! I'm Sana, your smart money assistant. Ask me anything about your expenses, balances, or budget! 💙",
  ts: Date.now(),
};

const QUICK_QUESTIONS = [
  "Who owes money?",
  "Wallet balance?",
  "This month's spending?",
  "Budget status?",
  "Biggest expense?",
];

export function SanaAssistant() {
  const { members, expenses, walletContributions, walletExpenses, budgets } =
    useApp();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scrollRef is stable
  useEffect(() => {
    if (open && scrollRef.current) {
      setTimeout(
        () =>
          scrollRef.current?.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: "smooth",
          }),
        100,
      );
    }
  }, [open, messages]);

  function uid() {
    return Math.random().toString(36).slice(2);
  }

  function getResponse(q: string): string {
    const lower = q.toLowerCase();
    const now = new Date();
    const thisMonth = expenses.filter((e) => {
      const d = new Date(e.date);
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    });
    const net = computeNet(expenses, members);
    const walletBalance =
      walletContributions.reduce((s, c) => s + c.amount, 0) -
      walletExpenses.reduce((s, e) => s + e.amount, 0);
    const walletIn = walletContributions.reduce((s, c) => s + c.amount, 0);
    const walletOut = walletExpenses.reduce((s, e) => s + e.amount, 0);

    if (
      lower.includes("owe") ||
      lower.includes("owed") ||
      (lower.includes("balance") && !lower.includes("wallet"))
    ) {
      const debtors = members
        .filter((m) => (net[m.id] ?? 0) < 0)
        .sort((a, b) => (net[a.id] ?? 0) - (net[b.id] ?? 0));
      if (debtors.length === 0)
        return "🎉 Great news! Everyone is settled up — no outstanding balances.";
      return `💸 Members who owe money:\n${debtors
        .map((m) => `• ${m.name}: owes ₹${fmt(Math.abs(net[m.id] ?? 0))}`)
        .join("\n")}`;
    }

    if (lower.includes("wallet")) {
      return `👛 Family Wallet\n• Balance: ₹${fmt(walletBalance)}\n• Total contributed: ₹${fmt(walletIn)}\n• Total spent: ₹${fmt(walletOut)}`;
    }

    if (
      lower.includes("month") ||
      lower.includes("spending") ||
      lower.includes("spent")
    ) {
      const total = thisMonth.reduce((s, e) => s + e.amount, 0);
      const cats = thisMonth.reduce(
        (acc, e) => {
          acc[e.category] = (acc[e.category] ?? 0) + e.amount;
          return acc;
        },
        {} as Record<string, number>,
      );
      const topCats = Object.entries(cats)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);
      const monthName = now.toLocaleString("default", { month: "long" });
      return `📅 ${monthName} spending\n• Total: ₹${fmt(total)} across ${thisMonth.length} expenses\n${
        topCats.length > 0
          ? `• Top categories:\n${topCats.map(([c, a]) => `  – ${c}: ₹${fmt(a)}`).join("\n")}`
          : ""
      }`;
    }

    if (lower.includes("budget")) {
      const m = now.getMonth() + 1;
      const y = now.getFullYear();
      const monthBudgets = budgets.filter((b) => b.month === m && b.year === y);
      if (monthBudgets.length === 0)
        return "📊 No budgets set for this month yet. Go to the Budget tab to set one!";
      const cats = thisMonth.reduce(
        (acc, e) => {
          acc[e.category] = (acc[e.category] ?? 0) + e.amount;
          return acc;
        },
        {} as Record<string, number>,
      );
      const lines = monthBudgets.map((b) => {
        const spent = cats[b.category] ?? 0;
        const pct = Math.round((spent / b.amount) * 100);
        const emoji = pct >= 100 ? "🔴" : pct >= 80 ? "🟡" : "🟢";
        return `${emoji} ${b.category}: ₹${fmt(spent)} / ₹${fmt(b.amount)} (${pct}%)`;
      });
      return `📊 Budget status this month:\n${lines.join("\n")}`;
    }

    if (
      lower.includes("biggest") ||
      lower.includes("largest") ||
      lower.includes("top")
    ) {
      const sorted = [...expenses]
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 3);
      if (sorted.length === 0) return "No expenses recorded yet.";
      return `💰 Top 3 biggest expenses:\n${sorted
        .map((e, i) => `${i + 1}. ${e.title}: ₹${fmt(e.amount)}`)
        .join("\n")}`;
    }

    if (
      lower.includes("member") ||
      (lower.includes("who") && lower.includes("in"))
    ) {
      return `👨‍👩‍👧 You have ${members.length} member${members.length !== 1 ? "s" : ""} in your group:\n${members.map((m) => `• ${m.name} (${m.role})`).join("\n")}`;
    }

    return (
      "👋 I can help you with:\n" +
      "• Who owes money\n" +
      "• Wallet balance & transactions\n" +
      "• This month's spending breakdown\n" +
      "• Budget vs actual status\n" +
      "• Biggest expenses\n" +
      "• Member list\n\n" +
      "Just ask me anything!"
    );
  }

  function handleSend(text?: string) {
    const q = (text ?? input).trim();
    if (!q) return;
    const userMsg: Message = {
      id: uid(),
      role: "user",
      text: q,
      ts: Date.now(),
    };
    const sanaMsg: Message = {
      id: uid(),
      role: "sana",
      text: getResponse(q),
      ts: Date.now() + 1,
    };
    setMessages((prev) => [...prev, userMsg, sanaMsg]);
    setInput("");
  }

  return (
    <>
      {/* Floating button */}
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded-full shadow-lg text-white"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.52 0.18 220), oklch(0.42 0.2 250))",
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        data-ocid="sana.open_modal_button"
      >
        <Sparkles className="w-4 h-4" />
        <span className="text-xs font-semibold">Sana</span>
      </motion.button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl px-0 pb-0 flex flex-col"
          style={{ maxHeight: "70dvh" }}
          data-ocid="sana.sheet"
        >
          <SheetHeader className="px-4 pt-3 pb-3 border-b">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.52 0.18 220), oklch(0.42 0.2 250))",
                }}
              >
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <SheetTitle className="text-base font-display">Sana</SheetTitle>
                <p className="text-xs text-muted-foreground">
                  Your money assistant
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8"
                onClick={() => setOpen(false)}
                data-ocid="sana.close_button"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </SheetHeader>

          {/* Quick questions */}
          <div className="px-4 py-2 flex gap-2 overflow-x-auto scrollbar-none border-b">
            {QUICK_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => handleSend(q)}
                className="flex-shrink-0 text-xs bg-accent text-foreground rounded-full px-3 py-1 hover:bg-primary hover:text-primary-foreground transition-colors"
                data-ocid="sana.secondary_button"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 overflow-y-auto">
            <div ref={scrollRef} className="px-4 py-3 space-y-3">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm whitespace-pre-line ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-blue-50 text-foreground rounded-bl-sm"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="px-4 py-3 border-t flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask Sana anything..."
              className="flex-1"
              data-ocid="sana.input"
            />
            <Button
              size="icon"
              onClick={() => handleSend()}
              disabled={!input.trim()}
              data-ocid="sana.submit_button"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
