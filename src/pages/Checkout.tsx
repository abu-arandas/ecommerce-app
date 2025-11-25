import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useAuthStore, useCartStore } from '@/store/store';
import { ordersAPI, orderItemsAPI } from '@/api/api';
import { StripePaymentForm } from '@/components/StripePaymentForm';

// Initialize Stripe (using test key for now)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_TGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');

function CheckoutContent() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const cartItems = useCartStore((state) => state.items);
  const cartTotal = useCartStore((state) => state.total);
  const clearCart = useCartStore((state) => state.clearCart);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    address: '',
    city: '',
    postalCode: '',
    phone: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentStep, setPaymentStep] = useState<'shipping' | 'payment'>('shipping');

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/checkout');
    }

    if (cartItems.length === 0) {
      navigate('/cart');
    }
  }, [user, cartItems, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentStep('payment');
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    setLoading(true);
    setError('');

    try {
      if (!user?.id) {
        throw new Error('You must be logged in to place an order');
      }

      // Prepare shipping address
      const shippingAddress = `${formData.firstName} ${formData.lastName}, ${formData.address}, ${formData.city}, ${formData.postalCode}. Phone: ${formData.phone}`;

      // Calculate totals
      const shipping = cartTotal() > 100 ? 0 : 10;
      const tax = cartTotal() * 0.08;
      const total = cartTotal() + shipping + tax;

      // Create order with payment info
      const orderData = {
        user_id: user.id,
        total,
        status: 'processing',
        payment_status: 'succeeded',
        payment_intent_id: paymentIntentId,
        payment_method: 'card',
        shipping_address: shippingAddress,
        notes: formData.notes || null,
      };

      const { data: order, error: orderError } = await ordersAPI.create(orderData);

      if (orderError || !order?.[0]) {
        throw new Error('Failed to create order');
      }

      // Create order items
      const orderItemsData = cartItems.map((item) => ({
        order_id: order[0].id,
        product_id: item.productId,
        quantity: item.quantity,
        price: item.price,
      }));

      const { error: itemsError } = await orderItemsAPI.create(orderItemsData);
      if (itemsError) {
        throw new Error('Failed to add items to order');
      }

      // Clear cart and redirect
      clearCart();
      navigate(`/order-confirmation/${order[0].id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to process order');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentError = (error: string) => {
    setError(error);
  };

  const shipping = cartTotal() > 100 ? 0 : 10;
  const tax = cartTotal() * 0.08;
  const total = cartTotal() + shipping + tax;

  return (
    <div className="min-h-screen bg-white">
      <div className="section">
        <h1 className="text-3xl font-bold text-secondary mb-8">Checkout</h1>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            {/* Progress Steps */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center gap-4">
                <div className={`flex items-center gap-2 ${paymentStep === 'shipping' ? 'text-secondary' : 'text-green-600'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${paymentStep === 'shipping' ? 'bg-secondary text-white' : 'bg-green-600 text-white'}`}>
                    {paymentStep === 'payment' ? '✓' : '1'}
                  </div>
                  <span className="font-semibold">Shipping</span>
                </div>
                <div className="w-16 h-0.5 bg-gray-300"></div>
                <div className={`flex items-center gap-2 ${paymentStep === 'payment' ? 'text-secondary' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${paymentStep === 'payment' ? 'bg-secondary text-white' : 'bg-gray-300 text-gray-600'}`}>
                    2
                  </div>
                  <span className="font-semibold">Payment</span>
                </div>
              </div>
            </div>

            {paymentStep === 'shipping' ? (
              <form onSubmit={handleShippingSubmit} className="space-y-6">
                {/* Shipping Information */}
                <div className="card p-6">
                  <h2 className="text-2xl font-bold text-secondary mb-4">Shipping Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="First Name"
                      className="input"
                      required
                    />
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Last Name"
                      className="input"
                      required
                    />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Email"
                      className="input md:col-span-2"
                      required
                    />
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Street Address"
                      className="input md:col-span-2"
                      required
                    />
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="City"
                      className="input"
                      required
                    />
                    <input
                      type="text"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleChange}
                      placeholder="Postal Code"
                      className="input"
                      required
                    />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Phone Number"
                      className="input md:col-span-2"
                      required
                    />
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                      placeholder="Delivery notes (optional)"
                      className="input md:col-span-2"
                      rows={3}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary w-full text-lg py-3"
                >
                  Continue to Payment
                </button>
              </form>
            ) : (
              <div className="space-y-6">
                {/* Payment Section */}
                <div className="card p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-secondary">Payment</h2>
                    <button
                      onClick={() => setPaymentStep('shipping')}
                      className="text-sm text-secondary hover:underline"
                    >
                      ← Edit Shipping
                    </button>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <h3 className="font-semibold mb-2">Shipping to:</h3>
                    <p className="text-sm text-gray-600">
                      {formData.firstName} {formData.lastName}<br />
                      {formData.address}<br />
                      {formData.city}, {formData.postalCode}<br />
                      {formData.phone}
                    </p>
                  </div>

                  <StripePaymentForm
                    amount={total}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                    disabled={loading}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-4">
              <h2 className="text-2xl font-bold text-secondary mb-4">Order Summary</h2>

              <div className="space-y-3 max-h-80 overflow-y-auto mb-4">
                {cartItems.map((item) => (
                  <div key={item.productId} className="flex justify-between text-sm">
                    <span>
                      {item.name} x {item.quantity}
                    </span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>${cartTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-secondary">${total.toFixed(2)}</span>
                </div>
              </div>

              {shipping > 0 && (
                <div className="mt-4 text-xs text-gray-500 bg-blue-50 p-3 rounded">
                  💡 Tip: Orders over $100 get free shipping!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Checkout() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutContent />
    </Elements>
  );
}
