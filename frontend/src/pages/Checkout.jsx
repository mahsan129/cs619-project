import { useContext, useState } from "react";
import client from "../api/client";
import { CartContext } from "../context/CartContext";
import { useNavigate } from "react-router-dom";

export default function Checkout() {
  const { items, summary, load } = useContext(CartContext);
  const navigate = useNavigate();
  const [form, setForm] = useState({ line1: "", city: "", state: "", zip: "", phone: "" });
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState(null);

  const placeOrder = async (e) => {
    e.preventDefault();
    setError("");
    setPlacing(true);
    try {
      const { data } = await client.post("/orders/checkout/", { address: form });
      setOrder(data);           // show confirmation
      await load();             // cart cleared
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.detail || "Failed to place order";
      setError(
        typeof msg === "string" ? msg : "Checkout error"
      );
    } finally {
      setPlacing(false);
    }
  };

  if (order) {
    return (
      <div style={{ padding: 16 }}>
        <h1>Order Placed ✅</h1>
        <p><b>Order #</b> {order.id}</p>
        <p><b>Status:</b> {order.status}</p>
        <p><b>Address:</b> {order.address}</p>
        <h3>Items</h3>
        <ul>
          {order.items.map((it, i) => (
            <li key={i}>
              {it.title} ({it.sku}) — {it.qty} × Rs {Number(it.price).toLocaleString()} = Rs {Number(it.line_total).toLocaleString()}
            </li>
          ))}
        </ul>
        <h3>Total: Rs {Number(order.total).toLocaleString()}</h3>
        <button onClick={() => navigate("/orders")}>Go to My Orders</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <h1>Checkout</h1>
      {items.length === 0 ? (
        <p>Your cart is empty. Go to Catalog to add items.</p>
      ) : (
        <>
          <h3>Cart Summary</h3>
          <p><b>Items:</b> {items.length} &nbsp; <b>Subtotal:</b> Rs {Number(summary.subtotal || 0).toLocaleString()}</p>

          <form onSubmit={placeOrder} className="card" style={{ maxWidth: 520 }}>
            <input placeholder="Address line" value={form.line1} onChange={e=>setForm({...form, line1:e.target.value})} required />
            <input placeholder="City" value={form.city} onChange={e=>setForm({...form, city:e.target.value})} required />
            <input placeholder="State" value={form.state} onChange={e=>setForm({...form, state:e.target.value})} />
            <input placeholder="ZIP" value={form.zip} onChange={e=>setForm({...form, zip:e.target.value})} />
            <input placeholder="Phone" value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} required />
            <button type="submit" disabled={placing}>{placing ? "Placing…" : "Place Order"}</button>
            {error && <p style={{ color: "red" }}>{error}</p>}
          </form>
        </>
      )}
    </div>
  );
}
