import { useEffect, useState } from "react";
import client from "../api/client";

export default function CategoryFilter({ value, onChange }) {
  const [cats, setCats] = useState([]);

  useEffect(() => {
    (async () => {
      const { data } = await client.get("/categories/");
      setCats(data);
    })();
  }, []);

  return (
    <div style={{ margin: "12px 0", display: "flex", gap: 8 }}>
      <select value={value} onChange={e => onChange(e.target.value)}>
        <option value="">All categories</option>
        {cats.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
      </select>
      {value && <button onClick={() => onChange("")}>Clear</button>}
    </div>
  );
}
