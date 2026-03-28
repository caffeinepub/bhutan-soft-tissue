# Bhutan Soft Tissue – Admin Dashboard Overhaul

## Current State
The Admin page (`src/frontend/src/pages/Admin.tsx`) has 1234 lines. It includes:
- Password-based login with lockout protection
- Tabs: Orders | Products
- Orders tab: table with status dropdown, WhatsApp/SMS message templates
- Products tab: add/edit/delete products with image upload

The backend (`main.mo`) exposes: `getAllOrders`, `getAllProducts`, `updateOrderStatus`, `addProduct`, `updateProduct`, `deleteProduct`, `placeOrder`, `adminPasswordLogin`, `setupAdminPassword`.

Orders have: id, customerName, phone, address, items (productId, quantity, price), total, status.
Products have: id, name, description, price, category, imageUrl, stock.

## Requested Changes (Diff)

### Add
- Sidebar navigation with sections: Dashboard, Orders, Inventory, Customers, Analytics, Settings
- Top navigation bar with logo ("Bhutan Soft Tissue | Opal Tissue"), nav links, bell notification icon, profile icon
- Dashboard overview section with 4 cards:
  - Total Orders Today (derived from all orders, green card)
  - Total Revenue Today (sum of all order totals, green card)
  - Active Customers (unique customer names count, blue card)
  - Low Stock Alerts (products with stock < 50, orange card)
- Orders table enhancements:
  - Columns: Order ID, Customer, Product, Cartons, Packets, Date, Time, Status, Action
  - Sort by status
  - Filter by status dropdown
  - Search by customer name or order ID
  - Status update dropdown in Action column
  - Expandable order timeline (click row → show vertical step timeline)
- Inventory section (new tab/page):
  - Table: Product, Cartons Available, Packets Available, Status (OK / Low Stock)
  - Cartons = stock / 10 (derived), Packets = stock (derived)
  - Low stock threshold: cartons < 20 = Low Stock
  - Edit inventory quantities
- Customers section (new tab/page):
  - Table: Customer Name, Phone, Location (from address), Total Orders
  - Click customer row → expand to show order history for that customer
- Analytics section (new tab/page):
  - Line chart: revenue per order (mock daily grouping)
  - Bar chart: top selling products by quantity ordered
  - Pie chart: revenue per customer
  - Use recharts (already available via chart.tsx)
- Notifications panel:
  - Bell icon in top nav with badge count
  - Dropdown list showing recent order status changes and low stock alerts
  - Mark as read
- Export button: download orders table as CSV
- Settings tab: change admin password (already exists, keep it)

### Modify
- Admin.tsx: Replace tab-based layout with sidebar + section layout
- Keep all existing functionality (add/edit/delete products, status update, WhatsApp message templates, login)
- Products management moves to Settings or a dedicated Products section in sidebar

### Remove
- Simple Tabs (Orders | Products) replaced by sidebar navigation

## Implementation Plan
1. Refactor Admin.tsx layout: add sidebar (collapsible on mobile), top nav with bell + profile
2. Implement Dashboard section with 4 stat cards derived from backend data
3. Enhance Orders section: search, filter, sort, expandable timeline row
4. Add Inventory section: derive carton/packet counts from product stock, allow editing
5. Add Customers section: aggregate from orders, expandable history
6. Add Analytics section: recharts line/bar/pie using real order data
7. Add Notifications panel with bell icon dropdown
8. Add CSV export for orders
9. Keep Products section (existing add/edit/delete with image upload)
10. Keep Settings (password change)
