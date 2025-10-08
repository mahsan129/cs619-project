import React, { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Loader from "./Loader";

/**
 * Usage:
 * <Route element={<RequireRole allow={["ADMIN"]} />}> ... </Route>
 * <Route element={<RequireRole allow={["SUPPLIER","ADMIN"]} />}> ... </Route>
 */
export default function RequireRole({ allow = [] }) {
  const { user, loading } = useContext(AuthContext); // ensure AuthContext exposes loading + user

  // ✅ show loader while fetching user info
  if (loading) return <Loader text="Checking access..." />;

  // ✅ safety: if not logged in → redirect
  if (!user) return <Navigate to="/login" replace />;

  const role = (user.role || "").toUpperCase();
  const ok = allow.length === 0 ? true : allow.includes(role);

  // ✅ allowed → render child routes; otherwise redirect
  return ok ? <Outlet /> : <Navigate to="/dashboard" replace />;
}
