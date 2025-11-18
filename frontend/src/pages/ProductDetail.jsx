import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import client from "../api/client";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const { data } = await client.get(`/materials/${id}/`);
        if (!mounted) return;
        setProduct(data);
      } catch (e) {
        console.error("Failed to load product", e);
        setErr("Failed to load product details");
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false };
  }, [id]);

  if (loading) return <div style={{ padding: 16 }}>Loading product…</div>;
  if (err) return <div style={{ padding: 16, color: 'red' }}>{err}</div>;
  if (!product) return <div style={{ padding: 16 }}>Product not found.</div>;

  return (
    <div style={{ padding: 16, maxWidth: 900, margin: '0 auto' }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: 12 }}>← Back</button>
      <h1>{product.title}</h1>
      <div style={{ color: '#666', marginBottom: 12 }}>SKU: {product.sku} • Category: {product.category_name ?? product.category?.name}</div>
      <div style={{ display: 'flex', gap: 20 }}>
        <div style={{ flex: 1 }}>
          <div style={{ padding: 12, border: '1px solid #eee', borderRadius: 8 }}>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Rs {Number(product.price_retail ?? product.price_wholesale ?? product.min_price ?? 0).toLocaleString()}</div>
            <div style={{ color: '#666' }}>Unit: {product.unit}</div>
            <div style={{ color: '#666', marginTop: 8 }}>Stock: {product.stock_qty}</div>
            <div style={{ marginTop: 12 }}>{product.description}</div>
          </div>
        </div>
        <div style={{ width: 300 }}>
          <div style={{ padding: 12, border: '1px solid #eee', borderRadius: 8 }}>
            <h3>Details</h3>
            <div><b>Brand:</b> {product.brand || '-'}</div>
            <div><b>Unit:</b> {product.unit}</div>
            <div><b>SKU:</b> {product.sku}</div>
            <div style={{ marginTop: 8 }}>
              <button onClick={() => navigate('/cart')} style={{ width: '100%', padding: 10, background: '#4CAF50', color: 'white', borderRadius: 6 }}>Go to Cart</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
