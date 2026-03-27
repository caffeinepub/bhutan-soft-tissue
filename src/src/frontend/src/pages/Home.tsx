import { Button } from "@/components/ui/button";
import { BadgeCheck } from "lucide-react";
import { motion } from "motion/react";
import type { Page } from "../App";
import type { Product } from "../backend.d";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import { useProducts } from "../hooks/useQueries";

interface HomeProps {
  onNavigate: (page: Page) => void;
}

const CATEGORIES = [
  {
    name: "Facial Tissue",
    img: "/assets/generated/tissue-facial.dim_400x400.jpg",
  },
  {
    name: "Toilet Roll",
    img: "/assets/generated/tissue-toilet.dim_400x400.jpg",
  },
  {
    name: "Kitchen Roll",
    img: "/assets/generated/tissue-kitchen.dim_400x400.jpg",
  },
  {
    name: "Pocket Tissue",
    img: "/assets/generated/tissue-pocket.dim_400x400.jpg",
  },
];

const SAMPLE_PRODUCTS: Product[] = [
  {
    id: BigInt(1),
    name: "Premium Facial Tissue Box",
    description: "Ultra-soft 3-ply facial tissue",
    price: BigInt(85),
    stock: BigInt(100),
    imageUrl: "/assets/generated/tissue-facial.dim_400x400.jpg",
    category: "facial",
  },
  {
    id: BigInt(2),
    name: "Dragon Toilet Roll 4-Pack",
    description: "Soft 2-ply toilet paper",
    price: BigInt(120),
    stock: BigInt(200),
    imageUrl: "/assets/generated/tissue-toilet.dim_400x400.jpg",
    category: "toilet",
  },
  {
    id: BigInt(3),
    name: "Kitchen Mega Roll",
    description: "Absorbent kitchen towel roll",
    price: BigInt(95),
    stock: BigInt(150),
    imageUrl: "/assets/generated/tissue-kitchen.dim_400x400.jpg",
    category: "kitchen",
  },
  {
    id: BigInt(4),
    name: "Pocket Tissue 10-Pack",
    description: "Travel-friendly tissue packets",
    price: BigInt(55),
    stock: BigInt(300),
    imageUrl: "/assets/generated/tissue-pocket.dim_400x400.jpg",
    category: "pocket",
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

export default function Home({ onNavigate }: HomeProps) {
  const { data: backendProducts } = useProducts();
  const products =
    backendProducts && backendProducts.length > 0
      ? backendProducts
      : SAMPLE_PRODUCTS;

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
        <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/30 to-transparent" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-xl"
          >
            <p className="text-brand-gold text-sm font-medium tracking-[0.2em] uppercase mb-3">
              Bhutan Soft Tissue
            </p>
            <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
              Softness
              <br />
              <span className="text-brand-gold italic">Inspired</span>
              <br />
              by Nature.
            </h1>
            <p className="text-white/80 text-base sm:text-lg mb-8 leading-relaxed">
              Premium tissue products crafted with care from the heart of Bhutan
              — pure, gentle, and kind to your skin.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                data-ocid="hero.primary_button"
                size="lg"
                onClick={() => onNavigate("shop")}
                className="rounded-full bg-brand-orange hover:bg-brand-orange/90 text-white px-8 font-medium"
              >
                Shop Our Collection
              </Button>
              <Button
                data-ocid="hero.secondary_button"
                size="lg"
                variant="outline"
                onClick={() =>
                  document
                    .getElementById("story")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="rounded-full border-white text-white hover:bg-white/10 px-8 font-medium bg-transparent"
              >
                Our Story
              </Button>
            </div>
          </motion.div>
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
              Shop by Category
            </h2>
            <p className="text-muted-foreground mt-2">
              Find the perfect tissue for every need
            </p>
          </motion.div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {CATEGORIES.map((cat, i) => (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                data-ocid={`category.item.${i + 1}`}
              >
                <button
                  type="button"
                  onClick={() => onNavigate("shop")}
                  className="group flex flex-col items-center gap-3 w-full"
                >
                  <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-brand-gold/30 group-hover:border-brand-gold transition-all duration-300 shadow-lg">
                    <img
                      src={cat.img}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <span className="font-medium text-sm text-center group-hover:text-brand-orange transition-colors">
                    {cat.name}
                  </span>
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
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
              Featured Products
            </h2>
            <p className="text-muted-foreground mt-2">
              Our bestselling tissue products
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.slice(0, 4).map((product, i) => (
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
              data-ocid="featured.primary_button"
              onClick={() => onNavigate("shop")}
              variant="outline"
              size="lg"
              className="rounded-full border-brand-forest text-brand-forest hover:bg-brand-forest hover:text-white px-10 font-medium"
            >
              View All Products
            </Button>
          </div>
        </div>
      </section>

      {/* Story */}
      <section id="story" className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="font-serif text-3xl sm:text-4xl font-bold">
              The Bhutan Soft Tissue Story
            </h2>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="bg-brand-forest/5 rounded-2xl p-8 border border-brand-beige"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-brand-gold/40">
                  <img
                    src="/assets/uploads/img_9268-019d212c-597f-76ad-bcd5-6631dad91b4e-3.png"
                    alt="Opal Tissue"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-serif font-bold">Opal Tissue</p>
                  <p className="text-sm text-muted-foreground">Brand</p>
                </div>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Bhutan Soft Tissue (BST) is a manufacturing Tissue Paper Company
                guided by its vision and mission, established at a suitable
                location at Phuentsholing, Bhutan. The company was started with
                a plan of proposal with aim to make Bhutan self-reliant in the
                use of tissue papers. We have completed the construction of the
                factory building, ordered and installed machines imported from
                India, and developed our product designs. We are producing
                different kinds of tissue paper in Bhutan under the brand name
                &ldquo;Opal Tissue&rdquo;. After doing extensive research over
                many years, we have established the Tissue factory in Bhutan,
                supported by an active and hard-working team to ensure constant
                supply to the market.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="rounded-2xl overflow-hidden h-80 shadow-xl bg-white flex items-center justify-center p-8"
            >
              <img
                src="/assets/uploads/img_9269-019d214c-9de5-726a-8245-19264c021580-1.jpeg"
                alt="Opal Tissue Logo"
                className="max-w-full max-h-full object-contain"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* License & Credentials */}
      <section
        id="license"
        className="py-16 bg-brand-forest/5 border-t border-brand-beige"
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
            {/* Header banner */}
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

            {/* Details grid */}
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

            {/* Footer strip */}
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
        className="py-16 bg-background border-t border-brand-beige"
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
              For orders, wholesale enquiries, or feedback, reach out to us.
              We&apos;re happy to help.
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
    </main>
  );
}
