import { useEffect, useState } from "react";
import client from "../api/client";


export default function MyOrders() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  

  useEffect(() => {
    (async () => {
      try {
        const { data } = await client.get("/orders/");
        setRows(data);
      } catch (e) {
        setErr("Failed to load orders");
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div style={{ padding: 16 }}>Loading…</div>;
  if (err) return <div style={{ padding: 16, color: "red" }}>{err}</div>;

  return (
    <div style={{ padding: 16 }}>
      <h1>My Orders</h1>
      {rows.length === 0 ? <p>No orders yet.</p> : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th align="left">#</th>
              <th>Status</th>
              <th>Items</th>
              <th>Total (Rs)</th>
              <th>Placed</th>
              <th>Invoice</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(o => (
              <tr key={o.id} style={{ borderTop: "1px solid #eee" }}>
                <td align="left">{o.id}</td>
                <td align="center">{o.status}</td>
                <td align="center">{o.item_count}</td>
                <td align="right">{Number(o.total).toLocaleString()}</td>
                <td align="center">{new Date(o.created_at).toLocaleString()}</td>
                <td align="center">
                 <button onClick={() => downloadInvoice(o.id)}>Download</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
   
    </div>
  );
  const downloadInvoice = async (id) => {
  try {
    const res = await client.get(`/orders/${id}/invoice.pdf`, { responseType: "blob" });
    const blob = new Blob([res.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice_${id}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    alert("Failed to download invoice");
    console.error(e);
  }
};
}
