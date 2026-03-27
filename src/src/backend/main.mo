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

  module CartItem {
    public func compare(a : CartItem, b : CartItem) : Order.Order {
      Nat.compare(a.productId, b.productId);
    };
  };

  type CartItem = {
    productId : Nat;
    quantity : Nat;
  };

  module Cart {
    public func compare(a : Cart, b : Cart) : Order.Order {
      compareByTotal(a, b);
    };

    public func compareByTotal(a : Cart, b : Cart) : Order.Order {
      Nat.compare(a.total, b.total);
    };
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
  // Number of consecutive failed login attempts
  stable var failedLoginAttempts : Nat = 0;
  // Time (nanoseconds) when lockout expires; 0 means not locked
  stable var loginLockedUntilNanos : Int = 0;

  // Max failed attempts before lockout
  let MAX_ATTEMPTS : Nat = 5;
  // Lockout duration: 15 minutes in nanoseconds
  let LOCKOUT_NANOS : Int = 15 * 60 * 1_000_000_000;

  // Legacy flag kept for compatibility
  stable var adminClaimed : Bool = false;

  var nextProductId = 0;
  var nextOrderId = 0;

  let products = Map.empty<Nat, Product>();
  let orders = Map.empty<Nat, Order>();
  let carts = Map.empty<Principal, Cart>();

  // INITIALIZE - seeds products once
  public shared ({ caller }) func initialize() : async () {
    if (nextProductId == 0) {
      seedProducts();
    };
    ();
  };

  // ADMIN PASSWORD AUTH

  // Check if an admin password has been configured
  public query func isAdminPasswordSet() : async Bool {
    switch (adminPasswordHash) {
      case (null) { false };
      case (?_) { true };
    };
  };

  // Returns seconds remaining in lockout (0 if not locked)
  public query func getLoginLockoutSeconds() : async Nat {
    let now = Time.now();
    if (loginLockedUntilNanos > now) {
      let remaining = loginLockedUntilNanos - now;
      Int.abs(remaining) / 1_000_000_000;
    } else {
      0;
    };
  };

  // Returns current failed attempt count
  public query func getFailedLoginAttempts() : async Nat {
    failedLoginAttempts;
  };

  // First-time setup: store hashed password and grant admin role to caller
  public shared ({ caller }) func setupAdminPassword(hash : Text) : async Bool {
    switch (adminPasswordHash) {
      case (?_) { false }; // Already configured
      case (null) {
        if (hash.size() < 8) { return false }; // Sanity check
        adminPasswordHash := ?hash;
        failedLoginAttempts := 0;
        loginLockedUntilNanos := 0;
        accessControlState.userRoles.add(caller, #admin);
        accessControlState.adminAssigned := true;
        adminClaimed := true;
        true;
      };
    };
  };

  // Login: grant admin role to caller if hash matches stored hash
  // Locks out after MAX_ATTEMPTS failed tries for LOCKOUT_NANOS duration
  public shared ({ caller }) func adminPasswordLogin(hash : Text) : async Bool {
    let now = Time.now();

    // Check lockout
    if (loginLockedUntilNanos > now) {
      return false;
    };

    switch (adminPasswordHash) {
      case (null) { false };
      case (?storedHash) {
        if (storedHash == hash) {
          // Success: reset counters
          failedLoginAttempts := 0;
          loginLockedUntilNanos := 0;
          accessControlState.userRoles.add(caller, #admin);
          true;
        } else {
          // Failure: increment counter
          failedLoginAttempts += 1;
          if (failedLoginAttempts >= MAX_ATTEMPTS) {
            loginLockedUntilNanos := now + LOCKOUT_NANOS;
            failedLoginAttempts := 0; // Reset for next window
          };
          false;
        };
      };
    };
  };

  // Change admin password (requires providing current password hash)
  public shared ({ caller }) func changeAdminPassword(currentHash : Text, newHash : Text) : async Bool {
    let now = Time.now();
    // Also protect change password from brute force
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

  // Legacy claim admin (kept for backward compat, no longer used)
  public shared ({ caller }) func claimAdmin() : async Bool {
    false;
  };

  // Check whether admin has been claimed (legacy)
  public query func isAdminClaimed() : async Bool {
    adminClaimed;
  };

  func seedProducts() {
    addProductInternal({
      name = "Premium Facial Tissue Box";
      description = "Soft and strong 2-ply facial tissue. 100 sheets per box.";
      price = 45;
      category = "facial";
      imageUrl = "";
      stock = 50;
      id = 0;
    });

    addProductInternal({
      name = "Toilet Roll (Pack of 6)";
      description = "Durable 2-ply toilet rolls. 200 sheets per roll.";
      price = 80;
      category = "toilet";
      imageUrl = "";
      stock = 100;
      id = 0;
    });

    addProductInternal({
      name = "Kitchen Roll";
      description = "Strong absorbent kitchen paper roll for everyday use.";
      price = 60;
      category = "kitchen";
      imageUrl = "";
      stock = 75;
      id = 0;
    });

    addProductInternal({
      name = "Pocket Tissue (Pack of 10)";
      description = "Compact pocket tissue packs, perfect for travel.";
      price = 30;
      category = "pocket";
      imageUrl = "";
      stock = 200;
      id = 0;
    });
  };

  // PRODUCTS (CRUD)
  func addProductInternal(product : Product) {
    let newProduct = { product with id = nextProductId };
    products.add(nextProductId, newProduct);
    nextProductId += 1;
  };

  public shared ({ caller }) func addProduct(product : Product) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can add products");
    };
    addProductInternal(product);
  };

  public query ({ caller }) func getProduct(id : Nat) : async Product {
    switch (products.get(id)) {
      case (?product) { product };
      case (null) { Runtime.trap("Product not found") };
    };
  };

  public query ({ caller }) func getAllProducts() : async [Product] {
    products.values().toArray().sort();
  };

  public shared ({ caller }) func updateProduct(id : Nat, product : Product) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update products");
    };
    if (not products.containsKey(id)) { Runtime.trap("Product not found") };
    let updatedProduct = { product with id };
    products.add(id, updatedProduct);
  };

  public shared ({ caller }) func deleteProduct(id : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete products");
    };
    if (not products.containsKey(id)) { Runtime.trap("Product not found") };
    products.remove(id);
  };

  // ORDERS
  public shared ({ caller }) func placeOrder(customerName : Text, phone : Text, address : Text) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can place orders");
    };

    let cart = getCartInternal(caller);

    if (cart.items.size() == 0) { Runtime.trap("Cart is empty") };

    let orderItemsList = List.empty<OrderItem>();
    for (cartItem in cart.items.values()) {
      switch (products.get(cartItem.productId)) {
        case (?product) {
          orderItemsList.add({ cartItem with price = product.price });
        };
        case (null) { Runtime.trap("Product not found") };
      };
    };
    let orderItems = orderItemsList.toArray();

    let newOrder : Order = {
      id = nextOrderId;
      customerName;
      phone;
      address;
      items = orderItems;
      total = cart.total;
      status = "Pending";
    };

    orders.add(nextOrderId, newOrder);
    nextOrderId += 1;

    // Update stock
    for (item in cart.items.values()) {
      switch (products.get(item.productId)) {
        case (?product) {
          if (product.stock < item.quantity) {
            Runtime.trap("Insufficient stock for product id " # item.productId.toText());
          };
          let updatedProduct = {
            product with
            stock = product.stock - item.quantity;
          };
          products.add(item.productId, updatedProduct);
        };
        case (null) { Runtime.trap("Product not found") };
      };
    };
    carts.remove(caller);

    newOrder.id;
  };

  public query ({ caller }) func getOrder(id : Nat) : async Order {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view orders");
    };
    switch (orders.get(id)) {
      case (?order) { order };
      case (null) { Runtime.trap("Order not found") };
    };
  };

  public query ({ caller }) func getAllOrders() : async [Order] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can list all orders");
    };
    orders.values().toArray();
  };

  public shared ({ caller }) func updateOrderStatus(id : Nat, status : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update order status");
    };
    switch (orders.get(id)) {
      case (?order) {
        let updatedOrder = { order with status };
        orders.add(id, updatedOrder);
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
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can add items to cart");
    };

    if (quantity == 0) { Runtime.trap("Quantity must be greater than 0") };
    switch (products.get(productId)) {
      case (?product) {
        if (product.stock < quantity) { Runtime.trap("Insufficient stock") };
        let cart = getCartInternal(caller);
        let existingItem = cart.items.find(func(item) { item.productId == productId });
        let newItems = switch (existingItem) {
          case (?item) {
            cart.items.map(func(item) { if (item.productId == productId) { { item with quantity = item.quantity + quantity } } else { item } });
          };
          case (null) { cart.items.concat([ { productId; quantity } ]) };
        };
        let newTotal = cart.total + (product.price * quantity);
        let newCart = { items = newItems; total = newTotal };
        carts.add(caller, newCart);
      };
      case (null) { Runtime.trap("Product not found") };
    };
  };

  public shared ({ caller }) func removeFromCart(productId : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can remove items from cart");
    };

    let cart = getCartInternal(caller);
    let filteredItems = cart.items.filter(func(item) { item.productId != productId });
    let newTotal = switch (products.get(productId)) {
      case (?product) {
        let removedItem = cart.items.find(func(item) { item.productId == productId });
        switch (removedItem) {
          case (?item) { cart.total - (product.price * item.quantity) };
          case (null) { cart.total };
        };
      };
      case (null) { cart.total };
    };
    let newCart = { items = filteredItems; total = newTotal };
    carts.add(caller, newCart);
  };

  public query ({ caller }) func getCart() : async Cart {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view cart");
    };
    getCartInternal(caller);
  };

  public shared ({ caller }) func clearCart() : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can clear cart");
    };
    carts.remove(caller);
  };
};
