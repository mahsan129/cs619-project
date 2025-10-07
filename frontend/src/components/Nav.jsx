import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

// role-based links (each role sees different menu)
const linksByRole = {
  ADMIN: [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/catalog", label: "Catalog" },
    { to: "/admin-orders", label: "Orders Board" },
    { to: "/inventory", label: "Inventory" },
    { to: "/reports", label: "Reports" },
  ],
  WHOLESALER: [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/catalog", label: "Catalog" },
    { to: "/bulk-requests", label: "Bulk Requests" },
    { to: "/orders", label: "My Orders" },
  ],
  RETAILER: [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/catalog", label: "Catalog" },
    { to: "/cart", label: "Cart" },
    { to: "/checkout", label: "Checkout" },
    { to: "/orders", label: "My Orders" },
  ],
  CUSTOMER: [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/catalog", label: "Catalog" },
    { to: "/cart", label: "Cart" },
    { to: "/checkout", label: "Checkout" },
    { to: "/orders", label: "My Orders" },
  ],
  SUPPLIER: [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/bids", label: "My Bids" },
  ],
};

export default function Nav() {
  const { user, logout } = useContext(AuthContext);
  const role = user?.role?.toUpperCase() || "CUSTOMER";
  const links = linksByRole[role] || [];

  return (
    <nav style={styles.nav}>
      {/* Brand / Logo */}
      <div style={styles.brand}>🏗️ CS619 Store</div>

      {/* Role-based Links */}
      <div style={styles.links}>
        {links.map((l) => (
          <Link key={l.to} to={l.to} style={styles.link}>
            {l.label}
          </Link>
        ))}
      </div>

      {/* Right side user info */}
      <div style={styles.right}>
        {user ? (
          <>
            <span style={{ marginRight: 12 }}>
              Hi, {user.username} ({user.role})
            </span>
            <button onClick={logout} style={styles.btn}>Logout</button>
          </>
        ) : (
          <Link to="/login" style={styles.link}>Login</Link>
        )}
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 16px",
    borderBottom: "1px solid #eee",
    gap: 16,
  },
  brand: { fontWeight: 700 },
  links: { display: "flex", gap: 12, flexWrap: "wrap" },
  link: { textDecoration: "none", color: "#333" },
  right: { display: "flex", alignItems: "center", gap: 8 },
  btn: {
    padding: "6px 10px",
    border: "1px solid #ccc",
    borderRadius: 4,
    cursor: "pointer",
    background: "#fff",
  },
};
