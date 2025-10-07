import { useEffect, useMemo, useState } from "react";
import client from "../api/client";

const STATUSES = ["PLACED","CONFIRMED","DISPATCHED","DELIVERED","CANCELLED"];

export default function AdminOrders() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const { data } = await client.get("/orders/");
      setRows(data);
    } catch (e) {
      setErr("Failed to load orders");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const setStatus = async (id, status) => {
    try {
      await client.patch(`/orders/${id}/status/`, { status });
      await load();
    } catch (e) {
      alert("Failed to update status");
      console.error(e);
    }
  };

  if (loading) return <div style={{ padding: 16 }}>Loading…</div>;
  if (err) return <div style={{ padding: 16, color: "red" }}>{err}</div>;

  return (
    <div style={{ padding: 16 }}>
      <h1>Admin Orders</h1>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th align="left">#</th>
            <th>Items</th>
            <th>Total (Rs)</th>
            <th>Placed</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(o => (
            <tr key={o.id} style={{ borderTop: "1px solid #eee" }}>
              <td align="left">{o.id}</td>
              <td align="center">{o.item_count}</td>
              <td align="right">{Number(o.total).toLocaleString()}</td>
              <td align="center">{new Date(o.created_at).toLocaleString()}</td>
              <td align="center">
                <select value={o.status} onChange={e => setStatus(o.id, e.target.value)}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
