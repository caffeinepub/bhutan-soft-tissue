import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Order, Product } from "../backend.d";
import { useActor } from "./useActor";

// Helper: get stored admin hash from localStorage
const getAdminHash = (): string =>
  localStorage.getItem("opal_admin_pw_hash") ?? "";

// Helper: unwrap AdminResult and throw on error
function unwrapAdminResult(result: { ok: null } | { err: string }): void {
  if ("err" in result) throw new Error(result.err);
}

export function useProducts() {
  const { actor, isFetching } = useActor();
  return useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllProducts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCart() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["cart"],
    queryFn: async () => {
      if (!actor) return { items: [], total: BigInt(0) };
      return actor.getCart();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useOrders() {
  const { actor, isFetching } = useActor();
  return useQuery<Order[]>({
    queryKey: ["orders"],
    queryFn: async () => {
      if (!actor) return [];
      const hash = getAdminHash();
      if (!hash) return [];
      // Use hash-authenticated call to get all orders reliably
      return (actor as any).getAllOrdersWithHash(hash);
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });
}

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });
}

export function useIsAdminClaimed() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isAdminClaimed"],
    queryFn: async () => {
      if (!actor) return true; // default to true (safe)
      return actor.isAdminClaimed();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useClaimAdmin() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      return actor.claimAdmin();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["isAdmin"] });
      qc.invalidateQueries({ queryKey: ["isAdminClaimed"] });
    },
  });
}

export function useAddToCart() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      productId,
      quantity,
    }: { productId: bigint; quantity: bigint }) => {
      if (!actor) throw new Error("Not connected");
      return actor.addToCart(productId, quantity);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });
}

export function useRemoveFromCart() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (productId: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.removeFromCart(productId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });
}

export function usePlaceOrder() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      phone,
      address,
    }: { name: string; phone: string; address: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.placeOrder(name, phone, address);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useUpdateOrderStatus() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: bigint; status: string }) => {
      if (!actor) throw new Error("Not connected");
      const hash = getAdminHash();
      if (hash) {
        // Use hash-authenticated call -- reliable with anonymous identity
        const result = await (actor as any).updateOrderStatusWithHash(
          hash,
          id,
          status,
        );
        unwrapAdminResult(result);
      } else {
        return actor.updateOrderStatus(id, status);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useAddProduct() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (product: Product) => {
      // Wait up to 5s for actor to be ready (handles brief null during refetch)
      let currentActor = actor;
      if (!currentActor) {
        for (let i = 0; i < 10; i++) {
          await new Promise((r) => setTimeout(r, 500));
          currentActor = qc.getQueryData<any>(["actor", undefined]) as any;
          if (currentActor) break;
        }
      }
      if (!currentActor)
        throw new Error(
          "Not connected to server. Please refresh and try again.",
        );
      const hash = getAdminHash();
      if (!hash) throw new Error("Admin not authenticated");
      // Use hash-authenticated call -- bypasses principal-based auth that fails with anonymous identity
      const result = await (currentActor as any).addProductWithHash(
        hash,
        product,
      );
      unwrapAdminResult(result);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useUpdateProduct() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, product }: { id: bigint; product: Product }) => {
      if (!actor) throw new Error("Not connected");
      const hash = getAdminHash();
      if (!hash) throw new Error("Admin not authenticated");
      const result = await (actor as any).updateProductWithHash(
        hash,
        id,
        product,
      );
      unwrapAdminResult(result);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useDeleteProduct() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      const hash = getAdminHash();
      if (!hash) throw new Error("Admin not authenticated");
      const result = await (actor as any).deleteProductWithHash(hash, id);
      unwrapAdminResult(result);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useUpdateProductStock() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, stock }: { id: bigint; stock: bigint }) => {
      if (!actor) throw new Error("Not connected");
      const hash = getAdminHash();
      if (!hash) throw new Error("Admin not authenticated");
      const result = await (actor as any).updateProductStockWithHash(
        hash,
        id,
        stock,
      );
      unwrapAdminResult(result);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useIsAdminPasswordSet() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isAdminPasswordSet"],
    queryFn: async () => {
      if (!actor) return false;
      return (actor as any).isAdminPasswordSet();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetupAdminPassword() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (hash: string) => {
      if (!actor) throw new Error("Not connected");
      return (actor as any).setupAdminPassword(hash) as Promise<boolean>;
    },
  });
}

export function useAdminPasswordLogin() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (hash: string) => {
      if (!actor) throw new Error("Not connected");
      return (actor as any).adminPasswordLogin(hash) as Promise<boolean>;
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["loginLockoutSeconds"] });
      qc.invalidateQueries({ queryKey: ["failedLoginAttempts"] });
    },
  });
}

export function useChangeAdminPassword() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      currentHash,
      newHash,
    }: { currentHash: string; newHash: string }) => {
      if (!actor) throw new Error("Not connected");
      return (actor as any).changeAdminPassword(
        currentHash,
        newHash,
      ) as Promise<boolean>;
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["loginLockoutSeconds"] });
      qc.invalidateQueries({ queryKey: ["failedLoginAttempts"] });
    },
  });
}

export function useLoginLockoutSeconds() {
  const { actor, isFetching } = useActor();
  return useQuery<number>({
    queryKey: ["loginLockoutSeconds"],
    queryFn: async () => {
      if (!actor) return 0;
      const result = (await (actor as any).getLoginLockoutSeconds()) as bigint;
      return Number(result);
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 5000,
  });
}

export function useFailedLoginAttempts() {
  const { actor, isFetching } = useActor();
  return useQuery<number>({
    queryKey: ["failedLoginAttempts"],
    queryFn: async () => {
      if (!actor) return 0;
      const result = (await (actor as any).getFailedLoginAttempts()) as bigint;
      return Number(result);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSubmitOrder() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      customerName,
      phone,
      address,
      items,
      total,
    }: {
      customerName: string;
      phone: string;
      address: string;
      items: Array<{ productId: bigint; quantity: bigint; price: bigint }>;
      total: bigint;
    }) => {
      if (!actor) throw new Error("Not connected to server");
      const result = await (actor as any).submitOrder(
        customerName,
        phone,
        address,
        items,
        total,
      );
      if ("err" in result) throw new Error(result.err);
      return result.ok as bigint;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}
