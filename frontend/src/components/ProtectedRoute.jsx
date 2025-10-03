import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function ProtectedRoute() {
  const { tokens, loadingMe } = useContext(AuthContext);

  if (loadingMe) {
    return <div style={{ padding: 24 }}>Loading…</div>;
  }
  if (!tokens?.access) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
