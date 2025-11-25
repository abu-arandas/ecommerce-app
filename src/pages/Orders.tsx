import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Clock, CheckCircle, XCircle, Truck, Eye } from 'lucide-react';
import { ordersAPI, orderItemsAPI } from '@/api/api';
import { useAuthStore } from '@/store/store';
import { useToastStore } from '@/store/toastStore';

interface Order {
  id: string;
  total: number;
  status: string;
  created_at: string;
  shipping_address: string;
  updated_at: string;
}

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
}

export default function Orders() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const addToast = useToastStore((state) => state.addToast);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<{ [key: string]: OrderItem[] }>({});
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await ordersAPI.getByUser(user.id);
      if (error) throw error;
      setOrders(data || []);
    } catch (err: any) {
      addToast('error', 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderItems = async (orderId: string) => {
    if (orderItems[orderId]) {
      setSelectedOrder(selectedOrder === orderId ? null : orderId);
      return;
    }

    try {
      const { data, error } = await orderItemsAPI.getByOrder(orderId);
      if (error) throw error;
      setOrderItems({ ...orderItems, [orderId]: data || [] });
      setSelectedOrder(orderId);
    } catch (err: any) {
      addToast('error', 'Failed to load order items');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="text-yellow-600" size={20} />;
      case 'processing':
        return <Package className="text-blue-600" size={20} />;
      case 'shipped':
        return <Truck className="text-purple-600" size={20} />;
      case 'delivered':
        return <CheckCircle className="text-green-600" size={20} />;
      case 'cancelled':
      case 'refunded':
        return <XCircle className="text-red-600" size={20} />;
      default:
        return <Package className="text-gray-600" size={20} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
      case 'refunded':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredOrders = filterStatus === 'all'
    ? orders
    : orders.filter(order => order.status === filterStatus);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p className="text-gray-600">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-secondary mb-2">My Orders</h1>
          <p className="text-gray-600">View and track all your orders</p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filterStatus === status
                    ? 'bg-secondary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Package size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Orders Found</h3>
            <p className="text-gray-500 mb-6">
              {filterStatus === 'all'
                ? "You haven't placed any orders yet."
                : `No ${filterStatus} orders found.`}
            </p>
            <button
              onClick={() => navigate('/products')}
              className="btn-primary inline-block"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Order Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-700">
                          Order #{order.id.substring(0, 8).toUpperCase()}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {getStatusIcon(order.status)}
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        Placed on {new Date(order.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Total</p>
                        <p className="text-2xl font-bold text-secondary">
                          ${order.total.toFixed(2)}
                        </p>
                      </div>
                      <button
                        onClick={() => fetchOrderItems(order.id)}
                        className="btn-secondary flex items-center gap-2"
                      >
                        <Eye size={18} />
                        {selectedOrder === order.id ? 'Hide' : 'View'} Details
                      </button>
                    </div>
                  </div>
                </div>

                {/* Order Details (Expandable) */}
                {selectedOrder === order.id && (
                  <div className="p-6 bg-gray-50">
                    <h4 className="font-semibold text-gray-700 mb-4">Order Items</h4>
                    {orderItems[order.id] && orderItems[order.id].length > 0 ? (
                      <div className="space-y-3">
                        {orderItems[order.id].map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between bg-white p-4 rounded-lg"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-gray-700">Product ID: {item.product_id.substring(0, 8)}</p>
                              <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                            </div>
                            <p className="font-semibold text-gray-700">
                              ${(item.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">Loading items...</p>
                    )}

                    {/* Shipping Address */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h4 className="font-semibold text-gray-700 mb-2">Shipping Address</h4>
                      <p className="text-gray-600 whitespace-pre-line">{order.shipping_address}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
