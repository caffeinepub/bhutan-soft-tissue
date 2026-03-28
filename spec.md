# Bhutan Soft Tissue — Bug Fix: Admin Product Upload & Customer Order System

## Current State

The app is a Motoko + React wholesale ordering platform. Two critical bugs are preventing core functionality:

1. **Admin product upload fails with "invalid credential"**: When the IC canister is redeployed (new canister ID), the backend `adminPasswordHash` stable var resets to null. The browser's localStorage still holds the old hash. The login logic checks `localMatch` (localStorage hash == typed password hash) and considers the user logged in without verifying the backend has the password registered. All subsequent `addProductWithHash` calls fail because `checkAdminHash` returns false against a null backend hash.

2. **Customer orders fail with "Failed to place order"**: The backend `placeOrder` and `addToCart` functions both call `Runtime.trap("Must be logged in")` when the caller is anonymous. Customer-facing pages use anonymous identity (no Internet Identity login), so every order attempt traps and fails. No orders are ever saved.

## Requested Changes (Diff)

### Add
- Backend: `submitOrder` function — takes order details and items directly, allows anonymous callers, returns `{#ok: Nat; #err: Text}`
- Backend: `orderTimestamp` field via encoding timestamp in address field for display  
- Frontend: `useSubmitOrder` hook in useQueries.ts
- Admin login: auto-register hash on fresh canister when localMatch succeeds but backend has no password set

### Modify
- `OrderDashboard.tsx`: Replace `clearCart` + `addToCart` + `placeOrder` flow with direct `submitOrder` call
- `useQueries.ts`: Add `useSubmitOrder` mutation
- `Admin.tsx`: In login handler, when `localMatch` is true but backend `adminPasswordLogin` returns false, check if password is set; if not, call `setupAdminPassword` to re-register the hash on the new canister
- Admin orders table: parse and display carton/packet info from the order address field
- Error messages: surface actual backend error text instead of generic messages

### Remove
- Nothing removed — all existing UI preserved

## Implementation Plan

1. **Backend (main.mo)**: Add `submitOrder(customerName, phone, address, items: [OrderItem]) -> {#ok: Nat; #err: Text}` — no authentication required, validates non-empty fields and items
2. **backend.d.ts**: Add `submitOrder` to `backendInterface`
3. **useQueries.ts**: Add `useSubmitOrder` mutation; in `useAdminPasswordLogin`, after failed backend match during localMatch login, call `isAdminPasswordSet` and if false, call `setupAdminPassword` to re-register
4. **Admin.tsx**: Fix login handler to handle fresh-canister scenario — when localMatch but backend returns false, check `isAdminPasswordSet()`, and if not set, call `setupAdminPassword(hash)` automatically
5. **OrderDashboard.tsx**: Replace the 3-step cart flow with a single `submitOrder` call; include carton/packet counts in the address string for admin display
