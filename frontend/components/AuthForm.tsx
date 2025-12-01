import React, { useState } from 'react';
import { User } from '../types';
import * as AuthService from '../services/authService';
import { Loader, Lock, Mail } from 'lucide-react';

interface AuthFormProps {
  onLoginSuccess: (user: User) => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onLoginSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const user = await AuthService.login(formData.email, formData.password);
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-8 text-center">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-4xl shadow-inner border border-white border-opacity-30">
            🐔
          </div>
          <h1 className="text-2xl font-bold text-white">Sunday's Chicken</h1>
          <p className="text-yellow-100 text-sm mt-1">Admin Portal</p>
        </div>

        <div className="p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">
            Admin Login
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center justify-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="admin@sundayschicken.com"
                  className="w-full pl-10 p-3 bg-gray-50 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none transition-all"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Password</label>
              <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 p-3 bg-gray-50 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none transition-all"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white py-3 rounded-lg font-bold shadow-md hover:bg-gray-800 transition-all transform active:scale-[0.98] flex justify-center items-center gap-2 mt-6"
            >
              {loading ? <Loader className="animate-spin w-5 h-5" /> : 'Sign In'}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">Restricted Access • Authorized Personnel Only</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;