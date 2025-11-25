/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersAPI, productsAPI } from '@/api/api';
import { BarChart3, ShoppingCart, Package, TrendingUp } from 'lucide-react';

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  monthlyRevenue: number;
}

interface Order {
  id: string;
  user_id: string;
  total: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    monthlyRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [revenueData, setRevenueData] = useState<{ date: string; amount: number }[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data: orders } = await ordersAPI.getAll();
      const { data: products } = await productsAPI.getAll();

      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const totalOrders = orders?.length || 0;
      const totalRevenue = orders?.reduce((sum: number, o: Order) => sum + o.total, 0) || 0;
      const monthlyRevenue =
        orders?.reduce((sum: number, o: Order) => {
          if (new Date(o.created_at) >= thisMonth) return sum + o.total;
          return sum;
        }, 0) || 0;
      const totalProducts = products?.length || 0;

      setStats({
        totalOrders,
        totalRevenue,
        totalProducts,
        monthlyRevenue,
      });

      setRecentOrders(orders?.slice(0, 5) || []);

      // Calculate last 7 days revenue
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
      }).reverse();

      const dailyRevenue = last7Days.map((date) => {
        const amount = orders
          ?.filter((o: Order) => o.created_at.startsWith(date))
          .reduce((sum: number, o: Order) => sum + o.total, 0) || 0;
        return { date, amount };
      });

      setRevenueData(dailyRevenue);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  interface StatCardProps {
    icon: React.ComponentType<{ className?: string; size?: number }>;
    label: string;
    value: string | number;
    color: string;
  }

  const StatCard = ({ icon: Icon, label, value, color }: StatCardProps) => (
    <div className="card p-6 flex items-start gap-4">
      <div className={`p-4 rounded-lg ${color}`}>
        <Icon className="text-white" size={24} />
      </div>
      <div>
        <p className="text-gray-600 text-sm">{label}</p>
        <p className="text-3xl font-bold text-secondary">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="section">
        <h1 className="text-3xl font-bold text-secondary mb-8">Dashboard</h1>

        {loading ? (
          // ... (loading state)
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary mx-auto mb-4"></div>
            <p className="text-gray-500">Loading dashboard...</p>
          </div>
        ) : error ? (
          // ... (error state)
          <div className="card p-8 text-center">
             {/* ... error content */}
             <p className="text-red-500">{error}</p>
             <button onClick={fetchDashboardData} className="btn-primary mt-4">Try Again</button>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                icon={ShoppingCart}
                label="Total Orders"
                value={stats.totalOrders}
                color="bg-blue-500"
              />
              <StatCard
                icon={BarChart3}
                label="Total Revenue"
                value={`$${stats.totalRevenue.toFixed(2)}`}
                color="bg-green-500"
              />
              <StatCard
                icon={Package}
                label="Total Products"
                value={stats.totalProducts}
                color="bg-secondary"
              />
              <StatCard
                icon={TrendingUp}
                label="Monthly Revenue"
                value={`$${stats.monthlyRevenue.toFixed(2)}`}
                color="bg-purple-500"
              />
            </div>

            {/* Revenue Chart */}
            <div className="card p-6 mb-8">
              <h2 className="text-xl font-bold text-secondary mb-6">Revenue Overview (Last 7 Days)</h2>
              <div className="h-64 flex items-end justify-between gap-2">
                {revenueData.map((day) => {
                  const maxAmount = Math.max(...revenueData.map((d) => d.amount), 100); // Avoid division by zero
                  const heightPercentage = (day.amount / maxAmount) * 100;
                  
                  return (
                    <div key={day.date} className="flex flex-col items-center flex-1 group">
                      <div className="relative w-full flex justify-center items-end h-full">
                         <div 
                           className="w-full max-w-[40px] bg-secondary/80 rounded-t-md hover:bg-secondary transition-all relative group-hover:shadow-lg"
                           style={{ height: `${Math.max(heightPercentage, 2)}%` }} // Min height for visibility
                         >
                           <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                             ${day.amount.toFixed(2)}
                           </div>
                         </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 rotate-0 sm:rotate-0">
                        {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' })}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Orders */}
            <div className="card p-6">
              {/* ... (recent orders table) */}
              <h2 className="text-2xl font-bold text-secondary mb-4">Recent Orders</h2>
              {recentOrders.length === 0 ? (
                <p className="text-gray-500">No orders yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100 border-b">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold">Order ID</th>
                        <th className="px-4 py-2 text-left font-semibold">Amount</th>
                        <th className="px-4 py-2 text-left font-semibold">Status</th>
                        <th className="px-4 py-2 text-left font-semibold">Date</th>
                        <th className="px-4 py-2 text-left font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((order) => (
                        <tr key={order.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-2 font-mono text-sm">{order.id.substring(0, 8)}</td>
                          <td className="px-4 py-2 font-bold text-secondary">
                            ${order.total.toFixed(2)}
                          </td>
                          <td className="px-4 py-2">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                order.status === 'delivered'
                                  ? 'bg-green-100 text-green-800'
                                  : order.status === 'shipped'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {order.status}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-sm">
                            {new Date(order.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2">
                            <button
                              onClick={() => navigate(`/admin/orders`)} // Navigate to orders list
                              className="text-secondary hover:underline font-semibold"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
