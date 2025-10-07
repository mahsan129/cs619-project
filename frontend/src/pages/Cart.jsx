import { useContext } from "react";
import { CartContext } from "../context/CartContext";

export default function Cart() {
  const { items, summary, updateQty, remove } = useContext(CartContext);

  return (
    <div style={{ padding: 16 }}>
      <h1>My Cart</h1>
      {items.length === 0 ? <p>Cart is empty.</p> : (
        <>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr><th align="left">Item</th><th>Unit</th><th>Price</th><th>Qty</th><th>Total</th><th></th></tr>
            </thead>
            <tbody>
              {items.map(x => (
                <tr key={x.id} style={{ borderTop: "1px solid #eee" }}>
                  <td>{x.title} <span style={{ color:"#666" }}>({x.sku})</span></td>
                  <td align="center">{x.unit}</td>
                  <td align="right">{x.price != null ? Number(x.price).toLocaleString() : "-"}</td>
                  <td align="center">
                    <input
                      type="number" min="1" value={x.qty}
                      onChange={(e)=>updateQty(x.id, Math.max(1, parseInt(e.target.value||"1",10)))}
                      style={{ width: 60 }}
                    />
                  </td>
                  <td align="right">{x.line_total != null ? Number(x.line_total).toLocaleString() : "-"}</td>
                  <td align="center"><button onClick={()=>remove(x.id)}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 16, textAlign: "right", fontSize: 18 }}>
            <b>Subtotal:</b> Rs {Number(summary.subtotal || 0).toLocaleString()}
          </div>
        </>
      )}
    </div>
  );
}
