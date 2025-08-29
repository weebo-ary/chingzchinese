import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import Dashboard from "@/components/dashboard/Dashboard";
import MenuManagement from "@/components/menu/MenuManagement";
import BillingSystem from "@/components/billing/BillingSystem";
import Recipies from "@/components/recipies/page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChefHat, LogIn } from "lucide-react";

const Index = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-brand flex items-center justify-center">
        <div className="text-center">
          <ChefHat className="h-12 w-12 text-white mx-auto mb-4 animate-pulse" />
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-brand flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-white/95 backdrop-blur-sm shadow-brand">
          <CardHeader className="text-center">
            <ChefHat className="h-12 w-12 text-restaurant-red mx-auto mb-4" />
            <CardTitle className="text-2xl text-restaurant-dark">Welcome to Chingz Chinese</CardTitle>
            <CardDescription>
              Please sign in to access your restaurant management system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate("/auth")} 
              className="w-full bg-gradient-brand hover:opacity-90 text-white"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'menu':
        return <MenuManagement />;
      case 'billing':
        return <BillingSystem />;
      case 'recipies':
        return <Recipies />;
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
