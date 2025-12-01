import React, { useState, useEffect } from 'react';
import { WeeklyRecord } from '../types';
import { AlertCircle, CheckCircle } from 'lucide-react';

// Helper to get local date string YYYY-MM-DD (Fixes timezone issues with ISOString)
const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface PurchaseFormProps {
  existingRecord?: WeeklyRecord;
  onSave: (record: WeeklyRecord) => void;
  onCancel: () => void;
}

const PurchaseForm: React.FC<PurchaseFormProps> = ({ existingRecord, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    date: getTodayDate(),
    totalHens: '',
    totalLiveWeight: '',
    purchaseRate: ''
  });

  const [errors, setErrors] = useState<{
    date?: string;
    totalHens?: string;
    totalLiveWeight?: string;
    purchaseRate?: string;
  }>({});

  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (existingRecord) {
      setFormData({
        date: existingRecord.weekDate,
        totalHens: existingRecord.totalHens.toString(),
        totalLiveWeight: existingRecord.totalLiveWeight.toString(),
        purchaseRate: existingRecord.purchaseRate.toString()
      });
    }
  }, [existingRecord]);

  const validate = () => {
    const newErrors: typeof errors = {};
    let isValid = true;

    if (!formData.date) {
      newErrors.date = 'Date is required';
      isValid = false;
    }

    const hens = Number(formData.totalHens);
    if (!formData.totalHens || hens <= 0 || !Number.isInteger(hens)) {
      newErrors.totalHens = 'Must be a positive whole number';
      isValid = false;
    }

    const weight = Number(formData.totalLiveWeight);
    if (!formData.totalLiveWeight || weight <= 0) {
      newErrors.totalLiveWeight = 'Weight must be greater than 0';
      isValid = false;
    }

    const rate = Number(formData.purchaseRate);
    if (!formData.purchaseRate || rate <= 0) {
      newErrors.purchaseRate = 'Rate must be greater than 0';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    // IMPORTANT: For new records, we do NOT generate an ID here.
    // We pass an empty string (or undefined logic handled in service)
    // The Backend Database (MongoDB) will generate the unique _id.
    const record: WeeklyRecord = {
      id: existingRecord?.id || '', 
      weekDate: formData.date,
      totalHens: Number(formData.totalHens),
      totalLiveWeight: Number(formData.totalLiveWeight),
      purchaseRate: Number(formData.purchaseRate),
      totalPurchaseCost: 0, // Calculated by backend/service
      
      // Capture timestamp
      createdAt: existingRecord?.createdAt || new Date().toISOString(),
      
      // Preserve existing data if editing, or set defaults
      isSalesEntryComplete: existingRecord?.isSalesEntryComplete || false,
      salesCompletedAt: existingRecord?.salesCompletedAt,
      sellingPrice: existingRecord?.sellingPrice,
      cashCollected: existingRecord?.cashCollected,
      upiCollected: existingRecord?.upiCollected,
      expenseTea: existingRecord?.expenseTea,
      expenseFuel: existingRecord?.expenseFuel,
    };

    // Show success message before proceeding
    setShowSuccess(true);
    
    // Delay actual save to let user see the success message
    setTimeout(() => {
      onSave(record);
    }, 1500);
  };

  const calculatedCost = (Number(formData.totalLiveWeight) || 0) * (Number(formData.purchaseRate) || 0);

  const getInputClass = (error?: string) => 
    `w-full p-3 bg-white text-gray-900 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${
      error 
        ? 'border-red-300 focus:ring-red-200 focus:border-red-400' 
        : 'border-gray-300 focus:ring-yellow-500 focus:border-yellow-500'
    }`;

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden max-w-lg mx-auto relative">
      
      {/* Success Overlay */}
      {showSuccess && (
        <div className="absolute inset-0 bg-white bg-opacity-95 flex flex-col items-center justify-center z-50 transition-all duration-300 animate-fade-in">
          <div className="bg-green-100 p-4 rounded-full mb-4 animate-bounce">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Purchase Saved!</h3>
          <p className="text-gray-500">Redirecting to dashboard...</p>
        </div>
      )}

      <div className="bg-gray-800 p-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          🐓 Purchase Entry
        </h2>
        <p className="text-gray-300 text-sm mt-1">Enter supplier details for the week.</p>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 space-y-5" noValidate>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input 
            type="date" 
            className={getInputClass(errors.date)}
            style={{ colorScheme: 'light' }}
            value={formData.date}
            onChange={e => setFormData({...formData, date: e.target.value})}
          />
          {errors.date && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={12}/> {errors.date}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Hens</label>
            <input 
              type="number" 
              className={getInputClass(errors.totalHens)}
              placeholder="Qty"
              value={formData.totalHens}
              onChange={e => setFormData({...formData, totalHens: e.target.value})}
            />
            {errors.totalHens && <p className="text-xs text-red-500 mt-1">{errors.totalHens}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Live Weight (kg)</label>
            <input 
              type="number" 
              className={getInputClass(errors.totalLiveWeight)}
              placeholder="0.00 kg"
              value={formData.totalLiveWeight}
              onChange={e => setFormData({...formData, totalLiveWeight: e.target.value})}
            />
            {errors.totalLiveWeight && <p className="text-xs text-red-500 mt-1">{errors.totalLiveWeight}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Rate (₹/kg)</label>
          <div className="relative">
            <span className="absolute left-3 top-3 text-gray-400">₹</span>
            <input 
              type="number" 
              className={`${getInputClass(errors.purchaseRate)} pl-8`}
              placeholder="0.00"
              value={formData.purchaseRate}
              onChange={e => setFormData({...formData, purchaseRate: e.target.value})}
            />
          </div>
          {errors.purchaseRate && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={12}/> {errors.purchaseRate}</p>}
        </div>

        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex justify-between items-center">
          <span className="text-sm text-gray-600">Estimated Cost:</span>
          <span className="text-lg font-bold text-gray-800">
            {calculatedCost.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
          </span>
        </div>

        <div className="flex gap-3 pt-2">
          <button 
            type="button" 
            onClick={onCancel}
            className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="flex-1 py-3 px-4 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900 transition-colors shadow-md"
          >
            Save Purchase
          </button>
        </div>
      </form>
    </div>
  );
};

export default PurchaseForm;