
// frontend/src/pages/Landing.jsx
import React, { useContext, useEffect } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "./Landing.css";


export default function Landing() {
  const { user, loadingMe } = useContext(AuthContext);
  if (loadingMe) return <div style={{ padding: 20 }}>Loading...</div>;

  return (
    <div className="landing">
      {/* ✅ Single, fixed navbar */}
      <header className="navbar">
        <div className="brand">ASBuild<span>Mart</span></div>

        {/* ⬇️ inner <nav> ko <div> kar diya */}
        <div className="links">
          <Link to="/catalog">Products</Link>
          <a href="#suppliers">Suppliers</a>
          <a href="#bulk">Bulk Orders</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </div>

        <div className="auth">
          <Link className="btn" to="/login">Login</Link>
          <Link className="btn" to="/register">Register</Link>
        </div>
      </header>
      {/* ─── Hero ───────────────────────────────── */}
      <section className="hero">
        <div className="overlay"></div>
        <div className="container hero-inner">
          <h1>
            Your One-Stop <span>Construction Materials</span> Marketplace
          </h1>
          <p className="hero-sub">
            Connect with trusted suppliers, get competitive prices, and
            streamline your construction procurement process.
          </p>
          <div className="cta">
            <Link className="btn lg" to="/catalog">
              Browse Products
            </Link>
            <Link className="btn lg alt" to="/bids">
              Become a Supplier
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Popular Categories ─────────────────── */}
      <section id="products" className="section">
        <div className="container">
          <h2 className="section-title">Popular Categories</h2>
          <div className="grid cards-4">
            {[
              { img: "/images/cement.png", name: "Cement", count: "200+" },
              { img: "/images/steel.png", name: "Steel", count: "150+" },
              { img: "/images/bricks.png", name: "Bricks", count: "80+" },
              { img: "/images/tiles.png", name: "Tiles", count: "120+" },
            ].map((c) => (
              <div className="card cat" key={c.name}>
                <img src={c.img} alt={c.name} />
                <h3>{c.name}</h3>
                <p>{c.count} Products</p>
                <Link
                  className="btn sm "
                  to={`/catalog?category=${c.name.toLowerCase()}`}
                >
                  View All
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Featured Products ──────────────────── */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">Featured Products</h2>
        </div>
        <div className="container">
          <div className="grid cards-4">
            {[
              {
                img: "/images/askari-cement.jpg",
                title: "Askari Cement (50kg)",
                price: "Rs 450/bag",
              },
              {
                img: "/images/tmt-bars.jpg",
                title: "TMT Steel Bars (12mm)",
                price: "Rs 242/kg",
              },
              {
                img: "/images/clay-brick.jpg",
                title: "Clay Bricks (9x4x3 in)",
                price: "Rs 12/piece",
              },
              {
                img: "/images/vitrified-tiles.jpg",
                title: "Vitrified Tiles (2x2 ft)",
                price: "Rs 155/sq.ft",
              },
            ].map((p) => (
              <div className="card prod" key={p.title}>
                <img src={p.img} alt={p.title} />
                <h3>{p.title}</h3>
                <p className="price">{p.price}</p>
                <Link className="btn sm" to="/catalog">
                  Add to Cart
                </Link>
              </div>
            ))}
          </div>

          <div className="center mt-24">
            <Link className="btn sm" to="/catalog">
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* ─── How It Works ───────────────────────── */}
      <section id="bulk" className="section light">
        <div className="container">
          <h2 className="section-title">How It Works</h2>
          <p className="section-sub">
            The 3-step process for quick order booking with easy options.
          </p>

          <div className="grid cards-3">
            {[
              {
                img: "/images/process-buy.jpg",
                title: "Buy",
                desc: "Select materials, compare prices, and add to cart or create a bulk request.",
              },
              {
                img: "/images/process-process.jpg",
                title: "Process",
                desc: "We validate availability, confirm pricing, and schedule delivery.",
              },
              {
                img: "/images/process-deliver.jpg",
                title: "Deliver",
                desc: "Trusted logistics deliver your materials safely to your site.",
              },
            ].map((s) => (
              <div className="card process" key={s.title}>
                <img src={s.img} alt={s.title} />
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────── */}
      <footer id="contact" className="footer">
        <div className="container grid footer-grid">
          <div>
            <h4>CONSTRUCTION BAZAAR</h4>
            <p>
              3rd Floor, LS-30, Federal B Area
              <br />
              Block 13 Gulberg Town, Karachi, Pakistan.
            </p>
          </div>

          <div>
            <h4>COMPANY</h4>
            <ul className="list">
              <li>
                <Link to="/about">About Us</Link>
              </li>
              <li>
                <Link to="/blog">Blog</Link>
              </li>
            </ul>
          </div>

          <div>
            <h4>Need Help?</h4>
            <p>
              +92 331 0160434
              <br />
              <a href="mailto:info@constructionbaazar.com">
                info@constructionbaazar.com
              </a>
            </p>
          </div>
        </div>

        <div className="container footer-bottom">
          <p>
            Copyright © {new Date().getFullYear()} Construction Bazaar
          </p>
        </div>
      </footer>
    </div>
  );
}
