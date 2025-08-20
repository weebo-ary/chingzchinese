import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";

interface DashboardStats {
  todayOrders: number;
  todayRevenue: number;
  totalItems: number;
  popularItem: string;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    todayOrders: 0,
    todayRevenue: 0,
    totalItems: 0,
    popularItem: "No data"
  });

  useEffect(() => {
    // Load stats from localStorage
    const orders = JSON.parse(localStorage.getItem('chingz_orders') || '[]');
    const menuItems = JSON.parse(localStorage.getItem('chingz_menu') || '[]');
    
    const today = new Date().toDateString();
    const todayOrders = orders.filter((order: any) => 
      new Date(order.date).toDateString() === today
    );
    
    const todayRevenue = todayOrders.reduce((sum: number, order: any) => 
      sum + order.total, 0
    );

    setStats({
      todayOrders: todayOrders.length,
      todayRevenue,
      totalItems: menuItems.length,
      popularItem: menuItems.length > 0 ? menuItems[0].name : "No items"
    });
  }, []);

  const statCards = [
    {
      title: "Today's Orders",
      value: stats.todayOrders,
      icon: "🛒",
      color: "text-restaurant-red"
    },
    {
      title: "Today's Revenue",
      value: `₹${stats.todayRevenue.toFixed(2)}`,
      icon: "💰",
      color: "text-restaurant-gold"
    },
    {
      title: "Menu Items",
      value: stats.totalItems,
      icon: "🍜",
      color: "text-restaurant-orange"
    },
    {
      title: "Popular Item",
      value: stats.popularItem,
      icon: "⭐",
      color: "text-primary"
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Dashboard</h2>
        <p className="text-muted-foreground">Welcome back! Here's your restaurant overview.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <Card key={index} className="shadow-card hover:shadow-brand transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
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
              <span className="text-muted-foreground">Average Order Value</span>
              <span className="font-semibold">
                ₹{stats.todayOrders > 0 ? (stats.todayRevenue / stats.todayOrders).toFixed(2) : '0.00'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Status</span>
              <span className="px-2 py-1 bg-gradient-brand text-primary-foreground rounded-full text-sm font-medium">
                System Active
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;