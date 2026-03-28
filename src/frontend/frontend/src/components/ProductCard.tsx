import { Button } from "@/components/ui/button";
import { ShoppingCart, Star } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "../backend.d";
import { useAddToCart } from "../hooks/useQueries";

interface ProductCardProps {
  product: Product;
  index: number;
}

export default function ProductCard({ product, index }: ProductCardProps) {
  const addToCart = useAddToCart();

  const handleAdd = () => {
    addToCart.mutate(
      { productId: product.id, quantity: BigInt(1) },
      { onSuccess: () => toast.success(`${product.name} added to cart!`) },
    );
  };

  return (
    <div
      data-ocid={`product.item.${index}`}
      className="rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 group"
    >
      <div className="bg-brand-card-green h-52 relative overflow-hidden flex items-center justify-center">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="text-white/20 text-6xl font-serif">T</div>
        )}
        {product.stock <= 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-medium text-sm bg-destructive px-3 py-1 rounded-full">
              Out of Stock
            </span>
          </div>
        )}
      </div>
      <div className="bg-white p-4">
        <h3 className="font-serif font-semibold text-foreground truncate">
          {product.name}
        </h3>
        <div className="flex items-center gap-1 mt-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              className={`w-3 h-3 ${i <= 4 ? "fill-brand-gold text-brand-gold" : "text-muted-foreground"}`}
            />
          ))}
          <span className="text-xs text-muted-foreground ml-1">(42)</span>
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="font-bold text-brand-forest text-lg">
            Nu. {Number(product.price).toLocaleString()}
          </span>
          <Button
            data-ocid={`product.button.${index}`}
            size="sm"
            onClick={handleAdd}
            disabled={addToCart.isPending || product.stock <= 0}
            className="rounded-full bg-brand-forest hover:bg-brand-forest-light text-white text-xs px-4"
          >
            <ShoppingCart className="w-3 h-3 mr-1" /> Add
          </Button>
        </div>
      </div>
    </div>
  );
}
