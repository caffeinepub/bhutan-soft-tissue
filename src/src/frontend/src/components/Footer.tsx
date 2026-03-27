import { ArrowUp, Leaf } from "lucide-react";
import { useState } from "react";
import { SiFacebook, SiInstagram, SiWhatsapp } from "react-icons/si";
import type { Page } from "../App";
import InfoModal from "./InfoModal";

interface FooterProps {
  onNavigate: (page: Page) => void;
}

const POLICIES = [
  {
    title: "How to Buy",
    content:
      "Browse our products and add your desired items to the cart. When ready, click the cart icon and proceed to checkout. Fill in your name, phone number, and delivery address, then place your order. We will confirm your order by phone.",
  },
  {
    title: "How to Pay",
    content:
      "Payment is accepted via:\n\n• Cash on Delivery\n• mBOB (Mobile Bank of Bhutan)\n• mPay\n• DK Bank transfer\n\nFor digital payments, please transfer to BoB account number: 206467642. Send payment confirmation to +975-17259599.",
  },
  {
    title: "Return Policy",
    content:
      "Products can be returned within 7 days of delivery if they are damaged or defective.\n\nTo arrange a return:\n1. Call us at +975-17259599\n2. Describe the issue\n3. We will arrange pickup or exchange\n\nWe do not accept returns for products that have been opened and used unless they are defective.",
  },
  {
    title: "Shipping Policy",
    content:
      "We deliver within Bhutan.\n\n• Phuentsholing & nearby: 1–3 business days\n• Other districts: 3–5 business days\n\nShipping fees apply based on location and order size. Free delivery for orders above Nu. 500 within Phuentsholing.\n\nFor urgent deliveries, please contact us directly.",
  },
  {
    title: "FAQ",
    content:
      'Q: Do I need an account to order?\nA: No, you can order as a guest.\n\nQ: How do I track my order?\nA: Call us at +975-17259599 with your order details.\n\nQ: Do you offer wholesale?\nA: Yes! Contact us directly for bulk and wholesale pricing.\n\nQ: What tissue brands do you carry?\nA: We produce under our own brand "Opal Tissue".\n\nQ: Can I change or cancel my order?\nA: Call us as soon as possible at +975-17259599.',
  },
];

export default function Footer({ onNavigate }: FooterProps) {
  const year = new Date().getFullYear();
  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "";
  const [modalPolicy, setModalPolicy] = useState<(typeof POLICIES)[0] | null>(
    null,
  );

  return (
    <footer className="bg-brand-forest text-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-brand-gold/20 flex items-center justify-center">
                <Leaf className="w-5 h-5 text-brand-gold" />
              </div>
              <div>
                <div className="font-serif text-sm font-bold tracking-wider uppercase">
                  Bhutan
                </div>
                <div className="font-serif text-sm font-bold text-brand-gold tracking-widest uppercase">
                  Soft Tissue
                </div>
              </div>
            </div>
            <p className="text-white/70 text-sm leading-relaxed">
              Premium tissue products inspired by the purity and natural beauty
              of the Kingdom of Bhutan.
            </p>
          </div>
          <div>
            <h4 className="font-serif text-brand-gold font-semibold mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li>
                <button
                  type="button"
                  data-ocid="footer.home.link"
                  onClick={() => onNavigate("home")}
                  className="hover:text-brand-gold transition-colors"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  type="button"
                  data-ocid="footer.shop.link"
                  onClick={() => onNavigate("shop")}
                  className="hover:text-brand-gold transition-colors"
                >
                  Shop
                </button>
              </li>
              <li>
                <a
                  href="#story"
                  className="hover:text-brand-gold transition-colors"
                >
                  Our Story
                </a>
              </li>
              <li>
                <a
                  href="#contact"
                  className="hover:text-brand-gold transition-colors"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-serif text-brand-gold font-semibold mb-4">
              Policies
            </h4>
            <ul className="space-y-2 text-sm text-white/70">
              {POLICIES.map((policy) => (
                <li key={policy.title}>
                  <button
                    type="button"
                    data-ocid="footer.policy.link"
                    onClick={() => setModalPolicy(policy)}
                    className="hover:text-brand-gold transition-colors text-left"
                  >
                    {policy.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-serif text-brand-gold font-semibold mb-4">
              Customer Support
            </h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li>Orders &amp; Delivery</li>
              <li>Returns &amp; Refunds</li>
              <li>Wholesale Enquiry</li>
              <li>FAQs</li>
            </ul>
          </div>
          <div>
            <h4 className="font-serif text-brand-gold font-semibold mb-4">
              Follow Us
            </h4>
            <div className="flex gap-4 mb-4">
              <button
                type="button"
                data-ocid="footer.social.link"
                className="w-9 h-9 rounded-full border border-white/30 flex items-center justify-center hover:bg-brand-gold hover:border-brand-gold transition-all"
              >
                <SiFacebook className="w-4 h-4" />
              </button>
              <button
                type="button"
                data-ocid="footer.social.link"
                className="w-9 h-9 rounded-full border border-white/30 flex items-center justify-center hover:bg-brand-gold hover:border-brand-gold transition-all"
              >
                <SiInstagram className="w-4 h-4" />
              </button>
              <button
                type="button"
                data-ocid="footer.social.link"
                className="w-9 h-9 rounded-full border border-white/30 flex items-center justify-center hover:bg-brand-gold hover:border-brand-gold transition-all"
              >
                <SiWhatsapp className="w-4 h-4" />
              </button>
            </div>
            <div className="text-sm text-white/70 space-y-1">
              <p>📞 +975-17259599</p>
              <p>✉ bhutansofttissue@gmail.com</p>
              <p>📍 Toribari: Phuntsholing Thromde, Pasakha, Chukha, Bhutan</p>
            </div>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-white/20 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white/50 text-xs">
            © {year} Bhutan Soft Tissue — Opal Tissue. All rights reserved.
          </p>
          <p className="text-white/40 text-xs">
            Built with ❤ using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(hostname)}`}
              className="underline hover:text-white/70"
              target="_blank"
              rel="noopener noreferrer"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </div>
      <button
        type="button"
        data-ocid="footer.button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="absolute bottom-6 right-6 w-10 h-10 rounded-full bg-brand-orange text-white flex items-center justify-center hover:bg-brand-orange/90 transition-all shadow-lg"
      >
        <ArrowUp className="w-4 h-4" />
      </button>

      {modalPolicy && (
        <InfoModal
          open={!!modalPolicy}
          onOpenChange={(open) => !open && setModalPolicy(null)}
          title={modalPolicy.title}
          content={modalPolicy.content}
        />
      )}
    </footer>
  );
}
