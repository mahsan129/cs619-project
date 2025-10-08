// frontend/src/components/ProtectedRoute.jsx
import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Loader from "./Loader";

export default function ProtectedRoute() {
  const { tokens, loadingMe } = useContext(AuthContext);

  // show loader while /auth/me in progress
  if (loadingMe) {
    return <Loader text="Authenticating..." />;
  }

  // if not logged in → redirect to login
  if (!tokens?.access) {
    return <Navigate to="/login" replace />;
  }

  // important: return <Outlet /> on the SAME line (no stray newline)
  return <Outlet />;
}
