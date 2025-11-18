import React, { useContext, useState } from "react";
import { CartContext } from "../context/CartContext";

export default function ProductCard({ item }) {
  const { add } = useContext(CartContext);
  const [adding, setAdding] = useState(false);
  const low = item.stock_qty <= item.min_stock;

  const handleAdd = async () => {
    setAdding(true);
    try {
      await add(item.id, 1);   // item.id == material id from catalog API
    } catch (e) {
      console.error(e);
      // show detailed server message when available
      alert(e.message || "Failed to add to cart.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div style={card}>
      <div style={{ fontWeight: 600 }}>{item.title}</div>
      <div style={{ color: "#666", fontSize: 12 }}>
        {item.sku} • {item.category_name}
      </div>

      <div style={{ margin: "8px 0" }}>
        {item.price != null ? (
          <div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>
              Rs {Number(item.price).toLocaleString()}
            </div>
            <div style={{ fontSize: 12, color: "#666" }}>
              ({item.price_type || "N/A"})
            </div>
          </div>
        ) : (
          <div style={{ color: "#a00" }}>No price set</div>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span>Unit: {item.unit}</span>
        <span>{low ? "Low stock" : `Stock: ${item.stock_qty}`}</span>
      </div>

      <p style={{ fontSize: 12, color: "#444" }}>
        {item.description?.slice(0, 100)}
      </p>

      <button onClick={handleAdd} disabled={adding || item.price == null}>
        {adding ? "Adding..." : "Add to Cart"}
      </button>
    </div>
  );
}

const card = {
  border: "1px solid #eee",
  borderRadius: 10,
  padding: 12,
  display: "flex",
  flexDirection: "column",
  gap: 6,
};






