import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import Consumption from "./pages/Consumption";
import Inventory from "./pages/Inventory";
import Purchases from "./pages/Purchases";
import Settings from "./pages/Settings";
import ProductDetail from "./pages/ProductDetail";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Dashboard} />
      <Route path={"/consumption"} component={Consumption} />
      <Route path={"/inventory"} component={Inventory} />
      <Route path={"/purchases"} component={Purchases} />
      <Route path={"/settings"} component={Settings} />
      <Route path={"/product/:id"} component={ProductDetail} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
