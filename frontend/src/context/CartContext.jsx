import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import client from "../api/client";
import { AuthContext } from "./AuthContext";

export const CartContext = createContext(null);

export default function CartProvider({ children }) {
  const { tokens } = useContext(AuthContext);
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({ count: 0, subtotal: 0 });

  // load optionally accepts a category slug to request server-side filtered cart
  const load = useCallback(async (category = "") => {
    if (!tokens?.access) { setItems([]); setSummary({ count: 0, subtotal: 0 }); return; }
    const params = category ? { params: { category } } : {};
    const [listRes, sumRes] = await Promise.all([
      client.get("/cart/", params),
      client.get("/cart/summary/", params),
    ]);
    // DRF may return a paginated response {count, next, previous, results: [...]}
    const listData = listRes?.data?.results ?? listRes?.data ?? [];
    setItems(Array.isArray(listData) ? listData : []);
    setSummary(sumRes?.data ?? { count: 0, subtotal: 0 });
  }, [tokens]);

  useEffect(() => { load(); }, [load]);

  const add = useCallback(async (materialId, qty = 1) => {
    try {
      await client.post("/cart/", { material: materialId, qty });
      await load();
    } catch (err) {
      const data = err?.response?.data;
      const msg = data?.detail ? data.detail : (data ? JSON.stringify(data) : err.message);
      const e = new Error(msg);
      e.original = err;
      throw e;
    }
  }, [load]);

  const updateQty = useCallback(async (id, qty) => {
    await client.patch(`/cart/${id}/`, { qty });
    await load();
  }, [load]);

  const remove = useCallback(async (id) => {
    await client.delete(`/cart/${id}/`);
    await load();
  }, [load]);

  const value = useMemo(() => ({
    items, summary, load, add, updateQty, remove
  }), [items, summary, add, updateQty, remove, load]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
