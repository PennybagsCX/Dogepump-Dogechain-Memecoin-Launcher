import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, AlertTriangle, CheckCircle, DollarSign, BarChart3, Settings } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useStore } from '../contexts/StoreContext';
import { PriceOracleDashboard } from '../components/PriceOracleDashboard';
import { AdminDashboard } from '../components/AdminDashboard';

export const Admin: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { resetStore } = useStore();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'price-oracle'>('overview');

  // Log for debugging
  useEffect(() => {
    console.log('[Admin Page] Location hash:', location.hash);
    console.log('[Admin Page] Full location:', location);
  }, [location]);

  // Get connected wallet address from localStorage (similar to Layout component)
  const [userAddress, setUserAddress] = useState<string | null>(() => {
    return localStorage.getItem('dogepump_address');
  });

  // Admin wallet addresses (stored as lowercase for case-insensitive comparison)
  const ADMIN_WALLETS = [
    '0x22f4194f6706e70abaa14ab352d0baa6c7ced24a'
  ];

  // Simple admin authentication (in production, this would be more secure)
  const ADMIN_ACCESS_CODE = 'admin123';

  // Check if user has admin wallet access
  useEffect(() => {
    if (userAddress) {
      const normalizedAddress = userAddress.toLowerCase();
      if (ADMIN_WALLETS.includes(normalizedAddress)) {
        setIsAuthenticated(true);
      }
    }
  }, [userAddress]);

  const handleAuthenticate = () => {
    if (adminCode === ADMIN_ACCESS_CODE) {
      setIsAuthenticated(true);
    } else if (userAddress) {
      const normalizedAddress = userAddress.toLowerCase();
      if (ADMIN_WALLETS.includes(normalizedAddress)) {
        setIsAuthenticated(true);
      }
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAdminCode('');
    navigate('/');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
        <div className="bg-[#050505] border border-white/10 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
          <div className="text-center mb-6 sm:mb-8">
            <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-4">
              <Shield size={28} className="sm:hidden text-red-500" />
              <Shield size={32} className="hidden sm:block text-red-500" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">Admin Access</h1>
            <p className="text-sm sm:text-base text-gray-400">Enter admin code or connect admin wallet to access moderation dashboard</p>
            {userAddress && ADMIN_WALLETS.includes(userAddress.toLowerCase()) && (
              <div className="mt-2 p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-xs sm:text-sm text-green-400 flex items-center gap-2">
                  <CheckCircle size={12} className="sm:hidden" />
                  <CheckCircle size={14} className="hidden sm:block" />
                  <span className="truncate">{userAddress}</span>
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <input
              id="admin-code"
              name="adminCode"
              type="password"
              value={adminCode}
              onChange={(e) => setAdminCode(e.target.value)}
              placeholder="Enter admin code"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-600 focus:border-white/20 outline-none text-sm"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAuthenticate();
                }
              }}
            />
            <button
              onClick={handleAuthenticate}
              disabled={!adminCode}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
            >
              Access Admin Dashboard
            </button>
          </div>

          <div className="mt-6 p-3 sm:p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle size={14} className="text-yellow-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs sm:text-sm text-yellow-200">
                  <strong>Development Note:</strong> This is a simple authentication system for development purposes.
                  In production, implement proper authentication with session management and role-based access control.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center mt-6">
            <button
              onClick={() => navigate('/')}
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              ← Back to App
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Simple admin dashboard for testing
  return (
    <div className="min-h-screen bg-[#0A0A0A] p-4 sm:p-6">
      <Helmet>
        <title>Admin Dashboard - DogePump</title>
      </Helmet>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <Shield size={28} className="sm:hidden text-red-500" />
            <Shield size={32} className="hidden sm:block text-red-500" />
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Admin Dashboard</h1>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors text-sm sm:text-base"
          >
            Logout
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-[#050505] border border-white/10 rounded-xl p-1 mb-6 overflow-x-auto">
          <div className="flex gap-2 min-w-max sm:min-w-0">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm sm:text-base whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Settings size={16} className="sm:hidden" />
              <Settings size={18} className="hidden sm:inline" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('price-oracle')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm sm:text-base whitespace-nowrap ${
                activeTab === 'price-oracle'
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <DollarSign size={16} className="sm:hidden" />
              <DollarSign size={18} className="hidden sm:inline" />
              Price Oracle
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'price-oracle' ? (
          <PriceOracleDashboard />
        ) : (
          <AdminDashboard onBack={() => navigate('/')} />
        )}
      </div>
    </div>
  );
};

// Add default export for lazy loading
export default Admin;