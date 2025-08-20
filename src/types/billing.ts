export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
}

export interface BillItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

export interface InvoiceData {
  id: string;
  date: string;
  customerName: string;
  items: BillItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
}