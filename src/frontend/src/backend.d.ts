import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Budget {
    id: bigint;
    month: string;
    owner: string;
    createdAt: Time;
    year: bigint;
    category: Category;
    amount: bigint;
}
export interface Settlement {
    to: string;
    from: string;
    note?: string;
    timestamp: Time;
    amount: bigint;
}
export type Time = bigint;
export interface Expense {
    id: bigint;
    date: Time;
    splitType: SplitType;
    description: string;
    category: Category;
    amount: bigint;
    paidBy: string;
    splitDetails: Array<[string, bigint]>;
}
export interface MonthlySummary {
    categoryBreakdown: Array<[Category, bigint]>;
    totalFundsAdded: bigint;
    totalExpenses: bigint;
}
export interface Transaction {
    id: bigint;
    transactionType: {
        __kind__: "expense";
        expense: string | null;
    } | {
        __kind__: "fundsAdded";
        fundsAdded: {
            user: string;
        };
    };
    description?: string;
    timestamp: Time;
    amount: bigint;
}
export interface Wallet {
    balance: bigint;
    transactionHistory: Array<Transaction>;
}
export interface Member {
    id: string;
    name: string;
    phone: string;
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
export enum SplitType {
    custom = "custom",
    equal = "equal",
    percentage = "percentage"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addBudget(category: Category, amount: bigint, month: string, year: bigint): Promise<void>;
    addExpense(description: string, amount: bigint, category: Category, paidBy: string, splitType: SplitType, splitDetails: Array<[string, bigint]>): Promise<void>;
    addFunds(userId: string, amount: bigint): Promise<void>;
    addMember(name: string, phone: string): Promise<void>;
    addSettlement(from: string, to: string, amount: bigint, note: string | null): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    convertCurrency(amount: bigint, fromCurrency: string, toCurrency: string): Promise<bigint>;
    deleteExpense(id: bigint): Promise<void>;
    getBudgets(): Promise<Array<Budget>>;
    getBudgetsByCategory(category: Category): Promise<Array<Budget>>;
    getBudgetsByMonthYear(month: string, year: bigint): Promise<Array<Budget>>;
    getBudgetsByOwner(owner: string): Promise<Array<Budget>>;
    getCallerUserProfile(): Promise<{
        name: string;
    } | null>;
    getCallerUserRole(): Promise<UserRole>;
    getExpenses(): Promise<Array<Expense>>;
    getIncomeAnalytics(): Promise<Array<[string, bigint]>>;
    getMembers(): Promise<Array<Member>>;
    getMonthlySummary(month: string): Promise<MonthlySummary>;
    getSettlements(): Promise<Array<Settlement>>;
    getSpendingAnalytics(): Promise<Array<[string, bigint]>>;
    getUserProfile(user: Principal): Promise<{
        name: string;
    } | null>;
    getWallet(userId: string): Promise<Wallet>;
    isCallerAdmin(): Promise<boolean>;
    removeMember(id: string): Promise<void>;
    saveCallerUserProfile(profile: {
        name: string;
    }): Promise<void>;
    uploadReceipt(userId: string, receipt: ExternalBlob): Promise<void>;
}
