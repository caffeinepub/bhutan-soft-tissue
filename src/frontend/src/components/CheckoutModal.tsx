import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { usePlaceOrder } from "../hooks/useQueries";

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  total: number;
}

type PaymentMethod = "bank_transfer" | "cash_on_delivery";

interface FormFields {
  businessName: string;
  contactPerson: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  paymentMethod: PaymentMethod;
}

interface FormErrors {
  businessName: string;
  contactPerson: string;
  phone: string;
  address: string;
  city: string;
}

export default function CheckoutModal({
  open,
  onClose,
  onSuccess,
  total,
}: CheckoutModalProps) {
  const [form, setForm] = useState<FormFields>({
    businessName: "",
    contactPerson: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    paymentMethod: "bank_transfer",
  });
  const [errors, setErrors] = useState<FormErrors>({
    businessName: "",
    contactPerson: "",
    phone: "",
    address: "",
    city: "",
  });
  const placeOrder = usePlaceOrder();

  const set =
    (key: keyof FormFields) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const validate = () => {
    const e: FormErrors = {
      businessName: form.businessName.trim() ? "" : "Business name is required",
      contactPerson: form.contactPerson.trim()
        ? ""
        : "Contact person is required",
      phone: form.phone.trim() ? "" : "Phone number is required",
      address: form.address.trim() ? "" : "Delivery address is required",
      city: form.city.trim() ? "" : "City is required",
    };
    setErrors(e);
    return !Object.values(e).some(Boolean);
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const combinedAddress = `${form.address}, ${form.city}${
      form.postalCode ? ` ${form.postalCode}` : ""
    } | Payment: ${
      form.paymentMethod === "bank_transfer"
        ? "Bank Transfer"
        : "Cash on Delivery"
    }`;
    try {
      await placeOrder.mutateAsync({
        name: form.businessName,
        phone: form.phone,
        address: `${form.businessName} | Contact: ${form.contactPerson} | ${combinedAddress}`,
      });
      toast.success("Wholesale order placed! We'll confirm within 24 hours.");
      setForm({
        businessName: "",
        contactPerson: "",
        phone: "",
        address: "",
        city: "",
        postalCode: "",
        paymentMethod: "bank_transfer",
      });
      onSuccess();
    } catch {
      toast.error("Failed to place order. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="bg-brand-cream max-w-lg max-h-[90vh] overflow-y-auto"
        data-ocid="checkout.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-brand-forest">
            Wholesale Order Checkout
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Order Total */}
          <div className="bg-brand-forest/10 rounded-lg p-3 flex justify-between items-center">
            <span className="text-sm font-medium">Order Total</span>
            <span className="font-serif font-bold text-brand-forest text-lg">
              Nu. {total.toLocaleString()}
            </span>
          </div>

          {/* Business Details */}
          <div className="space-y-1">
            <Label>
              Business Name <span className="text-destructive">*</span>
            </Label>
            <Input
              data-ocid="checkout.input"
              value={form.businessName}
              onChange={set("businessName")}
              placeholder="Your business / shop name"
              className="bg-white"
            />
            {errors.businessName && (
              <p
                data-ocid="checkout.name_error"
                className="text-destructive text-xs"
              >
                {errors.businessName}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label>
              Contact Person <span className="text-destructive">*</span>
            </Label>
            <Input
              data-ocid="checkout.input"
              value={form.contactPerson}
              onChange={set("contactPerson")}
              placeholder="Name of person handling this order"
              className="bg-white"
            />
            {errors.contactPerson && (
              <p
                data-ocid="checkout.contact_error"
                className="text-destructive text-xs"
              >
                {errors.contactPerson}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label>
              Phone Number <span className="text-destructive">*</span>
            </Label>
            <Input
              data-ocid="checkout.input"
              value={form.phone}
              onChange={set("phone")}
              placeholder="+975 XXXXXXXX"
              className="bg-white"
            />
            {errors.phone && (
              <p
                data-ocid="checkout.phone_error"
                className="text-destructive text-xs"
              >
                {errors.phone}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label>
              Delivery Address <span className="text-destructive">*</span>
            </Label>
            <Input
              data-ocid="checkout.textarea"
              value={form.address}
              onChange={set("address")}
              placeholder="Street / locality"
              className="bg-white"
            />
            {errors.address && (
              <p
                data-ocid="checkout.address_error"
                className="text-destructive text-xs"
              >
                {errors.address}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>
                City <span className="text-destructive">*</span>
              </Label>
              <Input
                data-ocid="checkout.input"
                value={form.city}
                onChange={set("city")}
                placeholder="Thimphu"
                className="bg-white"
              />
              {errors.city && (
                <p
                  data-ocid="checkout.city_error"
                  className="text-destructive text-xs"
                >
                  {errors.city}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Postal Code</Label>
              <Input
                data-ocid="checkout.input"
                value={form.postalCode}
                onChange={set("postalCode")}
                placeholder="Optional"
                className="bg-white"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  {
                    value: "bank_transfer",
                    label: "Bank Transfer",
                    icon: "🏦",
                  },
                  {
                    value: "cash_on_delivery",
                    label: "Cash on Delivery",
                    icon: "💵",
                  },
                ] as { value: PaymentMethod; label: string; icon: string }[]
              ).map((opt) => (
                <label
                  key={opt.value}
                  data-ocid={`checkout.${opt.value}.radio`}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                    form.paymentMethod === opt.value
                      ? "border-brand-forest bg-brand-forest/5"
                      : "border-brand-beige bg-white hover:border-brand-forest/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={opt.value}
                    checked={form.paymentMethod === opt.value}
                    onChange={set("paymentMethod")}
                    className="sr-only"
                  />
                  <span className="text-lg">{opt.icon}</span>
                  <span className="text-sm font-medium">{opt.label}</span>
                </label>
              ))}
            </div>
            {form.paymentMethod === "bank_transfer" && (
              <p className="text-xs text-muted-foreground bg-white rounded-lg p-3 border border-brand-beige">
                Bank of Bhutan — Account No. <strong>206467642</strong>. Please
                use your business name as the transfer reference.
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              data-ocid="checkout.cancel_button"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              data-ocid="checkout.submit_button"
              onClick={handleSubmit}
              disabled={placeOrder.isPending}
              className="flex-1 bg-brand-orange hover:bg-brand-orange/90 text-white rounded-full"
            >
              {placeOrder.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Placing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Place Wholesale Order
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
