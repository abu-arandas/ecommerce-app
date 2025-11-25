import { create } from 'zustand';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

export interface WishlistItem {
  productId: string;
  name: string;
  price: number;
  image: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: () => number;
}

interface WishlistStore {
  items: WishlistItem[];
  addItem: (item: WishlistItem) => void;
  removeItem: (productId: string) => void;
  isFavorited: (productId: string) => boolean;
}

interface AuthStore {
  user: any;
  role: 'admin' | 'customer' | null;
  loading: boolean;
  setUser: (user: any) => void;
  setLoading: (loading: boolean) => void;
}

import { supabase } from '../lib/supabase';

export const useCartStore = create<CartStore>((set, get) => ({
  items: JSON.parse(localStorage.getItem('cart') || '[]'),
  addItem: async (item) => {
    const user = useAuthStore.getState().user;

    // Optimistic update
    set((state) => {
      const existing = state.items.find((i) => i.productId === item.productId);
      let newItems;
      if (existing) {
        newItems = state.items.map((i) =>
          i.productId === item.productId
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      } else {
        newItems = [...state.items, item];
      }
      localStorage.setItem('cart', JSON.stringify(newItems));
      return { items: newItems };
    });

    // Sync with Supabase if logged in
    if (user) {
      const { error } = await supabase
        .from('cart_items')
        .upsert({
          user_id: user.id,
          product_id: item.productId,
          quantity: get().items.find(i => i.productId === item.productId)?.quantity || item.quantity
        }, { onConflict: 'user_id,product_id' });

      if (error) console.error('Failed to sync cart item:', error);
    }
  },
  removeItem: async (productId) => {
    const user = useAuthStore.getState().user;

    set((state) => {
      const newItems = state.items.filter((i) => i.productId !== productId);
      localStorage.setItem('cart', JSON.stringify(newItems));
      return { items: newItems };
    });

    if (user) {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) console.error('Failed to remove cart item:', error);
    }
  },
  updateQuantity: async (productId, quantity) => {
    const user = useAuthStore.getState().user;

    set((state) => {
      const newItems = state.items.map((i) =>
        i.productId === productId ? { ...i, quantity } : i
      );
      localStorage.setItem('cart', JSON.stringify(newItems));
      return { items: newItems };
    });

    if (user) {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) console.error('Failed to update cart quantity:', error);
    }
  },
  clearCart: async () => {
    const user = useAuthStore.getState().user;

    localStorage.removeItem('cart');
    set({ items: [] });

    if (user) {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      if (error) console.error('Failed to clear cart:', error);
    }
  },
  total: () => {
    return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },
}));

export const useWishlistStore = create<WishlistStore>((set, get) => ({
  items: JSON.parse(localStorage.getItem('wishlist') || '[]'),
  addItem: async (item) => {
    const user = useAuthStore.getState().user;

    set((state) => {
      // Prevent duplicates
      if (state.items.some(i => i.productId === item.productId)) return state;

      const newItems = [...state.items, item];
      localStorage.setItem('wishlist', JSON.stringify(newItems));
      return { items: newItems };
    });

    if (user) {
      const { error } = await supabase
        .from('wishlist')
        .insert({ user_id: user.id, product_id: item.productId });

      if (error) console.error('Failed to add to wishlist:', error);
    }
  },
  removeItem: async (productId) => {
    const user = useAuthStore.getState().user;

    set((state) => {
      const newItems = state.items.filter((i) => i.productId !== productId);
      localStorage.setItem('wishlist', JSON.stringify(newItems));
      return { items: newItems };
    });

    if (user) {
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) console.error('Failed to remove from wishlist:', error);
    }
  },
  isFavorited: (productId) => {
    return get().items.some((i) => i.productId === productId);
  },
}));

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  role: null,
  loading: true,
  setUser: async (user) => {
    set({
      user,
      role: user?.user_metadata?.role || 'customer'
    });

    // Fetch cart and wishlist if user logs in
    if (user) {
      // Fetch Cart
      const { data: cartData } = await supabase
        .from('cart_items')
        .select('*, products(*)')
        .eq('user_id', user.id);

      if (cartData) {
        const items = cartData.map((item: any) => ({
          id: item.id,
          productId: item.product_id,
          name: item.products.name,
          price: item.products.price,
          image: item.products.image_url,
          quantity: item.quantity
        }));
        useCartStore.setState({ items });
        localStorage.setItem('cart', JSON.stringify(items));
      }

      // Fetch Wishlist
      const { data: wishlistData } = await supabase
        .from('wishlist')
        .select('*, products(*)')
        .eq('user_id', user.id);

      if (wishlistData) {
        const items = wishlistData.map((item: any) => ({
          productId: item.product_id,
          name: item.products.name,
          price: item.products.price,
          image: item.products.image_url
        }));
        useWishlistStore.setState({ items });
        localStorage.setItem('wishlist', JSON.stringify(items));
      }
    } else {
      // Clear stores on logout (optional, or keep local)
      // useCartStore.setState({ items: [] });
      // useWishlistStore.setState({ items: [] });
    }
  },
  setLoading: (loading) => set({ loading }),
}));
