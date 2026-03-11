import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Camera, Plus, Search, Trash2, Upload } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { AddExpenseSheet } from "../components/AddExpenseSheet";
import {
  CategoryBadge,
  getCategoryBorderColor,
} from "../components/CategoryBadge";
import { MemberAvatar } from "../components/MemberAvatar";
import { useApp } from "../store/AppContext";
import { CATEGORIES, type Category } from "../types";

function fmt(n: number) {
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function Expenses() {
  const { expenses, members, removeExpense } = useApp();
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<"all" | Category>("all");
  const [filterMonth, setFilterMonth] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [billImageUrl, setBillImageUrl] = useState<string | undefined>();
  const fileRef = useRef<HTMLInputElement>(null);

  const monthOptions = Array.from(
    new Set(expenses.map((e) => e.date.slice(0, 7))),
  ).sort((a, b) => b.localeCompare(a));

  const filtered = expenses.filter((e) => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === "all" || e.category === filterCat;
    const matchMonth = filterMonth === "all" || e.date.startsWith(filterMonth);
    return matchSearch && matchCat && matchMonth;
  });

  const totalFiltered = filtered.reduce((s, e) => s + e.amount, 0);

  const handleBillUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    setBillImageUrl(url);
    toast.info("Bill uploaded! Enter the amount and save.");
    setAddOpen(true);
  };

  const handleBillClick = () => fileRef.current?.click();
  return (
    <div className="min-h-dvh bg-background">
      <div className="bg-primary text-primary-foreground px-4 pt-12 pb-6">
        <h1 className="font-display text-xl font-bold mb-3">Expenses</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-foreground/50" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search expenses..."
            className="pl-9 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 focus-visible:ring-primary-foreground/30"
            data-ocid="expense.search_input"
          />
        </div>
      </div>

      <div className="px-4 py-3 space-y-3">
        <div className="flex gap-2">
          <Select
            value={filterCat}
            onValueChange={(v) => setFilterCat(v as "all" | Category)}
          >
            <SelectTrigger
              className="flex-1 h-8 text-xs"
              data-ocid="expense.select"
            >
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterMonth} onValueChange={setFilterMonth}>
            <SelectTrigger
              className="flex-1 h-8 text-xs"
              data-ocid="expense.select"
            >
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Months</SelectItem>
              {monthOptions.map((m) => (
                <SelectItem key={m} value={m}>
                  {new Date(`${m}-01`).toLocaleString("default", {
                    month: "long",
                    year: "numeric",
                  })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {filtered.length} expense{filtered.length !== 1 ? "s" : ""}
          </span>
          <span className="text-sm font-bold">₹{fmt(totalFiltered)}</span>
        </div>

        {/* Bill scanner */}
        <button
          type="button"
          className="flex w-full items-center gap-3 p-3 rounded-xl border-2 border-dashed border-border bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={handleBillClick}
          data-ocid="expense.dropzone"
        >
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Camera className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Scan a Bill</p>
            <p className="text-xs text-muted-foreground">
              Upload a photo to auto-fill expense
            </p>
          </div>
          <Upload className="w-4 h-4 text-muted-foreground" />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleBillUpload(f);
              e.target.value = "";
            }}
            data-ocid="expense.upload_button"
          />
        </button>

        {filtered.length === 0 ? (
          <div className="py-12 text-center" data-ocid="expense.empty_state">
            <p className="text-muted-foreground text-sm">No expenses found.</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            <div className="space-y-2 pb-20">
              {filtered.map((e, idx) => {
                const payer = members.find((m) => m.id === e.paidBy);
                const borderColor = getCategoryBorderColor(e.category);
                return (
                  <motion.div
                    key={e.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ delay: idx * 0.03 }}
                    data-ocid={`expense.item.${idx + 1}`}
                  >
                    <Card className="shadow-card border-0 overflow-hidden">
                      <CardContent className="p-0">
                        <div className="flex items-stretch">
                          <div
                            className="w-1 flex-shrink-0"
                            style={{ backgroundColor: borderColor }}
                          />
                          <div className="flex-1 p-3 flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate">
                                {e.title}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <CategoryBadge category={e.category} />
                                {payer && (
                                  <MemberAvatar member={payer} size="sm" />
                                )}
                                <span className="text-[10px] text-muted-foreground">
                                  {new Date(e.date).toLocaleDateString(
                                    "en-IN",
                                    { day: "numeric", month: "short" },
                                  )}
                                </span>
                              </div>
                              {e.notes && (
                                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                  {e.notes}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <p className="font-bold text-sm">
                                  ₹{fmt(e.amount)}
                                </p>
                                <p className="text-[10px] text-muted-foreground capitalize">
                                  {e.splitType}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setDeleteId(e.id)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                data-ocid={`expense.delete_button.${idx + 1}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}
      </div>

      <Button
        onClick={() => {
          setBillImageUrl(undefined);
          setAddOpen(true);
        }}
        className="fixed bottom-20 right-4 rounded-full shadow-fab w-12 h-12 p-0 z-40"
        data-ocid="expense.primary_button"
      >
        <Plus className="w-5 h-5" />
      </Button>

      <AddExpenseSheet
        open={addOpen}
        onClose={() => {
          setAddOpen(false);
          if (billImageUrl) URL.revokeObjectURL(billImageUrl);
          setBillImageUrl(undefined);
        }}
        prefillImageUrl={billImageUrl}
      />

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
      >
        <AlertDialogContent data-ocid="expense.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete expense?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="expense.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) {
                  removeExpense(deleteId);
                  toast.success("Expense deleted");
                  setDeleteId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="expense.confirm_button"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
