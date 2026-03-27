import { Button } from "@/components/ui/button";
import { Eye, Package, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "../backend.d";
import { useAddToCart } from "../hooks/useQueries";

interface ProductCardProps {
  product: Product;
  index: number;
}

function parseMoq(description: string): string {
  const match = description.match(/MOQ:\s*(\d+\s*\w+)/i);
  return match ? match[1] : "12 units";
}

function parsePackSize(description: string): string | null {
  const match = description.match(/Pack Size:\s*([^|]+)/i);
  return match ? match[1].trim() : null;
}

export default function ProductCard({ product, index }: ProductCardProps) {
  const addToCart = useAddToCart();

  const handleAdd = () => {
    addToCart.mutate(
      { productId: product.id, quantity: BigInt(1) },
      { onSuccess: () => toast.success(`${product.name} added to cart!`) },
    );
  };

  const handleViewDetails = () => {
    toast.info(`${product.name} — contact us for full product details.`);
  };

  const moq = parseMoq(product.description);
  const packSize = parsePackSize(product.description);

  return (
    <div
      data-ocid={`product.item.${index}`}
      className="rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 group flex flex-col"
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
        {/* Wholesale badge */}
        <div className="absolute top-3 left-3">
          <span className="bg-brand-forest text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">
            Wholesale
          </span>
        </div>
      </div>
      <div className="bg-white p-4 flex flex-col flex-1">
        <h3 className="font-serif font-semibold text-foreground text-sm leading-snug mb-2">
          {product.name}
        </h3>

        {/* Pack size & MOQ info */}
        <div className="flex flex-col gap-1.5 mb-3">
          {packSize && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Package className="w-3 h-3 shrink-0" />
              <span>Pack: {packSize}</span>
            </div>
          )}
          <div className="inline-flex items-center gap-1.5">
            <span className="bg-brand-gold/15 text-brand-forest text-[11px] font-semibold px-2 py-0.5 rounded-full">
              Min. Order: {moq}
            </span>
          </div>
        </div>

        <div className="mt-auto">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
            Wholesale Price
          </p>
          <p className="font-bold text-brand-forest text-xl mb-3">
            Nu. {Number(product.price).toLocaleString()}
          </p>
          <div className="flex gap-2">
            <Button
              data-ocid={`product.button.${index}`}
              size="sm"
              onClick={handleAdd}
              disabled={addToCart.isPending || product.stock <= 0}
              className="flex-1 rounded-full bg-brand-forest hover:bg-brand-forest-light text-white text-xs px-3"
            >
              <ShoppingCart className="w-3 h-3 mr-1" /> Add to Order
            </Button>
            <Button
              data-ocid={`product.view.${index}`}
              size="sm"
              variant="outline"
              onClick={handleViewDetails}
              className="rounded-full border-brand-beige hover:border-brand-forest text-xs px-3"
            >
              <Eye className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
