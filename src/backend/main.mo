import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import List "mo:core/List";
import Order "mo:core/Order";
import Time "mo:core/Time";
import Int "mo:core/Int";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  // TYPES
  module Product {
    public func compare(a : Product, b : Product) : Order.Order {
      Nat.compare(a.id, b.id);
    };
  };

  type Product = {
    id : Nat;
    name : Text;
    description : Text;
    price : Nat;
    category : Text;
    imageUrl : Text;
    stock : Nat;
  };

  type OrderItem = {
    productId : Nat;
    quantity : Nat;
    price : Nat;
  };

  type Order = {
    id : Nat;
    customerName : Text;
    phone : Text;
    address : Text;
    items : [OrderItem];
    total : Nat;
    status : Text;
  };

  type CartItem = {
    productId : Nat;
    quantity : Nat;
  };

  type Cart = {
    items : [CartItem];
    total : Nat;
  };

  // STATE
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Admin password hash (SHA-256 hex string computed in frontend)
  stable var adminPasswordHash : ?Text = null;

  // Brute-force protection
  stable var failedLoginAttempts : Nat = 0;
  stable var loginLockedUntilNanos : Int = 0;

  let MAX_ATTEMPTS : Nat = 5;
  let LOCKOUT_NANOS : Int = 15 * 60 * 1_000_000_000;

  stable var adminClaimed : Bool = false;

  // Admin principal - preserved across upgrades so role is never lost
  stable var adminPrincipal : ?Principal = null;

  // Counters
  stable var nextProductId : Nat = 0;
  stable var nextOrderId : Nat = 0;

  // Stable backing storage for products, orders, carts
  stable var productsStable : [(Nat, Product)] = [];
  stable var ordersStable : [(Nat, Order)] = [];
  stable var cartsStable : [(Principal, Cart)] = [];

  // In-memory maps (rebuilt from stable vars on upgrade)
  let products = Map.empty<Nat, Product>();
  let orders = Map.empty<Nat, Order>();
  let carts = Map.empty<Principal, Cart>();

  // --- Helper functions defined before initialization ---

  func addProductInternal(product : Product) {
    let newProduct = { product with id = nextProductId };
    products.add(nextProductId, newProduct);
    nextProductId += 1;
    productsStable := products.entries().toArray();
  };

  func seedProducts() {
    addProductInternal({
      name = "Napkin Tissue";
      description = "Soft 2-ply napkin tissue. Ideal for restaurants, hotels, and offices.";
      price = 2800;
      category = "napkin";
      imageUrl = "";
      stock = 999999;
      id = 0;
    });
    addProductInternal({
      name = "Roll Tissue";
      description = "Durable 2-ply roll tissue for everyday use. Available in bulk cartons.";
      price = 3200;
      category = "roll";
      imageUrl = "";
      stock = 999999;
      id = 0;
    });
  };

  func isAdminCaller(caller : Principal) : Bool {
    switch (adminPrincipal) {
      case (?p) { if (Principal.equal(p, caller)) { return true } };
      case (null) {};
    };
    AccessControl.isAdmin(accessControlState, caller);
  };

  // --- Initialization ---

  // Load stable state into maps
  for ((k, v) in productsStable.values()) { products.add(k, v) };
  for ((k, v) in ordersStable.values()) { orders.add(k, v) };
  for ((k, v) in cartsStable.values()) { carts.add(k, v) };

  // Restore admin role
  switch (adminPrincipal) {
    case (?p) {
      accessControlState.userRoles.add(p, #admin);
      accessControlState.adminAssigned := true;
    };
    case (null) {};
  };

  // Auto-seed default products on first ever deployment
  if (nextProductId == 0) {
    seedProducts();
  };

  // --- Upgrade hooks ---

  system func preupgrade() {
    productsStable := products.entries().toArray();
    ordersStable := orders.entries().toArray();
    cartsStable := carts.entries().toArray();
  };

  system func postupgrade() {
    for ((k, v) in productsStable.values()) { products.add(k, v) };
    for ((k, v) in ordersStable.values()) { orders.add(k, v) };
    for ((k, v) in cartsStable.values()) { carts.add(k, v) };
    switch (adminPrincipal) {
      case (?p) {
        accessControlState.userRoles.add(p, #admin);
        accessControlState.adminAssigned := true;
      };
      case (null) {};
    };
  };

  // --- Public API ---

  // INITIALIZE - seeds products once (callable externally if needed)
  public shared func initialize() : async () {
    if (nextProductId == 0) { seedProducts() };
  };

  // ADMIN PASSWORD AUTH

  public query func isAdminPasswordSet() : async Bool {
    switch (adminPasswordHash) {
      case (null) { false };
      case (?_) { true };
    };
  };

  public query func getLoginLockoutSeconds() : async Nat {
    let now = Time.now();
    if (loginLockedUntilNanos > now) {
      Int.abs(loginLockedUntilNanos - now) / 1_000_000_000;
    } else { 0 };
  };

  public query func getFailedLoginAttempts() : async Nat {
    failedLoginAttempts;
  };

  public shared ({ caller }) func setupAdminPassword(hash : Text) : async Bool {
    switch (adminPasswordHash) {
      case (?_) { false };
      case (null) {
        if (hash.size() < 8) { return false };
        adminPasswordHash := ?hash;
        failedLoginAttempts := 0;
        loginLockedUntilNanos := 0;
        adminPrincipal := ?caller;
        accessControlState.userRoles.add(caller, #admin);
        accessControlState.adminAssigned := true;
        adminClaimed := true;
        true;
      };
    };
  };

  public shared ({ caller }) func adminPasswordLogin(hash : Text) : async Bool {
    let now = Time.now();
    if (loginLockedUntilNanos > now) { return false };
    switch (adminPasswordHash) {
      case (null) { false };
      case (?storedHash) {
        if (storedHash == hash) {
          failedLoginAttempts := 0;
          loginLockedUntilNanos := 0;
          adminPrincipal := ?caller;
          accessControlState.userRoles.add(caller, #admin);
          true;
        } else {
          failedLoginAttempts += 1;
          if (failedLoginAttempts >= MAX_ATTEMPTS) {
            loginLockedUntilNanos := now + LOCKOUT_NANOS;
            failedLoginAttempts := 0;
          };
          false;
        };
      };
    };
  };

  public shared ({ caller }) func changeAdminPassword(currentHash : Text, newHash : Text) : async Bool {
    let now = Time.now();
    if (loginLockedUntilNanos > now) { return false };
    switch (adminPasswordHash) {
      case (null) { false };
      case (?storedHash) {
        if (storedHash == currentHash and newHash.size() >= 8) {
          adminPasswordHash := ?newHash;
          failedLoginAttempts := 0;
          loginLockedUntilNanos := 0;
          true;
        } else {
          failedLoginAttempts += 1;
          if (failedLoginAttempts >= MAX_ATTEMPTS) {
            loginLockedUntilNanos := now + LOCKOUT_NANOS;
            failedLoginAttempts := 0;
          };
          false;
        };
      };
    };
  };

  public shared func claimAdmin() : async Bool { false };

  public query func isAdminClaimed() : async Bool { adminClaimed };

  // PRODUCTS (CRUD)

  public shared ({ caller }) func addProduct(product : Product) : async () {
    if (not isAdminCaller(caller)) {
      Runtime.trap("Unauthorized: Only admins can add products");
    };
    addProductInternal(product);
  };

  public query func getProduct(id : Nat) : async Product {
    switch (products.get(id)) {
      case (?product) { product };
      case (null) { Runtime.trap("Product not found") };
    };
  };

  public query func getAllProducts() : async [Product] {
    products.values().toArray().sort();
  };

  public shared ({ caller }) func updateProduct(id : Nat, product : Product) : async () {
    if (not isAdminCaller(caller)) {
      Runtime.trap("Unauthorized: Only admins can update products");
    };
    if (not products.containsKey(id)) { Runtime.trap("Product not found") };
    products.add(id, { product with id });
    productsStable := products.entries().toArray();
  };

  public shared ({ caller }) func deleteProduct(id : Nat) : async () {
    if (not isAdminCaller(caller)) {
      Runtime.trap("Unauthorized: Only admins can delete products");
    };
    if (not products.containsKey(id)) { Runtime.trap("Product not found") };
    products.remove(id);
    productsStable := products.entries().toArray();
  };

  // ORDERS

  public shared ({ caller }) func placeOrder(customerName : Text, phone : Text, address : Text) : async Nat {
    let cart = getCartInternal(caller);
    if (cart.items.size() == 0) { Runtime.trap("Cart is empty") };

    let orderItemsList = List.empty<OrderItem>();
    for (cartItem in cart.items.values()) {
      switch (products.get(cartItem.productId)) {
        case (?product) {
          orderItemsList.add({ cartItem with price = product.price });
        };
        case (null) {
          orderItemsList.add({ cartItem with price = 0 });
        };
      };
    };

    let newOrder : Order = {
      id = nextOrderId;
      customerName;
      phone;
      address;
      items = orderItemsList.toArray();
      total = cart.total;
      status = "pending";
    };

    orders.add(nextOrderId, newOrder);
    ordersStable := orders.entries().toArray();
    nextOrderId += 1;
    carts.remove(caller);
    cartsStable := carts.entries().toArray();
    newOrder.id;
  };

  public query ({ caller }) func getOrder(id : Nat) : async Order {
    if (not isAdminCaller(caller)) {
      Runtime.trap("Unauthorized: Only admins can view orders");
    };
    switch (orders.get(id)) {
      case (?order) { order };
      case (null) { Runtime.trap("Order not found") };
    };
  };

  public query ({ caller }) func getAllOrders() : async [Order] {
    if (not isAdminCaller(caller)) {
      Runtime.trap("Unauthorized: Only admins can list all orders");
    };
    orders.values().toArray();
  };

  public shared ({ caller }) func updateOrderStatus(id : Nat, status : Text) : async () {
    if (not isAdminCaller(caller)) {
      Runtime.trap("Unauthorized: Only admins can update order status");
    };
    switch (orders.get(id)) {
      case (?order) {
        orders.add(id, { order with status });
        ordersStable := orders.entries().toArray();
      };
      case (null) { Runtime.trap("Order not found") };
    };
  };

  // CART

  func getCartInternal(user : Principal) : Cart {
    switch (carts.get(user)) {
      case (?cart) { cart };
      case (null) { { items = []; total = 0 } };
    };
  };

  public shared ({ caller }) func addToCart(productId : Nat, quantity : Nat) : async () {
    if (quantity == 0) { Runtime.trap("Quantity must be greater than 0") };
    switch (products.get(productId)) {
      case (?product) {
        let cart = getCartInternal(caller);
        let existingItem = cart.items.find(func(item) { item.productId == productId });
        let newItems = switch (existingItem) {
          case (?_) {
            cart.items.map(func(item) {
              if (item.productId == productId) { { item with quantity = item.quantity + quantity } }
              else { item };
            });
          };
          case (null) { cart.items.concat([ { productId; quantity } ]) };
        };
        let newTotal = cart.total + (product.price * quantity);
        carts.add(caller, { items = newItems; total = newTotal });
        cartsStable := carts.entries().toArray();
      };
      case (null) { Runtime.trap("Product not found") };
    };
  };

  public shared ({ caller }) func removeFromCart(productId : Nat) : async () {
    let cart = getCartInternal(caller);
    let filteredItems = cart.items.filter(func(item) { item.productId != productId });
    let removed = cart.items.find(func(item) { item.productId == productId });
    let removedCost = switch (removed, products.get(productId)) {
      case (?item, ?product) { product.price * item.quantity };
      case (_,  _) { 0 };
    };
    let newTotal = if (cart.total >= removedCost) { cart.total - removedCost } else { 0 };
    carts.add(caller, { items = filteredItems; total = newTotal });
    cartsStable := carts.entries().toArray();
  };

  public query ({ caller }) func getCart() : async Cart {
    getCartInternal(caller);
  };

  public shared ({ caller }) func clearCart() : async () {
    carts.remove(caller);
    cartsStable := carts.entries().toArray();
  };
};
