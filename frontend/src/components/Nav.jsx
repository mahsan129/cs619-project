import { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const linksByRole = {
  ADMIN: [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/catalog", label: "Catalog" },
    { to: "/admin-orders", label: "Orders Board" },
    { to: "/reports", label: "Reports" },
  ],
  WHOLESALER: [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/catalog", label: "Catalog" },
    { to: "/bulk-requests", label: "Bulk Requests" },
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
    <nav style={styles.nav}>
      <div style={styles.brand}>🏗️ CS619 Store</div>
      <div style={styles.links}>
        {links.map((l) => (
          <Link key={l.to} to={l.to} style={styles.link}>
            {l.label}
          </Link>
        ))}
      </div>
      <div style={styles.right}>
        {user && <span style={{ marginRight: 12 }}>Hi, {user.username} ({user.role})</span>}
        <button onClick={logout} style={styles.btn}>Logout</button>
      </div>
    </nav>
  );
}

const styles = {
  nav: { display: "flex", alignItems: "center", gap: 16, padding: "10px 16px", borderBottom: "1px solid #eee" },
  brand: { fontWeight: 700 },
  links: { display: "flex", gap: 12, flex: 1 },
  link: { textDecoration: "none", color: "#333" },
  right: { display: "flex", alignItems: "center" },
  btn: { padding: "8px 12px", border: "1px solid #ccc", borderRadius: 6, cursor: "pointer", background: "#fff" },
};
