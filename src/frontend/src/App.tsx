import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import CartDrawer from "./components/CartDrawer";
import Nav from "./components/Nav";
import Admin from "./pages/Admin";
import Home from "./pages/Home";
import OrderDashboard from "./pages/OrderDashboard";
import Shop from "./pages/Shop";

export type Page = "home" | "shop" | "admin" | "order";

export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [cartOpen, setCartOpen] = useState(false);

  const handleNavigate = (p: Page) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      <Nav
        currentPage={page}
        onNavigate={handleNavigate}
        onCartClick={() => setCartOpen(true)}
      />
      {page === "home" && <Home onNavigate={handleNavigate} />}
      {page === "shop" && <Shop onNavigate={handleNavigate} />}
      {page === "admin" && <Admin />}
      {page === "order" && <OrderDashboard />}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <Toaster richColors position="top-right" />
    </div>
  );
}
