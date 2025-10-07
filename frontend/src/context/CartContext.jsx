import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import client from "../api/client";
import { AuthContext } from "./AuthContext";

export const CartContext = createContext(null);

export default function CartProvider({ children }) {
  const { tokens } = useContext(AuthContext);
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({ count: 0, subtotal: 0 });

  const load = useCallback(async () => {
    if (!tokens?.access) { setItems([]); setSummary({ count: 0, subtotal: 0 }); return; }
    const [listRes, sumRes] = await Promise.all([
      client.get("/cart/"),
      client.get("/cart/summary/"),
    ]);
    setItems(listRes.data);
    setSummary(sumRes.data);
  }, [tokens]);

  useEffect(() => { load(); }, [load]);

  const add = useCallback(async (materialId, qty = 1) => {
    await client.post("/cart/", { material: materialId, qty });
    await load();
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
