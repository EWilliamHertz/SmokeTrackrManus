import { Home, Package, ShoppingCart, Settings as SettingsIcon, PlusCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

export default function MobileNav() {
  const [location] = useLocation();

  const navItems = [
    { path: "/", icon: Home, label: "Dashboard" },
    { path: "/inventory", icon: Package, label: "Inventory" },
    { path: "/purchases", icon: ShoppingCart, label: "Purchases" },
    { path: "/settings", icon: SettingsIcon, label: "Settings" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
          return (
            <Link key={item.path} href={item.path}>
              <a className={cn(
                "flex flex-col items-center justify-center w-16 h-full transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                <Icon className="w-6 h-6" />
                <span className="text-xs mt-1">{item.label}</span>
              </a>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
