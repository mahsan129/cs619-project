import { useEffect, useState } from "react";
import client from "../api/client";

export default function AdminMaterials() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null); // material being edited
  const [form, setForm] = useState({ title: "", sku: "", category: "", unit: "", stock_qty: 0, min_stock: 0, description: "" });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await client.get("/materials/");
      setMaterials(Array.isArray(data) ? data : data.results ?? []);
    } catch (e) {
      console.error(e);
      setError("Failed to load materials");
    } finally {
      setLoading(false);
    }
  };

  const startCreate = () => {
    setEditing(null);
    setForm({ title: "", sku: "", category: "", unit: "", stock_qty: 0, min_stock: 0, description: "" });
  };

  const startEdit = (m) => {
    setEditing(m.id);
    setForm({
      title: m.title || "",
      sku: m.sku || "",
      category: m.category || "",
      unit: m.unit || "",
      stock_qty: m.stock_qty || 0,
      min_stock: m.min_stock || 0,
      description: m.description || "",
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await client.put(`/materials/${editing}/`, form);
      } else {
        await client.post(`/materials/`, form);
      }
      await load();
      setEditing(null);
      setForm({ title: "", sku: "", category: "", unit: "", stock_qty: 0, min_stock: 0, description: "" });
    } catch (err) {
      console.error(err);
      alert(err?.response?.data ? JSON.stringify(err.response.data) : err.message);
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this material?")) return;
    try {
      await client.delete(`/materials/${id}/`);
      await load();
    } catch (e) {
      console.error(e);
      alert("Failed to delete");
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h1>Admin: Materials</h1>
      <div style={{ marginBottom: 12 }}>
        <button onClick={startCreate} style={{ padding: 8 }}>+ Add Material</button>
        <button onClick={load} style={{ padding: 8, marginLeft: 8 }}>Refresh</button>
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 2 }}>
          {loading ? <div>Loading…</div> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left' }}>
                  <th>Id</th><th>Title</th><th>SKU</th><th>Category</th><th>Stock</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {materials.map(m => (
                  <tr key={m.id} style={{ borderTop: '1px solid #eee' }}>
                    <td>{m.id}</td>
                    <td>{m.title}</td>
                    <td>{m.sku}</td>
                    <td>{m.category_name ?? m.category}</td>
                    <td>{m.stock_qty}</td>
                    <td>
                      <button onClick={() => startEdit(m)} style={{ marginRight: 8 }}>Edit</button>
                      <button onClick={() => remove(m.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ padding: 12, border: '1px solid #eee', borderRadius: 8 }}>
            <h3>{editing ? `Edit #${editing}` : 'Create Material'}</h3>
            <form onSubmit={submit}>
              <div style={{ marginBottom: 8 }}>
                <label>Title</label>
                <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} style={{ width: '100%' }} />
              </div>
              <div style={{ marginBottom: 8 }}>
                <label>SKU</label>
                <input value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} style={{ width: '100%' }} />
              </div>
              <div style={{ marginBottom: 8 }}>
                <label>Category (id)</label>
                <input value={form.category} onChange={e => setForm({...form, category: e.target.value})} style={{ width: '100%' }} />
              </div>
              <div style={{ marginBottom: 8 }}>
                <label>Unit</label>
                <input value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} style={{ width: '100%' }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <label>Stock Qty</label>
                  <input type="number" value={form.stock_qty} onChange={e => setForm({...form, stock_qty: Number(e.target.value)})} style={{ width: '100%' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Min Stock</label>
                  <input type="number" value={form.min_stock} onChange={e => setForm({...form, min_stock: Number(e.target.value)})} style={{ width: '100%' }} />
                </div>
              </div>
              <div style={{ marginTop: 8 }}>
                <label>Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} style={{ width: '100%' }} rows={4} />
              </div>
              <div style={{ marginTop: 12 }}>
                <button type="submit" style={{ padding: 8 }}>{editing ? 'Save' : 'Create'}</button>
                {editing && <button type="button" onClick={() => { setEditing(null); setForm({ title: '', sku: '', category: '', unit: '', stock_qty: 0, min_stock: 0, description: '' }); }} style={{ marginLeft: 8 }}>Cancel</button>}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
