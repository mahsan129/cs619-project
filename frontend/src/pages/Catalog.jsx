// src/pages/Catalog.jsx
import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import "../styles/Catalog.css";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";

export default function Catalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);

  // Filters + pagination
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("");   // slug backend: e.g. "cement"
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [search, setSearch] = useState("");

  // Load categories from backend on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/categories/");
        const data = Array.isArray(res.data) ? res.data : res.data.results ?? [];
        setCategories(data);
      } catch (err) {
        console.warn("Failed to load categories", err);
      }
    })();
  }, []);

  // 🔁 Load from backend whenever filters change
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, category, minPrice, maxPrice, search]);

  async function load() {
    setLoading(true);
    setError("");

    try {
      const params = { page };

      if (search) params.search = search;
      if (category) params.category = category;         // ?category=<slug>
      if (minPrice) params.min_price = minPrice;        // optional: agar backend support kare
      if (maxPrice) params.max_price = maxPrice;

      // baseURL = "/api", to yeh call karega: GET /api/catalog/
      const res = await api.get("/catalog/", { params });

      const data = res.data.results || res.data; // DRF pagination ko handle karo

      // Serializer: MaterialCatalogSerializer → { id, title, sku, unit, description, price, price_type }
      const mapped = data.map((m) => {
        // prefer retail price if available, otherwise wholesale, otherwise try annotated min_price
        const price = Number(m.price_retail ?? m.price_wholesale ?? m.min_price ?? 0);
        return {
          id: m.id,
          name: m.title,
          sku: m.sku,
          description: m.description || "",
          price,
          unit: m.unit || "bag",
          stock_qty: m.stock_qty,
        };
      });

      setProducts(mapped);
    } catch (err) {
      console.error(err);
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  function handleClearFilters() {
    setCategory("");
    setMinPrice("");
    setMaxPrice("");
    setSearch("");
    setPage(1);
  }

  const { add: addToCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // 🔹 Add to cart using CartContext which syncs with backend
  async function handleAddToCart(productId) {
    if (!user) {
      alert("Please log in to add items to cart");
      return;
    }
    try {
      await addToCart(productId, 1);
      alert("Added to cart!");
    } catch (err) {
      console.error(err);
      // show detailed server error when available
      alert(err?.message || "Failed to add to cart");
    }
  }

  return (
    <div className="catalog-page">
      {/* Header row */}
      <div className="catalog-header-row">
        <div>
          <div className="catalog-breadcrumb">Home / Products</div>
          <h1 className="catalog-title">Cement Products</h1>
          <p className="catalog-subtitle">
            Showing popular cement brands for wholesale &amp; retail buyers.
          </p>
        </div>

        <div className="catalog-header-controls">
          <input
            className="catalog-search"
            placeholder="Search products, brand, grade…"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
          <select
            className="catalog-sort"
            onChange={(e) => {
              // Abhi sirf UI; backend sort add karna ho to yahan se param bhej sakte ho
              console.log("Sort:", e.target.value);
            }}
          >
            <option value="">Sort by: Popularity</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="newest">Newest</option>
          </select>
        </div>
      </div>

      <div className="catalog-layout">
        {/* LEFT FILTERS */}
        <aside className="catalog-filters">
          <h3 className="filters-title">Filters</h3>

          {/* Category filter → single slug */}
          <div className="filter-block">
            <div className="filter-heading">Category</div>

            <label className="filter-check">
              <input
                type="radio"
                name="cat"
                checked={category === ""}
                onChange={() => {
                  setPage(1);
                  setCategory("");
                }}
              />{" "}
              All Categories
            </label>

            {categories.map((cat) => (
              <label key={cat.id} className="filter-check">
                <input
                  type="radio"
                  name="cat"
                  checked={category === cat.slug}
                  onChange={() => {
                    setPage(1);
                    setCategory(cat.slug);
                  }}
                />{" "}
                {cat.name}
              </label>
            ))}
          </div>

          {/* Price range */}
          <div className="filter-block">
            <div className="filter-heading">Price Range (PKR)</div>
            <div className="filter-price-row">
              <input
                className="filter-input"
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => {
                  setPage(1);
                  setMinPrice(e.target.value);
                }}
              />
              <span className="filter-price-sep">-</span>
              <input
                className="filter-input"
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => {
                  setPage(1);
                  setMaxPrice(e.target.value);
                }}
              />
            </div>
          </div>

          {/* Supplier type & rating – abhi purely UI, backend se jab chaho link kar lena */}
          <div className="filter-block">
            <div className="filter-heading">Supplier Type</div>
            <label className="filter-check">
              <input type="checkbox" disabled /> Wholesaler
            </label>
            <label className="filter-check">
              <input type="checkbox" disabled /> Retailer
            </label>
          </div>

          <div className="filter-block">
            <div className="filter-heading">Rating</div>
            <label className="filter-check">
              <input type="checkbox" disabled /> 4★ &amp; Above
            </label>
            <label className="filter-check">
              <input type="checkbox" disabled /> 3★ &amp; Above
            </label>
          </div>

          <button
            className="filter-btn primary"
            onClick={() => {
              // currently filters instantly apply; yeh button cosmetic hai
              load();
            }}
          >
            Apply Filters
          </button>
          <button className="filter-btn secondary" onClick={handleClearFilters}>
            Clear All
          </button>
        </aside>

        {/* RIGHT PRODUCT GRID */}
        <main className="catalog-products">
          {error && <div className="catalog-error">{error}</div>}
          {loading && <div className="catalog-loading">Loading products…</div>}

          {!loading && !error && products.length === 0 && (
            <div className="catalog-empty">No products found.</div>
          )}

          <div className="product-grid">
            {products.map((p) => (
              <div key={p.id} className="product-card">
                <div className="product-image-placeholder">Image</div>

                <div className="product-body">
                  <h3 className="product-name">{p.name}</h3>
                  <p className="product-desc">{p.description}</p>

                  <div className="product-price-row">
                    <div>
                      <div className="product-price">
                        PKR {p.price.toLocaleString()}{" "}
                        <span className="product-unit">/ {p.unit}</span>
                      </div>
                      {p.note && <div className="product-note">{p.note}</div>}
                    </div>
                  </div>

                  <div className="product-actions">
                    <button className="btn-outline" onClick={() => navigate(`/materials/${p.id}`)}>View Details</button>
                    <button
                      className="btn-primary"
                      onClick={() => handleAddToCart(p.id)}
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Simple pagination (abhi hard-coded buttons, backend se total pages aa jaye to enhance kar sakte ho) */}
          <div className="catalog-pagination">
            <button
              className="page-btn"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </button>
            <button className="page-btn active">{page}</button>
            <button className="page-btn" onClick={() => setPage((p) => p + 1)}>
              Next
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
