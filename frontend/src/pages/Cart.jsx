import { useContext, useEffect, useState } from "react";
import { CartContext } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import client from "../api/client";

export default function Cart() {
  const ctx = useContext(CartContext) || {};
  const items = ctx.items || [];
  const summary = ctx.summary || {};
  const updateQty = ctx.updateQty || (async () => {});
  const remove = ctx.remove || (async () => {});
  const navigate = useNavigate();
  
  const [selected, setSelected] = useState(new Set());
  const [categories, setCategories] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("");

  const toggleSelect = (id) => {
    const newSet = new Set(selected);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelected(newSet);
  };

  const toggleSelectAll = () => {
    if (selected.size === items.length && items.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(items.map(x => x.id)));
    }
  };

  const getSelectedTotal = () => {
    return items
      .filter(x => selected.has(x.id))
      .reduce((sum, x) => sum + (x.line_total || 0), 0);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await client.get("/categories/");
        if (!mounted) return;
        setCategories(Array.isArray(data) ? data : data.results ?? []);
      } catch (e) {
        console.warn("Failed to load categories", e);
      }
    })();
    return () => { mounted = false };
  }, []);

  // When category filter changes, request server-side filtered cart and reset selection
  useEffect(() => {
    (async () => {
      try {
        if (ctx && typeof ctx.load === "function") {
          await ctx.load(categoryFilter || "");
          setSelected(new Set());
        }
      } catch (e) {
        console.warn("Failed to load filtered cart", e);
      }
    })();
  }, [categoryFilter]);

  const proceedToCheckout = () => {
    if (selected.size === 0) {
      alert("Please select at least one item to checkout.");
      return;
    }
    // Pass selected item IDs to checkout page via navigation state
    navigate("/checkout", { state: { selectedIds: Array.from(selected) } });
  };

  // Defensive render to avoid blank white screen on runtime errors
  try {
    return (
      <div style={{ padding: 16, maxWidth: 1200, margin: "0 auto" }}>
        <h1>🛒 My Cart</h1>
        {(!items || items.length === 0) ? (
          <p style={{ fontSize: 16, color: "#666" }}>Your cart is empty. Go to Catalog to add items.</p>
        ) : (
          <>
                <div style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "center" }}>
                  <label style={{ color: "#444", fontWeight: 600 }}>Filter by category:</label>
                  <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ padding: 8, borderRadius: 6 }}>
                    <option value="">All categories</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.slug}>{c.name}</option>
                    ))}
                  </select>
                </div>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20, fontSize: 14 }}>
              <thead>
                <tr style={{ backgroundColor: "#f5f5f5", borderBottom: "2px solid #ddd" }}>
                  <th align="center" style={{ padding: 12 }}>
                    <input
                      type="checkbox"
                      checked={selected.size === items.length && items.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th align="left" style={{ padding: 12 }}>Item</th>
                  <th align="center" style={{ padding: 12 }}>Unit</th>
                  <th align="right" style={{ padding: 12 }}>Price</th>
                  <th align="center" style={{ padding: 12 }}>Quantity</th>
                  <th align="right" style={{ padding: 12 }}>Total</th>
                  <th align="center" style={{ padding: 12 }}>Action</th>
                  <th align="center" style={{ padding: 12 }}>View</th>
                </tr>
              </thead>
              <tbody>
                {items
                  .filter(x => !categoryFilter || x.material_category_slug === categoryFilter)
                  .map((x) => (
                  <tr key={x.id} style={{ borderBottom: "1px solid #eee", backgroundColor: selected.has(x.id) ? "#fffacd" : "white" }}>
                    <td align="center" style={{ padding: 12 }}>
                      <input
                        type="checkbox"
                        checked={selected.has(x.id)}
                        onChange={() => toggleSelect(x.id)}
                      />
                    </td>
                    <td style={{ padding: 12 }}>
                      <div>
                        <b>{(x.material_title || x.title || "-")}</b>
                        <div style={{ color: "#666", fontSize: 12 }}>
                          SKU: {x.material_sku || x.sku || "-"}
                        </div>
                      </div>
                    </td>
                    <td align="center" style={{ padding: 12 }}>{x.unit || "-"}</td>
                    <td align="right" style={{ padding: 12, fontWeight: "bold" }}>Rs {x.price != null ? Number(x.price).toLocaleString() : "-"}</td>
                    <td align="center" style={{ padding: 12 }}>
                      <input
                        type="number"
                        min="1"
                        value={x.qty || 1}
                        onChange={(e) => updateQty(x.id, Math.max(1, parseInt(e.target.value || "1", 10)))}
                        style={{ width: 50, padding: 4, textAlign: "center" }}
                      />
                    </td>
                    <td align="right" style={{ padding: 12, fontWeight: "bold", color: "#d32f2f" }}>Rs {x.line_total != null ? Number(x.line_total).toLocaleString() : "-"}</td>
                    <td align="center" style={{ padding: 12 }}>
                      <button
                        onClick={() => remove(x.id)}
                        style={{ padding: "6px 12px", backgroundColor: "#f5f5f5", border: "1px solid #ddd", cursor: "pointer", borderRadius: 4 }}
                      >
                        Remove
                      </button>
                    </td>
                    <td align="center" style={{ padding: 12 }}>
                      <button
                        onClick={() => {
                          const mid = x?.material?.id ?? x?.material;
                          console.debug("Navigating to material detail", mid, x);
                          if (!mid) return alert("Material id not available");
                          navigate(`/materials/${mid}`);
                        }}
                        style={{ padding: "6px 12px", backgroundColor: "#fff", border: "1px solid #ddd", cursor: "pointer", borderRadius: 4 }}
                      >
                        View Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 16, backgroundColor: "#f9f9f9", borderRadius: 8, marginTop: 20 }}>
              <div style={{ fontSize: 16 }}>
                <div style={{ marginBottom: 8 }}>
                  <b>Total Items:</b> {items.length}
                </div>
                <div style={{ marginBottom: 8 }}>
                  <b>Selected:</b> {selected.size}
                </div>
                <div style={{ fontSize: 18, color: "#d32f2f", fontWeight: "bold" }}>
                  Selected Total: Rs {Number(getSelectedTotal()).toLocaleString()}
                </div>
              </div>
              <button
                onClick={proceedToCheckout}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "#4CAF50",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  fontSize: 16,
                  fontWeight: "bold",
                  cursor: "pointer",
                  transition: "background-color 0.3s"
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = "#45a049"}
                onMouseOut={(e) => e.target.style.backgroundColor = "#4CAF50"}
              >
                Proceed to Checkout →
              </button>
            </div>
          </>
        )}
      </div>
    );
  } catch (err) {
    console.error("Cart render error:", err);
    return (
      <div style={{ padding: 16 }}>
        <h1>My Cart</h1>
        <div style={{ color: "red" }}>An error occurred rendering the cart. Check console for details.</div>
      </div>
    );
  }
}
