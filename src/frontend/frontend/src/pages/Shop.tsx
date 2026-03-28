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
    name: "Premium Facial Tissue Box",
    description: "Ultra-soft 3-ply facial tissue box with 200 sheets",
    price: BigInt(85),
    stock: BigInt(100),
    imageUrl: "/assets/generated/tissue-facial.dim_400x400.jpg",
    category: "facial",
  },
  {
    id: BigInt(2),
    name: "Dragon Toilet Roll 4-Pack",
    description: "Soft 2-ply toilet paper with Bhutanese dragon embossing",
    price: BigInt(120),
    stock: BigInt(200),
    imageUrl: "/assets/generated/tissue-toilet.dim_400x400.jpg",
    category: "toilet",
  },
  {
    id: BigInt(3),
    name: "Kitchen Mega Roll",
    description: "Extra absorbent 2-ply kitchen paper towel",
    price: BigInt(95),
    stock: BigInt(150),
    imageUrl: "/assets/generated/tissue-kitchen.dim_400x400.jpg",
    category: "kitchen",
  },
  {
    id: BigInt(4),
    name: "Pocket Tissue 10-Pack",
    description: "Convenient travel-size pocket tissues",
    price: BigInt(55),
    stock: BigInt(300),
    imageUrl: "/assets/generated/tissue-pocket.dim_400x400.jpg",
    category: "pocket",
  },
  {
    id: BigInt(5),
    name: "Luxury Facial Tissue Box",
    description: "Premium 3-ply soft facial tissue with lotion",
    price: BigInt(110),
    stock: BigInt(80),
    imageUrl: "/assets/generated/tissue-facial.dim_400x400.jpg",
    category: "facial",
  },
  {
    id: BigInt(6),
    name: "Jumbo Toilet Roll 6-Pack",
    description: "Economy pack of soft toilet rolls for family use",
    price: BigInt(160),
    stock: BigInt(120),
    imageUrl: "/assets/generated/tissue-toilet.dim_400x400.jpg",
    category: "toilet",
  },
  {
    id: BigInt(7),
    name: "Kitchen Roll Duo Pack",
    description: "Two large absorbent kitchen paper rolls",
    price: BigInt(130),
    stock: BigInt(90),
    imageUrl: "/assets/generated/tissue-kitchen.dim_400x400.jpg",
    category: "kitchen",
  },
  {
    id: BigInt(8),
    name: "Pocket Tissue Variety Pack",
    description: "Assorted pocket tissues — 20 pack",
    price: BigInt(75),
    stock: BigInt(200),
    imageUrl: "/assets/generated/tissue-pocket.dim_400x400.jpg",
    category: "pocket",
  },
];

const CATEGORIES = [
  { label: "All", value: "all" },
  { label: "Facial Tissue", value: "facial" },
  { label: "Toilet Roll", value: "toilet" },
  { label: "Kitchen Roll", value: "kitchen" },
  { label: "Pocket Tissue", value: "pocket" },
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
            <h1 className="font-serif text-4xl sm:text-5xl font-bold mb-3">
              Our Products
            </h1>
            <p className="text-white/70 max-w-md mx-auto">
              Pure, soft, and eco-conscious tissue products from the heart of
              Bhutan
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
