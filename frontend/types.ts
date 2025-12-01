export interface WeeklyRecord {
  id: string;
  weekDate: string; // The Saturday date identifying the week
  
  // Timestamps
  createdAt?: string; // ISO String
  salesCompletedAt?: string; // ISO String

  // Saturday: Purchase Data
  totalHens: number;
  totalLiveWeight: number; // kg
  purchaseRate: number; // per kg
  totalPurchaseCost: number; // Calculated

  // Sunday: Sales Data (Optional until filled)
  isSalesEntryComplete: boolean;
  sellingPrice?: number; // per kg
  cashCollected?: number;
  upiCollected?: number;
  
  // Expenses
  expenseTea?: number;
  expenseFuel?: number;
  totalExpenses?: number;

  // Computed Metrics
  totalRevenue?: number;
  meatSold?: number;
  wastage?: number;
  wastagePercentage?: number;
  netProfit?: number;
  profitPerHen?: number;
  profitPerKg?: number;
}

export type WeeklyRecordInput = Omit<WeeklyRecord, 'id' | 'totalPurchaseCost' | 'totalExpenses' | 'totalRevenue' | 'meatSold' | 'wastage' | 'wastagePercentage' | 'netProfit' | 'profitPerHen' | 'profitPerKg'>;

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  ENTRY_PURCHASE = 'ENTRY_PURCHASE',
  ENTRY_SALES = 'ENTRY_SALES',
  HISTORY = 'HISTORY'
}

export interface User {
  id: string;
  name: string;
  email: string;
  token?: string;
}