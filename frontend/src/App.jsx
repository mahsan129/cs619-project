// src/App.jsx
import { Routes, Route } from "react-router-dom";
import RequireAdmin from "./components/RequireAdmin";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Nav from "./components/Nav";
import ProtectedRoute from "./components/ProtectedRoute";

import Dashboard from "./pages/Dashboard";
import Catalog from "./pages/Catalog";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import MyOrders from "./pages/MyOrders";
import AdminOrders from "./pages/AdminOrders";   // ✅ yahi admin ki file hai
import Inventory from "./pages/Inventory";
import BulkRequests from "./pages/BulkRequests";
import SupplierBids from "./pages/SupplierBids";

function WithNav({ children }) {
  return (
    <>
      <Nav />
      <div style={{ paddingTop: 8 }}>{children}</div>
    </>
  );
}

export default function App() {
  return (
    <Routes>
      {/* ─── Public Routes ─── */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* ─── Admin-only ─── */}
      <Route element={<RequireAdmin />}>
        <Route
          path="/admin"
          element={
            <WithNav>
              <AdminOrders />   {/* ✅ yahan se naya admin design aaye ga */}
            </WithNav>
          }
        />
      </Route>

      {/* ─── Protected Routes ─── */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<WithNav><Dashboard /></WithNav>} />
        <Route path="/catalog"   element={<WithNav><Catalog /></WithNav>} />
        <Route path="/cart"      element={<WithNav><Cart /></WithNav>} />
        <Route path="/checkout"  element={<WithNav><Checkout /></WithNav>} />
        <Route path="/orders"    element={<WithNav><MyOrders /></WithNav>} />
        <Route path="/admin-orders" element={<WithNav><AdminOrders /></WithNav>} />
        <Route path="/inventory" element={<WithNav><Inventory /></WithNav>} />
        <Route path="/bulk-requests" element={<WithNav><BulkRequests /></WithNav>} />
        <Route path="/bids"      element={<WithNav><SupplierBids /></WithNav>} />
      </Route>

      {/* ─── Fallback ─── */}
      <Route path="*" element={<Landing />} />
    </Routes>
  );
}
