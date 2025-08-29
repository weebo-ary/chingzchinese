"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../integrations/supabase/client";
import type { InvoiceData, BillItem, MenuItem } from "@/types/billing";

const RESTAURANT = "chingz_chinese";

interface DashboardStats {
  todayOrders: number;
  todayRevenue: number;
  totalItems: number;
  popularItem: string;
}

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export default function Dashboard() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [loading, setLoading] = useState(true);

  // -------- Fetch data from Supabase --------
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // fetch menu
      const { data: menu, error: menuErr } = await supabase
        .from("menu_items")
        .select("id,name,price,category")
        .eq("restaurant", RESTAURANT);

      if (menu && !menuErr) {
        setMenuItems(
          menu.map((m: any) => ({
            id: String(m.id),
            name: m.name,
            price: Number(m.price) || 0,
            category: m.category ?? "Uncategorized",
          }))
        );
      }

      // fetch invoices
      const { data: inv, error: invErr } = await supabase
        .from("invoices")
        .select("*")
        .eq("restaurant", RESTAURANT);

      if (inv && !invErr) {
        setInvoices(
          inv.map((i: any) => ({
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

      setLoading(false);
    };

    fetchData();
  }, []);

  // -------- Compute dashboard stats --------
  const stats: DashboardStats = useMemo(() => {
    const today = new Date();

    const todays = invoices.filter((inv) => {
      const d = new Date(inv.date);
      return sameDay(d, today);
    });

    const todayOrders = todays.length;
    const todayRevenue = todays.reduce(
      (sum, inv) => sum + (Number(inv.total) || 0),
      0
    );

    const freq = new Map<string, number>();
    for (const inv of invoices) {
      for (const it of inv.items || []) {
        const count = Number(it.quantity) || 0;
        if (!it.name || count <= 0) continue;
        freq.set(it.name, (freq.get(it.name) || 0) + count);
      }
    }

    let popularItem = "No data";
    if (freq.size > 0) {
      popularItem = Array.from(freq.entries()).sort(
        (a, b) => b[1] - a[1]
      )[0][0];
    } else if (menuItems.length > 0) {
      popularItem = menuItems[0].name;
    }

    return {
      todayOrders,
      todayRevenue,
      totalItems: menuItems.length,
      popularItem,
    };
  }, [invoices, menuItems]);

  const statCards = [
    {
      title: "Today's Orders",
      value: stats.todayOrders,
      icon: "🛒",
      color: "text-restaurant-red",
    },
    {
      title: "Today's Revenue",
      value: inr.format(stats.todayRevenue),
      icon: "💰",
      color: "text-restaurant-gold",
    },
    {
      title: "Menu Items",
      value: stats.totalItems,
      icon: "🍜",
      color: "text-restaurant-orange",
    },
    {
      title: "Popular Item",
      value: stats.popularItem,
      icon: "⭐",
      color: "text-primary",
    },
  ];

  // -------- UI --------
  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back! Here's your restaurant overview.
        </p>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground">Loading stats…</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((card, idx) => (
              <Card
                key={idx}
                className="shadow-card hover:shadow-brand transition-shadow"
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </CardTitle>
                  <span className="text-2xl">{card.icon}</span>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${card.color}`}>
                    {card.value}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>📈</span>
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">
                    Average Order Value
                  </span>
                  <span className="font-semibold">
                    {stats.todayOrders > 0
                      ? inr.format(stats.todayRevenue / stats.todayOrders)
                      : inr.format(0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status</span>
                  <span className="px-2 py-1 bg-gradient-brand text-white rounded-full text-sm font-medium">
                    System Active
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}