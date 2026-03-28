import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle,
  Clock,
  Loader2,
  MapPin,
  Package,
  Phone,
  ShoppingBag,
  Truck,
  User,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";
import { useOrders, useProducts } from "../hooks/useQueries";

const PRICING = {
  napkin: { carton: 2800, packet: 280, name: "Napkin Tissue", id: BigInt(0) },
  roll: { carton: 3200, packet: 320, name: "Roll Tissue", id: BigInt(1) },
};

const ORDER_STATUSES = [
  { key: "Order Confirmed", label: "Order Confirmed", icon: CheckCircle },
  { key: "Preparing Order", label: "Preparing Order", icon: Package },
  { key: "Out for Delivery", label: "Out for Delivery", icon: Truck },
  { key: "Delivered", label: "Delivered", icon: ShoppingBag },
];

const STATUS_COLORS: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-800",
  Processing: "bg-blue-100 text-blue-800",
  Shipped: "bg-purple-100 text-purple-800",
  Delivered: "bg-green-100 text-green-800",
  Canceled: "bg-red-100 text-red-800",
};

interface Quantities {
  cartons: number;
  packets: number;
}

function Stepper({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm font-medium text-muted-foreground w-16">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-11 h-11 rounded-full border-2 border-brand-forest text-brand-forest font-bold text-xl flex items-center justify-center hover:bg-brand-forest hover:text-white transition-colors active:scale-95"
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <span className="w-10 text-center text-lg font-bold tabular-nums">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="w-11 h-11 rounded-full bg-brand-forest text-white font-bold text-xl flex items-center justify-center hover:bg-brand-forest/80 transition-colors active:scale-95"
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

export default function OrderDashboard() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { data: products } = useProducts();
  const { data: orders } = useOrders();

  const [napkin, setNapkin] = useState<Quantities>({ cartons: 0, packets: 0 });
  const [roll, setRoll] = useState<Quantities>({ cartons: 0, packets: 0 });
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeOrder, setActiveOrder] = useState<{
    id: bigint;
    status: string;
  } | null>(null);

  const napkinTotal =
    napkin.cartons * PRICING.napkin.carton +
    napkin.packets * PRICING.napkin.packet;
  const rollTotal =
    roll.cartons * PRICING.roll.carton + roll.packets * PRICING.roll.packet;
  const grandTotal = napkinTotal + rollTotal;

  const hasItems = napkinTotal > 0 || rollTotal > 0;

  // Find product IDs from backend, falling back to hardcoded
  const getNapkinId = () => {
    const found = products?.find((p) =>
      p.name.toLowerCase().includes("napkin"),
    );
    return found ? found.id : PRICING.napkin.id;
  };
  const getRollId = () => {
    const found = products?.find((p) => p.name.toLowerCase().includes("roll"));
    return found ? found.id : PRICING.roll.id;
  };

  const handleConfirm = async () => {
    if (!hasItems) {
      toast.error("Add at least one product to your order");
      return;
    }
    if (!customerName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!phone.trim()) {
      toast.error("Please enter your phone number");
      return;
    }
    if (!actor) {
      toast.error("Not connected. Please try again.");
      return;
    }
    setIsSubmitting(true);
    try {
      const items: Array<{
        productId: bigint;
        quantity: bigint;
        price: bigint;
      }> = [];

      if (napkinTotal > 0) {
        const napkinId = getNapkinId();
        const qty = BigInt(napkin.cartons * 100 + napkin.packets);
        items.push({
          productId: napkinId,
          quantity: qty > 0n ? qty : 1n,
          price: BigInt(PRICING.napkin.carton),
        });
      }
      if (rollTotal > 0) {
        const rollId = getRollId();
        const qty = BigInt(roll.cartons * 100 + roll.packets);
        items.push({
          productId: rollId,
          quantity: qty > 0n ? qty : 1n,
          price: BigInt(PRICING.roll.carton),
        });
      }

      // Build a rich address that includes carton/packet breakdown for admin display
      const orderDetails = [
        napkinTotal > 0
          ? `Napkin: ${napkin.cartons}c+${napkin.packets}p`
          : null,
        rollTotal > 0 ? `Roll: ${roll.cartons}c+${roll.packets}p` : null,
      ]
        .filter(Boolean)
        .join(", ");

      const fullAddress = [
        address.trim() || "Not specified",
        `[${orderDetails}]`,
      ].join(" ");

      const result = await (actor as any).submitOrder(
        customerName.trim(),
        phone.trim(),
        fullAddress,
        items,
        BigInt(grandTotal),
      );

      if ("err" in result) {
        toast.error(`Order creation failed: ${result.err}`);
        return;
      }

      const orderId = result.ok;
      setActiveOrder({ id: orderId, status: "Order Confirmed" });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order placed successfully!");
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Order creation failed: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setNapkin({ cartons: 0, packets: 0 });
    setRoll({ cartons: 0, packets: 0 });
  };

  const handleNewOrder = () => {
    setActiveOrder(null);
    setNapkin({ cartons: 0, packets: 0 });
    setRoll({ cartons: 0, packets: 0 });
    setCustomerName("");
    setPhone("");
    setAddress("");
  };

  const currentStatusIdx = activeOrder
    ? ORDER_STATUSES.findIndex((s) => s.key === activeOrder.status)
    : -1;

  // Filter order history by current customer name
  const orderHistory = orders
    ? customerName.trim()
      ? orders.filter((o) =>
          o.customerName.toLowerCase().includes(customerName.toLowerCase()),
        )
      : orders
    : [];

  return (
    <main className="min-h-screen bg-brand-cream pt-6 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-serif font-bold text-brand-forest">
            Order Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Opal Tissue – Wholesale Ordering
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {activeOrder ? (
            /* Order Status Tracker */
            <motion.div
              key="tracker"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="bg-white rounded-2xl shadow-md p-6 sm:p-8"
              data-ocid="order.success_state"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-9 h-9 text-green-600" />
                </div>
                <h2 className="text-2xl font-serif font-bold text-brand-forest">
                  Order Placed!
                </h2>
                <p className="text-muted-foreground mt-1">
                  Order #{activeOrder.id.toString()}
                </p>
              </div>

              {/* Status Steps */}
              <div className="relative mb-10">
                <div className="hidden sm:block absolute top-5 left-[calc(12.5%+12px)] right-[calc(12.5%+12px)] h-1 bg-border rounded-full" />
                <div
                  className="hidden sm:block absolute top-5 h-1 bg-brand-forest rounded-full transition-all duration-700"
                  style={{
                    left: "calc(12.5% + 12px)",
                    width: `${(currentStatusIdx / (ORDER_STATUSES.length - 1)) * 75}%`,
                  }}
                />
                <div className="flex justify-between">
                  {ORDER_STATUSES.map((step, idx) => {
                    const Icon = step.icon;
                    const isActive = idx <= currentStatusIdx;
                    return (
                      <div
                        key={step.key}
                        className="flex flex-col items-center gap-2 flex-1"
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center z-10 border-2 transition-all duration-300 ${
                            isActive
                              ? "bg-brand-forest border-brand-forest text-white"
                              : "bg-white border-border text-muted-foreground"
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <span
                          className={`text-xs text-center leading-tight ${
                            isActive
                              ? "text-brand-forest font-semibold"
                              : "text-muted-foreground"
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-center">
                <Button
                  onClick={handleNewOrder}
                  className="bg-brand-forest text-white hover:bg-brand-forest/80 px-8"
                  data-ocid="order.primary_button"
                >
                  Place New Order
                </Button>
              </div>
            </motion.div>
          ) : (
            /* Main ordering UI */
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Product Cards */}
              <div className="lg:col-span-2 space-y-4">
                {/* Napkin Tissue Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="bg-white rounded-2xl shadow-sm border border-brand-beige overflow-hidden"
                  data-ocid="order.napkin.card"
                >
                  <div className="flex gap-4 p-4 sm:p-5">
                    <img
                      src="/assets/generated/napkin-tissue-wholesale.dim_400x400.jpg"
                      alt="Napkin Tissue"
                      className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="mb-1">
                        <h3 className="text-lg font-bold text-brand-forest">
                          Napkin Tissue
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Opal Tissue • Wholesale
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground mb-3">
                        Nu. 2,800/carton • Nu. 280/packet
                      </div>
                      <Stepper
                        label="Cartons"
                        value={napkin.cartons}
                        onChange={(v) =>
                          setNapkin((p) => ({ ...p, cartons: v }))
                        }
                      />
                      <Stepper
                        label="Packets"
                        value={napkin.packets}
                        onChange={(v) =>
                          setNapkin((p) => ({ ...p, packets: v }))
                        }
                      />
                      {napkinTotal > 0 && (
                        <div className="mt-2 text-sm font-semibold text-brand-orange">
                          Subtotal: Nu. {napkinTotal.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* Roll Tissue Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-2xl shadow-sm border border-brand-beige overflow-hidden"
                  data-ocid="order.roll.card"
                >
                  <div className="flex gap-4 p-4 sm:p-5">
                    <img
                      src="/assets/generated/tissue-rolls-wholesale.dim_400x400.jpg"
                      alt="Roll Tissue"
                      className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="mb-1">
                        <h3 className="text-lg font-bold text-brand-forest">
                          Roll Tissue
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Opal Tissue • Wholesale
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground mb-3">
                        Nu. 3,200/carton • Nu. 320/packet
                      </div>
                      <Stepper
                        label="Cartons"
                        value={roll.cartons}
                        onChange={(v) => setRoll((p) => ({ ...p, cartons: v }))}
                      />
                      <Stepper
                        label="Packets"
                        value={roll.packets}
                        onChange={(v) => setRoll((p) => ({ ...p, packets: v }))}
                      />
                      {rollTotal > 0 && (
                        <div className="mt-2 text-sm font-semibold text-brand-orange">
                          Subtotal: Nu. {rollTotal.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* Customer Info */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="bg-white rounded-2xl shadow-sm border border-brand-beige p-4 sm:p-5"
                >
                  <h3 className="font-bold text-brand-forest mb-4 flex items-center gap-2">
                    <User className="w-4 h-4" /> Customer Details
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="cname" className="text-sm">
                        Customer Name *
                      </Label>
                      <Input
                        id="cname"
                        placeholder="Your name or business name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="mt-1"
                        data-ocid="order.input"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="cphone"
                        className="text-sm flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" /> Phone Number *
                      </Label>
                      <Input
                        id="cphone"
                        type="tel"
                        placeholder="+975-XXXXXXXX"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="mt-1"
                        data-ocid="order.input"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="caddress"
                        className="text-sm flex items-center gap-1"
                      >
                        <MapPin className="w-3 h-3" /> Delivery Address
                      </Label>
                      <Input
                        id="caddress"
                        placeholder="Business address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="mt-1"
                        data-ocid="order.input"
                      />
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Order Summary Panel */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl shadow-sm border border-brand-beige p-5 lg:sticky lg:top-24">
                  <h3 className="font-bold text-brand-forest text-lg mb-4">
                    Order Summary
                  </h3>

                  <div className="space-y-3 mb-4">
                    {napkinTotal > 0 && (
                      <div className="p-3 bg-brand-cream rounded-xl">
                        <div className="font-medium text-sm text-brand-forest mb-1">
                          Napkin Tissue
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {napkin.cartons > 0 &&
                            `${napkin.cartons} Carton${napkin.cartons > 1 ? "s" : ""}`}
                          {napkin.cartons > 0 && napkin.packets > 0 && " + "}
                          {napkin.packets > 0 &&
                            `${napkin.packets} Packet${napkin.packets > 1 ? "s" : ""}`}
                        </div>
                        <div className="text-sm font-semibold text-brand-orange mt-1">
                          Nu. {napkinTotal.toLocaleString()}
                        </div>
                      </div>
                    )}
                    {rollTotal > 0 && (
                      <div className="p-3 bg-brand-cream rounded-xl">
                        <div className="font-medium text-sm text-brand-forest mb-1">
                          Roll Tissue
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {roll.cartons > 0 &&
                            `${roll.cartons} Carton${roll.cartons > 1 ? "s" : ""}`}
                          {roll.cartons > 0 && roll.packets > 0 && " + "}
                          {roll.packets > 0 &&
                            `${roll.packets} Packet${roll.packets > 1 ? "s" : ""}`}
                        </div>
                        <div className="text-sm font-semibold text-brand-orange mt-1">
                          Nu. {rollTotal.toLocaleString()}
                        </div>
                      </div>
                    )}
                    {!hasItems && (
                      <div
                        className="text-center py-6 text-muted-foreground text-sm"
                        data-ocid="order.empty_state"
                      >
                        No items added yet
                      </div>
                    )}
                  </div>

                  {hasItems && (
                    <>
                      <Separator className="my-3" />
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-bold text-brand-forest">
                          Grand Total
                        </span>
                        <span className="font-bold text-xl text-brand-orange">
                          Nu. {grandTotal.toLocaleString()}
                        </span>
                      </div>
                    </>
                  )}

                  <p className="text-xs text-muted-foreground mb-4">
                    Minimum 1 carton or 10 packets per product
                  </p>

                  <Button
                    onClick={handleConfirm}
                    disabled={isSubmitting}
                    className="w-full bg-brand-forest text-white hover:bg-brand-forest/80 mb-2 h-12 text-base"
                    data-ocid="order.submit_button"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                        Placing Order...
                      </>
                    ) : (
                      "Confirm Order"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    className="w-full border-destructive text-destructive hover:bg-destructive/10 h-12 text-base"
                    data-ocid="order.cancel_button"
                  >
                    Cancel Order
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Order History */}
        {!activeOrder && orderHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-10"
            data-ocid="order.list"
          >
            <h2 className="text-xl font-serif font-bold text-brand-forest mb-4">
              <Clock className="inline w-5 h-5 mr-2 -mt-0.5" />
              Order History
            </h2>
            <div className="space-y-3">
              {orderHistory.map((order, idx) => (
                <div
                  key={order.id.toString()}
                  className="bg-white rounded-xl border border-brand-beige p-4 flex items-start gap-3"
                  data-ocid={`order.item.${idx + 1}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-semibold text-brand-forest text-sm">
                        Order #{order.id.toString()}
                      </span>
                      <Badge
                        className={`text-xs ${
                          STATUS_COLORS[order.status] ??
                          "bg-gray-100 text-gray-700"
                        }`}
                        variant="outline"
                      >
                        {order.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {order.customerName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {order.items.length} item
                      {order.items.length !== 1 ? "s" : ""}
                    </div>
                    <div className="text-sm font-bold text-brand-orange mt-1">
                      Nu. {Number(order.total).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}
