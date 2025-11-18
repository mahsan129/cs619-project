import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import client from "../api/client";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { user, tokens, loadProfile } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const navigate = useNavigate();

  const isWholesaler = user?.role === "WHOLESALER";
  const isAdmin = user?.role === "ADMIN" || user?.is_staff;

  // Calculate stats based on role
  const getStats = () => {
    if (isWholesaler || isAdmin) {
      // Supplier perspective: orders received from buyers
      const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
      const totalProducts = materials.length;
      const totalInventory = materials.reduce((sum, m) => sum + (Number(m.stock_qty) || 0), 0);
      const lowStockCount = materials.filter(m => (Number(m.stock_qty) || 0) < (Number(m.min_stock) || 5)).length;

      return {
        totalOrders: orders.length,
        totalRevenue: totalRevenue,
        avgOrderValue: orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0,
        totalProducts: totalProducts,
        totalInventory: totalInventory,
        lowStockCount: lowStockCount,
        pendingOrders: orders.filter(o => o.status === "PLACED").length,
        confirmedOrders: orders.filter(o => o.status === "CONFIRMED").length,
        dispatchedOrders: orders.filter(o => o.status === "DISPATCHED").length,
        deliveredOrders: orders.filter(o => o.status === "DELIVERED").length,
      };
    } else {
      // Customer perspective
      return {
        totalOrders: orders.length,
        totalSpent: orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0),
        avgOrderValue: orders.length > 0 ? Math.round(orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0) / orders.length) : 0,
        placedOrders: orders.filter(o => o.status === "PLACED").length,
        confirmedOrders: orders.filter(o => o.status === "CONFIRMED").length,
        deliveredOrders: orders.filter(o => o.status === "DELIVERED").length,
      };
    }
  };

  const stats = getStats();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        if (!user && typeof loadProfile === "function") {
          await loadProfile();
        }
        const { data } = await client.get("/orders/");
        setOrders(Array.isArray(data) ? data : data.results ?? data);

        // Load materials for wholesaler/admin inventory stats
        if (isWholesaler || isAdmin) {
          try {
            const { data: matData } = await client.get("/materials/");
            setMaterials(Array.isArray(matData) ? matData : matData.results ?? matData);
          } catch (e) {
            console.error("Failed to load materials", e);
          }
        }
      } catch (e) {
        console.error("Failed to load dashboard orders", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [tokens]);

  const toggleDetails = async (id) => {
    if (expanded[id]) {
      setExpanded((s) => { const n = { ...s }; delete n[id]; return n; });
      return;
    }
    try {
      const { data } = await client.get(`/orders/${id}/`);
      setExpanded((s) => ({ ...s, [id]: data }));
    } catch (e) {
      console.error("Failed to fetch order items", e);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "PLACED": return "#FF9800";
      case "CONFIRMED": return "#2196F3";
      case "DISPATCHED": return "#9C27B0";
      case "DELIVERED": return "#4CAF50";
      default: return "#999";
    }
  };

  return (
    <div style={{ padding: 0, background: "#f5f5f5", minHeight: "100vh" }}>
      {/* Header - Different for Wholesaler */}
      {isAdmin ? (
        <div style={{ background: "linear-gradient(135deg, #ff8a00 0%, #37474f 100%)", color: "white", padding: 32, textAlign: "center" }}>
          <h1 style={{ margin: 0, fontSize: 32 }}>Welcome, Admin {user?.username}! 🔧</h1>
          <p style={{ margin: "8px 0 0", opacity: 0.95 }}>Overview of platform activity and management tools</p>
        </div>
      ) : isWholesaler ? (
        <div style={{ background: "linear-gradient(135deg, #00897b 0%, #004d40 100%)", color: "white", padding: 32, textAlign: "center" }}>
          <h1 style={{ margin: 0, fontSize: 32 }}>Welcome, Supplier {user?.username}! 🏢</h1>
          <p style={{ margin: "8px 0 0", opacity: 0.9 }}>Manage your supply orders and inventory</p>
        </div>
      ) : (
        <div style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white", padding: 32, textAlign: "center" }}>
          <h1 style={{ margin: 0, fontSize: 32 }}>Welcome, {user?.username}! 👋</h1>
          <p style={{ margin: "8px 0 0", opacity: 0.9 }}>Role: <b>{user?.role || "CUSTOMER"}</b></p>
        </div>
      )}

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: 24 }}>
        {/* Profile Card */}
        <div style={{ background: "white", padding: 20, borderRadius: 12, marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          <h2 style={{ margin: "0 0 16px", fontSize: 18, color: "#333" }}>📋 Profile Information</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            <div><b style={{ color: isWholesaler ? "#00897b" : "#667eea" }}>Username:</b> {user?.username}</div>
            <div><b style={{ color: isWholesaler ? "#00897b" : "#667eea" }}>Email:</b> {user?.email}</div>
            <div><b style={{ color: isWholesaler ? "#00897b" : "#667eea" }}>Account Type:</b> {user?.role || "CUSTOMER"}</div>
            {isAdmin ? (
              <>
                <button onClick={() => navigate('/admin')} style={{ padding: "10px 16px", background: "#ff8a00", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>
                  ⚙️ Admin Panel
                </button>
                <button onClick={() => navigate('/users')} style={{ padding: "10px 16px", background: "#37474f", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>
                  👥 Manage Users
                </button>
                <button onClick={() => navigate('/products')} style={{ padding: "10px 16px", background: "#ff8a00", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>
                  🛒 Manage Products
                </button>
              </>
            ) : isWholesaler ? (
              <>
                <button onClick={() => navigate('/wholesaler/inventory')} style={{ padding: "10px 16px", background: "#00897b", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>
                  📦 Manage Inventory
                </button>
                <button onClick={() => navigate('/orders')} style={{ padding: "10px 16px", background: "#00897b", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>
                  📋 View Supply Orders
                </button>
              </>
            ) : (
              <button onClick={() => navigate('/orders')} style={{ padding: "10px 16px", background: "#667eea", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>
                📦 View All Orders
              </button>
            )}
          </div>
        </div>

        {/* Admin KPI Cards */}
        {isAdmin && orders.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
            <div style={{ background: "white", padding: 20, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.12)", borderLeft: "4px solid #ff8a00" }}>
              <div style={{ fontSize: 12, color: "#999" }}>Total Orders</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#ff8a00" }}>{stats.totalOrders}</div>
              <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>across platform</div>
            </div>
            <div style={{ background: "white", padding: 20, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.12)", borderLeft: "4px solid #37474f" }}>
              <div style={{ fontSize: 12, color: "#999" }}>Total Revenue</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#37474f" }}>Rs {stats.totalRevenue?.toLocaleString?.() ?? 0}</div>
              <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>platform-wide</div>
            </div>
            <div style={{ background: "white", padding: 20, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.12)", borderLeft: "4px solid #FF9800" }}>
              <div style={{ fontSize: 12, color: "#999" }}>Avg Order Value</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#FF9800" }}>Rs {stats.avgOrderValue.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>platform average</div>
            </div>
            <div style={{ background: "white", padding: 20, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.12)", borderLeft: "4px solid #2196F3" }}>
              <div style={{ fontSize: 12, color: "#999" }}>Products</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#2196F3" }}>{stats.totalProducts}</div>
              <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>listed</div>
            </div>
          </div>
        )}

        {/* Wholesaler Supplier KPI Cards */}
        {isWholesaler && orders.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
            <div style={{ background: "white", padding: 20, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.1)", borderLeft: "4px solid #00897b" }}>
              <div style={{ fontSize: 12, color: "#999" }}>Supply Orders</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#00897b" }}>{stats.totalOrders}</div>
              <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>orders received</div>
            </div>
            <div style={{ background: "white", padding: 20, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.1)", borderLeft: "4px solid #4CAF50" }}>
              <div style={{ fontSize: 12, color: "#999" }}>Total Revenue</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#4CAF50" }}>Rs {stats.totalRevenue.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>from supplies</div>
            </div>
            <div style={{ background: "white", padding: 20, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.1)", borderLeft: "4px solid #FF9800" }}>
              <div style={{ fontSize: 12, color: "#999" }}>Avg Order Value</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#FF9800" }}>Rs {stats.avgOrderValue.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>per order</div>
            </div>
            <div style={{ background: "white", padding: 20, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.1)", borderLeft: "4px solid #2196F3" }}>
              <div style={{ fontSize: 12, color: "#999" }}>Products</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#2196F3" }}>{stats.totalProducts}</div>
              <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>in inventory</div>
            </div>
          </div>
        )}

        {/* Wholesaler Inventory Status */}
        {isWholesaler && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
            <div style={{ background: "white", padding: 20, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.1)", borderLeft: "4px solid #9C27B0" }}>
              <div style={{ fontSize: 12, color: "#999" }}>Total Stock Units</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#9C27B0" }}>{stats.totalInventory}</div>
              <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>across all items</div>
            </div>
            <div style={{ background: stats.lowStockCount > 0 ? "white" : "#f5f5f5", padding: 20, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.1)", borderLeft: `4px solid ${stats.lowStockCount > 0 ? "#F44336" : "#ccc"}` }}>
              <div style={{ fontSize: 12, color: "#999" }}>Low Stock Alerts</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: stats.lowStockCount > 0 ? "#F44336" : "#999" }}>{stats.lowStockCount}</div>
              <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>products need restocking</div>
              {stats.lowStockCount > 0 && (
                <button onClick={() => navigate('/wholesaler/inventory')} style={{ marginTop: 12, padding: "6px 12px", background: "#F44336", color: "white", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
                  View & Restock
                </button>
              )}
            </div>
          </div>
        )}

        {/* Wholesaler Order Status Breakdown */}
        {isWholesaler && orders.length > 0 && (
          <div style={{ background: "white", padding: 20, borderRadius: 12, marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
            <h2 style={{ margin: "0 0 16px", fontSize: 18, color: "#333" }}>📊 Supply Order Status</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
              {[
                { label: "Pending", count: stats.pendingOrders, color: "#FF9800", emoji: "⏳" },
                { label: "Confirmed", count: stats.confirmedOrders, color: "#2196F3", emoji: "✅" },
                { label: "Dispatched", count: stats.dispatchedOrders, color: "#9C27B0", emoji: "🚚" },
                { label: "Delivered", count: stats.deliveredOrders, color: "#4CAF50", emoji: "📦" },
              ].map((s, i) => (
                <div key={i} style={{ padding: 12, background: `${s.color}15`, borderLeft: `4px solid ${s.color}`, borderRadius: 6 }}>
                  <div style={{ fontSize: 12, color: "#666" }}>{s.emoji} {s.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.count}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Customer KPI Cards */}
        {!isWholesaler && !isAdmin && orders.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
            <div style={{ background: "white", padding: 20, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.1)", borderLeft: "4px solid #667eea" }}>
              <div style={{ fontSize: 12, color: "#999" }}>Total Orders</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#667eea" }}>{stats.totalOrders}</div>
            </div>
            <div style={{ background: "white", padding: 20, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.1)", borderLeft: "4px solid #4CAF50" }}>
              <div style={{ fontSize: 12, color: "#999" }}>Total Spent</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#4CAF50" }}>Rs {stats.totalSpent.toLocaleString()}</div>
            </div>
            <div style={{ background: "white", padding: 20, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.1)", borderLeft: "4px solid #FF9800" }}>
              <div style={{ fontSize: 12, color: "#999" }}>Avg Order Value</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#FF9800" }}>Rs {stats.avgOrderValue.toLocaleString()}</div>
            </div>
            <div style={{ background: "white", padding: 20, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.1)", borderLeft: "4px solid #2196F3" }}>
              <div style={{ fontSize: 12, color: "#999" }}>Delivered</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#2196F3" }}>{stats.deliveredOrders}</div>
            </div>
          </div>
        )}

        {/* Customer Status Breakdown */}
        {!isWholesaler && !isAdmin && orders.length > 0 && (
          <div style={{ background: "white", padding: 20, borderRadius: 12, marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
            <h2 style={{ margin: "0 0 16px", fontSize: 18, color: "#333" }}>📊 Order Status Breakdown</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
              {[
                { label: "Placed", count: stats.placedOrders, color: "#FF9800" },
                { label: "Confirmed", count: stats.confirmedOrders, color: "#2196F3" },
                { label: "Dispatched", count: stats.deliveredOrders, color: "#9C27B0" },
                { label: "Delivered", count: stats.deliveredOrders, color: "#4CAF50" },
              ].map((s, i) => (
                <div key={i} style={{ padding: 12, background: `${s.color}15`, borderLeft: `4px solid ${s.color}`, borderRadius: 6 }}>
                  <div style={{ fontSize: 12, color: "#666" }}>{s.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.count}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Orders / Supply Orders */}
        <div style={{ background: "white", padding: 20, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          <h2 style={{ margin: "0 0 16px", fontSize: 18, color: "#333" }}>
            {isWholesaler ? "📋 Recent Supply Orders" : "📦 Recent Orders"}
          </h2>
          {loading ? (
            <div style={{ textAlign: "center", color: "#999", padding: 32 }}>Loading orders…</div>
          ) : orders.length === 0 ? (
            <div style={{ textAlign: "center", color: "#999", padding: 32 }}>
              {isWholesaler ? "No supply orders yet. Check back soon!" : "No orders yet. Start shopping!"}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {orders.slice(0, 5).map(o => (
                <div key={o.id} style={{ padding: 16, border: "1px solid #eee", borderRadius: 8, backgroundColor: isWholesaler ? "#f0f7f6" : "#fafafa" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Order #{o.id}</div>
                      <div style={{ fontSize: 13, color: "#666", marginBottom: 4 }}>📅 {new Date(o.created_at).toLocaleDateString()}</div>
                      <span style={{ display: "inline-block", padding: "4px 10px", background: getStatusColor(o.status), color: "white", borderRadius: 4, fontSize: 12, fontWeight: 600 }}>
                        {o.status}
                      </span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: isWholesaler ? "#00897b" : "#4CAF50", marginBottom: 8 }}>Rs {Number(o.total).toLocaleString()}</div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => toggleDetails(o.id)} style={{ padding: "6px 12px", background: isWholesaler ? "#00897b" : "#667eea", color: "white", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12 }}>
                          {expanded[o.id] ? "Hide Items" : "View Items"}
                        </button>
                        <button onClick={() => navigate('/orders')} style={{ padding: "6px 12px", background: "#f5f5f5", color: "#333", border: "1px solid #ddd", borderRadius: 4, cursor: "pointer", fontSize: 12 }}>
                          Details
                        </button>
                      </div>
                    </div>
                  </div>

                  {expanded[o.id] && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #ddd" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                        <thead>
                          <tr style={{ backgroundColor: "#f5f5f5" }}>
                            <th style={{ padding: 8, textAlign: "left", fontWeight: 600, borderBottom: "1px solid #ddd" }}>Item</th>
                            <th style={{ padding: 8, textAlign: "center", fontWeight: 600, borderBottom: "1px solid #ddd" }}>Qty</th>
                            <th style={{ padding: 8, textAlign: "right", fontWeight: 600, borderBottom: "1px solid #ddd" }}>Price</th>
                            <th style={{ padding: 8, textAlign: "right", fontWeight: 600, borderBottom: "1px solid #ddd" }}>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {expanded[o.id].items?.map(it => (
                            <tr key={it.id} style={{ borderBottom: "1px solid #eee" }}>
                              <td style={{ padding: 8 }}>{it.material_title || it.title}</td>
                              <td style={{ padding: 8, textAlign: "center" }}>{it.qty}</td>
                              <td style={{ padding: 8, textAlign: "right" }}>Rs {Number(it.price).toLocaleString()}</td>
                              <td style={{ padding: 8, textAlign: "right", fontWeight: 600 }}>Rs {Number(it.line_total).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
