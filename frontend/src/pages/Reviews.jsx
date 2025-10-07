import { useEffect, useState } from "react";
import client from "../api/client";
import Stars from "../components/Stars";

export default function Reviews() {
  const [orders, setOrders] = useState([]);   // orders eligible to review (simple: my orders)
  const [reviews, setReviews] = useState([]);
  const [form, setForm] = useState({ order: "", rating: 0, comment: "" });

  const load = async () => {
    const [o, r] = await Promise.all([
      client.get("/orders/"),        // you may filter delivered on backend later
      client.get("/reviews/mine/"),
    ]);
    setOrders(o.data);
    setReviews(r.data);
  };

  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.order || form.rating < 1) return alert("Select order and rating");
    await client.post("/reviews/", form);
    setForm({ order: "", rating: 0, comment: "" });
    await load();
  };

  const alreadyReviewed = new Set(reviews.map(x => x.order));

  return (
    <div style={{ padding: 16 }}>
      <h1>My Reviews</h1>

      <form onSubmit={submit} style={{ display:"grid", gridTemplateColumns:"200px 1fr 120px", gap: 8, alignItems:"center", maxWidth: 800 }}>
        <select value={form.order} onChange={e=>setForm({...form, order:Number(e.target.value)})} required>
          <option value="">Select Order</option>
          {orders.map(o => (
            <option key={o.id} value={o.id} disabled={alreadyReviewed.has(o.id)}>
              #{o.id} • Total Rs {Number(o.total||0).toLocaleString()} • {o.status}
            </option>
          ))}
        </select>

        <div>
          <Stars value={form.rating} onChange={(n)=>setForm({...form, rating:n})} />
          <input
            placeholder="Write a short comment (optional)"
            value={form.comment}
            onChange={e=>setForm({...form, comment:e.target.value})}
            style={{ width:"100%", marginTop: 6 }}
          />
        </div>

        <button type="submit">Submit Review</button>
      </form>

      <h3 style={{ marginTop: 16 }}>Your Past Reviews</h3>
      {reviews.length === 0 ? <p>No reviews yet.</p> : (
        <ul>
          {reviews.map(r => (
            <li key={r.id}>
              Order #{r.order}: {Array.from({length:r.rating}).map((_,i)=>"★").join("")}
              {"  "} — {r.comment || "(no comment)"}  •  Rs {Number(r.order_total||0).toLocaleString()}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
