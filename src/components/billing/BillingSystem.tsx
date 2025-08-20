import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Minus, Plus, ShoppingCart, Receipt, History, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import InvoiceModal from "./InvoiceModal";
import { InvoiceData, printInvoice } from "@/utils/invoiceGenerator";

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

const BillingSystem = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [discount, setDiscount] = useState(0);
  const [invoiceHistory, setInvoiceHistory] = useState<InvoiceData[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const { toast } = useToast();

  const taxRate = 0.18; // 18% GST

  useEffect(() => {
    const savedItems = localStorage.getItem('chingz_menu');
    if (savedItems) {
      setMenuItems(JSON.parse(savedItems));
    }
    
    const savedOrders = localStorage.getItem('chingz_orders');
    if (savedOrders) {
      setInvoiceHistory(JSON.parse(savedOrders));
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
    const updatedOrders = [...existingOrders, invoiceData];
    localStorage.setItem('chingz_orders', JSON.stringify(updatedOrders));
    setInvoiceHistory(updatedOrders);

    // Print invoice
    printInvoice(invoiceData);

    // Clear current bill
    setBillItems([]);
    setCustomerName("");
    setDiscount(0);

    toast({
      title: "Invoice Generated!",
      description: `Invoice ${invoiceData.id} has been generated and saved.`
    });
  };

  const handleInvoiceClick = (invoice: InvoiceData) => {
    setSelectedInvoice(invoice);
    setIsInvoiceModalOpen(true);
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

      {/* Invoice History */}
      <div className="mt-8">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Previous Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invoiceHistory.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📄</div>
                <p className="text-muted-foreground">No invoices generated yet</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {invoiceHistory
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((invoice) => (
                  <div
                    key={invoice.id}
                    className="p-4 border rounded-lg bg-card hover:shadow-md transition-all cursor-pointer"
                    onClick={() => handleInvoiceClick(invoice)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-foreground">{invoice.id}</h4>
                          <Button size="sm" variant="outline" className="h-6 px-2">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Customer: {invoice.customerName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(invoice.date).toLocaleDateString()} • {new Date(invoice.date).toLocaleTimeString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Items: {invoice.items.reduce((sum, item) => sum + item.quantity, 0)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-restaurant-gold">
                          ₹{invoice.total.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        invoiceData={selectedInvoice}
      />
    </div>
  );
};

export default BillingSystem;