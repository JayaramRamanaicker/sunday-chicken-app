import { WeeklyRecord } from '../types';

export const calculateRecordMetrics = (record: WeeklyRecord): WeeklyRecord => {
  // 1. Saturday Calculation: Purchase Cost
  const totalPurchaseCost = record.totalLiveWeight * record.purchaseRate;

  // If sales data isn't present, return minimal update
  if (!record.isSalesEntryComplete) {
    return {
      ...record,
      totalPurchaseCost,
    };
  }

  // Ensure values exist (default to 0 to be safe)
  const sellingPrice = record.sellingPrice || 0;
  const cash = record.cashCollected || 0;
  const upi = record.upiCollected || 0;
  
  const expenseTea = record.expenseTea || 0;
  const expenseFuel = record.expenseFuel || 0;

  // 2. Sunday Calculations
  const totalRevenue = cash + upi;
  
  // Strict Formula: meatSold = totalRevenue / sellingPrice
  // Avoid division by zero
  const meatSold = sellingPrice > 0 ? totalRevenue / sellingPrice : 0;

  const wastage = record.totalLiveWeight - meatSold;
  
  const wastagePercentage = record.totalLiveWeight > 0 
    ? (wastage / record.totalLiveWeight) * 100 
    : 0;

  const totalExpenses = expenseTea + expenseFuel;

  const netProfit = totalRevenue - (totalPurchaseCost + totalExpenses);

  const profitPerHen = record.totalHens > 0 
    ? netProfit / record.totalHens 
    : 0;

  const profitPerKg = meatSold > 0 
    ? netProfit / meatSold 
    : 0;

  return {
    ...record,
    totalPurchaseCost,
    totalRevenue,
    meatSold,
    wastage,
    wastagePercentage,
    totalExpenses,
    netProfit,
    profitPerHen,
    profitPerKg
  };
};

export const formatCurrency = (amount: number | undefined) => {
  if (amount === undefined) return '-';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatNumber = (num: number | undefined, decimals = 2) => {
  if (num === undefined) return '-';
  return num.toLocaleString('en-IN', { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
};