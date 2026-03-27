import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  useAddToCart,
  useCart,
  useProducts,
  useRemoveFromCart,
} from "../hooks/useQueries";
import CheckoutModal from "./CheckoutModal";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { data: cart } = useCart();
  const { data: products } = useProducts();
  const removeFromCart = useRemoveFromCart();
  const addToCart = useAddToCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const items = cart?.items ?? [];
  const getProduct = (id: bigint) => products?.find((p) => p.id === id);

  const total = items.reduce((sum, item) => {
    const product = getProduct(item.productId);
    return sum + (product ? Number(product.price) * Number(item.quantity) : 0);
  }, 0);

  return (
    <>
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent
          className="w-full sm:w-96 bg-brand-cream flex flex-col"
          data-ocid="cart.sheet"
        >
          <SheetHeader>
            <SheetTitle className="font-serif text-xl text-brand-forest flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" /> Your Cart
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto mt-4 space-y-3">
            {items.length === 0 ? (
              <div
                data-ocid="cart.empty_state"
                className="text-center py-12 text-muted-foreground"
              >
                <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-serif text-lg">Your cart is empty</p>
                <p className="text-sm mt-1">Add some products to get started</p>
              </div>
            ) : (
              items.map((item, idx) => {
                const product = getProduct(item.productId);
                if (!product) return null;
                return (
                  <div
                    key={String(item.productId)}
                    data-ocid={`cart.item.${idx + 1}`}
                    className="flex gap-3 bg-white rounded-lg p-3 shadow-sm"
                  >
                    <div className="w-16 h-16 rounded-md bg-brand-card-green flex-shrink-0 overflow-hidden">
                      {product.imageUrl && (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {product.name}
                      </p>
                      <p className="text-brand-orange text-sm font-semibold">
                        Nu. {Number(product.price).toLocaleString()}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          type="button"
                          onClick={() =>
                            addToCart.mutate({
                              productId: item.productId,
                              quantity: BigInt(1),
                            })
                          }
                          className="w-6 h-6 rounded-full border border-border flex items-center justify-center hover:bg-muted"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-medium w-6 text-center">
                          {Number(item.quantity)}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      data-ocid={`cart.delete_button.${idx + 1}`}
                      onClick={() => removeFromCart.mutate(item.productId)}
                      className="text-destructive hover:text-destructive/80 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {items.length > 0 && (
            <div className="mt-4 space-y-3">
              <Separator />
              <div className="flex justify-between items-center">
                <span className="font-medium">Total</span>
                <span className="font-serif text-lg font-bold text-brand-forest">
                  Nu. {total.toLocaleString()}
                </span>
              </div>
              <Button
                data-ocid="cart.submit_button"
                className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white font-medium rounded-full"
                onClick={() => setCheckoutOpen(true)}
              >
                Place Order
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onSuccess={() => {
          setCheckoutOpen(false);
          onClose();
        }}
        total={total}
      />
    </>
  );
}
