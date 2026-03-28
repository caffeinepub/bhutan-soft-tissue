# Bhutan Soft Tissue – Wholesale Ordering Dashboard

## Current State
- Existing site has Home, Shop (product catalog), and Admin pages.
- Cart/checkout flow exists but is complex multi-step.
- No dedicated simple ordering dashboard for wholesale customers.
- Products: Napkin Tissue and Roll Tissue.

## Requested Changes (Diff)

### Add
- New `OrderDashboard` page (`/order-dashboard`) accessible from nav as "Order Now".
- Product cards for Napkin Tissue and Roll Tissue with product images, name, and carton/packet quantity selectors ([-] 0 [+]).
- Live order summary panel showing product name, cartons, packets, subtotal per product, and grand total.
- Action buttons: Add to Cart, Confirm Order, Cancel (reset).
- After order placement: order status tracker showing Confirmed → Preparing → Out for Delivery → Delivered / Canceled.
- Customer view: Current orders list with status badges, and Order History section.
- Mobile-first layout.

### Modify
- App.tsx: Add `order` to Page type and render OrderDashboard.
- Nav.tsx: Add "Order Now" nav link.

### Remove
- Nothing removed.

## Implementation Plan
1. Create `src/frontend/src/pages/OrderDashboard.tsx` with:
   - Two product cards (Napkin Tissue, Roll Tissue) each with carton/packet [-]/[+] stepper controls.
   - Price constants: Napkin Tissue carton = Nu.2,800, packet = Nu.280; Roll Tissue carton = Nu.3,200, packet = Nu.320.
   - Live summary panel computing totals.
   - Confirm Order calls backend placeOrder then shows status tracker.
   - Cancel resets all quantities.
   - After order placed: display status steps with current status highlighted.
   - Order history: list of past orders from getAllOrders (customer filtered by name).
2. Update App.tsx to include `order` page.
3. Update Nav.tsx to show "Order Now" button.
