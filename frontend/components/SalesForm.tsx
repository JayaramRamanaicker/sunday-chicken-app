import React, { useState } from 'react';
import { WeeklyRecord } from '../types';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface SalesFormProps {
  record: WeeklyRecord; // Sales MUST be attached to a Saturday record
  onSave: (record: WeeklyRecord) => void;
  onCancel: () => void;
}

const SalesForm: React.FC<SalesFormProps> = ({ record, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    // Editable Purchase Info
    totalHens: record.totalHens.toString(),
    totalLiveWeight: record.totalLiveWeight.toString(),
    purchaseRate: record.purchaseRate.toString(),

    // Sales Info
    sellingPrice: record.sellingPrice?.toString() || '',
    cashCollected: record.cashCollected?.toString() || '',
    upiCollected: record.upiCollected?.toString() || '',
    expenseTea: record.expenseTea?.toString() || '',
    expenseFuel: record.expenseFuel?.toString() || '',
  });

  const [errors, setErrors] = useState<{
    totalHens?: string;
    totalLiveWeight?: string;
    purchaseRate?: string;
    sellingPrice?: string;
    cashCollected?: string;
    upiCollected?: string;
    expenseTea?: string;
    expenseFuel?: string;
    general?: string;
  }>({});

  const [showSuccess, setShowSuccess] = useState(false);

  const validate = () => {
    const newErrors: typeof errors = {};
    let isValid = true;

    // Validate Purchase Fields (Hens, Weight, Rate)
    const hens = Number(formData.totalHens);
    if (!formData.totalHens || hens <= 0 || !Number.isInteger(hens)) {
      newErrors.totalHens = 'Must be a positive whole number';
      isValid = false;
    }

    const weight = Number(formData.totalLiveWeight);
    if (!formData.totalLiveWeight || weight <= 0) {
      newErrors.totalLiveWeight = 'Weight must be > 0';
      isValid = false;
    }

    const rate = Number(formData.purchaseRate);
    if (!formData.purchaseRate || rate <= 0) {
      newErrors.purchaseRate = 'Rate must be > 0';
      isValid = false;
    }

    // Validate Selling Price
    const price = Number(formData.sellingPrice);
    if (!formData.sellingPrice || price <= 0) {
      newErrors.sellingPrice = 'Price must be greater than 0';
      isValid = false;
    }

    // Validate Collections
    if (Number(formData.cashCollected) < 0) {
      newErrors.cashCollected = 'Cannot be negative';
      isValid = false;
    }
    if (Number(formData.upiCollected) < 0) {
      newErrors.upiCollected = 'Cannot be negative';
      isValid = false;
    }

    // Ensure at least some revenue is entered if price is set
    if (price > 0 && (Number(formData.cashCollected) + Number(formData.upiCollected) <= 0)) {
        newErrors.general = 'Total revenue (Cash + UPI) must be greater than 0';
        isValid = false;
    }

    // Validate Expenses
    if (Number(formData.expenseTea) < 0) {
      newErrors.expenseTea = 'Invalid';
      isValid = false;
    }
    if (Number(formData.expenseFuel) < 0) {
      newErrors.expenseFuel = 'Invalid';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    const updatedRecord: WeeklyRecord = {
      ...record,
      // Update Purchase Details if changed
      totalHens: Number(formData.totalHens),
      totalLiveWeight: Number(formData.totalLiveWeight),
      purchaseRate: Number(formData.purchaseRate),
      
      // Sales Details
      isSalesEntryComplete: true,
      salesCompletedAt: new Date().toISOString(), // Capture completion time
      sellingPrice: Number(formData.sellingPrice),
      cashCollected: Number(formData.cashCollected),
      upiCollected: Number(formData.upiCollected),
      expenseTea: Number(formData.expenseTea),
      expenseFuel: Number(formData.expenseFuel),
    };

    // Show success message before proceeding
    setShowSuccess(true);
    
    // Delay actual save to let user see the success message
    setTimeout(() => {
      onSave(updatedRecord);
    }, 1500);
  };

  const revenue = Number(formData.cashCollected) + Number(formData.upiCollected);
  const estMeatSold = Number(formData.sellingPrice) > 0 ? revenue / Number(formData.sellingPrice) : 0;
  const currentLiveWeight = Number(formData.totalLiveWeight) || 0;

  const getInputClass = (error?: string) => 
    `w-full bg-white text-gray-900 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${
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
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Sales Saved!</h3>
          <p className="text-gray-500">Redirecting to dashboard...</p>
        </div>
      )}

      <div className="bg-yellow-500 p-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          💰 Sold Entry
        </h2>
        <p className="text-yellow-100 text-sm mt-1">
          Completing week of {new Date(record.weekDate).toLocaleDateString()}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5" noValidate>
        
        {/* Editable Purchase Info */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-3">
             <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Purchase Info (Editable)</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Hens</label>
              <input 
                type="number"
                className={`${getInputClass(errors.totalHens)} p-2 text-sm`}
                value={formData.totalHens}
                onChange={e => setFormData({...formData, totalHens: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Weight (kg)</label>
              <input 
                type="number"
                className={`${getInputClass(errors.totalLiveWeight)} p-2 text-sm`}
                value={formData.totalLiveWeight}
                onChange={e => setFormData({...formData, totalLiveWeight: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Rate (₹)</label>
              <input 
                type="number"
                className={`${getInputClass(errors.purchaseRate)} p-2 text-sm`}
                value={formData.purchaseRate}
                onChange={e => setFormData({...formData, purchaseRate: e.target.value})}
              />
            </div>
          </div>
          {(errors.totalHens || errors.totalLiveWeight || errors.purchaseRate) && (
            <p className="text-xs text-red-500 mt-2">Please check purchase values above.</p>
          )}
        </div>

        {/* Revenue Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-yellow-600 uppercase tracking-wider">Revenue</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (₹/kg)</label>
            <input 
              type="number" step="0.01"
              className={`${getInputClass(errors.sellingPrice)} p-3`}
              value={formData.sellingPrice}
              onChange={e => setFormData({...formData, sellingPrice: e.target.value})}
            />
             {errors.sellingPrice && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={12}/> {errors.sellingPrice}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cash</label>
              <input 
                type="number"
                className={`${getInputClass(errors.cashCollected)} p-3`}
                value={formData.cashCollected}
                onChange={e => setFormData({...formData, cashCollected: e.target.value})}
              />
              {errors.cashCollected && <p className="text-xs text-red-500 mt-1">{errors.cashCollected}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">UPI</label>
              <input 
                type="number"
                className={`${getInputClass(errors.upiCollected)} p-3`}
                value={formData.upiCollected}
                onChange={e => setFormData({...formData, upiCollected: e.target.value})}
              />
               {errors.upiCollected && <p className="text-xs text-red-500 mt-1">{errors.upiCollected}</p>}
            </div>
          </div>
          {errors.general && <p className="text-sm text-red-500 bg-red-50 p-2 rounded text-center border border-red-100">{errors.general}</p>}
        </div>

        <div className="border-t border-gray-100 my-4"></div>

        {/* Expenses Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-red-500 uppercase tracking-wider">Shop Expenses</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tea/Snacks</label>
              <input 
                type="number"
                className={`${getInputClass(errors.expenseTea)} p-2 text-sm`}
                value={formData.expenseTea}
                onChange={e => setFormData({...formData, expenseTea: e.target.value})}
              />
              {errors.expenseTea && <p className="text-xs text-red-500 mt-1">{errors.expenseTea}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Fuel</label>
              <input 
                type="number"
                className={`${getInputClass(errors.expenseFuel)} p-2 text-sm`}
                value={formData.expenseFuel}
                onChange={e => setFormData({...formData, expenseFuel: e.target.value})}
              />
              {errors.expenseFuel && <p className="text-xs text-red-500 mt-1">{errors.expenseFuel}</p>}
            </div>
          </div>
        </div>

        {/* Live Validations */}
        <div className="bg-yellow-50 p-4 rounded-lg space-y-2 mt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Total Revenue:</span>
            <span className="font-semibold">{revenue.toLocaleString('en-IN', {style: 'currency', currency: 'INR'})}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Est. Meat Sold:</span>
            <span className="font-semibold">{estMeatSold.toFixed(2)} kg</span>
          </div>
          {estMeatSold > currentLiveWeight && (
             <div className="text-red-600 text-xs font-bold pt-1 flex items-center gap-1">
               <AlertCircle size={14}/> Warning: Meat sold exceeds live weight!
             </div>
          )}
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
            className="flex-1 py-3 px-4 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition-colors shadow-md"
          >
            Submit Week
          </button>
        </div>
      </form>
    </div>
  );
};

export default SalesForm;