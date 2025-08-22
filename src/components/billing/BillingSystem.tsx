import { useState } from "react";
import { useMenuItems } from "@/hooks/useMenuItems";
import { useInvoices } from "@/hooks/useInvoices";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Minus, Plus, ShoppingCart, Receipt, History, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import InvoiceModal from "./InvoiceModal";
import { MenuItem, BillItem, InvoiceData } from "@/types/billing";
import { printInvoice } from "@/utils/invoiceGenerator";

const BillingSystem = () => {
  const { menuItems, loading: menuLoading } = useMenuItems();
  const { invoices, saveInvoice } = useInvoices();
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [discount, setDiscount] = useState(0);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const { toast } = useToast();

  const taxRate = 0.18; // 18% GST

  if (menuLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p>Loading menu items...</p>
        </div>
      </div>
    );
  }

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

  const generateInvoice = async () => {
    if (billItems.length === 0 || !customerName.trim()) {
      toast({
        title: "Invalid Order",
        description: "Please add items to the bill and enter customer name.",
        variant: "destructive",
      });
      return;
    }

    const invoiceNumber = `INV-${Date.now()}`;
    const subtotal = billItems.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = (subtotal * discount) / 100;
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount * taxRate;
    const total = taxableAmount + taxAmount;

    const invoiceData: Omit<InvoiceData, 'id' | 'date'> = {
      invoiceNumber,
      customerName: customerName.trim(),
      items: billItems,
      subtotal,
      discount: discountAmount,
      tax: taxAmount,
      total,
    };

    const savedInvoice = await saveInvoice(invoiceData);
    if (savedInvoice) {
      // Clear the current bill
      setBillItems([]);
      setCustomerName("");
      setDiscount(0);

      toast({
        title: "Invoice Generated",
        description: `Invoice ${invoiceNumber} has been generated successfully.`,
      });
    }
  };

  const handleInvoiceClick = (invoice: InvoiceData) => {
    setSelectedInvoice(invoice);
    setIsInvoiceModalOpen(true);
  };

  const subtotal = billItems.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = (subtotal * discount) / 100;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * taxRate;
  const finalTotal = taxableAmount + taxAmount;

  return (
    <div className="container mx-auto px-4 py-8">
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
                <Label htmlFor="customer">Customer Name</Label>
                <Input
                  id="customer"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                  required
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
                    <Label htmlFor="discount">Discount (%)</Label>
                    <Input
                      id="discount"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={discount}
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Discount ({discount}%):</span>
                        <span>-₹{discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span>GST (18%):</span>
                      <span>₹{taxAmount.toFixed(2)}</span>
                    </div>
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
                    Generate Invoice
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Invoice History */}
      <div className="mt-8">
        <div className="grid grid-cols-1 gap-6">
          <div className="col-span-full">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Previous Invoices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-muted-foreground flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Previous Invoices
                  </h3>
                  {invoices.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No previous invoices found.</p>
                  ) : (
                    <div className="grid gap-2 max-h-60 overflow-y-auto">
                      {invoices.map((invoice) => (
                        <div
                          key={invoice.id}
                          className="flex items-center justify-between p-3 bg-card rounded-lg border hover:shadow-sm transition-shadow"
                        >
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{invoice.invoiceNumber}</span>
                              <span className="text-sm text-muted-foreground">
                                {new Date(invoice.date).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {invoice.customerName} • ₹{invoice.total.toFixed(2)}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleInvoiceClick(invoice)}
                            className="ml-2"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {selectedInvoice && (
        <InvoiceModal
          invoice={selectedInvoice}
          isOpen={isInvoiceModalOpen}
          onClose={() => {
            setIsInvoiceModalOpen(false);
            setSelectedInvoice(null);
          }}
        />
      )}
    </div>
  );
};

export default BillingSystem;