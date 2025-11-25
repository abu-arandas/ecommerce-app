import React from 'react';
import { Mail } from 'lucide-react';
import { useToastStore } from '@/store/toastStore';

export default function Newsletter() {
  const addToast = useToastStore((state) => state.addToast);
  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !email.includes('@')) {
      addToast('error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);

    // Simulate API call - in production, this would call your newsletter service
    await new Promise(resolve => setTimeout(resolve, 1000));

    addToast('success', 'Successfully subscribed to newsletter!');
    setEmail('');
    setLoading(false);
  };

  return (
    <div className="bg-gradient-to-r from-primary to-accent py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex-1">
            <h2 className="text-2xl md:text-3xl font-bold text-secondary mb-2">
              Subscribe to Our Newsletter
            </h2>
            <p className="text-gray-700">
              Get the latest updates on new products and exclusive deals!
            </p>
          </div>
          <form onSubmit={handleSubmit} className="flex-1 max-w-md">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary whitespace-nowrap flex items-center gap-2"
              >
                {loading && <div className="spinner"></div>}
                Subscribe
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
