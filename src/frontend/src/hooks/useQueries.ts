import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Order, Product } from "../backend.d";
import { useActor } from "./useActor";

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
      return actor.getAllOrders();
    },
    enabled: !!actor && !isFetching,
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
      return actor.updateOrderStatus(id, status);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useAddProduct() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (product: Product) => {
      if (!actor) throw new Error("Not connected");
      return actor.addProduct(product);
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
      return actor.updateProduct(id, product);
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
      return actor.deleteProduct(id);
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
