import { useEffect, useState } from "react";
import client from "../api/client";

export default function WholesalerInventory() {
  const [materials, setMaterials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    title: "",
    sku: "",
    category: "",
    unit: "bag",
    stock_qty: 0,
    min_stock: 10,
    description: "",
  });
  const [submitError, setSubmitError] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    load();
    loadCategories();
  }, []);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await client.get("/api/materials/");
      setMaterials(Array.isArray(data) ? data : data.results ?? []);
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.detail || "Failed to load materials");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data } = await client.get("/api/categories/");
      setCategories(Array.isArray(data) ? data : data.results ?? []);
    } catch (e) {
      console.warn("Failed to load categories", e);
    }
  };

  const startCreate = () => {
    setEditing(null);
    setForm({ title: "", sku: "", category: "", unit: "bag", stock_qty: 0, min_stock: 10, description: "" });
    setShowForm(true);
  };

  const startEdit = (m) => {
    setEditing(m.id);
    setForm({
      title: m.title || "",
      sku: m.sku || "",
      category: m.category || "",
      unit: m.unit || "bag",
      stock_qty: m.stock_qty || 0,
      min_stock: m.min_stock || 10,
      description: m.description || "",
    });
    setShowForm(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.sku || !form.category) {
      setSubmitError("Title, SKU, and Category are required");
      return;
    }
    setSubmitLoading(true);
    setSubmitError("");
    try {
      if (editing) {
        await client.put(`/api/materials/${editing}/`, form);
      } else {
        await client.post(`/api/materials/`, form);
      }
      await load();
      setShowForm(false);
      setEditing(null);
      setForm({ title: "", sku: "", category: "", unit: "bag", stock_qty: 0, min_stock: 10, description: "" });
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.detail || err?.response?.data?.title?.[0] || err?.message || "Failed to save product";
      setSubmitError(msg);
    } finally {
      setSubmitLoading(false);
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this product?")) return;
    try {
      await client.delete(`/api/materials/${id}/`);
      await load();
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.detail || "Failed to delete product");
    }
  };

  const cancel = () => {
    setShowForm(false);
    setEditing(null);
    setSubmitError("");
    setForm({ title: "", sku: "", category: "", unit: "bag", stock_qty: 0, min_stock: 10, description: "" });
  };

  return (
    <div style={{ padding: 0, background: "#f5f5f5", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white", padding: 32 }}>
        <h1 style={{ margin: 0, fontSize: 32 }}>📦 Inventory Management</h1>
        <p style={{ margin: "8px 0 0", opacity: 0.9 }}>Manage your products and stock levels</p>
      </div>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: 24 }}>
        {/* Action Bar */}
        <div style={{ marginBottom: 24, display: "flex", gap: 12 }}>
          <button onClick={startCreate} style={{ padding: "12px 24px", background: "#4CAF50", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
            ➕ Add New Product
          </button>
          <button onClick={load} style={{ padding: "12px 24px", background: "#667eea", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
            🔄 Refresh
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div style={{ background: "white", padding: 32, borderRadius: 12, maxWidth: 500, width: "90%", maxHeight: "90vh", overflowY: "auto" }}>
              <h2 style={{ margin: "0 0 24px", fontSize: 20 }}>{editing ? "✏️ Edit Product" : "➕ Create New Product"}</h2>
              {submitError && (
                <div style={{ padding: 12, background: "#ffebee", color: "#c62828", borderRadius: 6, marginBottom: 16, fontSize: 14 }}>
                  {submitError}
                </div>
              )}
              <form onSubmit={submit}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Product Title *</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 6, boxSizing: "border-box" }}
                    placeholder="e.g., Portland Cement"
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>SKU *</label>
                  <input
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 6, boxSizing: "border-box" }}
                    placeholder="e.g., CEMENT-001"
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Category *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 6, boxSizing: "border-box" }}
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Unit</label>
                    <input
                      value={form.unit}
                      onChange={(e) => setForm({ ...form, unit: e.target.value })}
                      style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 6, boxSizing: "border-box" }}
                      placeholder="e.g., bag"
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Stock Quantity</label>
                    <input
                      type="number"
                      value={form.stock_qty}
                      onChange={(e) => setForm({ ...form, stock_qty: Number(e.target.value) })}
                      style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 6, boxSizing: "border-box" }}
                    />
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Minimum Stock Level</label>
                  <input
                    type="number"
                    value={form.min_stock}
                    onChange={(e) => setForm({ ...form, min_stock: Number(e.target.value) })}
                    style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 6, boxSizing: "border-box" }}
                  />
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 6, boxSizing: "border-box", minHeight: 80 }}
                    placeholder="Product details..."
                  />
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <button type="submit" disabled={submitLoading} style={{ flex: 1, padding: 12, background: submitLoading ? "#999" : "#667eea", color: "white", border: "none", borderRadius: 6, cursor: submitLoading ? "not-allowed" : "pointer", fontWeight: 600 }}>
                    {submitLoading ? "Saving..." : editing ? "Save Changes" : "Create Product"}
                  </button>
                  <button type="button" onClick={cancel} style={{ flex: 1, padding: 12, background: "#f5f5f5", color: "#333", border: "1px solid #ddd", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Materials List */}
        <div style={{ background: "white", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.1)", overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: 32, textAlign: "center", color: "#999" }}>Loading inventory…</div>
          ) : error ? (
            <div style={{ padding: 32, textAlign: "center", color: "red" }}>{error}</div>
          ) : materials.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", color: "#999" }}>No products yet. Create your first product!</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ background: "#f5f5f5", borderBottom: "2px solid #ddd" }}>
                  <tr>
                    <th style={{ padding: 16, textAlign: "left", fontWeight: 700 }}>Product</th>
                    <th style={{ padding: 16, textAlign: "left", fontWeight: 700 }}>SKU</th>
                    <th style={{ padding: 16, textAlign: "center", fontWeight: 700 }}>Category</th>
                    <th style={{ padding: 16, textAlign: "center", fontWeight: 700 }}>Stock</th>
                    <th style={{ padding: 16, textAlign: "center", fontWeight: 700 }}>Min Stock</th>
                    <th style={{ padding: 16, textAlign: "center", fontWeight: 700 }}>Unit</th>
                    <th style={{ padding: 16, textAlign: "center", fontWeight: 700 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.map((m, idx) => (
                    <tr key={m.id} style={{ borderBottom: "1px solid #eee", background: idx % 2 === 0 ? "#fafafa" : "white" }}>
                      <td style={{ padding: 16 }}>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>{m.title}</div>
                        <div style={{ fontSize: 12, color: "#666" }}>{m.description?.slice(0, 50) || "-"}</div>
                      </td>
                      <td style={{ padding: 16, fontFamily: "monospace", color: "#667eea" }}>{m.sku}</td>
                      <td style={{ padding: 16, textAlign: "center" }}>
                        <span style={{ display: "inline-block", padding: "4px 12px", background: "#e3f2fd", color: "#1976d2", borderRadius: 4, fontSize: 12, fontWeight: 600 }}>
                          {m.category_name || "-"}
                        </span>
                      </td>
                      <td style={{ padding: 16, textAlign: "center" }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: m.stock_qty <= m.min_stock ? "#d32f2f" : "#4CAF50" }}>
                          {m.stock_qty}
                        </div>
                      </td>
                      <td style={{ padding: 16, textAlign: "center", color: "#666" }}>{m.min_stock}</td>
                      <td style={{ padding: 16, textAlign: "center", color: "#666" }}>{m.unit || "-"}</td>
                      <td style={{ padding: 16, textAlign: "center" }}>
                        <button onClick={() => startEdit(m)} style={{ padding: "6px 12px", background: "#2196F3", color: "white", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12, marginRight: 6 }}>
                          ✏️ Edit
                        </button>
                        <button onClick={() => remove(m.id)} style={{ padding: "6px 12px", background: "#d32f2f", color: "white", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12 }}>
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary Card */}
        {materials.length > 0 && (
          <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            <div style={{ background: "white", padding: 20, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.1)", borderLeft: "4px solid #667eea" }}>
              <div style={{ fontSize: 12, color: "#999" }}>Total Products</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#667eea" }}>{materials.length}</div>
            </div>
            <div style={{ background: "white", padding: 20, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.1)", borderLeft: "4px solid #4CAF50" }}>
              <div style={{ fontSize: 12, color: "#999" }}>Total Stock</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#4CAF50" }}>{materials.reduce((sum, m) => sum + (m.stock_qty || 0), 0)} units</div>
            </div>
            <div style={{ background: "white", padding: 20, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.1)", borderLeft: "4px solid #FF9800" }}>
              <div style={{ fontSize: 12, color: "#999" }}>Low Stock Alerts</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#FF9800" }}>{materials.filter(m => m.stock_qty <= m.min_stock).length}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
