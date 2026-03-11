import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Category } from "../backend";
import type {
  Expense,
  Member,
  MonthlySummary,
  Settlement,
  UserProfile,
} from "../backend";
import { useActor } from "./useActor";

export type { Member, Expense, Settlement, MonthlySummary, UserProfile };
export { Category };

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

export function useBalances() {
  const { actor, isFetching } = useActor();
  return useQuery<Member[]>({
    queryKey: ["balances"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getBalances();
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
    queryFn: async () => {
      if (!actor) return { totalSpending: BigInt(0), categoryBreakdown: [] };
      return actor.getMonthlySummary(month);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUserProfile() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["userProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddMember() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.addMember(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["balances"] });
    },
  });
}

export function useRemoveMember() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.removeMember(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["balances"] });
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
      splitAmong: string[];
      date: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.addExpense(
        data.description,
        data.amount,
        data.category,
        data.paidBy,
        data.splitAmong,
        data.date,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["balances"] });
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
      queryClient.invalidateQueries({ queryKey: ["balances"] });
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
      queryClient.invalidateQueries({ queryKey: ["balances"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });
}

export function useSaveProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Not connected");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });
}
