import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, LogOut, Trash2, Package } from 'lucide-react';
import { authAPI } from '@/api/api';
import { useAuthStore } from '@/store/store';
import { supabase } from '@/lib/supabase';
import { useToastStore } from '@/store/toastStore';
import { validateName } from '@/utils/validation';

export default function Profile() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const addToast = useToastStore((state) => state.addToast);
  
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (user) {
      setDisplayName(user.user_metadata?.display_name || '');
      setEmail(user.email || '');
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching orders:', error);
    } else {
      setOrders(data || []);
    }
    setLoadingOrders(false);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateName(displayName)) {
      addToast('error', 'Name must be at least 2 characters');
      return;
    }

    setLoading(true);

    const { data, error } = await authAPI.getCurrentUser();
    
    if (!error && data.user) {
      // Update user metadata
      const { error: updateError } = await authAPI.updateRole(data.user.id, user.user_metadata?.role || 'customer');
      
      if (updateError) {
        addToast('error', 'Failed to update profile');
      } else {
        addToast('success', 'Profile updated successfully!');
        setIsEditing(false);
        // Refresh user data
        const { data: newData } = await authAPI.getCurrentUser();
        if (newData.user) {
          setUser(newData.user);
        }
      }
    }
    
    setLoading(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword.length < 8) {
      addToast('error', 'Password must be at least 8 characters');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      addToast('error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    const { error } = await authAPI.updatePassword(newPassword);
    
    if (error) {
      addToast('error', 'Failed to update password');
    } else {
      addToast('success', 'Password updated successfully!');
      setShowChangePassword(false);
      setNewPassword('');
      setConfirmPassword('');
    }
    
    setLoading(false);
  };

  const handleLogout = async () => {
    await authAPI.logout();
    setUser(null);
    addToast('info', 'You have been logged out');
    navigate('/login');
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-accent p-8 text-white">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <User size={40} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{displayName || 'User Profile'}</h1>
                <p className="text-white/80 mt-1">{email}</p>
              </div>
            </div>
          </div>

          {/* Profile Information */}
          <div className="p-8">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <User size={20} className="text-secondary" />
              Profile Information
            </h2>

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div>
                <label htmlFor="display-name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  id="display-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <div className="flex gap-3">
                {!isEditing ? (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="btn-primary"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <>
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary flex items-center gap-2"
                    >
                      {loading && <div className="spinner" />}
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setDisplayName(user.user_metadata?.display_name || '');
                      }}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>

          {/* Order History */}
          <div className="border-t border-gray-200 p-8">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Package size={20} className="text-secondary" />
              Order History
            </h2>

            {loadingOrders ? (
              <div className="text-center py-8">
                <div className="spinner mx-auto mb-2"></div>
                <p className="text-gray-500">Loading orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-500">No orders found</p>
                <button 
                  onClick={() => navigate('/products')}
                  className="text-secondary font-medium mt-2 hover:underline"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="border border-gray-200 rounded-xl p-4 hover:border-secondary transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">Order #{order.id.slice(0, 8)}</p>
                        <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize
                        ${order.status === 'delivered' ? 'bg-green-100 text-green-700' : 
                          order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                          order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <p className="text-gray-600">{order.shipping_address}</p>
                      <p className="font-bold text-secondary">${order.total}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Change Password Section */}
          <div className="border-t border-gray-200 p-8">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Lock size={20} className="text-secondary" />
              Password & Security
            </h2>

            {!showChangePassword ? (
              <button
                onClick={() => setShowChangePassword(true)}
                className="btn-secondary"
              >
                Change Password
              </button>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition-all"
                    minLength={8}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition-all"
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex items-center gap-2"
                  >
                    {loading && <div className="spinner" />}
                    Update Password
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowChangePassword(false);
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Account Actions */}
          <div className="border-t border-gray-200 p-8 bg-gray-50">
            <h2 className="text-xl font-semibold mb-6">Account Actions</h2>
            
            <div className="space-y-3">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-xl transition-all"
              >
                <LogOut size={20} />
                Logout
              </button>
              
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                    addToast('info', 'Account deletion is not yet implemented');
                  }
                }}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-xl transition-all border border-red-200"
              >
                <Trash2 size={20} />
                Delete Account
              </button>
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="mt-6 p-4 bg-white rounded-xl border border-gray-200">
          <h3 className="font-medium text-gray-700 mb-2">Account Information</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Role:</strong> {user.user_metadata?.role || 'Customer'}</p>
            <p><strong>Account created:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
            <p><strong>Email verified:</strong> {user.email_confirmed_at ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
