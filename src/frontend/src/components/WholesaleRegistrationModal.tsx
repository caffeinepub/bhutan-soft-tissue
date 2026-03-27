import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BadgeCheck, Building2, CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";

interface WholesaleRegistrationModalProps {
  open: boolean;
  onClose: () => void;
}

interface FormFields {
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  businessAddress: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  businessAddress: string;
  password: string;
  confirmPassword: string;
}

const EMPTY_FORM: FormFields = {
  businessName: "",
  ownerName: "",
  phone: "",
  email: "",
  businessAddress: "",
  password: "",
  confirmPassword: "",
};

const EMPTY_ERRORS: FormErrors = {
  businessName: "",
  ownerName: "",
  phone: "",
  email: "",
  businessAddress: "",
  password: "",
  confirmPassword: "",
};

export default function WholesaleRegistrationModal({
  open,
  onClose,
}: WholesaleRegistrationModalProps) {
  const [form, setForm] = useState<FormFields>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>(EMPTY_ERRORS);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const set =
    (key: keyof FormFields) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const validate = (): boolean => {
    const e: FormErrors = { ...EMPTY_ERRORS };
    if (!form.businessName.trim()) e.businessName = "Business name is required";
    if (!form.ownerName.trim()) e.ownerName = "Owner name is required";
    if (!form.phone.trim()) e.phone = "Phone number is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^@]+@[^@]+\.[^@]+$/.test(form.email))
      e.email = "Enter a valid email";
    if (!form.businessAddress.trim())
      e.businessAddress = "Business address is required";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 8)
      e.password = "Password must be at least 8 characters";
    if (form.confirmPassword !== form.password)
      e.confirmPassword = "Passwords do not match";
    setErrors(e);
    return !Object.values(e).some(Boolean);
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    // Persist registration to localStorage
    const existing = JSON.parse(
      localStorage.getItem("wholesale_registrations") ?? "[]",
    ) as object[];
    existing.push({
      ...form,
      password: "[hashed]",
      status: "pending",
      submittedAt: new Date().toISOString(),
    });
    localStorage.setItem("wholesale_registrations", JSON.stringify(existing));
    setSubmitting(false);
    setSuccess(true);
  };

  const handleClose = () => {
    onClose();
    // Reset after dialog close animation
    setTimeout(() => {
      setForm(EMPTY_FORM);
      setErrors(EMPTY_ERRORS);
      setSuccess(false);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="bg-brand-cream max-w-lg max-h-[90vh] overflow-y-auto"
        data-ocid="wholesale.dialog"
      >
        {success ? (
          <div className="py-8 flex flex-col items-center text-center gap-5">
            <div className="w-20 h-20 rounded-full bg-brand-forest/10 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-brand-forest" />
            </div>
            <div>
              <h2 className="font-serif text-2xl font-bold text-brand-forest mb-2">
                Registration Submitted!
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
                Your wholesale account registration has been submitted. Our team
                will review and approve your account within{" "}
                <strong>1–2 business days</strong>. We'll contact you at the
                provided phone number and email.
              </p>
            </div>
            <div className="bg-brand-forest/5 border border-brand-beige rounded-xl p-4 text-left w-full space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-brand-forest uppercase tracking-wider">
                <BadgeCheck className="w-4 h-4" />
                Pending Admin Approval
              </div>
              <p className="text-xs text-muted-foreground">
                Your application is pending approval by Bhutan Soft Tissue
                management. Once approved, you'll receive full access to
                wholesale pricing and ordering.
              </p>
            </div>
            <Button
              data-ocid="wholesale.close_button"
              onClick={handleClose}
              className="rounded-full bg-brand-forest hover:bg-brand-forest-light text-white px-8"
            >
              Close
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-xl bg-brand-forest/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-brand-forest" />
                </div>
                <DialogTitle className="font-serif text-xl text-brand-forest">
                  Wholesale Buyer Registration
                </DialogTitle>
              </div>
              <p className="text-sm text-muted-foreground">
                Register your business to access wholesale pricing and place
                bulk orders with Opal Tissue.
              </p>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              <div className="space-y-1">
                <Label>
                  Business Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  data-ocid="wholesale.input"
                  value={form.businessName}
                  onChange={set("businessName")}
                  placeholder="Your shop / company name"
                  className="bg-white"
                />
                {errors.businessName && (
                  <p
                    data-ocid="wholesale.name_error"
                    className="text-destructive text-xs"
                  >
                    {errors.businessName}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label>
                  Owner Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  data-ocid="wholesale.input"
                  value={form.ownerName}
                  onChange={set("ownerName")}
                  placeholder="Full name of business owner"
                  className="bg-white"
                />
                {errors.ownerName && (
                  <p
                    data-ocid="wholesale.owner_error"
                    className="text-destructive text-xs"
                  >
                    {errors.ownerName}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>
                    Phone Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    data-ocid="wholesale.input"
                    value={form.phone}
                    onChange={set("phone")}
                    placeholder="+975 XXXXXXXX"
                    className="bg-white"
                  />
                  {errors.phone && (
                    <p
                      data-ocid="wholesale.phone_error"
                      className="text-destructive text-xs"
                    >
                      {errors.phone}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label>
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    data-ocid="wholesale.input"
                    type="email"
                    value={form.email}
                    onChange={set("email")}
                    placeholder="your@email.com"
                    className="bg-white"
                  />
                  {errors.email && (
                    <p
                      data-ocid="wholesale.email_error"
                      className="text-destructive text-xs"
                    >
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <Label>
                  Business Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  data-ocid="wholesale.input"
                  value={form.businessAddress}
                  onChange={set("businessAddress")}
                  placeholder="Full business address"
                  className="bg-white"
                />
                {errors.businessAddress && (
                  <p
                    data-ocid="wholesale.address_error"
                    className="text-destructive text-xs"
                  >
                    {errors.businessAddress}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label>
                  Password <span className="text-destructive">*</span>
                </Label>
                <Input
                  data-ocid="wholesale.input"
                  type="password"
                  value={form.password}
                  onChange={set("password")}
                  placeholder="Min. 8 characters"
                  className="bg-white"
                />
                {errors.password && (
                  <p
                    data-ocid="wholesale.password_error"
                    className="text-destructive text-xs"
                  >
                    {errors.password}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label>
                  Confirm Password <span className="text-destructive">*</span>
                </Label>
                <Input
                  data-ocid="wholesale.input"
                  type="password"
                  value={form.confirmPassword}
                  onChange={set("confirmPassword")}
                  placeholder="Repeat your password"
                  className="bg-white"
                />
                {errors.confirmPassword && (
                  <p
                    data-ocid="wholesale.confirm_error"
                    className="text-destructive text-xs"
                  >
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              <div className="bg-brand-gold/10 border border-brand-gold/30 rounded-xl p-3">
                <p className="text-xs text-muted-foreground">
                  <strong className="text-brand-forest">Note:</strong> All
                  wholesale accounts are reviewed and approved by Bhutan Soft
                  Tissue management before activation.
                </p>
              </div>

              <div className="flex gap-3 pt-1">
                <Button
                  variant="outline"
                  data-ocid="wholesale.cancel_button"
                  onClick={handleClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  data-ocid="wholesale.submit_button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 bg-brand-forest hover:bg-brand-forest-light text-white rounded-full"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Registration"
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
