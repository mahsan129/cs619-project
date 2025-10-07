import { useEffect, useState } from "react";
import client from "../api/client";

export default function Inventory() {
  const [materials, setMaterials] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [m, a] = await Promise.all([
        client.get("/materials/"),
        client.get("/inventory/alerts/"),
      ]);
      setMaterials(m.data);
      setAlerts(a.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const adjust = async (id, delta) => {
    await client.post(`/materials/${id}/adjust_stock/`, { delta });
    await load();
  };

  const resolveAlert = async (id) => {
    await client.patch(`/inventory/alerts/${id}/resolve/`);
    await load();
  };

  if (loading) return <div style={{ padding: 16 }}>Loading…</div>;

  return (
    <div style={{ padding: 16, display: "grid", gridTemplateColumns: "1fr 360px", gap: 16 }}>
      <div>
        <h1>Inventory</h1>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th align="left">Material</th>
              <th>SKU</th>
              <th>Unit</th>
              <th>Stock</th>
              <th>Min</th>
              <th>Adjust</th>
            </tr>
          </thead>
          <tbody>
            {materials.map(m => (
              <tr key={m.id} style={{ borderTop: "1px solid #eee" }}>
                <td align="left">{m.title}</td>
                <td align="center">{m.sku}</td>
                <td align="center">{m.unit}</td>
                <td align="center" style={{ color: m.stock_qty <= m.min_stock ? "#b00020" : "inherit" }}>
                  {m.stock_qty}
                </td>
                <td align="center">{m.min_stock}</td>
                <td align="center">
                  <button onClick={() => adjust(m.id, +5)}>+5</button>{" "}
                  <button onClick={() => adjust(m.id, -5)}>-5</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h2>Low-Stock Alerts</h2>
        {alerts.length === 0 ? <p>No open alerts.</p> : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {alerts.map(a => (
              <li key={a.id} style={{ border: "1px solid #eee", padding: 10, borderRadius: 8, marginBottom: 8 }}>
                <div><b>{a.material_title}</b> <span style={{ color:"#666" }}>({a.material_sku})</span></div>
                <div style={{ fontSize: 12, color:"#b00020" }}>LOW_STOCK • created {new Date(a.created_at).toLocaleString()}</div>
                <button onClick={() => resolveAlert(a.id)} style={{ marginTop: 8 }}>Resolve</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
