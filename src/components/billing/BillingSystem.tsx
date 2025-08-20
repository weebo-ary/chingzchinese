import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Minus, Plus, ShoppingCart, Receipt } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
}

interface BillItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

interface InvoiceData {
  id: string;
  date: string;
  customerName: string;
  items: BillItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
}

const BillingSystem = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [discount, setDiscount] = useState(0);
  const { toast } = useToast();

  const taxRate = 0.18; // 18% GST

  useEffect(() => {
    const savedItems = localStorage.getItem('chingz_menu');
    if (savedItems) {
      setMenuItems(JSON.parse(savedItems));
    }
  }, []);

  const categories = ["all", ...Array.from(new Set(menuItems.map(item => item.category)))];

  const filteredMenuItems = selectedCategory === "all" 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  const addToBill = (menuItem: MenuItem) => {
    const existingItem = billItems.find(item => item.id === menuItem.id);
    
    if (existingItem) {
      setBillItems(billItems.map(item =>
        item.id === menuItem.id
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
          : item
      ));
    } else {
      setBillItems([...billItems, {
        id: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: 1,
        total: menuItem.price
      }]);
    }
    
    toast({
      title: "Added to bill",
      description: `${menuItem.name} added to current order`
    });
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setBillItems(billItems.filter(item => item.id !== id));
    } else {
      setBillItems(billItems.map(item =>
        item.id === id
          ? { ...item, quantity: newQuantity, total: newQuantity * item.price }
          : item
      ));
    }
  };

  const subtotal = billItems.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = subtotal * taxRate;
  const finalTotal = subtotal + taxAmount - discount;

  const generateInvoice = () => {
    if (billItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add items to the bill first",
        variant: "destructive"
      });
      return;
    }

    const invoiceData: InvoiceData = {
      id: `INV-${Date.now()}`,
      date: new Date().toISOString(),
      customerName: customerName || "Walk-in Customer",
      items: billItems,
      subtotal,
      tax: taxAmount,
      discount,
      total: finalTotal
    };

    // Save to orders history
    const existingOrders = JSON.parse(localStorage.getItem('chingz_orders') || '[]');
    localStorage.setItem('chingz_orders', JSON.stringify([...existingOrders, invoiceData]));

    // Generate PDF-like content (simplified for demo)
    const invoiceWindow = window.open('', '_blank');
    if (invoiceWindow) {
      invoiceWindow.document.write(`
        <html>
          <head>
            <title>Invoice - ${invoiceData.id}</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
              .header { text-align: center; border-bottom: 2px solid #e74c3c; padding-bottom: 20px; margin-bottom: 30px; }
              .logo { width: 80px; height: 80px; margin: 0 auto 10px; }
              .invoice-details { display: flex; justify-content: space-between; margin-bottom: 30px; }
              .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              .items-table th, .items-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
              .items-table th { background-color: #e74c3c; color: white; }
              .totals { text-align: right; margin-top: 20px; }
              .total-row { font-weight: bold; font-size: 18px; color: #e74c3c; }
              @media print { body { margin: 0; } }
            </style>
          </head>
          <body>
            <div class="header">
              <img src="/lovable-uploads/3419ee8e-6ea9-4f1e-b277-aec4b018b84c.png" alt="Chingz Chinese" class="logo" />
              <h1>CHINGZ CHINESE</h1>
              <p>Authentic Chinese Cuisine</p>
              <p>Phone: +91 XXXXX-XXXXX | Email: info@chingzchinese.com</p>
            </div>
            
            <div class="invoice-details">
              <div>
                <h3>Invoice #${invoiceData.id}</h3>
                <p>Date: ${new Date(invoiceData.date).toLocaleDateString()}</p>
                <p>Time: ${new Date(invoiceData.date).toLocaleTimeString()}</p>
              </div>
              <div>
                <h3>Customer Details</h3>
                <p>Name: ${invoiceData.customerName}</p>
              </div>
            </div>

            <table class="items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${invoiceData.items.map(item => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>₹${item.price.toFixed(2)}</td>
                    <td>₹${item.total.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="totals">
              <p>Subtotal: ₹${invoiceData.subtotal.toFixed(2)}</p>
              <p>GST (18%): ₹${invoiceData.tax.toFixed(2)}</p>
              ${invoiceData.discount > 0 ? `<p>Discount: -₹${invoiceData.discount.toFixed(2)}</p>` : ''}
              <p class="total-row">Total: ₹${invoiceData.total.toFixed(2)}</p>
            </div>

            <div style="text-center; margin-top: 40px; font-size: 14px; color: #666;">
              <p>Thank you for dining with us!</p>
              <p>Visit us again soon!</p>
            </div>

            <script>
              window.onload = function() {
                window.print();
              }
            </script>
          </body>
        </html>
      `);
      
      invoiceWindow.document.close();
    }

    // Clear current bill
    setBillItems([]);
    setCustomerName("");
    setDiscount(0);

    toast({
      title: "Invoice Generated!",
      description: `Invoice ${invoiceData.id} has been generated and saved.`
    });
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-foreground mb-2">Billing System</h2>
        <p className="text-muted-foreground">Create orders and generate invoices.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Menu Items */}
        <div className="lg:col-span-2">
          <Card className="shadow-card">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Menu Items
                </CardTitle>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.filter(cat => cat !== "all").map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {filteredMenuItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 border rounded-lg bg-card hover:shadow-md transition-all cursor-pointer"
                    onClick={() => addToBill(item)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-foreground">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">{item.category}</p>
                        <p className="text-lg font-bold text-restaurant-gold">₹{item.price.toFixed(2)}</p>
                      </div>
                      <Button size="sm" className="bg-gradient-brand hover:opacity-90">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              {filteredMenuItems.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No menu items available. Add items in Menu Management first.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Current Bill */}
        <div>
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Current Bill
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="customer">Customer Name (Optional)</Label>
                <Input
                  id="customer"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Walk-in Customer"
                />
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {billItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">₹{item.price.toFixed(2)} each</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {billItems.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground text-sm">No items in current bill</p>
                </div>
              )}

              {billItems.length > 0 && (
                <>
                  <div>
                    <Label htmlFor="discount">Discount (₹)</Label>
                    <Input
                      id="discount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={discount}
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>GST (18%):</span>
                      <span>₹{taxAmount.toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Discount:</span>
                        <span>-₹{discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg text-restaurant-red">
                      <span>Total:</span>
                      <span>₹{finalTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button 
                    onClick={generateInvoice}
                    className="w-full bg-gradient-brand hover:opacity-90"
                    size="lg"
                  >
                    Generate Invoice & Print
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BillingSystem;