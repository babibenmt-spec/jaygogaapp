import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { User as AppUser, Product, Customer, DailyOrder, OrderItem } from '../types';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';

interface AuthContextType {
  user: AppUser | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (email: string, username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  sendPasswordResetEmail: (email: string) => Promise<{ success: boolean; message?: string }>;
  updatePassword: (password: string) => Promise<{ success: boolean; message?: string }>;
  authLoading: boolean;
  products: Product[];
  customers: Customer[];
  orders: DailyOrder[];
  dataLoading: boolean;
  error: string | null;
  addProduct: (product: Omit<Product, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  updateProduct: (productId: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  addCustomer: (customer: Omit<Customer, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  updateCustomer: (customerId: string, updates: Partial<Customer>) => Promise<void>;
  deleteCustomer: (customerId: string) => Promise<void>;
  addOrder: (order: Omit<DailyOrder, 'id' | 'user_id' | 'created_at' | 'items'>, items: OrderItem[]) => Promise<void>;
  updateOrder: (orderId: string, updates: Partial<DailyOrder>) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mapSupabaseUserToAppUser = (supabaseUser: SupabaseUser): AppUser => ({
  id: supabaseUser.id,
  email: supabaseUser.email || '',
  username: supabaseUser.user_metadata.username || supabaseUser.email,
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<DailyOrder[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAuthLoading(true);
    
    // onAuthStateChange fires immediately with the current session,
    // so we don't need a separate getSession() call. This is the
    // recommended and most robust way to handle auth state. It gracefully
    // handles session recovery, expiration, and sign-outs.
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const appUser = session ? mapSupabaseUserToAppUser(session.user) : null;
      setUser(appUser);
      setAuthLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setProducts([]);
        setCustomers([]);
        setOrders([]);
        setDataLoading(false);
        return;
      }

      setDataLoading(true);
      setError(null);

      try {
        const [productsRes, customersRes, ordersRes] = await Promise.all([
          supabase.from('products').select('*').eq('user_id', user.id),
          supabase.from('customers').select('*').eq('user_id', user.id),
          supabase.from('daily_orders').select('*').eq('user_id', user.id),
        ]);

        if (productsRes.error) throw productsRes.error;
        if (customersRes.error) throw customersRes.error;
        if (ordersRes.error) throw ordersRes.error;

        setProducts(productsRes.data || []);
        setCustomers(customersRes.data || []);
        
        // The 'items' column is a JSONB array and is fetched directly with the order.
        // No need for a separate query.
        setOrders(ordersRes.data || []);

      } catch (err: any) {
        setError(err.message);
        console.error("Error fetching data:", err);
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const login = useCallback(async (email: string, password: string) => {
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setAuthLoading(false);
    if (error) {
      console.error('Login error:', error.message);
      return { success: false, message: error.message };
    }
    return { success: true };
  }, []);

  const register = useCallback(async (email: string, username: string, password: string) => {
    setAuthLoading(true);
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { username } } });
    setAuthLoading(false);
    if (error) {
      console.error('Registration error:', error.message);
      return { success: false, message: error.message };
    }
    return { success: true };
  }, []);

  const logout = useCallback(async () => {
    setAuthLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setAuthLoading(false);
  }, []);

  const sendPasswordResetEmail = useCallback(async (email: string) => {
    setAuthLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    setAuthLoading(false);
    if (error) {
      console.error('Password reset error:', error.message);
      return { success: false, message: error.message };
    }
    return { success: true };
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    setAuthLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setAuthLoading(false);
    if (error) {
      console.error('Password update error:', error.message);
      return { success: false, message: error.message };
    }
    return { success: true };
  }, []);

  const addProduct = useCallback(async (product: Omit<Product, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) throw new Error("User not authenticated");
    const { data, error } = await supabase.from('products').insert({ ...product, user_id: user.id }).select().single();
    if (error) throw error;
    if (data) setProducts(p => [...p, data]);
  }, [user]);

  const updateProduct = useCallback(async (productId: string, updates: Partial<Product>) => {
    const { data, error } = await supabase.from('products').update(updates).eq('id', productId).select().single();
    if (error) throw error;
    if (data) setProducts(p => p.map(prod => prod.id === productId ? { ...prod, ...data } : prod));
  }, []);

  const deleteProduct = useCallback(async (productId: string) => {
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) throw error;
    setProducts(p => p.filter(prod => prod.id !== productId));
  }, []);

  const addCustomer = useCallback(async (customer: Omit<Customer, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) throw new Error("User not authenticated");
    const { data, error } = await supabase.from('customers').insert({ ...customer, user_id: user.id }).select().single();
    if (error) throw error;
    if (data) setCustomers(c => [...c, data]);
  }, [user]);

  const updateCustomer = useCallback(async (customerId: string, updates: Partial<Customer>) => {
    const { data, error } = await supabase.from('customers').update(updates).eq('id', customerId).select().single();
    if (error) throw error;
    if (data) setCustomers(c => c.map(cust => cust.id === customerId ? { ...cust, ...data } : cust));
  }, []);

  const deleteCustomer = useCallback(async (customerId: string) => {
    // First, delete all orders associated with this customer to prevent foreign key violation
    const { error: ordersError } = await supabase
      .from('daily_orders')
      .delete()
      .eq('customer_id', customerId);

    if (ordersError) {
      console.error("Error deleting customer's orders:", ordersError);
      throw ordersError;
    }
    
    // After associated orders are deleted, delete the customer
    const { error: customerError } = await supabase
      .from('customers')
      .delete()
      .eq('id', customerId);

    if (customerError) {
      console.error("Error deleting customer:", customerError);
      throw customerError;
    }

    // Update local state for both orders and customers
    setOrders(o => o.filter(ord => ord.customer_id !== customerId));
    setCustomers(c => c.filter(cust => cust.id !== customerId));
  }, []);

  const addOrder = useCallback(async (order: Omit<DailyOrder, 'id' | 'user_id' | 'created_at' | 'items'>, items: OrderItem[]) => {
    if (!user) throw new Error("User not authenticated");

    // The 'items' are passed as a JSONB array in the payload.
    const orderPayload = { ...order, user_id: user.id, items: items };

    const { data: newOrder, error: orderError } = await supabase.from('daily_orders').insert(orderPayload).select().single();
    
    if (orderError) {
      console.error("Failed to create order", orderError);
      throw orderError;
    }
    if (!newOrder) throw new Error("Failed to create order.");
    
    // The newOrder returned from Supabase already includes the 'items' array.
    setOrders(o => [...o, newOrder]);
  }, [user]);

  const updateOrder = useCallback(async (orderId: string, updates: Partial<DailyOrder>) => {
    const { data, error } = await supabase.from('daily_orders').update(updates).eq('id', orderId).select().single();
    if (error) throw error;
    if (data) setOrders(o => o.map(ord => ord.id === orderId ? { ...ord, ...data } : ord));
  }, []);

  const deleteOrder = useCallback(async (orderId: string) => {
    const { error } = await supabase.from('daily_orders').delete().eq('id', orderId);
    if (error) throw error;
    setOrders(o => o.filter(ord => ord.id !== orderId));
  }, []);

  const value = useMemo(() => ({
    user, login, register, logout, authLoading, sendPasswordResetEmail, updatePassword,
    products, customers, orders, dataLoading, error,
    addProduct, updateProduct, deleteProduct,
    addCustomer, updateCustomer, deleteCustomer,
    addOrder, updateOrder, deleteOrder,
  }), [
    user, login, register, logout, authLoading, sendPasswordResetEmail, updatePassword,
    products, customers, orders, dataLoading, error,
    addProduct, updateProduct, deleteProduct,
    addCustomer, updateCustomer, deleteCustomer,
    addOrder, updateOrder, deleteOrder,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
