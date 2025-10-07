import { useEffect, useState } from "react";
import client from "../api/client";

export default function Reports() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ from: "", to: "" });
  const [err, setErr] = useState("");

  const load = async () => {
    try {
      const q = [];
      if (form.from) q.push(`from=${form.from}`);
      if (form.to) q.push(`to=${form.to}`);
      const qs = q.length ? `?${q.join("&")}` : "";
      const { data } = await client.get(`/reports/sales${qs}`);
      setRows(data);
      setErr("");
    } catch (e) {
      setErr("Failed (Admin only or missing permission)");
      setRows([]);
    }
  };

  useEffect(() => { load(); }, []); // initial

  return (
    <div style={{ padding: 16 }}>
      <h1>Sales Report</h1>
      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
        <input type="date" value={form.from} onChange={e=>setForm({...form, from:e.target.value})} />
        <span>to</span>
        <input type="date" value={form.to} onChange={e=>setForm({...form, to:e.target.value})} />
        <button onClick={load}>Run</button>
      </div>

      {err && <p style={{ color:"red" }}>{err}</p>}

      {rows.length === 0 ? <p>No data.</p> : (
        <table style={{ width:"100%", borderCollapse:"collapse", marginTop: 12 }}>
          <thead>
            <tr>
              <th align="left">Day</th>
              <th>Orders</th>
              <th>Revenue (Rs)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={idx} style={{ borderTop: "1px solid #eee" }}>
                <td>{r.day}</td>
                <td align="center">{r.orders}</td>
                <td align="right">{Number(r.revenue).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
