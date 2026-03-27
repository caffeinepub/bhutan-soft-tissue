import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { useState } from "react";
import type { Page } from "../App";
import type { Product } from "../backend.d";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import { useProducts } from "../hooks/useQueries";

interface ShopProps {
  onNavigate: (page: Page) => void;
}

const SAMPLE_PRODUCTS: Product[] = [
  {
    id: BigInt(1),
    name: "Tissue Roll Pack (12 Rolls)",
    description: "Soft 2-ply toilet roll | Pack Size: 12 rolls | MOQ: 10 packs",
    price: BigInt(450),
    stock: BigInt(500),
    imageUrl: "/assets/generated/tissue-rolls-wholesale.dim_400x400.jpg",
    category: "rolls",
  },
  {
    id: BigInt(2),
    name: "Napkin Tissue Box (200 Sheets)",
    description:
      "Premium 2-ply napkin tissue | Pack Size: 200 sheets | MOQ: 20 boxes",
    price: BigInt(280),
    stock: BigInt(800),
    imageUrl: "/assets/generated/napkin-tissue-wholesale.dim_400x400.jpg",
    category: "napkin",
  },
  {
    id: BigInt(3),
    name: "Toilet Roll Bulk Pack (24 Rolls)",
    description:
      "Economy 2-ply toilet roll | Pack Size: 24 rolls | MOQ: 5 packs",
    price: BigInt(820),
    stock: BigInt(300),
    imageUrl: "/assets/generated/tissue-rolls-wholesale.dim_400x400.jpg",
    category: "rolls",
  },
  {
    id: BigInt(4),
    name: "Napkin Dispenser Pack (500 Sheets)",
    description:
      "Interfold napkin for dispensers | Pack Size: 500 sheets | MOQ: 10 packs",
    price: BigInt(360),
    stock: BigInt(600),
    imageUrl: "/assets/generated/napkin-tissue-wholesale.dim_400x400.jpg",
    category: "napkin",
  },
  {
    id: BigInt(5),
    name: "Premium Soft Roll Pack (6 Rolls)",
    description:
      "Premium 3-ply extra soft roll | Pack Size: 6 rolls | MOQ: 20 packs",
    price: BigInt(320),
    stock: BigInt(400),
    imageUrl: "/assets/generated/tissue-rolls-wholesale.dim_400x400.jpg",
    category: "rolls",
  },
  {
    id: BigInt(6),
    name: "Cocktail Napkin Box (400 Sheets)",
    description:
      "Compact cocktail napkin tissue | Pack Size: 400 sheets | MOQ: 15 boxes",
    price: BigInt(210),
    stock: BigInt(700),
    imageUrl: "/assets/generated/napkin-tissue-wholesale.dim_400x400.jpg",
    category: "napkin",
  },
  {
    id: BigInt(7),
    name: "Jumbo Roll Carton (48 Rolls)",
    description:
      "Jumbo carton for hotels & institutions | Pack Size: 48 rolls | MOQ: 2 cartons",
    price: BigInt(1580),
    stock: BigInt(150),
    imageUrl: "/assets/generated/tissue-rolls-wholesale.dim_400x400.jpg",
    category: "rolls",
  },
  {
    id: BigInt(8),
    name: "Luncheon Napkin Pack (300 Sheets)",
    description:
      "Full-size luncheon napkin | Pack Size: 300 sheets | MOQ: 12 packs",
    price: BigInt(290),
    stock: BigInt(500),
    imageUrl: "/assets/generated/napkin-tissue-wholesale.dim_400x400.jpg",
    category: "napkin",
  },
];

const CATEGORIES = [
  { label: "All Products", value: "all" },
  { label: "Tissue Rolls", value: "rolls" },
  { label: "Napkin Tissue", value: "napkin" },
];

export default function Shop({ onNavigate }: ShopProps) {
  const [activeCategory, setActiveCategory] = useState("all");
  const { data: backendProducts } = useProducts();
  const allProducts =
    backendProducts && backendProducts.length > 0
      ? backendProducts
      : SAMPLE_PRODUCTS;
  const filtered =
    activeCategory === "all"
      ? allProducts
      : allProducts.filter((p) => p.category === activeCategory);

  return (
    <main>
      <section className="bg-brand-forest text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-brand-gold text-xs font-medium tracking-[0.2em] uppercase mb-3">
              Factory Direct
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl font-bold mb-3">
              Wholesale Product Catalog
            </h1>
            <p className="text-white/70 max-w-md mx-auto">
              Factory-direct tissue products for retailers and businesses across
              Bhutan. Minimum order quantities apply.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="flex flex-wrap gap-3 mb-10 justify-center"
            data-ocid="shop.filter.tab"
          >
            {CATEGORIES.map((cat) => (
              <Button
                key={cat.value}
                data-ocid={`shop.${cat.value}.tab`}
                variant={activeCategory === cat.value ? "default" : "outline"}
                onClick={() => setActiveCategory(cat.value)}
                className={`rounded-full ${
                  activeCategory === cat.value
                    ? "bg-brand-forest text-white hover:bg-brand-forest-light"
                    : "border-brand-beige hover:border-brand-forest hover:text-brand-forest"
                }`}
              >
                {cat.label}
              </Button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div
              data-ocid="shop.empty_state"
              className="text-center py-16 text-muted-foreground"
            >
              <p className="font-serif text-2xl mb-2">No products found</p>
              <p className="text-sm">Try a different category</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filtered.map((product, i) => (
                <motion.div
                  key={String(product.id)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                >
                  <ProductCard product={product} index={i + 1} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer onNavigate={onNavigate} />
    </main>
  );
}
