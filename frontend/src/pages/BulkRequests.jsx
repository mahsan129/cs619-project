import { useEffect, useState } from "react";
import client from "../api/client";

export default function BulkRequests() {
  const [rows, setRows] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [form, setForm] = useState({ material: "", qty: "", deadline: "" });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [r, m] = await Promise.all([
      client.get("/bulk-requests/mine/"),
      client.get("/materials/"),
    ]);
    setRows(r.data);
    setMaterials(m.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const createBR = async (e) => {
    e.preventDefault();
    await client.post("/bulk-requests/", {
      material: Number(form.material),
      qty: Number(form.qty),
      deadline: form.deadline || null
    });
    setForm({ material: "", qty: "", deadline: "" });
    await load();
  };

  if (loading) return <div style={{ padding: 16 }}>Loading…</div>;

  return (
    <div style={{ padding: 16 }}>
      <h1>My Bulk Requests</h1>

      <form onSubmit={createBR} style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr auto", gap:8, maxWidth:800 }}>
        <select value={form.material} onChange={e=>setForm({...form, material:e.target.value})} required>
          <option value="">Select Material</option>
          {materials.map(m=><option key={m.id} value={m.id}>{m.title} ({m.sku})</option>)}
        </select>
        <input type="number" min="1" placeholder="Qty" value={form.qty} onChange={e=>setForm({...form, qty:e.target.value})} required />
        <input type="date" value={form.deadline} onChange={e=>setForm({...form, deadline:e.target.value})} />
        <button type="submit">Create</button>
      </form>

      <table style={{ width:"100%", borderCollapse:"collapse", marginTop:16 }}>
        <thead>
          <tr>
            <th align="left">#</th>
            <th>Material</th>
            <th>Qty</th>
            <th>Deadline</th>
            <th>Status</th>
            <th>Bids</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(br=>(
            <tr key={br.id} style={{ borderTop:"1px solid #eee" }}>
              <td align="left">{br.id}</td>
              <td align="center">{br.material_title} ({br.material_sku})</td>
              <td align="center">{br.qty}</td>
              <td align="center">{br.deadline || "-"}</td>
              <td align="center">{br.status}</td>
              <td align="center">{br.bids_count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
