import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Package } from 'lucide-react';
import { ordersAPI, orderItemsAPI } from '@/api/api';

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const { data: orderData } = await ordersAPI.getById(orderId!);
      const { data: itemsData } = await orderItemsAPI.getByOrder(orderId!);
      setOrder(orderData);
      setItems(itemsData || []);
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="section text-center py-12">
        <p className="text-gray-500">Loading order details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="section max-w-2xl">
        {/* Success Message */}
        <div className="text-center mb-8">
          <CheckCircle className="mx-auto mb-4 text-green-500" size={64} />
          <h1 className="text-4xl font-bold text-secondary mb-2">Order Confirmed!</h1>
          <p className="text-gray-600 text-lg">Thank you for your purchase</p>
        </div>

        {order && (
          <>
            {/* Order Details */}
            <div className="card p-6 mb-6">
              <h2 className="text-2xl font-bold text-secondary mb-4">Order Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600 text-sm">Order Number</p>
                  <p className="font-mono font-bold">{order.id.substring(0, 12)}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Order Date</p>
                  <p className="font-semibold">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Total Amount</p>
                  <p className="text-2xl font-bold text-secondary">
                    ${order.total.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Status</p>
                  <p className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800">
                    Pending
                  </p>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="card p-6 mb-6">
              <h2 className="text-2xl font-bold text-secondary mb-4">Order Items</h2>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center border-b pb-4">
                    <div>
                      <p className="font-semibold">{item.product_id}</p>
                      <p className="text-gray-600 text-sm">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-bold text-secondary">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Steps */}
            <div className="card p-6 mb-6 bg-blue-50 border border-blue-200">
              <div className="flex gap-4">
                <Package className="text-blue-600 flex-shrink-0" size={24} />
                <div>
                  <h3 className="font-bold text-blue-900 mb-2">What's Next?</h3>
                  <p className="text-blue-800 text-sm mb-2">
                    Your order has been received and is being prepared. You'll receive:
                  </p>
                  <ul className="text-blue-800 text-sm space-y-1 ml-4 list-disc">
                    <li>Confirmation email with order details</li>
                    <li>Shipping notification when your order ships</li>
                    <li>Tracking information for your package</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-4">
              <Link to="/orders" className="btn-secondary text-center block">
                View Orders
              </Link>
              <Link to="/products" className="btn-primary text-center block">
                Continue Shopping
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
