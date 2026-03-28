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
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  BarChart2,
  Bell,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  Home,
  ImagePlus,
  KeyRound,
  Loader2,
  Lock,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  Pencil,
  PieChart as PieChartIcon,
  Plus,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Trash2,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import type { Product } from "../backend.d";
import { useActor } from "../hooks/useActor";
import {
  useAddProduct,
  useAdminPasswordLogin,
  useDeleteProduct,
  useOrders,
  useProducts,
  useSetupAdminPassword,
  useUpdateOrderStatus,
  useUpdateProduct,
} from "../hooks/useQueries";

// ── Constants ──────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  preparing: "bg-orange-100 text-orange-800 border-orange-200",
  out_for_delivery: "bg-purple-100 text-purple-800 border-purple-200",
  delivered: "bg-green-100 text-green-800 border-green-200",
  canceled: "bg-red-100 text-red-800 border-red-200",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  canceled: "Canceled",
};

const STATUS_FLOW = [
  "pending",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "delivered",
];

const PIE_COLORS = [
  "#22c55e",
  "#3b82f6",
  "#f97316",
  "#8b5cf6",
  "#ec4899",
  "#94a3b8",
];

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

// ── Auth helpers ────────────────────────────────────────────────────────────
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

// ── Message templates ───────────────────────────────────────────────────────
function getMessageTemplate(
  status: string,
  customerName: string,
): string | null {
  switch (status) {
    case "confirmed":
      return `Hello ${customerName},\n\nYour order with Bhutan Soft Tissue (Opal Tissue) has been confirmed.\n\nWe are currently preparing your napkin and roll tissue products for delivery.\n\nThank you for choosing our wholesale service.\n\nWe will notify you once the order is dispatched.\n\nBhutan Soft Tissue (Opal Tissue)\nWholesale Supply\nPhone: +975-17259599`;
    case "out_for_delivery":
      return `Hello ${customerName},\n\nYour order from Bhutan Soft Tissue (Opal Tissue) is now out for delivery.\n\nOur delivery team will reach you shortly. Please be available to receive the products.\n\nThank you.\n\nBhutan Soft Tissue (Opal Tissue)\nWholesale Supply\nPhone: +975-17259599`;
    case "delivered":
      return `Hello ${customerName},\n\nYour order from Bhutan Soft Tissue (Opal Tissue) has been successfully delivered.\n\nWe hope you received the products in good condition. Thank you for choosing us for your tissue supply.\n\nPlease reply CONFIRMED to confirm the delivery.\n\nIf you need more napkin or roll tissue supplies, feel free to contact us anytime.\n\nBhutan Soft Tissue (Opal Tissue)\nWholesale Supply\nPhone: +975-17259599`;
    case "canceled":
      return `Hello ${customerName},\n\nYour order with Bhutan Soft Tissue (Opal Tissue) has been canceled.\n\nWe apologize for any inconvenience caused. If you would like to place a new order for napkin or roll tissue, please contact us anytime.\n\nThank you for your understanding.\n\nBhutan Soft Tissue (Opal Tissue)\nWholesale Supply\nPhone: +975-17259599`;
    default:
      return null;
  }
}

// ── Nav items ───────────────────────────────────────────────────────────────
type NavSection =
  | "dashboard"
  | "orders"
  | "inventory"
  | "customers"
  | "analytics"
  | "products"
  | "settings";

const NAV_ITEMS: { id: NavSection; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "Dashboard", icon: <Home className="w-5 h-5" /> },
  { id: "orders", label: "Orders", icon: <ShoppingCart className="w-5 h-5" /> },
  {
    id: "inventory",
    label: "Inventory",
    icon: <Package className="w-5 h-5" />,
  },
  { id: "customers", label: "Customers", icon: <Users className="w-5 h-5" /> },
  {
    id: "analytics",
    label: "Analytics",
    icon: <BarChart2 className="w-5 h-5" />,
  },
  {
    id: "products",
    label: "Products",
    icon: <PieChartIcon className="w-5 h-5" />,
  },
  { id: "settings", label: "Settings", icon: <Settings className="w-5 h-5" /> },
];

// ── Main Component ──────────────────────────────────────────────────────────
export default function Admin() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === "true",
  );
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [activeSection, setActiveSection] = useState<NavSection>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const queryClient = useQueryClient();
  const [notifOpen, setNotifOpen] = useState(false);

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

  // Message modal
  const [messageModal, setMessageModal] = useState<{
    message: string;
    status: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Orders state
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [orderSortAsc, setOrderSortAsc] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<bigint | null>(null);

  // Inventory inline edit
  const [editingStockId, setEditingStockId] = useState<bigint | null>(null);
  const [editingStockValue, setEditingStockValue] = useState("");

  // Customer expand
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);

  // Backend mutations
  const adminPasswordLoginMutation = useAdminPasswordLogin();
  const setupAdminPasswordMutation = useSetupAdminPassword();

  const isAdminPasswordSet = !!getStoredHash();

  // Lockout countdown
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
  const updateProductMutation = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  // Product modal
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

  // Auto re-login to restore backend admin role on every mount
  const { actor } = useActor();
  useEffect(() => {
    if (!isAdminAuthenticated || !actor) return;
    const hash = getStoredHash();
    if (!hash) return;
    (actor as any).adminPasswordLogin(hash).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actor, isAdminAuthenticated]);

  // ── Image compression ────────────────────────────────────────────────────
  const handleImageFile = (file: File) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const MAX = 400;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) {
          height = Math.round((height * MAX) / width);
          width = MAX;
        } else {
          width = Math.round((width * MAX) / height);
          height = MAX;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
      setForm((prev) => ({ ...prev, imageUrl: dataUrl }));
    };
    img.src = objectUrl;
  };

  // ── Auth handlers ────────────────────────────────────────────────────────
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
      try {
        await setupAdminPasswordMutation.mutateAsync(hash);
      } catch {
        await adminPasswordLoginMutation.mutateAsync(hash);
      }
      sessionStorage.setItem(SESSION_KEY, "true");
      setIsAdminAuthenticated(true);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
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
        try {
          await adminPasswordLoginMutation.mutateAsync(hash);
        } catch {}
        sessionStorage.setItem(SESSION_KEY, "true");
        setIsAdminAuthenticated(true);
        queryClient.invalidateQueries({ queryKey: ["orders"] });
        queryClient.invalidateQueries({ queryKey: ["products"] });
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
          setLoginError(
            `Incorrect password. ${MAX_ATTEMPTS - attempts} attempt(s) remaining before lockout.`,
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

  const handleStatusChange = (
    orderId: bigint,
    newStatus: string,
    customerName: string,
  ) => {
    updateStatus.mutate({ id: orderId, status: newStatus });
    const msg = getMessageTemplate(newStatus, customerName);
    if (msg) {
      setMessageModal({ message: msg, status: newStatus });
      setCopied(false);
    }
  };

  const handleCopyMessage = async () => {
    if (!messageModal) return;
    try {
      await navigator.clipboard.writeText(messageModal.message);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error("Could not copy. Please select and copy the text manually.");
    }
  };

  // ── Product handlers ─────────────────────────────────────────────────────
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
        await updateProductMutation.mutateAsync({
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

  // ── Export CSV ───────────────────────────────────────────────────────────
  const exportOrdersCSV = () => {
    const header = "Order ID,Customer,Phone,Address,Products,Total,Status";
    const rows = orders.map((o) =>
      [
        String(o.id),
        `"${o.customerName}"`,
        o.phone,
        `"${o.address}"`,
        `"${o.items.map((i) => `Qty:${i.quantity}`).join("; ")}"`,
        `Nu ${Number(o.total).toLocaleString()}`,
        STATUS_LABELS[o.status] ?? o.status,
      ].join(","),
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "orders.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Derived data ─────────────────────────────────────────────────────────
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
  const uniqueCustomers = new Set(orders.map((o) => o.customerName)).size;
  const lowStockProducts = products.filter((p) => Number(p.stock) < 50);
  const lowStockCount = lowStockProducts.length;

  // Notifications
  const notifications = [
    ...orders
      .slice(-5)
      .reverse()
      .map((o) => ({
        text: `Order #${o.id} — ${STATUS_LABELS[o.status] ?? o.status}`,
        type: "order" as const,
      })),
    ...lowStockProducts.map((p) => ({
      text: `Low stock alert: ${p.name}`,
      type: "stock" as const,
    })),
  ];

  // Filtered / sorted orders
  const filteredOrders = orders
    .filter((o) => {
      const matchSearch =
        orderSearch === "" ||
        o.customerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
        String(o.id).includes(orderSearch);
      const matchStatus =
        orderStatusFilter === "all" || o.status === orderStatusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) =>
      orderSortAsc ? Number(a.id) - Number(b.id) : Number(b.id) - Number(a.id),
    );

  // Customer list derived from orders
  const customerMap = new Map<
    string,
    { phone: string; orders: typeof orders; totalSpent: number }
  >();
  for (const o of orders) {
    if (!customerMap.has(o.customerName)) {
      customerMap.set(o.customerName, {
        phone: o.phone,
        orders: [],
        totalSpent: 0,
      });
    }
    const c = customerMap.get(o.customerName)!;
    c.orders.push(o);
    c.totalSpent += Number(o.total);
  }
  const customers = Array.from(customerMap.entries()).map(([name, data]) => ({
    name,
    ...data,
  }));

  // Analytics data
  const revenueData = orders.map((o) => ({
    name: `#${o.id}`,
    revenue: Number(o.total),
  }));

  const productQtyMap = new Map<bigint, { name: string; qty: number }>();
  for (const o of orders) {
    for (const item of o.items) {
      const prod = products.find((p) => p.id === item.productId);
      const name = prod?.name ?? `Product ${item.productId}`;
      if (!productQtyMap.has(item.productId))
        productQtyMap.set(item.productId, { name, qty: 0 });
      productQtyMap.get(item.productId)!.qty += Number(item.quantity);
    }
  }
  const topProductsData = Array.from(productQtyMap.values())
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const customerRevMap = new Map<string, number>();
  for (const o of orders) {
    customerRevMap.set(
      o.customerName,
      (customerRevMap.get(o.customerName) ?? 0) + Number(o.total),
    );
  }
  const sortedCustRev = Array.from(customerRevMap.entries()).sort(
    (a, b) => b[1] - a[1],
  );
  const top5 = sortedCustRev.slice(0, 5);
  const othersTotal = sortedCustRev.slice(5).reduce((s, [, v]) => s + v, 0);
  const pieData = [
    ...top5.map(([name, value]) => ({ name, value })),
    ...(othersTotal > 0 ? [{ name: "Others", value: othersTotal }] : []),
  ];

  // ── Auth screens (no sidebar) ─────────────────────────────────────────────
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

  // ── AUTHENTICATED DASHBOARD ──────────────────────────────────────────────
  const sectionTitle =
    NAV_ITEMS.find((n) => n.id === activeSection)?.label ?? "Dashboard";

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          role="button"
          tabIndex={0}
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 flex flex-col w-64 bg-slate-900 text-white transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="px-6 py-5 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-green-500 flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-sm leading-tight">
                Bhutan Soft Tissue
              </p>
              <p className="text-slate-400 text-xs">Opal Tissue</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              data-ocid={`admin.${item.id}.link`}
              onClick={() => {
                setActiveSection(item.id);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                activeSection === item.id
                  ? "bg-slate-800 text-white border-r-2 border-green-400"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-4 py-4 border-t border-slate-700">
          <button
            type="button"
            data-ocid="admin.logout.button"
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-sm transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              data-ocid="admin.menu.toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="font-semibold text-slate-800 text-lg">
              {sectionTitle}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <div className="relative">
              <button
                type="button"
                data-ocid="admin.notifications.button"
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-lg hover:bg-slate-100"
              >
                <Bell className="w-5 h-5 text-slate-600" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                    {Math.min(notifications.length, 9)}
                  </span>
                )}
              </button>
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    data-ocid="admin.notifications.popover"
                    className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="font-semibold text-sm text-slate-800">
                        Notifications
                      </p>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-sm text-slate-400 px-4 py-6 text-center">
                          No notifications
                        </p>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.text}
                            className={`px-4 py-3 border-b border-slate-50 flex items-start gap-3 ${
                              n.type === "stock" ? "bg-orange-50" : ""
                            }`}
                          >
                            <div
                              className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                                n.type === "stock"
                                  ? "bg-orange-400"
                                  : "bg-blue-400"
                              }`}
                            />
                            <p className="text-xs text-slate-700">{n.text}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-brand-forest flex items-center justify-center">
              <span className="text-white text-xs font-bold">A</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {/* ═══════════════ DASHBOARD ═══════════════ */}
              {activeSection === "dashboard" && (
                <div className="space-y-6">
                  {/* Stat cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                      label="Total Orders"
                      value={String(orders.length)}
                      icon={<ShoppingCart className="w-5 h-5" />}
                      color="blue"
                    />
                    <StatCard
                      label="Total Revenue"
                      value={`Nu ${totalRevenue.toLocaleString()}`}
                      icon={<TrendingUp className="w-5 h-5" />}
                      color="green"
                    />
                    <StatCard
                      label="Active Customers"
                      value={String(uniqueCustomers)}
                      icon={<Users className="w-5 h-5" />}
                      color="green"
                    />
                    <StatCard
                      label="Low Stock Alerts"
                      value={String(lowStockCount)}
                      icon={<AlertTriangle className="w-5 h-5" />}
                      color="orange"
                    />
                  </div>

                  {/* Recent orders */}
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100">
                      <h2 className="font-semibold text-slate-800">
                        Recent Orders
                      </h2>
                    </div>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {orders
                            .slice(-5)
                            .reverse()
                            .map((o) => (
                              <TableRow key={String(o.id)}>
                                <TableCell className="font-mono text-xs">
                                  #{String(o.id)}
                                </TableCell>
                                <TableCell className="font-medium">
                                  {o.customerName}
                                </TableCell>
                                <TableCell>
                                  Nu {Number(o.total).toLocaleString()}
                                </TableCell>
                                <TableCell>
                                  <StatusBadge status={o.status} />
                                </TableCell>
                              </TableRow>
                            ))}
                          {orders.length === 0 && (
                            <TableRow>
                              <TableCell
                                colSpan={4}
                                className="text-center text-muted-foreground py-8"
                              >
                                No orders yet
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Quick stats */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                      <h3 className="font-semibold text-slate-700 mb-3">
                        Inventory Status
                      </h3>
                      {products.length === 0 ? (
                        <p className="text-sm text-slate-400">
                          No products added yet
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {products.slice(0, 4).map((p) => (
                            <div
                              key={String(p.id)}
                              className="flex items-center justify-between text-sm"
                            >
                              <span className="text-slate-700">{p.name}</span>
                              <span
                                className={
                                  Number(p.stock) < 50
                                    ? "text-orange-600 font-semibold"
                                    : "text-green-600 font-semibold"
                                }
                              >
                                {Number(p.stock)} units
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                      <h3 className="font-semibold text-slate-700 mb-3">
                        Low Stock Alerts
                      </h3>
                      {lowStockProducts.length === 0 ? (
                        <p className="text-sm text-green-600 font-medium">
                          ✓ All products are well stocked
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {lowStockProducts.map((p) => (
                            <div
                              key={String(p.id)}
                              className="flex items-center gap-2 text-sm text-orange-700 bg-orange-50 rounded-lg px-3 py-2"
                            >
                              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                              <span>
                                {p.name} — {Number(p.stock)} units remaining
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ═══════════════ ORDERS ═══════════════ */}
              {activeSection === "orders" && (
                <div className="space-y-4">
                  {/* Filters */}
                  <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1">
                        <Input
                          data-ocid="admin.orders.search_input"
                          placeholder="Search by customer or order ID…"
                          value={orderSearch}
                          onChange={(e) => setOrderSearch(e.target.value)}
                          className="w-full"
                        />
                      </div>
                      <Select
                        value={orderStatusFilter}
                        onValueChange={setOrderStatusFilter}
                      >
                        <SelectTrigger
                          data-ocid="admin.orders.select"
                          className="w-full sm:w-48"
                        >
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          {Object.entries(STATUS_LABELS).map(([k, v]) => (
                            <SelectItem key={k} value={k}>
                              {v}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        data-ocid="admin.orders.toggle"
                        onClick={() => setOrderSortAsc(!orderSortAsc)}
                        className="shrink-0"
                      >
                        Order ID {orderSortAsc ? "↑" : "↓"}
                      </Button>
                      <Button
                        variant="outline"
                        data-ocid="admin.orders.export_button"
                        onClick={exportOrdersCSV}
                        className="shrink-0"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                      </Button>
                    </div>
                  </div>

                  {/* Orders table */}
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-8" />
                            <TableHead>Order ID</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Products</TableHead>
                            <TableHead>Qty</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredOrders.length === 0 && (
                            <TableRow>
                              <TableCell
                                colSpan={8}
                                data-ocid="admin.orders.empty_state"
                                className="text-center text-muted-foreground py-10"
                              >
                                No orders found
                              </TableCell>
                            </TableRow>
                          )}
                          {filteredOrders.map((o, idx) => {
                            const isExpanded = expandedOrderId === o.id;
                            const totalQty = o.items.reduce(
                              (s, i) => s + Number(i.quantity),
                              0,
                            );
                            const productNames = o.items
                              .map((i) => {
                                const p = products.find(
                                  (pr) => pr.id === i.productId,
                                );
                                return p?.name ?? `Product ${i.productId}`;
                              })
                              .join(", ");
                            return (
                              <>
                                <TableRow
                                  key={String(o.id)}
                                  data-ocid={`admin.orders.row.${idx + 1}`}
                                  className="cursor-pointer hover:bg-slate-50"
                                  onClick={() =>
                                    setExpandedOrderId(isExpanded ? null : o.id)
                                  }
                                >
                                  <TableCell>
                                    <ChevronRight
                                      className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                                    />
                                  </TableCell>
                                  <TableCell className="font-mono text-xs font-medium">
                                    #{String(o.id)}
                                  </TableCell>
                                  <TableCell>
                                    <div>
                                      <p className="font-medium text-sm">
                                        {o.customerName}
                                      </p>
                                      <p className="text-xs text-slate-400">
                                        {o.phone}
                                      </p>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-sm text-slate-600 max-w-32 truncate">
                                    {productNames || "—"}
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    {totalQty}
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    Nu {Number(o.total).toLocaleString()}
                                  </TableCell>
                                  <TableCell
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <StatusBadge status={o.status} />
                                  </TableCell>
                                  <TableCell
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Select
                                      value={o.status}
                                      onValueChange={(val) =>
                                        handleStatusChange(
                                          o.id,
                                          val,
                                          o.customerName,
                                        )
                                      }
                                    >
                                      <SelectTrigger
                                        data-ocid={`admin.orders.status.select.${idx + 1}`}
                                        className="h-8 w-36 text-xs"
                                      >
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {Object.entries(STATUS_LABELS).map(
                                          ([k, v]) => (
                                            <SelectItem key={k} value={k}>
                                              {v}
                                            </SelectItem>
                                          ),
                                        )}
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                </TableRow>
                                {isExpanded && (
                                  <TableRow key={`${String(o.id)}-expand`}>
                                    <TableCell
                                      colSpan={8}
                                      className="bg-slate-50 p-0"
                                    >
                                      <div className="px-8 py-5">
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
                                          Order #{String(o.id)} Timeline
                                        </p>
                                        <OrderTimeline
                                          currentStatus={o.status}
                                        />
                                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                                          <div>
                                            <span className="font-medium">
                                              Address:
                                            </span>{" "}
                                            {o.address}
                                          </div>
                                          <div>
                                            <span className="font-medium">
                                              Phone:
                                            </span>{" "}
                                            {o.phone}
                                          </div>
                                          {o.items.map((item) => {
                                            const p = products.find(
                                              (pr) => pr.id === item.productId,
                                            );
                                            return (
                                              <div key={String(item.productId)}>
                                                <span className="font-medium">
                                                  {p?.name ?? "Product"}:
                                                </span>{" "}
                                                Qty {Number(item.quantity)} × Nu{" "}
                                                {Number(
                                                  item.price,
                                                ).toLocaleString()}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══════════════ INVENTORY ═══════════════ */}
              {activeSection === "inventory" && (
                <div className="space-y-4">
                  <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-800">
                    <AlertTriangle className="w-4 h-4 inline mr-2" />
                    Low stock threshold: products with fewer than 50 units are
                    flagged as Low Stock.
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product Name</TableHead>
                            <TableHead>Total Stock</TableHead>
                            <TableHead>Cartons (÷10)</TableHead>
                            <TableHead>Packets (rem×100)</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Edit</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {products.length === 0 && (
                            <TableRow>
                              <TableCell
                                colSpan={6}
                                data-ocid="admin.inventory.empty_state"
                                className="text-center text-muted-foreground py-10"
                              >
                                No products in inventory
                              </TableCell>
                            </TableRow>
                          )}
                          {products.map((p, idx) => {
                            const stock = Number(p.stock);
                            const cartons = Math.floor(stock / 10);
                            const packets = (stock % 10) * 100;
                            const isOk = stock >= 50;
                            const isEditing = editingStockId === p.id;
                            return (
                              <TableRow
                                key={String(p.id)}
                                data-ocid={`admin.inventory.row.${idx + 1}`}
                              >
                                <TableCell className="font-medium">
                                  {p.name}
                                </TableCell>
                                <TableCell>
                                  {isEditing ? (
                                    <Input
                                      data-ocid="admin.inventory.input"
                                      type="number"
                                      value={editingStockValue}
                                      onChange={(e) =>
                                        setEditingStockValue(e.target.value)
                                      }
                                      className="h-8 w-24"
                                      autoFocus
                                    />
                                  ) : (
                                    <span>{stock}</span>
                                  )}
                                </TableCell>
                                <TableCell>{cartons}</TableCell>
                                <TableCell>{packets}</TableCell>
                                <TableCell>
                                  {isOk ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                                      ✓ OK
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-medium">
                                      ⚠ Low Stock
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {isEditing ? (
                                    <div className="flex gap-1">
                                      <Button
                                        size="sm"
                                        data-ocid={`admin.inventory.save_button.${idx + 1}`}
                                        className="h-7 px-2 bg-green-600 hover:bg-green-700 text-white text-xs"
                                        onClick={async () => {
                                          try {
                                            await updateProductMutation.mutateAsync(
                                              {
                                                id: p.id,
                                                product: {
                                                  ...p,
                                                  stock: BigInt(
                                                    editingStockValue || "0",
                                                  ),
                                                },
                                              },
                                            );
                                            toast.success("Stock updated");
                                            setEditingStockId(null);
                                          } catch {
                                            toast.error(
                                              "Failed to update stock",
                                            );
                                          }
                                        }}
                                      >
                                        Save
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        data-ocid={`admin.inventory.cancel_button.${idx + 1}`}
                                        className="h-7 px-2 text-xs"
                                        onClick={() => setEditingStockId(null)}
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      data-ocid={`admin.inventory.edit_button.${idx + 1}`}
                                      className="h-7 px-2 text-xs"
                                      onClick={() => {
                                        setEditingStockId(p.id);
                                        setEditingStockValue(String(stock));
                                      }}
                                    >
                                      <Pencil className="w-3 h-3 mr-1" />
                                      Edit
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══════════════ CUSTOMERS ═══════════════ */}
              {activeSection === "customers" && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-8" />
                          <TableHead>Customer Name</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Total Orders</TableHead>
                          <TableHead>Total Spent</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customers.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              data-ocid="admin.customers.empty_state"
                              className="text-center text-muted-foreground py-10"
                            >
                              No customers yet
                            </TableCell>
                          </TableRow>
                        )}
                        {customers.map((c, idx) => {
                          const isExpanded = expandedCustomer === c.name;
                          return (
                            <>
                              <TableRow
                                key={c.name}
                                data-ocid={`admin.customers.row.${idx + 1}`}
                                className="cursor-pointer hover:bg-slate-50"
                                onClick={() =>
                                  setExpandedCustomer(
                                    isExpanded ? null : c.name,
                                  )
                                }
                              >
                                <TableCell>
                                  <ChevronRight
                                    className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                                  />
                                </TableCell>
                                <TableCell className="font-medium">
                                  {c.name}
                                </TableCell>
                                <TableCell>{c.phone}</TableCell>
                                <TableCell>{c.orders.length}</TableCell>
                                <TableCell className="font-medium">
                                  Nu {c.totalSpent.toLocaleString()}
                                </TableCell>
                              </TableRow>
                              {isExpanded && (
                                <TableRow key={`${c.name}-expand`}>
                                  <TableCell
                                    colSpan={5}
                                    className="bg-slate-50 p-0"
                                  >
                                    <div className="px-8 py-4">
                                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                                        Order History — {c.name}
                                      </p>
                                      <table className="w-full text-xs">
                                        <thead>
                                          <tr className="text-slate-500">
                                            <th className="text-left pb-1 pr-4">
                                              Order ID
                                            </th>
                                            <th className="text-left pb-1 pr-4">
                                              Total
                                            </th>
                                            <th className="text-left pb-1">
                                              Status
                                            </th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {c.orders.map((o) => (
                                            <tr
                                              key={String(o.id)}
                                              className="border-t border-slate-100"
                                            >
                                              <td className="py-1.5 pr-4 font-mono">
                                                #{String(o.id)}
                                              </td>
                                              <td className="py-1.5 pr-4">
                                                Nu{" "}
                                                {Number(
                                                  o.total,
                                                ).toLocaleString()}
                                              </td>
                                              <td className="py-1.5">
                                                <StatusBadge
                                                  status={o.status}
                                                />
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* ═══════════════ ANALYTICS ═══════════════ */}
              {activeSection === "analytics" && (
                <div className="space-y-6">
                  {orders.length === 0 ? (
                    <div
                      data-ocid="admin.analytics.empty_state"
                      className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400"
                    >
                      <BarChart2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">No data yet</p>
                      <p className="text-sm mt-1">
                        Analytics will appear once orders are placed
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Line chart */}
                      <div className="bg-white rounded-xl border border-slate-200 p-5">
                        <h3 className="font-semibold text-slate-800 mb-4">
                          Revenue per Order
                        </h3>
                        <ResponsiveContainer width="100%" height={250}>
                          <LineChart data={revenueData}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#f1f5f9"
                            />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis
                              tick={{ fontSize: 11 }}
                              tickFormatter={(v) => `Nu ${v.toLocaleString()}`}
                            />
                            <Tooltip
                              formatter={(v: number) => [
                                `Nu ${v.toLocaleString()}`,
                                "Revenue",
                              ]}
                            />
                            <Line
                              type="monotone"
                              dataKey="revenue"
                              stroke="#22c55e"
                              strokeWidth={2}
                              dot={{ r: 3 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Bar chart */}
                      <div className="bg-white rounded-xl border border-slate-200 p-5">
                        <h3 className="font-semibold text-slate-800 mb-4">
                          Top Products by Quantity Ordered
                        </h3>
                        {topProductsData.length === 0 ? (
                          <p className="text-slate-400 text-sm">
                            No product data available
                          </p>
                        ) : (
                          <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={topProductsData}>
                              <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#f1f5f9"
                              />
                              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                              <YAxis tick={{ fontSize: 11 }} />
                              <Tooltip
                                formatter={(v: number) => [v, "Total Qty"]}
                              />
                              <Bar
                                dataKey="qty"
                                fill="#3b82f6"
                                radius={[4, 4, 0, 0]}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </div>

                      {/* Pie chart */}
                      <div className="bg-white rounded-xl border border-slate-200 p-5">
                        <h3 className="font-semibold text-slate-800 mb-4">
                          Revenue per Customer
                        </h3>
                        {pieData.length === 0 ? (
                          <p className="text-slate-400 text-sm">
                            No customer data available
                          </p>
                        ) : (
                          <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                              <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                dataKey="value"
                                label={({ name, percent }) =>
                                  `${name} (${(percent * 100).toFixed(0)}%)`
                                }
                                labelLine={false}
                              >
                                {pieData.map((entry, i) => (
                                  <Cell
                                    key={entry.name}
                                    fill={PIE_COLORS[i % PIE_COLORS.length]}
                                  />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(v: number) => [
                                  `Nu ${v.toLocaleString()}`,
                                  "Revenue",
                                ]}
                              />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ═══════════════ PRODUCTS ═══════════════ */}
              {activeSection === "products" && (
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <Button
                      data-ocid="admin.products.add_button"
                      onClick={openAdd}
                      className="bg-brand-forest hover:bg-brand-forest-light text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Product
                    </Button>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Image</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Stock</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {products.length === 0 && (
                            <TableRow>
                              <TableCell
                                colSpan={6}
                                data-ocid="admin.products.empty_state"
                                className="text-center text-muted-foreground py-10"
                              >
                                No products yet. Add your first product.
                              </TableCell>
                            </TableRow>
                          )}
                          {products.map((product, idx) => (
                            <TableRow
                              key={String(product.id)}
                              data-ocid={`admin.products.row.${idx + 1}`}
                            >
                              <TableCell>
                                <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden">
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
                  </div>
                </div>
              )}

              {/* ═══════════════ SETTINGS ═══════════════ */}
              {activeSection === "settings" && (
                <div className="max-w-lg space-y-6">
                  <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h2 className="font-semibold text-slate-800 mb-4">
                      Change Admin Password
                    </h2>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                      <div className="space-y-1">
                        <Label htmlFor="s-change-current">
                          Current Password
                        </Label>
                        <Input
                          id="s-change-current"
                          data-ocid="admin.settings.input"
                          type="password"
                          value={changeCurrent}
                          onChange={(e) => setChangeCurrent(e.target.value)}
                          autoComplete="current-password"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="s-change-new">New Password</Label>
                        <Input
                          id="s-change-new"
                          data-ocid="admin.settings.input"
                          type="password"
                          value={changeNew}
                          onChange={(e) => setChangeNew(e.target.value)}
                          placeholder="Minimum 8 characters"
                          autoComplete="new-password"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="s-change-confirm">
                          Confirm New Password
                        </Label>
                        <Input
                          id="s-change-confirm"
                          data-ocid="admin.settings.input"
                          type="password"
                          value={changeConfirm}
                          onChange={(e) => setChangeConfirm(e.target.value)}
                          autoComplete="new-password"
                        />
                      </div>
                      {changeError && (
                        <p
                          data-ocid="admin.settings.error_state"
                          className="text-destructive text-xs"
                        >
                          {changeError}
                        </p>
                      )}
                      <Button
                        type="submit"
                        data-ocid="admin.settings.save_button"
                        disabled={isSubmitting}
                        className="bg-brand-forest hover:bg-brand-forest-light text-white"
                      >
                        {isSubmitting ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : null}
                        Update Password
                      </Button>
                    </form>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h2 className="font-semibold text-slate-800 mb-3">
                      Store Information
                    </h2>
                    <div className="space-y-1 text-sm text-slate-600">
                      <p>
                        <span className="font-medium">Company:</span> Bhutan
                        Soft Tissue
                      </p>
                      <p>
                        <span className="font-medium">Brand:</span> Opal Tissue
                      </p>
                      <p>
                        <span className="font-medium">Address:</span> Toribari:
                        Phuntsholing Thromde, Pasakha, Chukha, Bhutan
                      </p>
                      <p>
                        <span className="font-medium">Phone:</span>{" "}
                        +975-17259599
                      </p>
                      <p>
                        <span className="font-medium">Email:</span>{" "}
                        bhutansofttissue@gmail.com
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* ── WhatsApp/SMS Message Modal ── */}
      <Dialog open={!!messageModal} onOpenChange={() => setMessageModal(null)}>
        <DialogContent
          className="bg-white max-w-md"
          data-ocid="admin.message.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-brand-forest flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              {messageModal && (
                <span>
                  Message —{" "}
                  {STATUS_LABELS[messageModal.status] ?? messageModal.status}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mt-1 mb-3">
            Copy this message and send it to the customer via WhatsApp or SMS.
          </p>
          {messageModal && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">
                {messageModal.message}
              </pre>
            </div>
          )}
          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              data-ocid="admin.message.close_button"
              onClick={() => setMessageModal(null)}
              className="flex-1"
            >
              Close
            </Button>
            <Button
              data-ocid="admin.message.copy_button"
              onClick={handleCopyMessage}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Message
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Product Modal ── */}
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
                    Tap to choose from gallery or camera
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
                disabled={
                  addProduct.isPending || updateProductMutation.isPending
                }
                className="flex-1 bg-brand-forest hover:bg-brand-forest-light text-white rounded-full"
              >
                {addProduct.isPending || updateProductMutation.isPending ? (
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

      {/* ── Delete Confirm ── */}
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

// ── Sub-components ──────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: "blue" | "green" | "orange" | "red";
}) {
  const colorMap = {
    blue: "bg-blue-50 border-blue-200 text-blue-600",
    green: "bg-green-50 border-green-200 text-green-600",
    orange: "bg-orange-50 border-orange-200 text-orange-600",
    red: "bg-red-50 border-red-200 text-red-600",
  };
  const iconBg = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    orange: "bg-orange-500",
    red: "bg-red-500",
  };
  return (
    <div className={`rounded-xl border p-4 ${colorMap[color]}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium opacity-70 uppercase tracking-wide">
          {label}
        </p>
        <div
          className={`w-8 h-8 rounded-lg ${iconBg[color]} flex items-center justify-center text-white`}
        >
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    STATUS_COLORS[status] ?? "bg-slate-100 text-slate-700 border-slate-200";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function OrderTimeline({ currentStatus }: { currentStatus: string }) {
  const steps = STATUS_FLOW;
  const currentIdx = steps.indexOf(currentStatus);
  return (
    <div className="flex items-start gap-0">
      {steps.map((step, i) => {
        const isDone = i < currentIdx;
        const isCurrent = i === currentIdx;
        const isPending = i > currentIdx;
        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                  isDone
                    ? "bg-green-500 border-green-500 text-white"
                    : isCurrent
                      ? "bg-blue-500 border-blue-500 text-white"
                      : "bg-white border-slate-300 text-slate-400"
                }`}
              >
                {isDone ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <p
                className={`mt-1 text-[10px] text-center w-16 leading-tight ${
                  isCurrent
                    ? "text-blue-600 font-semibold"
                    : isDone
                      ? "text-green-600"
                      : isPending
                        ? "text-slate-400"
                        : ""
                }`}
              >
                {STATUS_LABELS[step] ?? step}
              </p>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`h-0.5 w-8 mb-4 ${
                  isDone ? "bg-green-400" : "bg-slate-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
