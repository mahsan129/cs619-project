import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Nav from "./components/Nav";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Catalog from "./pages/Catalog";

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        {/* Protected group */}
        <Route
  path="/catalog"
  element={
    <>
      <Nav />
      <div style={{ paddingTop: 8 }}>
        <Catalog />
      </div>
    </>
  }
/>
        <Route element={<ProtectedRoute />}>
          <Route
            path="/"
            element={
              <>
                <Nav />
                <div style={{ paddingTop: 8 }}>
                  <Dashboard />
                </div>
              </>
            }
          />
          <Route
            path="/dashboard"
            element={
              <>
                <Nav />
                <div style={{ paddingTop: 8 }}>
                  <Dashboard />
                </div>
              </>
            }
          />
          {/* Future pages (protected):
              <Route path="/catalog" element={<><Nav /><Catalog /></>} />
              <Route path="/orders" element={<><Nav /><MyOrders /></>} />
              etc.
          */}
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Login />} />
      </Routes>
    </>
  );
}
