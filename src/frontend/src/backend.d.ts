import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Settlement {
    to: string;
    from: string;
    note?: string;
    timestamp: Time;
    amount: bigint;
}
export type Time = bigint;
export interface Member {
    balance: bigint;
    name: string;
}
export interface MonthlySummary {
    totalSpending: bigint;
    categoryBreakdown: Array<[Category, bigint]>;
}
export interface Expense {
    id: bigint;
    date: string;
    description: string;
    category: Category;
    amount: bigint;
    paidBy: string;
    splitAmong: Array<string>;
}
export interface UserProfile {
    name: string;
    email: string;
}
export enum Category {
    other = "other",
    entertainment = "entertainment",
    travel = "travel",
    rent = "rent",
    utilities = "utilities",
    groceries = "groceries",
    schoolFees = "schoolFees"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addExpense(description: string, amount: bigint, category: Category, paidBy: string, splitAmong: Array<string>, date: string): Promise<void>;
    addMember(name: string): Promise<void>;
    addSettlement(from: string, to: string, amount: bigint, note: string | null): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteExpense(id: bigint): Promise<void>;
    getBalances(): Promise<Array<Member>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getExpense(id: bigint): Promise<Expense | null>;
    getExpenses(): Promise<Array<Expense>>;
    getMembers(): Promise<Array<Member>>;
    getMonthlySummary(month: string): Promise<MonthlySummary>;
    getSettlements(): Promise<Array<Settlement>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    removeMember(name: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
}
