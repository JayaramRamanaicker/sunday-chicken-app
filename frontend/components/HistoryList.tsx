import React, { useState, useMemo } from 'react';
import { WeeklyRecord } from '../types';
import { formatCurrency, formatNumber } from '../utils/calculations';
import { Trash2, Edit2, CheckCircle, Clock, Download, Filter, X, Calendar, ArrowRight, ChevronRight, TrendingUp } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface HistoryListProps {
  records: WeeklyRecord[];
  onEdit: (record: WeeklyRecord) => void;
  onDelete: (id: string) => void;
  onContinue: (record: WeeklyRecord) => void;
}

const HistoryList: React.FC<HistoryListProps> = ({ records, onEdit, onDelete, onContinue }) => {
  const [filters, setFilters] = useState({
    status: 'all',
    startDate: '',
    endDate: '',
    minProfit: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      // Status Filter
      if (filters.status === 'completed' && !r.isSalesEntryComplete) return false;
      if (filters.status === 'pending' && r.isSalesEntryComplete) return false;

      // Date Filter
      if (filters.startDate && r.weekDate < filters.startDate) return false;
      if (filters.endDate && r.weekDate > filters.endDate) return false;

      // Profit Filter (only if completed)
      if (filters.minProfit && r.isSalesEntryComplete && (r.netProfit || 0) < Number(filters.minProfit)) return false;

      return true;
    });
  }, [records, filters]);

  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  // Helper for PDF currency to avoid unicode artifacts (The "small 1" issue)
  const formatPdfCurrency = (amount: number | undefined) => {
    if (amount === undefined) return '-';
    // Use 'Rs.' instead of symbol for better PDF font compatibility
    return `Rs. ${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('l'); // Landscape for more columns
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(245, 158, 11);
    doc.text("Sunday's Chicken - Business Report", 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    // Use en-GB for dd/mm/yyyy format
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString('en-IN')}`, 14, 30);

    // Table Data
    const tableBody = filteredRecords.map(r => {
      const dateStr = new Date(r.weekDate).toLocaleDateString('en-GB');
      const entryTime = r.createdAt ? `Entry: ${formatTime(r.createdAt)}` : '';
      const soldTime = r.salesCompletedAt ? `Sold: ${formatTime(r.salesCompletedAt)}` : '';
      
      // Combine date and times for the first column
      const dateColumnContent = [dateStr, entryTime, soldTime].filter(Boolean).join('\n');

      return [
        dateColumnContent,
        `${formatNumber(r.totalLiveWeight)} kg`,
        `${formatNumber(r.totalHens)}`,
        formatPdfCurrency(r.totalPurchaseCost),
        r.isSalesEntryComplete ? formatPdfCurrency(r.sellingPrice) : '-',
        r.isSalesEntryComplete ? `${formatNumber(r.meatSold)} kg` : '-',
        r.isSalesEntryComplete ? `${formatNumber(r.wastage)} kg` : '-',
        r.isSalesEntryComplete ? formatPdfCurrency(r.totalExpenses) : '-',
        r.isSalesEntryComplete ? formatPdfCurrency(r.totalRevenue) : '-',
        r.isSalesEntryComplete ? formatPdfCurrency(r.netProfit) : '-'
      ];
    });

    autoTable(doc, {
      head: [['Date / Time', 'Live Wt', 'Hens', 'Purchase', 'Price/kg', 'Meat Sold', 'Wastage', 'Expenses', 'Revenue', 'Profit']],
      body: tableBody,
      startY: 35,
      theme: 'grid',
      headStyles: { fillColor: [245, 158, 11], textColor: 255 },
      styles: { fontSize: 8, cellPadding: 2, valign: 'middle' },
      columnStyles: {
        0: { cellWidth: 30 }, // Wider date column for times
        9: { fontStyle: 'bold' } // Profit
      }
    });

    doc.save('SundaysChicken_Report.pdf');
  };

  const clearFilters = () => setFilters({ status: 'all', startDate: '', endDate: '', minProfit: '' });
  const hasActiveFilters = filters.status !== 'all' || filters.startDate || filters.endDate || filters.minProfit;

  const inputClass = "w-full p-2 border border-gray-400 bg-gray-50 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-yellow-500 focus:bg-white focus:border-yellow-500 outline-none transition-all";

  return (
    <div className="pb-24">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Weekly History</h2>
          <p className="text-gray-500 text-sm">
            Showing {filteredRecords.length} of {records.length} records
          </p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${showFilters || hasActiveFilters ? 'bg-yellow-50 border-yellow-200 text-yellow-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
          >
            <Filter size={16} />
            Filters
            {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-yellow-500"></span>}
          </button>
          
          {records.length > 0 && (
            <button 
              onClick={handleExportPDF}
              className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-900 transition-colors shadow-sm"
            >
              <Download size={16} />
              <span className="hidden sm:inline">Export</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      {(showFilters || hasActiveFilters) && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 animate-fade-in">
           <div className="flex justify-between items-center mb-3">
             <h3 className="text-xs font-semibold uppercase text-gray-600 tracking-wider">Refine Search</h3>
             {hasActiveFilters && (
               <button onClick={clearFilters} className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1">
                 <X size={12} /> Clear All
               </button>
             )}
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
             <div>
               <label className="block text-xs font-bold text-gray-700 mb-1">Status</label>
               <select 
                 className={inputClass}
                 value={filters.status}
                 onChange={e => setFilters({...filters, status: e.target.value})}
               >
                 <option value="all">All Records</option>
                 <option value="completed">Completed Sales</option>
                 <option value="pending">Pending Sales</option>
               </select>
             </div>
             <div>
               <label className="block text-xs font-bold text-gray-700 mb-1">From Date</label>
               <input 
                 type="date"
                 className={inputClass}
                 value={filters.startDate}
                 onChange={e => setFilters({...filters, startDate: e.target.value})}
               />
             </div>
             <div>
               <label className="block text-xs font-bold text-gray-700 mb-1">To Date</label>
               <input 
                 type="date"
                 className={inputClass}
                 value={filters.endDate}
                 onChange={e => setFilters({...filters, endDate: e.target.value})}
               />
             </div>
             <div>
               <label className="block text-xs font-bold text-gray-700 mb-1">Min Profit (₹)</label>
               <input 
                 type="number"
                 placeholder="e.g. 5000"
                 className={inputClass}
                 value={filters.minProfit}
                 onChange={e => setFilters({...filters, minProfit: e.target.value})}
               />
             </div>
           </div>
        </div>
      )}

      {/* Content Area */}
      {filteredRecords.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
          No records match your filters.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          
          {/* Large Screen - Full Detailed Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-100 border-b border-gray-200 text-gray-600 font-semibold uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-4 py-4 sticky left-0 bg-gray-100 z-10">Date</th>
                  <th className="px-4 py-4">Purchase Info</th>
                  <th className="px-4 py-4 text-center">Selling Price</th>
                  <th className="px-4 py-4 text-center">Meat Sold</th>
                  <th className="px-4 py-4 text-center">Wastage</th>
                  <th className="px-4 py-4 text-right">Expenses</th>
                  <th className="px-4 py-4 text-right">Revenue</th>
                  <th className="px-4 py-4 text-right">Profit</th>
                  <th className="px-4 py-4 text-center">Status</th>
                  <th className="px-4 py-4 text-center sticky right-0 bg-gray-100 z-10">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRecords.map(record => (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 font-medium text-gray-900 sticky left-0 bg-white hover:bg-gray-50 align-top">
                      <div>
                        {new Date(record.weekDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      {record.createdAt && (
                        <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                          <Clock size={10} /> {formatTime(record.createdAt)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-gray-600 align-top">
                      <div className="font-medium">{formatNumber(record.totalLiveWeight)} kg <span className="text-gray-400 font-normal">({record.totalHens} hens)</span></div>
                      <div className="text-xs text-gray-400 mt-0.5">@ {formatCurrency(record.purchaseRate)} = {formatCurrency(record.totalPurchaseCost)}</div>
                    </td>
                    <td className="px-4 py-4 text-center text-gray-600 align-top">
                      {record.isSalesEntryComplete ? formatCurrency(record.sellingPrice) : '-'}
                    </td>
                    <td className="px-4 py-4 text-center text-gray-600 align-top">
                      {record.isSalesEntryComplete ? `${formatNumber(record.meatSold)} kg` : '-'}
                    </td>
                    <td className="px-4 py-4 text-center align-top">
                       {record.isSalesEntryComplete ? (
                         <div>
                            <span className="text-red-500 font-medium">{formatNumber(record.wastagePercentage, 1)}%</span>
                            <div className="text-xs text-gray-400">({formatNumber(record.wastage)} kg)</div>
                         </div>
                       ) : '-'}
                    </td>
                     <td className="px-4 py-4 text-right text-gray-600 align-top">
                      {record.isSalesEntryComplete ? formatCurrency(record.totalExpenses) : '-'}
                    </td>
                    <td className="px-4 py-4 text-right text-gray-600 align-top">
                      {record.isSalesEntryComplete ? formatCurrency(record.totalRevenue) : '-'}
                    </td>
                    <td className="px-4 py-4 text-right font-bold align-top">
                       {record.isSalesEntryComplete ? (
                         <span className={(record.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}>
                           {formatCurrency(record.netProfit)}
                         </span>
                       ) : '-'}
                    </td>
                    <td className="px-4 py-4 text-center align-top">
                      {record.isSalesEntryComplete ? (
                        <div className="flex flex-col items-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                            <CheckCircle size={12} /> Complete
                          </span>
                          {record.salesCompletedAt && (
                            <div className="text-[10px] text-gray-400 mt-1">
                              {formatTime(record.salesCompletedAt)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                          <Clock size={12} /> Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center sticky right-0 bg-white hover:bg-gray-50 align-top">
                       <div className="flex items-center justify-center gap-2">
                        {!record.isSalesEntryComplete && (
                          <button onClick={() => onContinue(record)} className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded"><ArrowRight size={16} /></button>
                        )}
                        <button onClick={() => onEdit(record)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => { if(window.confirm('Delete this record?')) onDelete(record.id); }} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile/Tablet Card View */}
          <div className="lg:hidden divide-y divide-gray-100">
            {filteredRecords.map(record => (
              <div key={record.id} className="p-4 bg-white hover:bg-gray-50 transition-colors">
                {/* Header Line */}
                <div className="flex justify-between items-start mb-2">
                   <div className="flex items-center gap-2">
                     <div className="p-1.5 bg-gray-100 rounded-lg">
                       <Calendar size={16} className="text-gray-600" />
                     </div>
                     <div>
                       <span className="font-bold text-gray-800 text-sm block">
                         {new Date(record.weekDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                       </span>
                     </div>
                   </div>
                   <div className="flex flex-col items-end gap-1">
                     {record.isSalesEntryComplete ? 
                       <span className="text-[10px] font-bold px-2 py-0.5 bg-green-100 text-green-700 rounded-full border border-green-200">COMPLETED</span> : 
                       <span className="text-[10px] font-bold px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full border border-yellow-200">PENDING</span>
                     }
                   </div>
                </div>

                {/* Timestamps Row - New Alignment */}
                <div className="flex justify-between items-center px-1 mb-3">
                   <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                     <Clock size={10} /> 
                     <span>Entered: {record.createdAt ? formatTime(record.createdAt) : '--:--'}</span>
                   </div>
                   {record.isSalesEntryComplete && record.salesCompletedAt && (
                      <div className="flex items-center gap-1.5 text-[10px] text-green-600">
                        <CheckCircle size={10} /> 
                        <span>Sold: {formatTime(record.salesCompletedAt)}</span>
                      </div>
                   )}
                </div>

                <div className="space-y-3">
                  {/* Row 1: Purchase Details (Full) */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100 relative">
                      <span className="block text-[10px] text-gray-500 uppercase font-semibold">Live Weight</span>
                      <span className="font-bold text-gray-900 text-sm">{formatNumber(record.totalLiveWeight)} kg</span>
                    </div>
                    <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                      <span className="block text-[10px] text-gray-500 uppercase font-semibold">Hens</span>
                      <span className="font-bold text-gray-900 text-sm">{record.totalHens}</span>
                    </div>
                    <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100 text-right">
                      <span className="block text-[10px] text-gray-500 uppercase font-semibold">Cost</span>
                      <span className="font-bold text-gray-900 text-sm">{formatCurrency(record.totalPurchaseCost)}</span>
                    </div>
                  </div>

                  {record.isSalesEntryComplete ? (
                    <>
                       {/* Row 2: Sales & Wastage Details (Full) */}
                       <div className="grid grid-cols-2 gap-2">
                          <div className="bg-blue-50 p-2.5 rounded-lg border border-blue-100 relative">
                             <div className="flex justify-between items-start">
                               <span className="block text-[10px] text-blue-500 uppercase font-semibold">Meat Sold</span>
                               <span className="text-[10px] text-blue-400">@ {formatCurrency(record.sellingPrice)}</span>
                             </div>
                             <span className="font-bold text-blue-900 text-sm">{formatNumber(record.meatSold)} kg</span>
                          </div>
                          
                          <div className="bg-red-50 p-2.5 rounded-lg border border-red-100">
                             <span className="block text-[10px] text-red-500 uppercase font-semibold">Wastage</span>
                             <div className="flex items-baseline gap-1">
                                <span className="font-bold text-red-900 text-sm">{formatNumber(record.wastagePercentage, 1)}%</span>
                                <span className="text-[10px] text-red-400">({formatNumber(record.wastage)} kg)</span>
                             </div>
                          </div>
                       </div>

                       {/* Row 3: Expenses & Revenue */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-2">
                             <span className="block text-[10px] text-gray-400 uppercase">Expenses</span>
                             <span className="font-medium text-gray-700">{formatCurrency(record.totalExpenses)}</span>
                          </div>
                          <div className="p-2 text-right">
                             <span className="block text-[10px] text-gray-400 uppercase">Revenue</span>
                             <span className="font-bold text-gray-900">{formatCurrency(record.totalRevenue)}</span>
                          </div>
                       </div>

                       {/* Row 4: Net Profit (Highlight) */}
                       <div className={`mt-2 p-3 rounded-lg flex justify-between items-center border ${
                         (record.netProfit || 0) >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                       }`}>
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-full ${(record.netProfit || 0) >= 0 ? 'bg-green-200' : 'bg-red-200'}`}>
                               <TrendingUp size={16} className={(record.netProfit || 0) >= 0 ? 'text-green-700' : 'text-red-700'} />
                            </div>
                            <span className={`text-xs font-bold uppercase ${(record.netProfit || 0) >= 0 ? 'text-green-800' : 'text-red-800'}`}>Net Profit</span>
                          </div>
                          <span className={`text-lg font-bold ${(record.netProfit || 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                            {formatCurrency(record.netProfit)}
                          </span>
                       </div>
                    </>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center mt-2">
                      <p className="text-xs text-yellow-800 font-medium mb-3">Sales entry pending for this week.</p>
                      <button 
                        onClick={() => onContinue(record)}
                        className="w-full flex items-center justify-center gap-2 bg-yellow-500 text-white px-4 py-2.5 rounded-lg text-sm font-bold shadow-sm active:scale-95 transition-all hover:bg-yellow-600"
                      >
                        Enter Sales Details <ChevronRight size={16} />
                      </button>
                    </div>
                  )}

                  {/* Mobile Actions Footer */}
                  <div className="flex justify-end pt-2 border-t border-gray-50 gap-3 mt-3">
                     <button onClick={() => onEdit(record)} className="text-gray-400 hover:text-blue-600 flex items-center gap-1 text-xs px-2 py-1">
                       <Edit2 size={14} /> Edit
                     </button>
                     <button onClick={() => onDelete(record.id)} className="text-gray-400 hover:text-red-600 flex items-center gap-1 text-xs px-2 py-1">
                       <Trash2 size={14} /> Delete
                     </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}
    </div>
  );
};

export default HistoryList;