import React, { useMemo, useState, useEffect } from 'react';
import { WeeklyRecord } from '../types';
import { formatCurrency, formatNumber } from '../utils/calculations';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Legend 
} from 'recharts';
import { TrendingUp, DollarSign, Scale, AlertCircle, Award, Wallet, ArrowUpRight, Calendar, ChevronDown } from 'lucide-react';

interface DashboardProps {
  records: WeeklyRecord[];
  onAddPurchase: () => void;
  onAddSales: () => void;
}

const StatCard: React.FC<{ 
  title: string; 
  value: string; 
  subValue?: string;
  icon: React.ReactNode; 
  trend?: 'up' | 'down' | 'neutral';
  color: string 
}> = ({ title, value, subValue, icon, color }) => (
  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-2">
      <div className={`p-2.5 rounded-lg ${color} bg-opacity-10 text-opacity-100`}>
        {React.cloneElement(icon as React.ReactElement, { className: `w-6 h-6 ${color.replace('bg-', 'text-')}` })}
      </div>
    </div>
    <div>
      <h3 className="text-gray-500 text-xs uppercase font-semibold tracking-wider">{title}</h3>
      <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
      {subValue && <p className="text-xs text-gray-400 mt-1">{subValue}</p>}
    </div>
  </div>
);

const LifetimeStat: React.FC<{
  label: string;
  value: string;
  icon: React.ReactNode;
  bgClass: string;
  textClass: string;
}> = ({ label, value, icon, bgClass, textClass }) => (
  <div className={`flex items-center p-4 rounded-xl border ${bgClass} ${textClass} shadow-sm flex-1 min-w-[200px]`}>
    <div className="p-3 bg-white bg-opacity-30 rounded-full mr-4">
      {icon}
    </div>
    <div>
      <p className="text-xs opacity-80 uppercase tracking-wider font-semibold">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ records, onAddPurchase, onAddSales }) => {
  // 1. Get all completed records sorted by date (newest first)
  const completedRecords = useMemo(() => {
    return records
      .filter(r => r.isSalesEntryComplete)
      .sort((a, b) => new Date(b.weekDate).getTime() - new Date(a.weekDate).getTime());
  }, [records]);

  // 2. State for selected record ID
  const [selectedRecordId, setSelectedRecordId] = useState<string>("");

  // 3. Set default selection to the newest completed record
  useEffect(() => {
    if (completedRecords.length > 0 && !selectedRecordId) {
      setSelectedRecordId(completedRecords[0].id);
    }
  }, [completedRecords, selectedRecordId]);

  // 4. Determine which record to display
  const displayRecord = useMemo(() => {
    return completedRecords.find(r => r.id === selectedRecordId) || completedRecords[0];
  }, [completedRecords, selectedRecordId]);

  // Calculate Lifetime Totals
  const lifetimeStats = useMemo(() => {
    return records.reduce((acc, curr) => {
      if (curr.isSalesEntryComplete) {
        acc.revenue += (curr.totalRevenue || 0);
        acc.profit += (curr.netProfit || 0);
        acc.meat += (curr.meatSold || 0);
      }
      return acc;
    }, { revenue: 0, profit: 0, meat: 0 });
  }, [records]);

  // Prepare chart data (last 8 weeks, reversed for chronological order)
  const chartData = useMemo(() => {
    return [...records]
    .filter(r => r.isSalesEntryComplete)
    .sort((a, b) => new Date(b.weekDate).getTime() - new Date(a.weekDate).getTime()) // Sort desc first
    .slice(0, 8) // Take last 8
    .reverse() // Reverse for chart (oldest to newest)
    .map(r => ({
      date: new Date(r.weekDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      Profit: r.netProfit || 0,
      Revenue: r.totalRevenue || 0,
      Cost: (r.totalPurchaseCost || 0) + (r.totalExpenses || 0),
      Wastage: r.wastagePercentage || 0,
    }));
  }, [records]);

  // Common Tooltip Style
  const tooltipStyle = {
    backgroundColor: '#fff',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    padding: '8px 12px',
    fontSize: '12px',
    outline: 'none'
  };

  return (
    <div className="space-y-8 pb-24">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
           <p className="text-gray-500 text-sm">Overview of your business performance</p>
        </div>
        <span className="text-xs font-medium px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full">
          {records.length} Records
        </span>
      </div>

      {/* Lifetime Totals Row */}
      <div className="flex flex-wrap gap-4">
        <LifetimeStat 
          label="All-Time Revenue" 
          value={formatCurrency(lifetimeStats.revenue)} 
          icon={<Wallet size={24} />}
          bgClass="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200"
          textClass="text-blue-900"
        />
        <LifetimeStat 
          label="All-Time Profit" 
          value={formatCurrency(lifetimeStats.profit)} 
          icon={<Award size={24} />}
          bgClass="bg-gradient-to-br from-green-50 to-green-100 border-green-200"
          textClass="text-green-900"
        />
        <LifetimeStat 
          label="Total Meat Sold" 
          value={`${formatNumber(lifetimeStats.meat)} kg`} 
          icon={<Scale size={24} />}
          bgClass="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200"
          textClass="text-purple-900"
        />
      </div>

      {/* Action Buttons with Quotes */}
      <div className="grid grid-cols-2 md:grid-cols-2 gap-4 sm:gap-6 lg:max-w-2xl mx-auto">
        <button 
          onClick={onAddPurchase}
          className="bg-gray-800 hover:bg-gray-900 text-white p-6 rounded-xl shadow-lg flex flex-col items-center justify-center transition-all transform active:scale-95 group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-2 opacity-10">
             <ArrowUpRight size={48} />
          </div>
          <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">🐓</span>
          <span className="font-semibold text-lg">Purchase Entry</span>
          <span className="text-xs text-gray-400 opacity-90 mt-2 italic font-serif">"Well begun is half done"</span>
        </button>
        <button 
          onClick={onAddSales}
          className="bg-yellow-500 hover:bg-yellow-600 text-white p-6 rounded-xl shadow-lg flex flex-col items-center justify-center transition-all transform active:scale-95 group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-2 opacity-10">
             <DollarSign size={48} />
          </div>
          <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">💰</span>
          <span className="font-semibold text-lg">Sold Entry</span>
          <span className="text-xs text-white opacity-90 mt-2 italic font-serif">"Profit is the applause"</span>
        </button>
      </div>

      {/* Dynamic Performance Section */}
      {completedRecords.length > 0 ? (
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Performance Metrics</h3>
              <p className="text-sm text-gray-500">
                {displayRecord 
                  ? `Details for ${new Date(displayRecord.weekDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`
                  : 'Select a date below'}
              </p>
            </div>
            
            {/* Date Selector */}
            <div className="relative">
              <select 
                value={selectedRecordId}
                onChange={(e) => setSelectedRecordId(e.target.value)}
                className="appearance-none bg-white border border-gray-300 text-gray-700 py-2 pl-4 pr-10 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 font-medium cursor-pointer"
              >
                {completedRecords.map(record => (
                  <option key={record.id} value={record.id}>
                    {new Date(record.weekDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <ChevronDown size={16} />
              </div>
            </div>
          </div>

          {displayRecord ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 animate-fade-in">
              <StatCard 
                title="Net Profit" 
                value={formatCurrency(displayRecord.netProfit)} 
                subValue={`${formatCurrency(displayRecord.profitPerKg)} / kg`}
                icon={<TrendingUp />} 
                color="bg-green-500" 
              />
              <StatCard 
                title="Total Revenue" 
                value={formatCurrency(displayRecord.totalRevenue)} 
                icon={<DollarSign />} 
                color="bg-blue-500" 
              />
              <StatCard 
                title="Meat Sold" 
                value={`${formatNumber(displayRecord.meatSold)} kg`} 
                icon={<Scale />} 
                color="bg-purple-500" 
              />
               <StatCard 
                title="Wastage" 
                value={`${formatNumber(displayRecord.wastagePercentage, 1)}%`} 
                subValue={`${formatNumber(displayRecord.wastage)} kg lost`}
                icon={<AlertCircle />} 
                color="bg-red-500" 
              />
            </div>
          ) : (
             <div className="text-center py-8 text-gray-500">Select a date to view details.</div>
          )}

          {/* Charts */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">Analytics Trends</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              
              {/* Chart 1: Revenue vs Cost */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-80">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Revenue vs Costs</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{fontSize: 10, fill: '#6b7280'}} axisLine={false} tickLine={false} dy={10} />
                    <YAxis tick={{fontSize: 10, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                    <Tooltip 
                      cursor={{ fill: 'rgba(243, 244, 246, 0.5)' }}
                      wrapperStyle={{ zIndex: 1000 }}
                      contentStyle={tooltipStyle}
                      itemStyle={{ color: '#374151' }}
                      formatter={(value: number, name: string) => [formatCurrency(value), name]}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar dataKey="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                    <Bar dataKey="Cost" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Chart 2: Net Profit */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-80">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Net Profit Trend</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{fontSize: 10, fill: '#6b7280'}} axisLine={false} tickLine={false} dy={10} />
                    <YAxis tick={{fontSize: 10, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                    <Tooltip 
                      cursor={{ stroke: '#10b981', strokeWidth: 1 }}
                      wrapperStyle={{ zIndex: 1000 }}
                      contentStyle={tooltipStyle}
                      itemStyle={{ color: '#10b981' }}
                      formatter={(value: number) => [formatCurrency(value), 'Profit']}
                    />
                    <Line type="monotone" dataKey="Profit" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Chart 3: Wastage */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-80">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Wastage Trend (%)</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{fontSize: 10, fill: '#6b7280'}} axisLine={false} tickLine={false} dy={10} />
                    <YAxis tick={{fontSize: 10, fill: '#6b7280'}} unit="%" axisLine={false} tickLine={false} />
                    <Tooltip 
                      cursor={{ stroke: '#f59e0b', strokeWidth: 1 }}
                      wrapperStyle={{ zIndex: 1000 }}
                      contentStyle={tooltipStyle}
                      itemStyle={{ color: '#f59e0b' }}
                      formatter={(value: number) => [`${formatNumber(value, 1)}%`, 'Wastage']}
                    />
                    <Line type="monotone" dataKey="Wastage" stroke="#f59e0b" strokeWidth={3} dot={{r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-500">No complete records found.</p>
          <p className="text-sm text-gray-400">Add purchase and sales data to see analytics.</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;