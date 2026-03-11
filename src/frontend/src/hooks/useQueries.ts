import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Category, SplitType } from "../backend";
import type { Expense, Member, MonthlySummary, Settlement } from "../backend";
import { useActor } from "./useActor";

export type { Member, Expense, Settlement, MonthlySummary };
export { Category, SplitType };

export function useMembers() {
  const { actor, isFetching } = useActor();
  return useQuery<Member[]>({
    queryKey: ["members"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMembers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useExpenses() {
  const { actor, isFetching } = useActor();
  return useQuery<Expense[]>({
    queryKey: ["expenses"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getExpenses();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSettlements() {
  const { actor, isFetching } = useActor();
  return useQuery<Settlement[]>({
    queryKey: ["settlements"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSettlements();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMonthlySummary(month: string) {
  const { actor, isFetching } = useActor();
  return useQuery<MonthlySummary>({
    queryKey: ["monthlySummary", month],
    queryFn: async (): Promise<MonthlySummary> => {
      if (!actor)
        return {
          categoryBreakdown: [],
          totalFundsAdded: BigInt(0),
          totalExpenses: BigInt(0),
        };
      return actor.getMonthlySummary(month);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddMember() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, phone }: { name: string; phone: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.addMember(name, phone);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });
}

export function useRemoveMember() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.removeMember(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });
}

export function useAddExpense() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      description: string;
      amount: bigint;
      category: Category;
      paidBy: string;
      splitType: SplitType;
      splitDetails: Array<[string, bigint]>;
      date: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.addExpense(
        data.description,
        data.amount,
        data.category,
        data.paidBy,
        data.splitType,
        data.splitDetails,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["monthlySummary"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });
}

export function useDeleteExpense() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteExpense(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["monthlySummary"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });
}

export function useAddSettlement() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      from: string;
      to: string;
      amount: bigint;
      note: string | null;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.addSettlement(data.from, data.to, data.amount, data.note);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settlements"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });
}
