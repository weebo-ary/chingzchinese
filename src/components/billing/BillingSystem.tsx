"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Minus, Plus, ShoppingCart, Receipt, History, Eye } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import InvoiceModal from "./InvoiceModal";
import { generateTokenInvoicePDF } from "@/utils/tokenInvoice";
import Logo from "../../../public/lovable-uploads/3419ee8e-6ea9-4f1e-b277-aec4b018b84c.png";

import type { MenuItem, BillItem, InvoiceData } from "@/types/billing";

const TAX_RATE = 0.18;
const RESTAURANT = "chingz_chinese";

// ------------------ Helpers ------------------
function sanitizeDigits(v: string) {
  return (v || "").replace(/\D/g, "");
}

function normalizeForWhatsApp(rawPhone: string, defaultCountryCode = "91") {
  let digits = sanitizeDigits(rawPhone);
  if (!digits) return "";
  if (digits.length === 10) {
    digits = defaultCountryCode + digits;
  }
  return digits;
}

function buildWhatsAppMessage({ customerName, invoiceNumber, items, subtotal, discountAmount, taxAmount, total }: any) {
  const lines = [
    `Hi ${customerName || "Customer"},`,
    `Your order from *CHINGZ CHINESE* is ready ✅`,
    ``,
    `*${invoiceNumber}*`,
    `--------------------------------`,
    ...items.map(
      (i: BillItem) =>
        `• ${i.name} x${i.quantity} — ₹${(i.price * i.quantity).toFixed(2)}`
    ),
    `--------------------------------`,
    `Subtotal: ₹${subtotal.toFixed(2)}`,
    ...(discountAmount > 0 ? [`Discount: -₹${discountAmount.toFixed(2)}`] : []),
    // `GST (18%): ₹${taxAmount.toFixed(2)}`,
    `*Total: ₹${total.toFixed(2)}*`,
    ``,
    `Thank you! 🙏`,
  ];
  return lines.join("\n");
}

function openWhatsAppNoRedirect(phoneE164: string, text: string) {
  const enc = encodeURIComponent(text);
  const waScheme = `whatsapp://send?phone=${phoneE164}&text=${enc}`;
  const waIntent = `intent://send/?phone=${phoneE164}&text=${enc}#Intent;scheme=whatsapp;package=com.whatsapp;end`;

  const launch = (url: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.style.display = "none";
    a.target = "_self";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const ua = (navigator.userAgent || "").toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) {
    launch(waScheme);
    return;
  }
  if (/android/.test(ua)) {
    launch(waIntent);
    return;
  }
  launch(waScheme);
}

// ------------------ Component ------------------
export default function BillingSystem() {
  const { toast } = useToast();

  const [visibleMenuItems, setVisibleMenuItems] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(false);

  const [invoices, setInvoices] = useState<InvoiceData[]>([]);

  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [discount, setDiscount] = useState(0);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(
    null
  );
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  // ------------------ Fetch Menu Items ------------------
  useEffect(() => {
    const fetchMenu = async () => {
      setMenuLoading(true);

      const { data, error } = await supabase
        .from("menu_items")
        .select("id,name,price,category")
        .eq("restaurant", RESTAURANT)
        .order("category", { ascending: true })
        .order("name", { ascending: true });

      if (error) {
        toast({
          title: "Failed to load menu",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setVisibleMenuItems(
          (data ?? []).map((m: any) => ({
            id: String(m.id),
            name: m.name,
            price: Number(m.price) || 0,
            category: m.category ?? "Uncategorized",
          }))
        );
      }
      setMenuLoading(false);
    };

    const fetchInvoices = async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("restaurant", RESTAURANT)
        .order("created_at", { ascending: false });

      if (error) {
        toast({
          title: "Failed to load invoices",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setInvoices(
          (data ?? []).map((i: any) => ({
            id: String(i.id),
            invoiceNumber: i.invoice_number,
            customerName: i.customer_name,
            items: (i.items as BillItem[]) || [],
            subtotal: Number(i.subtotal) || 0,
            discount: Number(i.discount) || 0,
            tax: Number(i.tax) || 0,
            total: Number(i.total) || 0,
            date: i.created_at,
          }))
        );
      }
    };

    fetchMenu();
    fetchInvoices();
  }, [toast]);

  // ------------------ Save Invoice ------------------
  const saveInvoice = async (payload: Omit<InvoiceData, "id" | "date">) => {
    const { data, error } = await supabase
      .from("invoices")
      .insert([
        {
          invoice_number: payload.invoiceNumber,
          customer_name: payload.customerName,
          items: payload.items,
          subtotal: payload.subtotal,
          discount: payload.discount,
          tax: payload.tax,
          total: payload.total,
          restaurant: RESTAURANT,
        },
      ])
      .select()
      .single();

    if (error) {
      toast({
        title: "Failed to save invoice",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }

    const newInvoice: InvoiceData = {
      id: String(data.id),
      invoiceNumber: data.invoice_number,
      customerName: data.customer_name,
      items: data.items as BillItem[],
      subtotal: Number(data.subtotal),
      discount: Number(data.discount),
      tax: Number(data.tax),
      total: Number(data.total),
      date: data.created_at,
    };

    setInvoices((prev) => [newInvoice, ...prev]);
    return newInvoice;
  };

  // ------------------ Bill Functions ------------------
  const addToBill = (menuItem: MenuItem) => {
    const price = Number(menuItem.price) || 0;
    const existing = billItems.find((i) => i.id === menuItem.id);

    if (existing) {
      setBillItems((prev) =>
        prev.map((i) =>
          i.id === menuItem.id
            ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * price }
            : i
        )
      );
    } else {
      setBillItems((prev) => [
        ...prev,
        {
          id: menuItem.id,
          name: menuItem.name,
          price,
          quantity: 1,
          total: price,
        },
      ]);
    }

    toast({
      title: "Added to bill",
      description: `${menuItem.name} added to current order`,
    });
  };

  const updateQuantity = (id: string, qty: number) => {
    if (qty <= 0) {
      setBillItems((prev) => prev.filter((i) => i.id !== id));
    } else {
      setBillItems((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, quantity: qty, total: qty * i.price } : i
        )
      );
    }
  };

  const generateInvoice = async () => {
    if (billItems.length === 0) {
      toast({
        title: "No items in bill",
        description: "Please add at least one menu item.",
        variant: "destructive",
      });
      return;
    }

    const normalizedPhone = normalizeForWhatsApp(customerPhone, "91");
    if (!normalizedPhone) {
      toast({
        title: "Phone required",
        description: "Please enter a valid customer phone number.",
        variant: "destructive",
      });
      return;
    }

    const invoiceCount = invoices.length + 1;
    const invoiceNumber = `INV-${invoiceCount}`;

    const subtotal = billItems.reduce((s, i) => s + i.total, 0);
    const discountAmount = (subtotal * discount) / 100;
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount * TAX_RATE;
    const total = taxableAmount + taxAmount;

    const payload: Omit<InvoiceData, "id" | "date"> = {
      invoiceNumber,
      customerName,
      items: billItems,
      subtotal,
      discount: discountAmount,
      tax: taxAmount,
      total,
    };

    const saved = await saveInvoice(payload);
    if (saved) {
      generateTokenInvoicePDF({
        invoiceCount,
        date: new Date(),
        items: billItems,
        subtotal,
        discount: discountAmount,
        tax: taxAmount,
        total,
        shopName: "CHINGZ CHINESE",
        tagline: "FAST FOOD",
        addressLine: "BAWARIYA KALAN, BHOPAL",
        tokenPrefix: "Token#",
        paymentMode: "CASH",
        logo: Logo,
      });

      const message = buildWhatsAppMessage({
        customerName,
        invoiceNumber,
        items: billItems,
        subtotal,
        discountAmount,
        taxAmount,
        total,
      });

      openWhatsAppNoRedirect(normalizedPhone, message);

      setBillItems([]);
      setCustomerName("");
      setCustomerPhone("");
      setDiscount(0);

      toast({
        title: "Invoice Generated",
        description: `Invoice ${invoiceNumber} saved & WhatsApp opened.`,
      });
    }
  };

  // ------------------ Derived ------------------
  const subtotal = billItems.reduce((s, i) => s + i.total, 0);
  const discountAmount = (subtotal * discount) / 100;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * TAX_RATE;
  const finalTotal = taxableAmount + taxAmount;
  const canGenerate = billItems.length > 0;

  const categories = ["all", ...Array.from(new Set(visibleMenuItems.map((i) => i.category).filter(Boolean)))];
  const filteredMenuItems =
    selectedCategory === "all"
      ? visibleMenuItems
      : visibleMenuItems.filter((item) => item.category === selectedCategory);
  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold mb-4">Billing System</h2>

      {menuLoading ? (
        <div className="text-center py-8">Loading menu items...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Menu Items */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Menu Items
                    </CardTitle>
                    <Select
                      value={selectedCategory}
                      onValueChange={setSelectedCategory}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories
                          .filter((c) => c !== "all")
                          .map((category) => (
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
                        className="p-4 border rounded-lg bg-card hover:shadow-md cursor-pointer"
                        onClick={() => addToBill(item)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold">{item.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {item.category}
                            </p>
                            <p className="text-lg font-bold text-restaurant-gold">
                              ₹{Number(item.price).toFixed(2)}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              addToBill(item);
                            }}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Current Bill */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Current Bill
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Customer Name</Label>
                    <Input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Customer Phone</Label>
                    <Input
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {billItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center p-2 border rounded"
                      >
                        <span>
                          {item.name} x{item.quantity}
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span>{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {billItems.length > 0 && (
                    <>
                      <div>
                        <Label>Discount (%)</Label>
                        <Input
                          type="number"
                          value={discount}
                          onChange={(e) =>
                            setDiscount(parseFloat(e.target.value) || 0)
                          }
                        />
                      </div>
                      <div className="border-t pt-2 space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Subtotal</span>
                          <span>₹{subtotal.toFixed(2)}</span>
                        </div>
                        {discount > 0 && (
                          <div className="flex justify-between text-sm">
                            <span>Discount</span>
                            <span>-₹{discountAmount.toFixed(2)}</span>
                          </div>
                        )}
                        {/* <div className="flex justify-between text-sm">
                          <span>GST (18%)</span>
                          <span>₹{taxAmount.toFixed(2)}</span>
                        </div> */}
                        <div className="flex justify-between font-bold">
                          <span>Total</span>
                          <span>₹{finalTotal.toFixed(2)}</span>
                        </div>
                      </div>

                      <Button
                        className="w-full"
                        disabled={!canGenerate}
                        onClick={generateInvoice}
                      >
                        Generate & WhatsApp
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Invoice History */}
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Previous Invoices
                </CardTitle>
              </CardHeader>
              <CardContent>
                {invoices.length === 0 ? (
                  <p className="text-center text-muted-foreground">
                    No previous invoices found.
                  </p>
                ) : (
                  invoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex justify-between items-center p-2 border rounded mb-2"
                    >
                      <span>{invoice.invoiceNumber}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedInvoice(invoice)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
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
        </>
      )}
    </div>
  );
}
