"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, User, Menu as MenuIcon } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";

interface HeaderProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

const Header = ({ currentView, onViewChange }: HeaderProps) => {
  const { user, signOut } = useAuth();

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "menu", label: "Menu Management", icon: "🍜" },
    { id: "billing", label: "Billing", icon: "🧾" },
    { id: "recipies", label: "Recipes", icon: "👨‍🍳" },
  ];

  const NavButtons = ({ onItemClick }: { onItemClick?: () => void }) => (
    <>
      {navItems.map((item) => (
        <Button
          key={item.id}
          variant={currentView === item.id ? "secondary" : "ghost"}
          className={
            currentView === item.id
              ? "bg-secondary text-secondary-foreground font-medium"
              : "text-black hover:bg-primary-foreground/10"
          }
          onClick={() => {
            onViewChange(item.id);
            onItemClick?.();
          }}
        >
          <span className="mr-2">{item.icon}</span>
          {item.label}
        </Button>
      ))}
    </>
  );

  return (
    <header className="bg-gradient-brand shadow-brand">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Brand */}
        <div className="flex items-center space-x-4">
          <img
            src="/lovable-uploads/3419ee8e-6ea9-4f1e-b277-aec4b018b84c.png"
            alt="Chingz Chinese Logo"
            className="h-12 w-12 object-contain"
          />
          <div>
            <h1 className="text-2xl font-bold text-primary-foreground">
              Chingz Chinese
            </h1>
            <p className="text-sm text-primary-foreground/80">Billing System</p>
          </div>
        </div>

        {/* Desktop nav (sm and up) */}
        <nav className="hidden sm:flex space-x-2">
          <NavButtons />
        </nav>

        {/* User Info (desktop only) */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="flex items-center gap-2 text-white">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline text-sm">
              {user?.user_metadata?.display_name || user?.email}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="text-white hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline ml-2">Sign Out</span>
          </Button>
        </div>

        {/* Mobile Hamburger (xs only) */}
        {/* Mobile Hamburger (xs only) */}
        <div className="sm:hidden">
          <Dialog.Root>
            <Dialog.Trigger asChild>
              <Button variant="ghost" className="text-white hover:bg-white/10">
                <MenuIcon className="h-6 w-6" />
              </Button>
            </Dialog.Trigger>

            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/40" />
              <Dialog.Content className="fixed right-0 top-0 h-full w-72 bg-white shadow-lg flex flex-col p-6">
                <Dialog.Title className="flex items-center gap-3 text-lg font-semibold">
                  <img
                    src="/lovable-uploads/3419ee8e-6ea9-4f1e-b277-aec4b018b84c.png"
                    alt="Chingz Chinese Logo"
                    className="h-8 w-8 object-contain"
                  />
                  Chingz Chinese
                </Dialog.Title>

                {/* Nav buttons */}
                <div className="mt-6 flex flex-col gap-2">
                  {navItems.map((item) => (
                    <Dialog.Close asChild key={item.id}>
                      <Button
                        variant={
                          currentView === item.id ? "secondary" : "ghost"
                        }
                        className={
                          currentView === item.id
                            ? "bg-secondary text-secondary-foreground font-medium"
                            : "text-gray-800 hover:bg-gray-100"
                        }
                        onClick={() => onViewChange(item.id)}
                      >
                        <span className="mr-2">{item.icon}</span>
                        {item.label}
                      </Button>
                    </Dialog.Close>
                  ))}
                </div>

                {/* User Info + Sign out */}
                <div className="mt-auto border-t pt-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <User className="h-4 w-4" />
                    <span>
                      {user?.user_metadata?.display_name || user?.email}
                    </span>
                  </div>
                  <Dialog.Close asChild>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={signOut}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </Dialog.Close>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>
    </header>
  );
};

export default Header;
