import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Map "mo:core/Map";
import Array "mo:core/Array";
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

  // Keep accessControlState to preserve stable variable compatibility with previous version
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // STABLE STATE
  stable var adminPasswordHash : ?Text = null;
  // Persist admin principal so it survives canister upgrades
  stable var adminPrincipal : ?Principal = null;
  stable var failedLoginAttempts : Nat = 0;
  stable var loginLockedUntilNanos : Int = 0;
  stable var adminClaimed : Bool = false;

  stable var nextProductId : Nat = 0;
  stable var nextOrderId : Nat = 0;

  // Stable storage arrays -- use original names to preserve upgrade compatibility
  stable var productsStable : [(Nat, Product)] = [];
  stable var ordersStable : [(Nat, Order)] = [];
  stable var cartsStable : [(Principal, Cart)] = [];

  // In-memory maps restored from stable on upgrade
  let products = Map.fromIter<Nat, Product>(productsStable.vals());
  let orders = Map.fromIter<Nat, Order>(ordersStable.vals());
  let carts = Map.fromIter<Principal, Cart>(cartsStable.vals());

  let MAX_ATTEMPTS : Nat = 5;
  let LOCKOUT_NANOS : Int = 15 * 60 * 1_000_000_000;

  system func preupgrade() {
    productsStable := products.entries().toArray();
    ordersStable := orders.entries().toArray();
    cartsStable := carts.entries().toArray();
  };

  system func postupgrade() {
    productsStable := [];
    ordersStable := [];
    cartsStable := [];
  };

  // Helper: check caller is admin using stable principal
  func isAdmin(caller : Principal) : Bool {
    switch (adminPrincipal) {
      case (?p) { p == caller };
      case (null) { false };
    };
  };

  // Helper: validate admin password hash directly (bypasses principal check)
  // This is the reliable auth method since the frontend uses anonymous identity
  func checkAdminHash(hash : Text) : Bool {
    switch (adminPasswordHash) {
      case (null) { false };
      case (?storedHash) { storedHash == hash };
    };
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
      let remaining = loginLockedUntilNanos - now;
      Int.abs(remaining) / 1_000_000_000;
    } else {
      0;
    };
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
        adminPrincipal := ?caller;
        failedLoginAttempts := 0;
        loginLockedUntilNanos := 0;
        accessControlState.userRoles.add(caller, #admin);
        accessControlState.adminAssigned := true;
        adminClaimed := true;
        true;
      };
    };
  };

  public shared ({ caller }) func adminPasswordLogin(hash : Text) : async Bool {
    let now = Time.now();
    if (loginLockedUntilNanos > now) {
      return false;
    };
    switch (adminPasswordHash) {
      case (null) { false };
      case (?storedHash) {
        if (storedHash == hash) {
          failedLoginAttempts := 0;
          loginLockedUntilNanos := 0;
          // Update stable adminPrincipal so checks work after upgrade
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

  public shared func changeAdminPassword(currentHash : Text, newHash : Text) : async Bool {
    let now = Time.now();
    if (loginLockedUntilNanos > now) {
      return false;
    };
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

  // PRODUCTS (CRUD) - principal-based (kept for compatibility)
  func addProductInternal(product : Product) {
    let newProduct = { product with id = nextProductId };
    products.add(nextProductId, newProduct);
    nextProductId += 1;
  };

  public shared ({ caller }) func addProduct(product : Product) : async () {
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can add products");
    };
    addProductInternal(product);
  };

  // Hash-authenticated product operations -- reliable when using anonymous identity
  // The frontend stores the admin password hash in localStorage and passes it here
  public shared func addProductWithHash(hash : Text, product : Product) : async { #ok; #err : Text } {
    if (not checkAdminHash(hash)) {
      return #err("Unauthorized: invalid admin credentials");
    };
    // Validate required fields
    if (product.name.size() == 0) { return #err("Product name is required") };
    if (product.category.size() == 0) { return #err("Category is required") };
    // Image is optional (use empty string if none)
    addProductInternal(product);
    #ok;
  };

  public shared func updateProductWithHash(hash : Text, id : Nat, product : Product) : async { #ok; #err : Text } {
    if (not checkAdminHash(hash)) {
      return #err("Unauthorized: invalid admin credentials");
    };
    if (not products.containsKey(id)) { return #err("Product not found") };
    let updatedProduct = { product with id };
    products.add(id, updatedProduct);
    #ok;
  };

  public shared func deleteProductWithHash(hash : Text, id : Nat) : async { #ok; #err : Text } {
    if (not checkAdminHash(hash)) {
      return #err("Unauthorized: invalid admin credentials");
    };
    if (not products.containsKey(id)) { return #err("Product not found") };
    products.remove(id);
    #ok;
  };

  public shared func updateOrderStatusWithHash(hash : Text, id : Nat, status : Text) : async { #ok; #err : Text } {
    if (not checkAdminHash(hash)) {
      return #err("Unauthorized: invalid admin credentials");
    };
    switch (orders.get(id)) {
      case (?order) {
        orders.add(id, { order with status });
        #ok;
      };
      case (null) { #err("Order not found") };
    };
  };

  // Returns orders if hash is valid, empty array otherwise
  public shared func getAllOrdersWithHash(hash : Text) : async [Order] {
    if (not checkAdminHash(hash)) {
      return [];
    };
    orders.values().toArray();
  };

  // Update stock with hash
  public shared func updateProductStockWithHash(hash : Text, id : Nat, newStock : Nat) : async { #ok; #err : Text } {
    if (not checkAdminHash(hash)) {
      return #err("Unauthorized: invalid admin credentials");
    };
    switch (products.get(id)) {
      case (?product) {
        products.add(id, { product with stock = newStock });
        #ok;
      };
      case (null) { #err("Product not found") };
    };
  };

  public query func getProduct(id : Nat) : async Product {
    switch (products.get(id)) {
      case (?product) { product };
      case (null) { Runtime.trap("Product not found") };
    };
  };

  public query func getAllProducts() : async [Product] {
    products.values().toArray();
  };

  public shared ({ caller }) func updateProduct(id : Nat, product : Product) : async () {
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can update products");
    };
    if (not products.containsKey(id)) { Runtime.trap("Product not found") };
    let updatedProduct = { product with id };
    products.add(id, updatedProduct);
  };

  public shared ({ caller }) func deleteProduct(id : Nat) : async () {
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can delete products");
    };
    if (not products.containsKey(id)) { Runtime.trap("Product not found") };
    products.remove(id);
  };

  // ORDERS
  public shared ({ caller }) func placeOrder(customerName : Text, phone : Text, address : Text) : async Nat {
    if (caller.isAnonymous()) {
      Runtime.trap("Must be logged in to place an order");
    };
    let cart = getCartInternal(caller);
    if (cart.items.size() == 0) { Runtime.trap("Cart is empty") };

    let orderItemsList = List.empty<OrderItem>();
    for (cartItem in cart.items.vals()) {
      switch (products.get(cartItem.productId)) {
        case (?product) {
          orderItemsList.add({ cartItem with price = product.price });
        };
        case (null) { Runtime.trap("Product not found") };
      };
    };

    let newOrder : Order = {
      id = nextOrderId;
      customerName;
      phone;
      address;
      items = orderItemsList.toArray();
      total = cart.total;
      status = "Pending";
    };

    orders.add(nextOrderId, newOrder);
    nextOrderId += 1;
    carts.remove(caller);
    newOrder.id;
  };

  public query ({ caller }) func getOrder(id : Nat) : async Order {
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can view orders");
    };
    switch (orders.get(id)) {
      case (?order) { order };
      case (null) { Runtime.trap("Order not found") };
    };
  };

  // Returns orders if admin, empty array otherwise (no trap -- safe for pre-login calls)
  public query ({ caller }) func getAllOrders() : async [Order] {
    if (not isAdmin(caller)) {
      return [];
    };
    orders.values().toArray();
  };

  public shared ({ caller }) func updateOrderStatus(id : Nat, status : Text) : async () {
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can update order status");
    };
    switch (orders.get(id)) {
      case (?order) {
        orders.add(id, { order with status });
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
    if (caller.isAnonymous()) {
      Runtime.trap("Must be logged in to use cart");
    };
    if (quantity == 0) { Runtime.trap("Quantity must be greater than 0") };
    switch (products.get(productId)) {
      case (?product) {
        let cart = getCartInternal(caller);
        let existingItem = cart.items.find(func(item : CartItem) : Bool { item.productId == productId });
        let newItems = switch (existingItem) {
          case (?_) {
            cart.items.map(func(item : CartItem) : CartItem {
              if (item.productId == productId) { { item with quantity = item.quantity + quantity } }
              else { item };
            });
          };
          case (null) { cart.items.concat([{ productId; quantity }]) };
        };
        carts.add(caller, { items = newItems; total = cart.total + (product.price * quantity) });
      };
      case (null) { Runtime.trap("Product not found") };
    };
  };

  public shared ({ caller }) func removeFromCart(productId : Nat) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Must be logged in to use cart");
    };
    let cart = getCartInternal(caller);
    let filteredItems = cart.items.filter(func(item : CartItem) : Bool { item.productId != productId });
    let newTotal = switch (products.get(productId)) {
      case (?product) {
        switch (cart.items.find(func(item : CartItem) : Bool { item.productId == productId })) {
          case (?item) { let sub = product.price * item.quantity; if (cart.total > sub) { cart.total - sub } else { 0 } };
          case (null) { cart.total };
        };
      };
      case (null) { cart.total };
    };
    carts.add(caller, { items = filteredItems; total = newTotal });
  };

  public query ({ caller }) func getCart() : async Cart {
    if (caller.isAnonymous()) { return { items = []; total = 0 } };
    getCartInternal(caller);
  };

  public shared ({ caller }) func clearCart() : async () {
    carts.remove(caller);
  };
};
