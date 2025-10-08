import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import RequireRole from "./components/RequireRole";

import Nav from "./components/Nav";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Catalog from "./pages/Catalog";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import MyOrders from "./pages/MyOrders";
import AdminOrders from "./pages/AdminOrders";
import Inventory from "./pages/Inventory";
import BulkRequests from "./pages/BulkRequests";
import SupplierBids from "./pages/SupplierBids";
import Reviews from "./pages/Reviews";
import Reports from "./pages/Reports";


// Simple layout to avoid repeating <Nav/> everywhere
function AppLayout() {
  return (
    <>
      <Nav />
      <div style={{ paddingTop: 8 }}>
        <Outlet />
      </div>
    </>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />

      {/* Protected area */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          {/* Common for all logged-in roles */}
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/reviews" element={<Reviews />} />

          {/* Customer / Retailer */}
          <Route element={<RequireRole allow={["CUSTOMER","RETAILER","ADMIN"]} />}>
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders" element={<MyOrders />} />
          </Route>

          {/* Wholesaler / Retailer: Bulk Requests */}
          <Route element={<RequireRole allow={["WHOLESALER","RETAILER","ADMIN"]} />}>
            <Route path="/bulk-requests" element={<BulkRequests />} />
          </Route>

          {/* Supplier: Bids */}
          <Route element={<RequireRole allow={["SUPPLIER","ADMIN"]} />}>
            <Route path="/bids" element={<SupplierBids />} />
          </Route>

          {/* Admin only */}
          <Route element={<RequireRole allow={["ADMIN"]} />}>
            <Route path="/admin-orders" element={<AdminOrders />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/reports" element={<Reports />} />
          </Route>
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}