import { useState } from "react";
import Header from "@/components/layout/Header";
import Dashboard from "@/components/dashboard/Dashboard";
import MenuManagement from "@/components/menu/MenuManagement";
import BillingSystem from "@/components/billing/BillingSystem";

const Index = () => {
  const [currentView, setCurrentView] = useState('dashboard');

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'menu':
        return <MenuManagement />;
      case 'billing':
        return <BillingSystem />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header currentView={currentView} onViewChange={setCurrentView} />
      <main>
        {renderCurrentView()}
      </main>
    </div>
  );
};

export default Index;
