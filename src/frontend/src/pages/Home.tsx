import { Button } from "@/components/ui/button";
import {
  BadgeCheck,
  CheckCircle,
  PackageCheck,
  TrendingDown,
  Truck,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { Page } from "../App";
import type { Product } from "../backend.d";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import WholesaleRegistrationModal from "../components/WholesaleRegistrationModal";
import { useProducts } from "../hooks/useQueries";

interface HomeProps {
  onNavigate: (page: Page) => void;
}

const CATEGORIES = [
  {
    name: "Tissue Rolls",
    img: "/assets/generated/tissue-rolls-wholesale.dim_400x400.jpg",
    desc: "Toilet rolls, kitchen rolls & more",
  },
  {
    name: "Napkin Tissue",
    img: "/assets/generated/napkin-tissue-wholesale.dim_400x400.jpg",
    desc: "Napkin boxes, dispenser packs & more",
  },
];

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
];

const LICENSE_DETAILS = [
  { label: "License No.", value: "2010425" },
  {
    label: "Issued By",
    value:
      "Ministry of Industry, Commerce and Employment, Royal Government of Bhutan",
  },
  { label: "Establishment Name", value: "Bhutan Soft Tissue" },
  { label: "Dzongkhag", value: "Chhukha" },
  { label: "Location", value: "Pekarzhing, Phuntsholing Throm" },
  { label: "Activity", value: "Toilet paper and napkin production" },
  { label: "Classification", value: "Production and Manufacturing" },
  { label: "Owner", value: "Opal Tissue" },
];

const WHY_CHOOSE = [
  {
    icon: CheckCircle,
    title: "Manufactured in Bhutan",
    desc: "Factory-built in Phuentsholing, supporting local industry and ensuring fresh stock directly from the source.",
  },
  {
    icon: PackageCheck,
    title: "High Quality Soft Tissue",
    desc: "Premium 2-ply and 3-ply tissue products rigorously tested for softness, strength, and consistency.",
  },
  {
    icon: TrendingDown,
    title: "Competitive Wholesale Pricing",
    desc: "Factory-direct pricing means maximum margins for your business with no middleman markups.",
  },
  {
    icon: Truck,
    title: "Reliable Supply for Businesses",
    desc: "Consistent stock levels backed by our dedicated manufacturing team to keep your shelves never empty.",
  },
];

const WHOLESALE_BENEFITS = [
  {
    title: "Factory Direct Pricing",
    desc: "Order directly from Bhutan Soft Tissue factory — no distributor fees, maximum savings.",
    emoji: "🏭",
  },
  {
    title: "Bulk Discounts Available",
    desc: "The larger your order, the more you save. Tiered pricing for hotels, restaurants, and distributors.",
    emoji: "📦",
  },
  {
    title: "Fast Delivery Across Bhutan",
    desc: "Efficient logistics to deliver your bulk orders anywhere across Bhutan on time.",
    emoji: "🚚",
  },
  {
    title: "Trusted Bhutan Brand",
    desc: "Opal Tissue is a government-licensed brand that your customers already know and trust.",
    emoji: "🇧🇹",
  },
];

export default function Home({ onNavigate }: HomeProps) {
  const { data: backendProducts } = useProducts();
  const products =
    backendProducts && backendProducts.length > 0
      ? backendProducts
      : SAMPLE_PRODUCTS;
  const [wholesaleOpen, setWholesaleOpen] = useState(false);

  return (
    <main>
      {/* Hero */}
      <section
        className="relative min-h-[90vh] flex items-center overflow-hidden"
        style={{
          backgroundImage:
            "url('/assets/generated/bhutan-hero.dim_1400x700.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />

        {/* Logo top-left corner */}
        <div className="absolute top-5 left-5 z-20">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-2 shadow-lg">
            <img
              src="/assets/uploads/img_9269-019d214c-9de5-726a-8245-19264c021580-1.jpeg"
              alt="Opal Tissue Logo"
              className="h-14 w-auto object-contain"
            />
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-2xl"
          >
            <p className="text-brand-gold text-sm font-medium tracking-[0.2em] uppercase mb-3">
              Wholesale Orders — Factory Direct
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-5">
              Opal Tissue –
              <br />
              <span className="text-brand-gold">Premium Quality</span>
              <br />
              Tissue Made in Bhutan
            </h1>
            <p className="text-white/80 text-base sm:text-lg mb-8 leading-relaxed">
              Bhutan's leading tissue manufacturer offering factory-direct bulk
              ordering for retailers, hotels, restaurants, and distributors
              across Bhutan.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                data-ocid="hero.primary_button"
                size="lg"
                onClick={() => onNavigate("shop")}
                className="rounded-full bg-brand-orange hover:bg-brand-orange/90 text-white px-8 font-medium"
              >
                View Products
              </Button>
              <Button
                data-ocid="hero.secondary_button"
                size="lg"
                variant="outline"
                onClick={() => setWholesaleOpen(true)}
                className="rounded-full border-white text-white hover:bg-white/10 px-8 font-medium bg-transparent"
              >
                Become a Wholesale Buyer
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Our Products */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="font-serif text-3xl sm:text-4xl font-bold">
              Wholesale Product Catalog
            </h2>
            <p className="text-muted-foreground mt-2">
              Factory-direct tissue products for retailers and businesses
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product, i) => (
              <motion.div
                key={String(product.id)}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <ProductCard product={product} index={i + 1} />
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Button
              data-ocid="home.view_all.button"
              onClick={() => onNavigate("shop")}
              className="rounded-full bg-brand-forest hover:bg-brand-forest-light text-white px-8"
            >
              View Full Catalog
            </Button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="font-serif text-3xl sm:text-4xl font-bold">
              Product Categories
            </h2>
            <p className="text-muted-foreground mt-2">
              Two core categories for every business need
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {CATEGORIES.map((cat, i) => (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                data-ocid={`category.item.${i + 1}`}
              >
                <button
                  type="button"
                  onClick={() => onNavigate("shop")}
                  className="group w-full rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-brand-beige"
                >
                  <div className="h-48 overflow-hidden">
                    <img
                      src={cat.img}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="bg-white px-5 py-4 text-left">
                    <p className="font-serif font-bold text-lg text-brand-forest group-hover:text-brand-orange transition-colors">
                      {cat.name}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {cat.desc}
                    </p>
                  </div>
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Opal Tissue */}
      <section className="py-16 bg-brand-forest/5 border-y border-brand-beige">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <p className="text-brand-gold text-xs font-medium tracking-[0.2em] uppercase mb-2">
              Our Advantage
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-brand-forest">
              Why Choose Opal Tissue
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {WHY_CHOOSE.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: i * 0.1 }}
                data-ocid={`why.card.${i + 1}`}
                className="bg-white rounded-2xl p-6 border border-brand-beige shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col gap-4"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-brand-forest/10 text-brand-forest">
                  <item.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-foreground mb-2">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Wholesale Benefits */}
      <section className="py-16 bg-brand-forest">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <p className="text-brand-gold text-xs font-medium tracking-[0.2em] uppercase mb-2">
              For Retailers &amp; Businesses
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white">
              Wholesale Benefits
            </h2>
            <p className="text-white/70 mt-2 max-w-lg mx-auto">
              Partner with Bhutan's trusted tissue manufacturer and grow your
              business with factory-direct advantages.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {WHOLESALE_BENEFITS.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: i * 0.1 }}
                data-ocid={`benefit.card.${i + 1}`}
                className="bg-white/10 border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-colors duration-300"
              >
                <div className="text-3xl mb-4">{item.emoji}</div>
                <h3 className="font-serif font-bold text-base text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-white/70 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center mt-12"
          >
            <Button
              data-ocid="wholesale.register.button"
              size="lg"
              onClick={() => setWholesaleOpen(true)}
              className="rounded-full bg-brand-gold text-brand-forest hover:bg-brand-gold/90 px-10 font-bold text-base"
            >
              Become a Wholesale Buyer
            </Button>
          </motion.div>
        </div>
      </section>

      {/* License & Credentials */}
      <section
        id="license"
        className="py-16 bg-background border-t border-brand-beige"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 bg-brand-gold/10 border border-brand-gold/30 rounded-full px-4 py-1.5 mb-4">
              <BadgeCheck className="w-4 h-4 text-brand-gold" />
              <span className="text-xs font-medium text-brand-gold uppercase tracking-widest">
                Verified Business
              </span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold">
              Our License &amp; Credentials
            </h2>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              Officially registered and licensed by the Royal Government of
              Bhutan.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="bg-white rounded-2xl border border-brand-beige shadow-sm overflow-hidden"
          >
            <div className="bg-brand-forest px-8 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="text-brand-gold text-xs font-medium tracking-[0.15em] uppercase mb-1">
                  Official Business License
                </p>
                <p className="text-white font-serif text-xl font-bold">
                  Bhutan Soft Tissue
                </p>
              </div>
              <div className="text-right">
                <p className="text-white/60 text-xs uppercase tracking-wider">
                  License No.
                </p>
                <p className="text-brand-gold font-serif text-2xl font-bold">
                  2010425
                </p>
              </div>
            </div>

            <div className="p-8">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-5">
                {LICENSE_DETAILS.slice(1).map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                    className="border-b border-brand-beige pb-4 last:border-0"
                    data-ocid={`license.item.${i + 1}`}
                  >
                    <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                      {item.label}
                    </dt>
                    <dd
                      className={`font-medium text-sm ${
                        item.label === "Owner"
                          ? "text-brand-forest font-serif text-base"
                          : "text-foreground"
                      }`}
                    >
                      {item.value}
                    </dd>
                  </motion.div>
                ))}
              </dl>
            </div>

            <div className="bg-brand-gold/5 border-t border-brand-beige px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                Issued by the Ministry of Industry, Commerce and Employment,
                Royal Government of Bhutan
              </p>
              <div className="flex items-center gap-1.5 text-brand-gold">
                <BadgeCheck className="w-4 h-4" />
                <span className="text-xs font-semibold">
                  Officially Verified
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact */}
      <section
        id="contact"
        className="py-16 bg-brand-forest/5 border-t border-brand-beige"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-4">
              Get in Touch
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              For wholesale orders, bulk pricing enquiries, or business
              partnerships, reach out to us.
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <div className="flex items-center gap-2 bg-white rounded-full px-5 py-3 shadow-sm border border-brand-beige">
                <span>📞</span>{" "}
                <span className="font-medium">+975-17259599</span>
              </div>
              <div className="flex items-center gap-2 bg-white rounded-full px-5 py-3 shadow-sm border border-brand-beige">
                <span>✉</span>{" "}
                <span className="font-medium">bhutansofttissue@gmail.com</span>
              </div>
              <div className="flex items-center gap-2 bg-white rounded-full px-5 py-3 shadow-sm border border-brand-beige">
                <span>📍</span>{" "}
                <span className="font-medium">
                  Toribari: Phuntsholing Thromde, Pasakha, Chukha, Bhutan
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer onNavigate={onNavigate} />

      <WholesaleRegistrationModal
        open={wholesaleOpen}
        onClose={() => setWholesaleOpen(false)}
      />
    </main>
  );
}
