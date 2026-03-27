import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  ImagePlus,
  KeyRound,
  Loader2,
  Lock,
  LogOut,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Product } from "../backend.d";
import {
  useAddProduct,
  useDeleteProduct,
  useOrders,
  useProducts,
  useUpdateOrderStatus,
  useUpdateProduct,
} from "../hooks/useQueries";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  delivered: "bg-green-100 text-green-800",
};

const EMPTY_FORM = {
  name: "",
  description: "",
  price: BigInt(0),
  stock: BigInt(0),
  imageUrl: "",
  category: "facial",
};

const STORAGE_HASH_KEY = "opal_admin_pw_hash";
const STORAGE_LOCKOUT_KEY = "opal_admin_lockout_until";
const STORAGE_ATTEMPTS_KEY = "opal_admin_attempts";
const SESSION_KEY = "opal_admin_authed";
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

async function sha256hex(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function getStoredHash(): string | null {
  return localStorage.getItem(STORAGE_HASH_KEY);
}
function getLockoutUntil(): number {
  return Number(localStorage.getItem(STORAGE_LOCKOUT_KEY) ?? "0");
}
function getFailedAttempts(): number {
  return Number(localStorage.getItem(STORAGE_ATTEMPTS_KEY) ?? "0");
}
function resetAttempts() {
  localStorage.removeItem(STORAGE_ATTEMPTS_KEY);
  localStorage.removeItem(STORAGE_LOCKOUT_KEY);
}

export default function Admin() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === "true",
  );
  const [showChangePassword, setShowChangePassword] = useState(false);

  // Login form state
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdownDisplay, setCountdownDisplay] = useState(0);

  // Setup form state
  const [setupPassword, setSetupPassword] = useState("");
  const [setupConfirm, setSetupConfirm] = useState("");
  const [setupError, setSetupError] = useState("");

  // Change password form state
  const [changeCurrent, setChangeCurrent] = useState("");
  const [changeNew, setChangeNew] = useState("");
  const [changeConfirm, setChangeConfirm] = useState("");
  const [changeError, setChangeError] = useState("");

  const isAdminPasswordSet = !!getStoredHash();
  // Live countdown for lockout
  useEffect(() => {
    const until = getLockoutUntil();
    const remaining = Math.max(0, Math.ceil((until - Date.now()) / 1000));
    setCountdownDisplay(remaining);
    if (remaining <= 0) return;
    const interval = setInterval(() => {
      const left = Math.max(
        0,
        Math.ceil((getLockoutUntil() - Date.now()) / 1000),
      );
      setCountdownDisplay(left);
      if (left <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: orders = [] } = useOrders();
  const { data: products = [] } = useProducts();
  const updateStatus = useUpdateOrderStatus();
  const addProduct = useAddProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<bigint | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync sessionStorage
  useEffect(() => {
    if (isAdminAuthenticated) {
      sessionStorage.setItem(SESSION_KEY, "true");
    } else {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }, [isAdminAuthenticated]);

  const handleImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setForm((prev) => ({ ...prev, imageUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupError("");
    if (setupPassword.length < 8) {
      setSetupError("Password must be at least 8 characters.");
      return;
    }
    if (setupPassword !== setupConfirm) {
      setSetupError("Passwords do not match.");
      return;
    }
    setIsSubmitting(true);
    try {
      const hash = await sha256hex(setupPassword);
      localStorage.setItem(STORAGE_HASH_KEY, hash);
      resetAttempts();
      sessionStorage.setItem(SESSION_KEY, "true");
      setIsAdminAuthenticated(true);
      toast.success("Admin password created. You are now logged in.");
    } catch {
      setSetupError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    // Check lockout
    const lockoutUntil = getLockoutUntil();
    if (Date.now() < lockoutUntil) {
      const secs = Math.ceil((lockoutUntil - Date.now()) / 1000);
      const mins = Math.floor(secs / 60);
      const s = secs % 60;
      setLoginError(
        `Too many failed attempts. Try again in ${mins} minutes ${s} seconds.`,
      );
      return;
    }
    setIsSubmitting(true);
    try {
      const hash = await sha256hex(loginPassword);
      const storedHash = getStoredHash();
      if (hash === storedHash) {
        resetAttempts();
        sessionStorage.setItem(SESSION_KEY, "true");
        setIsAdminAuthenticated(true);
        setLoginPassword("");
      } else {
        const attempts = getFailedAttempts() + 1;
        localStorage.setItem(STORAGE_ATTEMPTS_KEY, String(attempts));
        if (attempts >= MAX_ATTEMPTS) {
          const until = Date.now() + LOCKOUT_DURATION_MS;
          localStorage.setItem(STORAGE_LOCKOUT_KEY, String(until));
          localStorage.setItem(STORAGE_ATTEMPTS_KEY, "0");
          setLoginError("Too many failed attempts. Locked out for 15 minutes.");
        } else {
          const remaining = MAX_ATTEMPTS - attempts;
          setLoginError(
            `Incorrect password. ${remaining} attempt(s) remaining before lockout.`,
          );
        }
      }
    } catch {
      setLoginError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangeError("");
    if (changeNew.length < 8) {
      setChangeError("New password must be at least 8 characters.");
      return;
    }
    if (changeNew !== changeConfirm) {
      setChangeError("New passwords do not match.");
      return;
    }
    setIsSubmitting(true);
    try {
      const currentHash = await sha256hex(changeCurrent);
      const storedHash = getStoredHash();
      if (currentHash !== storedHash) {
        setChangeError("Current password is incorrect.");
        return;
      }
      const newHash = await sha256hex(changeNew);
      localStorage.setItem(STORAGE_HASH_KEY, newHash);
      setShowChangePassword(false);
      setChangeCurrent("");
      setChangeNew("");
      setChangeConfirm("");
      toast.success("Password changed successfully.");
    } catch {
      setChangeError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setIsAdminAuthenticated(false);
    setLoginPassword("");
    setLoginError("");
  };

  // Setup password (first time)
  if (!isAdminPasswordSet && !isAdminAuthenticated) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-10 shadow-xl border border-brand-beige max-w-sm w-full mx-4"
          data-ocid="admin.panel"
        >
          <div className="w-16 h-16 rounded-full bg-brand-forest/10 flex items-center justify-center mx-auto mb-5">
            <KeyRound className="w-8 h-8 text-brand-forest" />
          </div>
          <h2 className="font-serif text-2xl font-bold mb-1 text-center">
            Set Up Admin Password
          </h2>
          <p className="text-muted-foreground text-sm mb-6 text-center">
            Create a secure admin password. This is done only once.
          </p>
          <form onSubmit={handleSetup} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="setup-pw">New Password</Label>
              <Input
                id="setup-pw"
                data-ocid="admin.input"
                type="password"
                value={setupPassword}
                onChange={(e) => setSetupPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="setup-confirm">Confirm Password</Label>
              <Input
                id="setup-confirm"
                data-ocid="admin.input"
                type="password"
                value={setupConfirm}
                onChange={(e) => setSetupConfirm(e.target.value)}
                placeholder="Repeat password"
                autoComplete="new-password"
              />
            </div>
            {setupError && (
              <p
                data-ocid="admin.error_state"
                className="text-destructive text-xs"
              >
                {setupError}
              </p>
            )}
            <Button
              type="submit"
              data-ocid="admin.primary_button"
              disabled={isSubmitting}
              className="w-full bg-brand-forest hover:bg-brand-forest-light text-white rounded-full"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Create Admin Password
                </>
              )}
            </Button>
          </form>
        </motion.div>
      </div>
    );
  }

  // Login gate
  if (!isAdminAuthenticated) {
    const isLockedOut = countdownDisplay > 0;
    const lockMins = Math.floor(countdownDisplay / 60);
    const lockSecs = countdownDisplay % 60;

    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-10 shadow-xl border border-brand-beige max-w-sm w-full mx-4"
          data-ocid="admin.panel"
        >
          <div className="w-16 h-16 rounded-full bg-brand-forest/10 flex items-center justify-center mx-auto mb-5">
            <Lock className="w-8 h-8 text-brand-forest" />
          </div>
          <h2 className="font-serif text-2xl font-bold mb-1 text-center">
            Admin Login
          </h2>
          <p className="text-muted-foreground text-sm mb-6 text-center">
            Enter your admin password to continue
          </p>

          {isLockedOut && (
            <div
              data-ocid="admin.error_state"
              className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-medium"
            >
              🔒 Too many failed attempts. Please wait{" "}
              <span className="font-bold">
                {lockMins > 0 ? `${lockMins} min ` : ""}
                {lockSecs} sec
              </span>{" "}
              before trying again.
            </div>
          )}

          {!showChangePassword ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="login-pw">Admin Password</Label>
                <Input
                  id="login-pw"
                  data-ocid="admin.input"
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  disabled={isLockedOut}
                />
              </div>
              {loginError && (
                <p
                  data-ocid="admin.error_state"
                  className="text-destructive text-xs"
                >
                  {loginError}
                </p>
              )}
              <Button
                type="submit"
                data-ocid="admin.primary_button"
                disabled={isSubmitting || isLockedOut}
                className="w-full bg-brand-forest hover:bg-brand-forest-light text-white rounded-full"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isLockedOut ? (
                  `Locked (${lockMins > 0 ? `${lockMins}m ` : ""}${lockSecs}s)`
                ) : (
                  "Sign In"
                )}
              </Button>
              <div className="text-center">
                <button
                  type="button"
                  data-ocid="admin.link"
                  onClick={() => {
                    setShowChangePassword(true);
                    setLoginError("");
                  }}
                  className="text-xs text-muted-foreground underline hover:text-brand-forest"
                >
                  Change Password
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <p className="text-sm font-medium text-brand-forest">
                Change Admin Password
              </p>
              <div className="space-y-1">
                <Label htmlFor="change-current">Current Password</Label>
                <Input
                  id="change-current"
                  data-ocid="admin.input"
                  type="password"
                  value={changeCurrent}
                  onChange={(e) => setChangeCurrent(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="change-new">New Password</Label>
                <Input
                  id="change-new"
                  data-ocid="admin.input"
                  type="password"
                  value={changeNew}
                  onChange={(e) => setChangeNew(e.target.value)}
                  placeholder="Minimum 8 characters"
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="change-confirm">Confirm New Password</Label>
                <Input
                  id="change-confirm"
                  data-ocid="admin.input"
                  type="password"
                  value={changeConfirm}
                  onChange={(e) => setChangeConfirm(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              {changeError && (
                <p
                  data-ocid="admin.error_state"
                  className="text-destructive text-xs"
                >
                  {changeError}
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  data-ocid="admin.cancel_button"
                  onClick={() => {
                    setShowChangePassword(false);
                    setChangeError("");
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  data-ocid="admin.primary_button"
                  disabled={isSubmitting}
                  className="flex-1 bg-brand-forest hover:bg-brand-forest-light text-white"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Update"
                  )}
                </Button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    );
  }

  // ---- Authenticated Dashboard ----

  const openAdd = () => {
    setEditingProduct(null);
    setForm(EMPTY_FORM);
    setProductModalOpen(true);
  };
  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setForm({
      name: p.name,
      description: p.description,
      price: p.price,
      stock: p.stock,
      imageUrl: p.imageUrl,
      category: p.category,
    });
    setProductModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingProduct) {
        await updateProduct.mutateAsync({
          id: editingProduct.id,
          product: { ...editingProduct, ...form },
        });
        toast.success("Product updated");
      } else {
        await addProduct.mutateAsync({ id: BigInt(0), ...form });
        toast.success("Product added");
      }
      setProductModalOpen(false);
    } catch {
      toast.error("Failed to save product");
    }
  };

  const handleDelete = async (id: bigint) => {
    try {
      await deleteProduct.mutateAsync(id);
      toast.success("Product deleted");
      setDeleteConfirm(null);
    } catch {
      toast.error("Failed to delete product");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-brand-forest text-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-white/70 text-sm mt-1">
              Manage products and orders
            </p>
          </div>
          <Button
            data-ocid="admin.secondary_button"
            variant="ghost"
            onClick={handleSignOut}
            className="text-white hover:bg-white/10 rounded-full"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Tabs defaultValue="orders">
          <TabsList className="mb-6 bg-brand-beige">
            <TabsTrigger
              value="orders"
              data-ocid="admin.orders.tab"
              className="data-[state=active]:bg-brand-forest data-[state=active]:text-white"
            >
              Orders ({orders.length})
            </TabsTrigger>
            <TabsTrigger
              value="products"
              data-ocid="admin.products.tab"
              className="data-[state=active]:bg-brand-forest data-[state=active]:text-white"
            >
              Products ({products.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            {orders.length === 0 ? (
              <div
                data-ocid="admin.orders.empty_state"
                className="text-center py-16 text-muted-foreground"
              >
                <p className="font-serif text-xl">No orders yet</p>
              </div>
            ) : (
              <div
                className="overflow-x-auto rounded-xl border border-brand-beige"
                data-ocid="admin.orders.table"
              >
                <Table>
                  <TableHeader>
                    <TableRow className="bg-brand-beige/50">
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Update</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order, idx) => (
                      <TableRow
                        key={String(order.id)}
                        data-ocid={`admin.orders.row.${idx + 1}`}
                      >
                        <TableCell className="font-mono text-sm">
                          #{String(order.id)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {order.customerName}
                        </TableCell>
                        <TableCell>{order.phone}</TableCell>
                        <TableCell className="max-w-32 truncate">
                          {order.address}
                        </TableCell>
                        <TableCell className="font-semibold">
                          Nu. {Number(order.total).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`text-xs ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-700"}`}
                          >
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            defaultValue={order.status}
                            onValueChange={(val) =>
                              updateStatus.mutate({ id: order.id, status: val })
                            }
                          >
                            <SelectTrigger
                              data-ocid={`admin.orders.select.${idx + 1}`}
                              className="w-32 h-8 text-xs"
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="confirmed">
                                Confirmed
                              </SelectItem>
                              <SelectItem value="delivered">
                                Delivered
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="products">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-serif text-xl font-semibold">Products</h2>
              <Button
                data-ocid="admin.product.primary_button"
                onClick={openAdd}
                className="bg-brand-orange hover:bg-brand-orange/90 text-white rounded-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </div>
            {products.length === 0 ? (
              <div
                data-ocid="admin.products.empty_state"
                className="text-center py-16 text-muted-foreground"
              >
                <p className="font-serif text-xl">No products yet</p>
              </div>
            ) : (
              <div
                className="overflow-x-auto rounded-xl border border-brand-beige"
                data-ocid="admin.products.table"
              >
                <Table>
                  <TableHeader>
                    <TableRow className="bg-brand-beige/50">
                      <TableHead>Image</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product, idx) => (
                      <TableRow
                        key={String(product.id)}
                        data-ocid={`admin.products.row.${idx + 1}`}
                      >
                        <TableCell>
                          <div className="w-10 h-10 rounded-lg bg-brand-card-green overflow-hidden">
                            {product.imageUrl && (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {product.name}
                        </TableCell>
                        <TableCell className="capitalize">
                          {product.category}
                        </TableCell>
                        <TableCell>
                          Nu. {Number(product.price).toLocaleString()}
                        </TableCell>
                        <TableCell>{Number(product.stock)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              data-ocid={`admin.products.edit_button.${idx + 1}`}
                              size="sm"
                              variant="outline"
                              onClick={() => openEdit(product)}
                              className="h-8 w-8 p-0"
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button
                              data-ocid={`admin.products.delete_button.${idx + 1}`}
                              size="sm"
                              variant="outline"
                              onClick={() => setDeleteConfirm(product.id)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Product Modal */}
      <Dialog open={productModalOpen} onOpenChange={setProductModalOpen}>
        <DialogContent
          className="bg-brand-cream max-w-lg"
          data-ocid="admin.product.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-brand-forest">
              {editingProduct ? "Edit Product" : "Add New Product"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1">
              <Label>Product Name</Label>
              <Input
                data-ocid="admin.product.input"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g. Premium Facial Tissue Box"
                className="bg-white"
              />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea
                data-ocid="admin.product.textarea"
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={2}
                className="bg-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Price (Nu.)</Label>
                <Input
                  data-ocid="admin.product.input"
                  type="number"
                  value={String(form.price)}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      price: BigInt(e.target.value || "0"),
                    }))
                  }
                  className="bg-white"
                />
              </div>
              <div className="space-y-1">
                <Label>Stock</Label>
                <Input
                  data-ocid="admin.product.input"
                  type="number"
                  value={String(form.stock)}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      stock: BigInt(e.target.value || "0"),
                    }))
                  }
                  className="bg-white"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(val) =>
                  setForm((prev) => ({ ...prev, category: val }))
                }
              >
                <SelectTrigger
                  data-ocid="admin.product.select"
                  className="bg-white"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="facial">Facial Tissue</SelectItem>
                  <SelectItem value="toilet">Toilet Roll</SelectItem>
                  <SelectItem value="kitchen">Kitchen Roll</SelectItem>
                  <SelectItem value="pocket">Pocket Tissue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Product Image</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageFile(file);
                }}
              />
              {form.imageUrl ? (
                <div className="relative w-full h-40 rounded-xl overflow-hidden border border-brand-beige bg-white">
                  <img
                    src={form.imageUrl}
                    alt="Product preview"
                    className="w-full h-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setForm((prev) => ({ ...prev, imageUrl: "" }));
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="absolute top-2 right-2 bg-white rounded-full p-1 shadow border border-gray-200 hover:bg-red-50"
                  >
                    <X className="w-4 h-4 text-destructive" />
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-2 right-2 bg-white rounded-full px-3 py-1 text-xs shadow border border-gray-200 font-medium hover:bg-gray-50"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-36 rounded-xl border-2 border-dashed border-brand-forest/30 bg-white hover:bg-brand-forest/5 flex flex-col items-center justify-center gap-2 transition-colors"
                >
                  <ImagePlus className="w-8 h-8 text-brand-forest/50" />
                  <span className="text-sm text-brand-forest/70 font-medium">
                    Tap to choose photo
                  </span>
                  <span className="text-xs text-muted-foreground">
                    From gallery or camera
                  </span>
                </button>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                data-ocid="admin.product.cancel_button"
                onClick={() => setProductModalOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                data-ocid="admin.product.save_button"
                onClick={handleSave}
                disabled={addProduct.isPending || updateProduct.isPending}
                className="flex-1 bg-brand-forest hover:bg-brand-forest-light text-white rounded-full"
              >
                {addProduct.isPending || updateProduct.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : editingProduct ? (
                  "Update"
                ) : (
                  "Add Product"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog
        open={deleteConfirm !== null}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <DialogContent
          className="bg-brand-cream max-w-sm"
          data-ocid="admin.delete.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              Delete Product
            </DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm mt-2">
            Are you sure you want to delete this product? This cannot be undone.
          </p>
          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              data-ocid="admin.delete.cancel_button"
              onClick={() => setDeleteConfirm(null)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              data-ocid="admin.delete.confirm_button"
              onClick={() =>
                deleteConfirm !== null && handleDelete(deleteConfirm)
              }
              disabled={deleteProduct.isPending}
              className="flex-1 bg-destructive hover:bg-destructive/90 text-white"
            >
              {deleteProduct.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
