import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { MenuItem } from '@/types/billing';

export const useMenuItems = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchMenuItems = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      setMenuItems(data || []);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      toast({
        title: "Error",
        description: "Failed to load menu items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addMenuItem = async (item: Omit<MenuItem, 'id'>) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .insert([{ ...item, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      
      setMenuItems(prev => [...prev, data]);
      toast({
        title: "Success",
        description: "Menu item added successfully",
      });
    } catch (error) {
      console.error('Error adding menu item:', error);
      toast({
        title: "Error",
        description: "Failed to add menu item",
        variant: "destructive",
      });
    }
  };

  const updateMenuItem = async (id: string, updates: Partial<MenuItem>) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      setMenuItems(prev => prev.map(item => item.id === id ? data : item));
      toast({
        title: "Success",
        description: "Menu item updated successfully",
      });
    } catch (error) {
      console.error('Error updating menu item:', error);
      toast({
        title: "Error",
        description: "Failed to update menu item",
        variant: "destructive",
      });
    }
  };

  const deleteMenuItem = async (id: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setMenuItems(prev => prev.filter(item => item.id !== id));
      toast({
        title: "Success",
        description: "Menu item deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting menu item:', error);
      toast({
        title: "Error",
        description: "Failed to delete menu item",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, [user]);

  return {
    menuItems,
    loading,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    refetch: fetchMenuItems,
  };
};