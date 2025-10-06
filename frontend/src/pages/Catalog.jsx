import { useEffect, useState } from "react";
import client from "../api/client";
import CategoryFilter from "../components/CategoryFilter";
import ProductCard from "../components/ProductCard";

export default function Catalog() {
  const [items, setItems] = useState([]);
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { data } = await client.get(`/catalog/${slug ? `?category=${slug}` : ""}`);
      setItems(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [slug]);

  return (
    <div style={{ padding: 16 }}>
      <h1>Catalog</h1>
      <CategoryFilter value={slug} onChange={setSlug} />
      {loading ? <p>Loading…</p> : (
        <div style={grid}>
          {items.map(it => <ProductCard key={it.id} item={it} />)}
        </div>
      )}
      {!loading && items.length === 0 && <p>No items found.</p>}
    </div>
  );
}

const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 };
