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
import { Badge } from "@/components/ui/badge";
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
import { Crown, Phone, Plus, Trash2, User } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { MemberAvatar } from "../components/MemberAvatar";
import { useApp } from "../store/AppContext";
import type { MemberRole } from "../types";

function fmt(n: number) {
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function Members() {
  const { members, expenses, addMember, removeMember } = useApp();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<MemberRole>("member");

  const getMemberStats = (memberId: string) => {
    const paid = expenses
      .filter((e) => e.paidBy === memberId)
      .reduce((s, e) => s + e.amount, 0);
    const owed = expenses.reduce((s, e) => {
      const split = e.splits.find((sp) => sp.memberId === memberId);
      return s + (split?.amount ?? 0);
    }, 0);
    return { paid, balance: paid - owed };
  };

  const handleAdd = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (phone && !/^[6-9]\d{9}$/.test(phone)) {
      toast.error("Enter a valid 10-digit Indian phone number");
      return;
    }
    addMember({ name: name.trim(), phone, role });
    toast.success(`${name} added to the family!`);
    setName("");
    setPhone("");
    setRole("member");
    setSheetOpen(false);
  };

  return (
    <div className="min-h-dvh bg-background">
      <div className="bg-primary text-primary-foreground px-4 pt-12 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-bold">Family Members</h1>
            <p className="text-primary-foreground/70 text-sm mt-0.5">
              {members.length} members
            </p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setSheetOpen(true)}
            className="rounded-full"
            data-ocid="members.primary_button"
          >
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3 pb-20">
        {members.length === 0 && (
          <div className="py-12 text-center" data-ocid="members.empty_state">
            <p className="text-muted-foreground">
              No members yet. Add your family!
            </p>
          </div>
        )}
        {members.map((m, idx) => {
          const { paid, balance } = getMemberStats(m.id);
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.07 }}
              data-ocid={`members.item.${idx + 1}`}
            >
              <Card className="shadow-card border-0">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <MemberAvatar member={m} size="lg" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-base truncate">
                          {m.name}
                        </p>
                        <Badge
                          variant={m.role === "admin" ? "default" : "secondary"}
                          className="text-[10px] py-0 h-4"
                        >
                          {m.role === "admin" ? (
                            <Crown className="w-2.5 h-2.5 mr-0.5" />
                          ) : (
                            <User className="w-2.5 h-2.5 mr-0.5" />
                          )}
                          {m.role}
                        </Badge>
                      </div>
                      {m.phone && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {m.phone}
                          </span>
                        </div>
                      )}
                      <div className="flex gap-4 mt-2">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Total Paid
                          </p>
                          <p className="text-sm font-bold">₹{fmt(paid)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Balance
                          </p>
                          <p
                            className={`text-sm font-bold ${balance >= 0 ? "text-green-600" : "text-primary"}`}
                          >
                            {balance >= 0 ? "+" : ""}₹{fmt(Math.abs(balance))}
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDeleteId(m.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0"
                      data-ocid={`members.delete_button.${idx + 1}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Add Member Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl px-4 pb-8"
          data-ocid="members.sheet"
        >
          <SheetHeader className="mb-4">
            <SheetTitle className="font-display text-lg">
              Add Family Member
            </SheetTitle>
          </SheetHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <Label htmlFor="m-name">Full Name *</Label>
              <Input
                id="m-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Priya Sharma"
                data-ocid="members.input"
              />
            </div>
            <div>
              <Label htmlFor="m-phone">Phone Number</Label>
              <Input
                id="m-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit number"
                data-ocid="members.input"
              />
            </div>
            <div>
              <Label>Role</Label>
              <Select
                value={role}
                onValueChange={(v) => setRole(v as MemberRole)}
              >
                <SelectTrigger data-ocid="members.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setSheetOpen(false)}
                data-ocid="members.cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                data-ocid="members.submit_button"
              >
                Add Member
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Delete Dialog */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
      >
        <AlertDialogContent data-ocid="members.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove them from the family group.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="members.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) {
                  removeMember(deleteId);
                  toast.success("Member removed");
                  setDeleteId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground"
              data-ocid="members.confirm_button"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
