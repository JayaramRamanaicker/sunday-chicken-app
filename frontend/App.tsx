import React, { useState, useEffect } from 'react';
import { WeeklyRecord, AppView, User } from './types';
import * as Storage from './services/storageService';
import * as AuthService from './services/authService';
import Dashboard from './components/Dashboard';
import PurchaseForm from './components/PurchaseForm';
import SalesForm from './components/SalesForm';
import HistoryList from './components/HistoryList';
import AuthForm from './components/AuthForm';
import { LayoutDashboard, History, PlusCircle, AlertTriangle, LogOut } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);
  const [records, setRecords] = useState<WeeklyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeRecord, setActiveRecord] = useState<WeeklyRecord | undefined>(undefined);

  // Initial Load (Auth Check)
  useEffect(() => {
    const currentUser = AuthService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      loadData();
    } else {
      setLoading(false);
    }
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await Storage.getRecords();
      setRecords(data);
    } catch (err) {
      setError("Failed to load records. Is the backend running?");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (user: User) => {
    setUser(user);
    loadData();
  };

  const handleLogout = () => {
    AuthService.logout();
    setUser(null);
    setRecords([]);
    setView(AppView.DASHBOARD);
  };

  const handleSavePurchase = async (record: WeeklyRecord) => {
    setLoading(true);
    try {
      const savedRecord = await Storage.saveRecord(record);
      await loadData();
      // Redirect directly to Sales Entry for the just-created record
      setActiveRecord(savedRecord);
      setView(AppView.ENTRY_SALES);
    } catch (err) {
      alert("Failed to save purchase. Please try again.");
      setLoading(false);
    }
  };

  const handleSaveSales = async (record: WeeklyRecord) => {
    setLoading(true);
    try {
      await Storage.saveRecord(record);
      await loadData();
      setView(AppView.DASHBOARD);
      setActiveRecord(undefined);
    } catch (err) {
      alert("Failed to save sales data. Please try again.");
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await Storage.deleteRecord(id);
      await loadData();
    } catch (err) {
      alert("Failed to delete record.");
    }
  };

  const startPurchaseEntry = () => {
    setActiveRecord(undefined);
    setView(AppView.ENTRY_PURCHASE);
  };

  const startSalesEntry = () => {
    const incomplete = records.find(r => !r.isSalesEntryComplete);
    if (incomplete) {
      setActiveRecord(incomplete);
      setView(AppView.ENTRY_SALES);
    } else {
      alert("No pending Purchase records found. Please enter Purchase data first.");
      setView(AppView.ENTRY_PURCHASE);
    }
  };

  const handleEdit = (record: WeeklyRecord) => {
    setActiveRecord(record);
    if (record.isSalesEntryComplete) {
       setView(AppView.ENTRY_SALES);
    } else {
       setView(AppView.ENTRY_PURCHASE);
    }
  };

  const handleHistoryContinue = (record: WeeklyRecord) => {
    setActiveRecord(record);
    setView(AppView.ENTRY_SALES);
  };

  if (!user) {
    return <AuthForm onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-gradient-to-br from-yellow-600 to-yellow-400 rounded-xl flex items-center justify-center shadow-md text-2xl border border-yellow-200">
               🐔
             </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900 leading-none">Sunday's Chicken</h1>
              <p className="text-xs text-gray-400 mt-1 hidden sm:block">Business Management Portal • {user.name}</p>
              <p className="text-xs text-gray-400 mt-1 sm:hidden">{user.name}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-gray-100">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8" style={{ minHeight: 'calc(100vh - 140px)' }}>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
          </div>
        ) : error ? (
           <div className="flex flex-col justify-center items-center h-64 text-center">
             <AlertTriangle className="w-12 h-12 text-red-400 mb-2" />
             <p className="text-gray-600 font-medium">{error}</p>
             <button onClick={loadData} className="mt-4 px-4 py-2 bg-gray-200 rounded-lg text-sm font-medium hover:bg-gray-300">Retry</button>
           </div>
        ) : (
          <>
            {view === AppView.DASHBOARD && (
              <Dashboard 
                records={records} 
                onAddPurchase={startPurchaseEntry}
                onAddSales={startSalesEntry}
              />
            )}
            
            {view === AppView.HISTORY && (
              <HistoryList 
                records={records} 
                onEdit={handleEdit} 
                onDelete={handleDelete}
                onContinue={handleHistoryContinue}
              />
            )}

            {view === AppView.ENTRY_PURCHASE && (
              <PurchaseForm 
                existingRecord={activeRecord}
                onSave={handleSavePurchase}
                onCancel={() => setView(AppView.DASHBOARD)}
              />
            )}

            {view === AppView.ENTRY_SALES && activeRecord && (
              <SalesForm 
                record={activeRecord}
                onSave={handleSaveSales}
                onCancel={() => setView(AppView.DASHBOARD)}
              />
            )}
          </>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 pb-4 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="max-w-7xl mx-auto flex justify-around md:justify-center md:gap-32 items-center h-16 px-4">
          <button 
            onClick={() => setView(AppView.DASHBOARD)}
            className={`flex flex-col items-center gap-1 w-16 transition-colors ${view === AppView.DASHBOARD ? 'text-yellow-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <LayoutDashboard size={20} />
            <span className="text-xs font-medium">Home</span>
          </button>

          <div className="relative -top-5">
            <button 
              onClick={startPurchaseEntry}
              className="bg-gray-900 text-white rounded-full p-4 shadow-xl hover:bg-gray-800 hover:scale-105 transition-all transform active:scale-95 border-4 border-gray-50"
            >
              <PlusCircle size={24} />
            </button>
          </div>

          <button 
            onClick={() => setView(AppView.HISTORY)}
            className={`flex flex-col items-center gap-1 w-16 transition-colors ${view === AppView.HISTORY ? 'text-yellow-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <History size={20} />
            <span className="text-xs font-medium">History</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default App;