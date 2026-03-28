import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type AdminResult = { ok: null } | { err: string };
export interface Cart {
    total: bigint;
    items: Array<CartItem>;
}
export interface CartItem {
    productId: bigint;
    quantity: bigint;
}
export interface Order {
    id: bigint;
    customerName: string;
    status: string;
    total: bigint;
    address: string;
    phone: string;
    items: Array<OrderItem>;
}
export interface Product {
    id: bigint;
    name: string;
    description: string;
    stock: bigint;
    imageUrl: string;
    category: string;
    price: bigint;
}
export interface OrderItem {
    productId: bigint;
    quantity: bigint;
    price: bigint;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addProduct(product: Product): Promise<void>;
    addProductWithHash(hash: string, product: Product): Promise<AdminResult>;
    updateProductWithHash(hash: string, id: bigint, product: Product): Promise<AdminResult>;
    deleteProductWithHash(hash: string, id: bigint): Promise<AdminResult>;
    updateOrderStatusWithHash(hash: string, id: bigint, status: string): Promise<AdminResult>;
    getAllOrdersWithHash(hash: string): Promise<Array<Order>>;
    updateProductStockWithHash(hash: string, id: bigint, stock: bigint): Promise<AdminResult>;
    addToCart(productId: bigint, quantity: bigint): Promise<void>;
    adminPasswordLogin(hash: string): Promise<boolean>;
    changeAdminPassword(currentHash: string, newHash: string): Promise<boolean>;
    claimAdmin(): Promise<boolean>;
    clearCart(): Promise<void>;
    deleteProduct(id: bigint): Promise<void>;
    getAllOrders(): Promise<Array<Order>>;
    getAllProducts(): Promise<Array<Product>>;
    getCart(): Promise<Cart>;
    getFailedLoginAttempts(): Promise<bigint>;
    getLoginLockoutSeconds(): Promise<bigint>;
    getOrder(id: bigint): Promise<Order>;
    getProduct(id: bigint): Promise<Product>;
    isAdminClaimed(): Promise<boolean>;
    isAdminPasswordSet(): Promise<boolean>;
    placeOrder(customerName: string, phone: string, address: string): Promise<bigint>;
    removeFromCart(productId: bigint): Promise<void>;
    setupAdminPassword(hash: string): Promise<boolean>;
    updateOrderStatus(id: bigint, status: string): Promise<void>;
    updateProduct(id: bigint, product: Product): Promise<void>;
}
