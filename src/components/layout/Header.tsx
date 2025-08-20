import { Button } from "@/components/ui/button";

interface HeaderProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

const Header = ({ currentView, onViewChange }: HeaderProps) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'menu', label: 'Menu Management', icon: '🍜' },
    { id: 'billing', label: 'Billing', icon: '🧾' },
  ];

  return (
    <header className="bg-gradient-brand shadow-brand">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          <img 
            src="/lovable-uploads/3419ee8e-6ea9-4f1e-b277-aec4b018b84c.png" 
            alt="Chingz Chinese Logo" 
            className="h-12 w-12 object-contain"
          />
          <div>
            <h1 className="text-2xl font-bold text-primary-foreground">Chingz Chinese</h1>
            <p className="text-sm text-primary-foreground/80">Billing System</p>
          </div>
        </div>
        
        <nav className="flex space-x-2">
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant={currentView === item.id ? "secondary" : "ghost"}
              className={currentView === item.id ? 
                "bg-secondary text-secondary-foreground font-medium" : 
                "text-primary-foreground hover:bg-primary-foreground/10"
              }
              onClick={() => onViewChange(item.id)}
            >
              <span className="mr-2">{item.icon}</span>
              {item.label}
            </Button>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Header;