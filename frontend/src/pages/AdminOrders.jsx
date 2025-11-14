// src/pages/AdminOrders.jsx
import { useEffect, useState } from "react";
import api from "../api/client";
import "../styles/AdminOrders.css";   // ⬅️ YEH LINE ADD

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const r = await api.get("/admin/recent-orders/");
        if (!cancelled) setOrders(r.data || []);
      } catch (err) {
        console.error(err);
        if (!cancelled) setError("Failed to load orders");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="admin-page">
      <h1 className="admin-title">Admin Orders</h1>

      {error && <div className="admin-error">{error}</div>}
      {loading && <div className="admin-loading">Loading…</div>}

      {!loading && !error && (
        <div className="admin-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Buyer</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>{o.id}</td>
                  <td>{o.buyer}</td>
                  <td>
                    <span className="admin-tag">{o.status}</span>
                  </td>
                  <td>{o.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
