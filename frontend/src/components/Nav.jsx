// frontend/src/components/Nav.jsx
import { NavLink } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const linksByRole = {
  ADMIN: [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/catalog", label: "Catalog" },
    { to: "/admin-orders", label: "Orders Board" },
    { to: "/products", label: "Manage Products" },
    { to: "/users", label: "Manage Users" },
    { to: "/admin", label: "Admin Panel" },
    { to: "/reports", label: "Reports" },
  ],
  WHOLESALER: [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/catalog", label: "Catalog" },
    { to: "/bulk-requests", label: "Bulk Requests" },
    { to: "/wholesaler/inventory", label: "Manage Inventory" },
  ],
  RETAILER: [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/catalog", label: "Catalog" },
    { to: "/cart", label: "Cart" },
    { to: "/orders", label: "My Orders" },
  ],
  CUSTOMER: [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/catalog", label: "Catalog" },
    { to: "/cart", label: "Cart" },
    { to: "/orders", label: "My Orders" },
  ],
};

export default function Nav() {
  const { user, logout } = useContext(AuthContext);
  const role = user?.role || "CUSTOMER";
  const links = linksByRole[role] || [];

  return (
    <nav>
      <div className="brand">ASBuild<span>Mart</span></div>
      <div className="links">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            {l.label}
          </NavLink>
        ))}
      </div>
      <div className="right">
        {user && <span>Hi, {user.username} ({user.role})</span>}
        <button className="btn ghost" onClick={logout}>Logout</button>
      </div>
    </nav>
  );
}
