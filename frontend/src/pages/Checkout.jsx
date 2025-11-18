import { useContext, useState } from "react";
import client from "../api/client";
import { CartContext } from "../context/CartContext";
import { useNavigate, useLocation } from "react-router-dom";

export default function Checkout() {
  const { items, load } = useContext(CartContext);
  const navigate = useNavigate();
  const location = useLocation();
  const selectedIds = location.state?.selectedIds || [];
  
  const [form, setForm] = useState({ line1: "", city: "", state: "", zip: "", phone: "" });
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");

  // Filter items that were selected
  const selectedItems = items.filter(x => selectedIds.includes(x.id));
  const selectedTotal = selectedItems.reduce((sum, x) => sum + (x.line_total || 0), 0);
  const DELIVERY_CHARGES = 500; // Rs 500 delivery charges
  const finalTotal = selectedTotal + DELIVERY_CHARGES;

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    if (!form.line1 || !form.city || !form.phone) {
      setError("Please fill in all required fields");
      return;
    }
    setError("");
    setShowPayment(true);
  };

  const placeOrder = async (e) => {
    e.preventDefault();
    setError("");
    setPlacing(true);
    try {
      const { data } = await client.post("/orders/checkout/", {
        address: form,
        cart_item_ids: selectedIds,  // Pass selected item IDs to backend
        payment_method: paymentMethod,
        delivery_charges: DELIVERY_CHARGES
      });
      setOrder(data);           // show confirmation
      await load();             // reload cart (selected items removed)
      // After placing the order, navigate to My Orders so the new order appears there
      navigate("/orders");
    } catch (err) {
      console.error(err);
      // Show detailed server message when available to aid debugging
      const respData = err?.response?.data;
      let msg = "Failed to place order";
      if (respData) {
        if (typeof respData.detail === "string") msg = respData.detail;
        else msg = JSON.stringify(respData);
      }
      setError(msg);
    } finally {
      setPlacing(false);
    }
  };

  if (selectedItems.length === 0 && !order) {
    return (
      <div style={{ padding: 16 }}>
        <h1>Checkout</h1>
        <p>No items selected. Please go back to your cart and select items to checkout.</p>
        <button onClick={() => navigate("/cart")}>← Back to Cart</button>
      </div>
    );
  }

  if (order) {
    return (
      <div style={{ padding: 16, maxWidth: 800, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <div style={{ fontSize: 48, marginBottom: 10 }}>✅</div>
          <h1>Order Placed Successfully!</h1>
        </div>
        <div style={{ backgroundColor: "#f9f9f9", padding: 16, borderRadius: 8, marginBottom: 20 }}>
          <p><b>Order ID:</b> #{order.id}</p>
          <p><b>Status:</b> {order.status}</p>
          <p><b>Delivery Address:</b> {order.address}</p>
          <p><b>Payment Method:</b> {paymentMethod === "card" ? "Credit/Debit Card" : "Cash on Delivery"}</p>
        </div>
        <h3 style={{ marginTop: 20 }}>📦 Order Items</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
          <thead>
            <tr style={{ backgroundColor: "#f5f5f5", borderBottom: "2px solid #ddd" }}>
              <th align="left" style={{ padding: 12 }}>Item</th>
              <th align="center" style={{ padding: 12 }}>Qty</th>
              <th align="right" style={{ padding: 12 }}>Price</th>
              <th align="right" style={{ padding: 12 }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((it, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: 12 }}>
                  <div><b>{it.material_title || it.title || "-"}</b></div>
                  <div style={{ color: "#666", fontSize: 12 }}>SKU: {it.material_sku || it.sku || "-"}</div>
                </td>
                <td align="center" style={{ padding: 12 }}>{it.qty}</td>
                <td align="right" style={{ padding: 12 }}>Rs {Number(it.price).toLocaleString()}</td>
                <td align="right" style={{ padding: 12, fontWeight: "bold", color: "#d32f2f" }}>Rs {Number(it.line_total).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ textAlign: "right", backgroundColor: "#f9f9f9", padding: 16, borderRadius: 8, marginBottom: 20 }}>
          <div style={{ fontSize: 16, marginBottom: 8 }}>
            <b>Subtotal:</b> Rs {Number(order.subtotal).toLocaleString()}
          </div>
          <div style={{ fontSize: 16, marginBottom: 8 }}>
            <b>Delivery Charges:</b> Rs {DELIVERY_CHARGES.toLocaleString()}
          </div>
          <div style={{ fontSize: 16, marginBottom: 8 }}>
            <b>Tax:</b> Rs {Number(order.tax).toLocaleString()}
          </div>
          <div style={{ fontSize: 20, color: "#4CAF50", fontWeight: "bold", paddingTop: 8, borderTop: "2px solid #ddd" }}>
            <b>Total:</b> Rs {Number(order.total).toLocaleString()}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button 
            onClick={() => navigate("/orders")}
            style={{ flex: 1, padding: 12, backgroundColor: "#4CAF50", color: "white", border: "none", borderRadius: 4, fontSize: 16, fontWeight: "bold", cursor: "pointer" }}
          >
            📋 View My Orders
          </button>
          <button 
            onClick={() => navigate("/catalog")}
            style={{ flex: 1, padding: 12, backgroundColor: "#2196F3", color: "white", border: "none", borderRadius: 4, fontSize: 16, fontWeight: "bold", cursor: "pointer" }}
          >
            🛍️ Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, maxWidth: 800, margin: "0 auto" }}>
      <h1>📍 Checkout</h1>
      
      <div style={{ backgroundColor: "#f9f9f9", padding: 16, borderRadius: 8, marginBottom: 20 }}>
        <h3 style={{ marginTop: 0 }}>Order Summary</h3>
        <div style={{ fontSize: 16, marginBottom: 8 }}>
          <b>Items Selected:</b> {selectedItems.length}
        </div>
        <table style={{ width: "100%", fontSize: 14, marginBottom: 16 }}>
          <tbody>
            <tr>
              <td><b>Subtotal:</b></td>
              <td align="right">Rs {Number(selectedTotal).toLocaleString()}</td>
            </tr>
            <tr style={{ borderTop: "1px solid #ddd", paddingTop: 8 }}>
              <td><b>Delivery Charges:</b></td>
              <td align="right">Rs {DELIVERY_CHARGES.toLocaleString()}</td>
            </tr>
            <tr style={{ borderTop: "1px solid #ddd", fontWeight: "bold", fontSize: 16, color: "#d32f2f" }}>
              <td><b>Final Total:</b></td>
              <td align="right">Rs {Number(finalTotal).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {!showPayment ? (
        <form onSubmit={handleAddressSubmit} style={{ backgroundColor: "white", padding: 16, borderRadius: 8, border: "1px solid #ddd" }}>
          <h3 style={{ marginTop: 0 }}>📮 Shipping Address</h3>
          
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>Address Line *</label>
            <input
              placeholder="Street address"
              value={form.line1}
              onChange={e => setForm({ ...form, line1: e.target.value })}
              required
              style={{ width: "100%", padding: 10, borderRadius: 4, border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box" }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>City *</label>
            <input
              placeholder="City"
              value={form.city}
              onChange={e => setForm({ ...form, city: e.target.value })}
              required
              style={{ width: "100%", padding: 10, borderRadius: 4, border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>State</label>
              <input
                placeholder="State"
                value={form.state}
                onChange={e => setForm({ ...form, state: e.target.value })}
                style={{ width: "100%", padding: 10, borderRadius: 4, border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box" }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>ZIP Code</label>
              <input
                placeholder="ZIP"
                value={form.zip}
                onChange={e => setForm({ ...form, zip: e.target.value })}
                style={{ width: "100%", padding: 10, borderRadius: 4, border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box" }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>Phone Number *</label>
            <input
              placeholder="Phone number"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              required
              style={{ width: "100%", padding: 10, borderRadius: 4, border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box" }}
            />
          </div>

          {error && <div style={{ color: "red", marginBottom: 16, padding: 12, backgroundColor: "#ffebee", borderRadius: 4 }}>❌ {error}</div>}

          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={() => navigate("/cart")}
              style={{ flex: 1, padding: 12, backgroundColor: "#f5f5f5", border: "1px solid #ddd", borderRadius: 4, fontSize: 16, fontWeight: "bold", cursor: "pointer" }}
            >
              ← Back to Cart
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: 12,
                backgroundColor: "#F97316",
                color: "white",
                border: "none",
                borderRadius: 4,
                fontSize: 16,
                fontWeight: "bold",
                cursor: "pointer"
              }}
            >
              Continue to Payment →
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={placeOrder} style={{ backgroundColor: "white", padding: 16, borderRadius: 8, border: "1px solid #ddd" }}>
          <h3 style={{ marginTop: 0 }}>💳 Payment Method</h3>
          
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "flex", alignItems: "center", padding: 16, border: "2px solid " + (paymentMethod === "card" ? "#F97316" : "#ddd"), borderRadius: 8, cursor: "pointer", marginBottom: 12, backgroundColor: paymentMethod === "card" ? "#fff7ed" : "white" }}>
              <input
                type="radio"
                name="payment"
                value="card"
                checked={paymentMethod === "card"}
                onChange={(e) => setPaymentMethod(e.target.value)}
                style={{ marginRight: 12, width: 20, height: 20, cursor: "pointer" }}
              />
              <div>
                <div style={{ fontWeight: "bold", fontSize: 16 }}>💳 Credit/Debit Card</div>
                <div style={{ color: "#666", fontSize: 14 }}>Pay securely with your credit or debit card</div>
              </div>
            </label>

            <label style={{ display: "flex", alignItems: "center", padding: 16, border: "2px solid " + (paymentMethod === "cod" ? "#F97316" : "#ddd"), borderRadius: 8, cursor: "pointer", backgroundColor: paymentMethod === "cod" ? "#fff7ed" : "white" }}>
              <input
                type="radio"
                name="payment"
                value="cod"
                checked={paymentMethod === "cod"}
                onChange={(e) => setPaymentMethod(e.target.value)}
                style={{ marginRight: 12, width: 20, height: 20, cursor: "pointer" }}
              />
              <div>
                <div style={{ fontWeight: "bold", fontSize: 16 }}>🚚 Cash on Delivery</div>
                <div style={{ color: "#666", fontSize: 14 }}>Pay when your order arrives at your doorstep</div>
              </div>
            </label>
          </div>

          {paymentMethod === "card" && (
            <div style={{ backgroundColor: "#f0f9ff", padding: 12, borderRadius: 8, marginBottom: 20, fontSize: 14 }}>
              <strong>Note:</strong> Card payment integration coming soon. For now, use Cash on Delivery.
            </div>
          )}

          <div style={{ backgroundColor: "#f9f9f9", padding: 16, borderRadius: 8, marginBottom: 20 }}>
            <div style={{ fontSize: 16, marginBottom: 8 }}>
              <b>Order Total: Rs {Number(finalTotal).toLocaleString()}</b>
            </div>
            <div style={{ fontSize: 14, color: "#666" }}>
              Including Rs {DELIVERY_CHARGES} delivery charges
            </div>
          </div>

          {error && <div style={{ color: "red", marginBottom: 16, padding: 12, backgroundColor: "#ffebee", borderRadius: 4 }}>❌ {error}</div>}

          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={() => setShowPayment(false)}
              style={{ flex: 1, padding: 12, backgroundColor: "#f5f5f5", border: "1px solid #ddd", borderRadius: 4, fontSize: 16, fontWeight: "bold", cursor: "pointer" }}
            >
              ← Back
            </button>
            <button
              type="submit"
              disabled={placing}
              style={{
                flex: 1,
                padding: 12,
                backgroundColor: placing ? "#ccc" : "#4CAF50",
                color: "white",
                border: "none",
                borderRadius: 4,
                fontSize: 16,
                fontWeight: "bold",
                cursor: placing ? "not-allowed" : "pointer"
              }}
            >
              {placing ? "⏳ Placing Order..." : "✓ Place Order"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
