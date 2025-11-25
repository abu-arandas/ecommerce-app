import { supabase } from '../lib/supabase';

export const authAPI = {
  signup: async (email: string, password: string, displayName: string, role: string = 'customer') => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
          role: role
        },
      },
    });
    return { data, error };
  },

  login: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  logout: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getCurrentUser: async () => {
    const { data, error } = await supabase.auth.getUser();
    return { data, error };
  },

  getSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    return { data, error };
  },

  signInWithGoogle: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    return { data, error };
  },

  resetPassword: async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { data, error };
  },

  updatePassword: async (password: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password,
    });
    return { data, error };
  },

  updateRole: async (userId: string, role: 'admin' | 'customer') => {
    // Note: This should ideally be done via a secure server-side endpoint or Edge Function
    // allowing only admins to update roles. For this demo, we'll assume the client
    // can't easily call this without being authenticated, but RLS should enforce this.
    // However, supabase.auth.updateUser updates the CURRENT user.
    // To update OTHER users, we need the service_role key or an Edge Function.
    // For this demo, we will just provide a way to update the CURRENT user's metadata
    // which is useful for testing "Promote to Admin" on yourself.
    const { data, error } = await supabase.auth.updateUser({
      data: { role },
    });
    return { data, error };
  },
};

export const productsAPI = {
  getAll: async (category?: string) => {
    let query = supabase.from('products').select('*');
    if (category) {
      query = query.eq('category_id', category);
    }
    const { data, error } = await query;
    return { data, error };
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    return { data, error };
  },

  search: async (query: string) => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`);
    return { data, error };
  },

  getByCategory: async (categoryId: string) => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category_id', categoryId);
    return { data, error };
  },

  // Admin methods
  create: async (product: any) => {
    const { data, error } = await supabase
      .from('products')
      .insert([product])
      .select();
    return { data, error };
  },

  update: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select();
    return { data, error };
  },

  delete: async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    return { error };
  },
};

export const categoriesAPI = {
  getAll: async () => {
    const { data, error } = await supabase.from('categories').select('*');
    return { data, error };
  },

  create: async (name: string) => {
    const { data, error } = await supabase
      .from('categories')
      .insert([{ name }])
      .select();
    return { data, error };
  },

  update: async (id: string, name: string) => {
    const { data, error } = await supabase
      .from('categories')
      .update({ name })
      .eq('id', id)
      .select();
    return { data, error };
  },

  delete: async (id: string) => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    return { error };
  },
};

export const ordersAPI = {
  create: async (orderData: any) => {
    const { data, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select();
    return { data, error };
  },

  getByUser: async (userId: string) => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId);
    return { data, error };
  },

  getAll: async () => {
    const { data, error } = await supabase.from('orders').select('*');
    return { data, error };
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();
    return { data, error };
  },

  updateStatus: async (id: string, status: string) => {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select();
    return { data, error };
  },
};

export const orderItemsAPI = {
  create: async (items: any[]) => {
    const { data, error } = await supabase
      .from('order_items')
      .insert(items)
      .select();
    return { data, error };
  },

  getByOrder: async (orderId: string) => {
    const { data, error } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);
    return { data, error };
  },
};

export const storageAPI = {
  uploadImage: async (file: File, bucket: string) => {
    const fileName = `${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);
    return { data, error };
  },

  getPublicUrl: (bucket: string, fileName: string) => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return data?.publicUrl;
  },

  deleteImage: async (bucket: string, fileName: string) => {
    const { error } = await supabase.storage.from(bucket).remove([fileName]);
    return { error };
  },
};

export const reviewsAPI = {
  getByProduct: async (productId: string) => {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, user_id')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  create: async (review: any) => {
    const { data, error } = await supabase
      .from('reviews')
      .insert([review])
      .select();
    return { data, error };
  },

  update: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('reviews')
      .update(updates)
      .eq('id', id)
      .select();
    return { data, error };
  },

  delete: async (id: string) => {
    const { error } = await supabase.from('reviews').delete().eq('id', id);
    return { error };
  },

  markHelpful: async (id: string) => {
    const { data, error } = await supabase.rpc('increment_helpful_count', {
      review_id: id,
    });
    return { data, error };
  },

  getAverageRating: async (productId: string) => {
    const { data, error } = await supabase
      .from('reviews')
      .select('rating')
      .eq('product_id', productId);

    if (error || !data || data.length === 0) {
      return { average: 0, count: 0, error };
    }

    const average = data.reduce((sum, review) => sum + review.rating, 0) / data.length;
    return { average, count: data.length, error: null };
  },
};

