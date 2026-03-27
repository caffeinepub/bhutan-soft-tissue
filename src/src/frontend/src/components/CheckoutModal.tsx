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

export default function CheckoutModal({
  open,
  onClose,
  onSuccess,
  total,
}: CheckoutModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [errors, setErrors] = useState({ name: "", phone: "", address: "" });
  const placeOrder = usePlaceOrder();

  const validate = () => {
    const e = { name: "", phone: "", address: "" };
    if (!name.trim()) e.name = "Name is required";
    if (!phone.trim()) e.phone = "Phone is required";
    if (!address.trim()) e.address = "Address is required";
    setErrors(e);
    return !e.name && !e.phone && !e.address;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      await placeOrder.mutateAsync({ name, phone, address });
      toast.success("Order placed! We'll contact you soon.");
      setName("");
      setPhone("");
      setAddress("");
      onSuccess();
    } catch {
      toast.error("Failed to place order. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="bg-brand-cream max-w-md"
        data-ocid="checkout.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-brand-forest">
            Complete Your Order
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="bg-brand-forest/10 rounded-lg p-3 flex justify-between">
            <span className="text-sm font-medium">Order Total</span>
            <span className="font-serif font-bold text-brand-forest">
              Nu. {total.toLocaleString()}
            </span>
          </div>
          <div className="space-y-1">
            <Label>Customer Name</Label>
            <Input
              data-ocid="checkout.input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className="bg-white"
            />
            {errors.name && (
              <p
                data-ocid="checkout.name_error"
                className="text-destructive text-xs"
              >
                {errors.name}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label>Phone Number</Label>
            <Input
              data-ocid="checkout.input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
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
            <Label>Delivery Address</Label>
            <Input
              data-ocid="checkout.textarea"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Thimphu, Bhutan"
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
                  Place Order
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
