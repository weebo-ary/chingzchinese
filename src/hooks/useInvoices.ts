import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { InvoiceData } from '@/types/billing';

export const useInvoices = () => {
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchInvoices = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform database data to match InvoiceData interface
      const transformedData: InvoiceData[] = (data || []).map(invoice => ({
        id: invoice.id,
        invoiceNumber: invoice.invoice_number,
        customerName: invoice.customer_name,
        items: invoice.items as any[], // JSONB field
        subtotal: parseFloat(invoice.subtotal.toString()),
        discount: parseFloat(invoice.discount.toString()),
        tax: parseFloat(invoice.tax.toString()),
        total: parseFloat(invoice.total.toString()),
        date: invoice.created_at,
      }));
      
      setInvoices(transformedData);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast({
        title: "Error",
        description: "Failed to load invoices",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveInvoice = async (invoiceData: Omit<InvoiceData, 'id' | 'date'>) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('invoices')
        .insert({
          invoice_number: invoiceData.invoiceNumber,
          customer_name: invoiceData.customerName,
          items: invoiceData.items as any, // Cast to any for JSONB
          subtotal: invoiceData.subtotal,
          discount: invoiceData.discount,
          tax: invoiceData.tax,
          total: invoiceData.total,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      
      const newInvoice: InvoiceData = {
        id: data.id,
      invoiceNumber: data.invoice_number,
        customerName: data.customer_name,
        items: data.items as any[], // Cast from JSONB
        subtotal: parseFloat(data.subtotal.toString()),
        discount: parseFloat(data.discount.toString()),
        tax: parseFloat(data.tax.toString()),
        total: parseFloat(data.total.toString()),
        date: data.created_at,
      };
      
      setInvoices(prev => [newInvoice, ...prev]);
      toast({
        title: "Success",
        description: "Invoice saved successfully",
      });
      
      return newInvoice;
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast({
        title: "Error",
        description: "Failed to save invoice",
        variant: "destructive",
      });
      return null;
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [user]);

  return {
    invoices,
    loading,
    saveInvoice,
    refetch: fetchInvoices,
  };
};