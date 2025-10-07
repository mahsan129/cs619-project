import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
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

      {/* Protected area (everything below requires auth) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          {/* Redirect root → /dashboard */}
          <Route index element={<Navigate to="/dashboard" replace />} />

          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<MyOrders />} />

          {/* Role-specific pages (optional: add admin/supplier guards later) */}
          <Route path="/admin-orders" element={<AdminOrders />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/bulk-requests" element={<BulkRequests />} />
          <Route path="/bids" element={<SupplierBids />} />
          <Route path="/reviews" element={<Reviews />} />
         <Route path="/reports" element={<Reports />} />
        </Route>
         
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
