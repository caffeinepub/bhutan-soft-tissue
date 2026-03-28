import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Home, LogOut, ShoppingCart, User } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { Page } from "../App";
import { useCart } from "../hooks/useQueries";
import AuthModal from "./AuthModal";

interface NavProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onCartClick: () => void;
}

interface LoggedUser {
  name: string;
  credential: string;
  password: string;
}

export default function Nav({
  currentPage,
  onNavigate,
  onCartClick,
}: NavProps) {
  const { data: cart } = useCart();
  const itemCount = cart?.items?.length ?? 0;
  const [authOpen, setAuthOpen] = useState(false);
  const [loggedUser, setLoggedUser] = useState<LoggedUser | null>(null);

  const handleLogin = (user: LoggedUser) => {
    setLoggedUser(user);
  };

  const handleSignOut = () => {
    setLoggedUser(null);
  };

  return (
    <>
      <motion.header
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="sticky top-0 z-50 bg-brand-cream/95 backdrop-blur border-b border-brand-beige shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              type="button"
              data-ocid="nav.link"
              onClick={() => onNavigate("home")}
              className="flex items-center gap-2 text-brand-forest hover:text-brand-orange transition-colors"
            >
              <Home className="w-5 h-5" />
              <span className="font-semibold text-base">Home</span>
            </button>

            <nav className="hidden md:flex items-center gap-8">
              <button
                type="button"
                data-ocid="nav.shop.link"
                onClick={() => onNavigate("shop")}
                className={`text-sm font-medium transition-colors hover:text-brand-orange ${currentPage === "shop" ? "text-brand-orange" : "text-foreground"}`}
              >
                Shop
              </button>
              <a
                href="#story"
                className="text-sm font-medium transition-colors hover:text-brand-orange"
              >
                Our Story
              </a>
              <a
                href="#contact"
                className="text-sm font-medium transition-colors hover:text-brand-orange"
              >
                Contact
              </a>
            </nav>

            <div className="flex items-center gap-2">
              {loggedUser ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      data-ocid="nav.user.button"
                      className="w-9 h-9 rounded-full bg-brand-forest text-white flex items-center justify-center text-sm font-bold hover:bg-brand-forest/90 transition-colors"
                    >
                      {loggedUser.name.charAt(0).toUpperCase()}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    data-ocid="nav.user.dropdown_menu"
                  >
                    <DropdownMenuItem
                      disabled
                      className="font-medium text-brand-forest"
                    >
                      {loggedUser.name}
                    </DropdownMenuItem>
                    <DropdownMenuItem data-ocid="nav.myorders.link">
                      My Orders
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      data-ocid="nav.signout.button"
                      onClick={handleSignOut}
                      className="text-destructive"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  data-ocid="nav.user.button"
                  onClick={() => setAuthOpen(true)}
                >
                  <User className="w-5 h-5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                data-ocid="nav.admin.link"
                onClick={() => onNavigate("admin")}
                title="Admin"
              >
                <User className="w-5 h-5 opacity-50" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                data-ocid="nav.cart.button"
                onClick={onCartClick}
                className="relative"
              >
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-brand-orange text-white text-[10px] flex items-center justify-center font-bold">
                    {itemCount}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </motion.header>
      <AuthModal
        open={authOpen}
        onOpenChange={setAuthOpen}
        onLogin={handleLogin}
      />
    </>
  );
}
