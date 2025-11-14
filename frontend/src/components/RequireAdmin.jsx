import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function RequireAdmin() {
  const { user, loadingMe } = useContext(AuthContext);

  if (loadingMe) return <div style={{padding:20}}>Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "ADMIN") return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
