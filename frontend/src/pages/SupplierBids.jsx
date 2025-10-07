import { useEffect, useState } from "react";
import client from "../api/client";

export default function SupplierBids() {
  const [openBRs, setOpenBRs] = useState([]); // open bulk requests from all users
  const [myBids, setMyBids] = useState([]);
  const [amounts, setAmounts] = useState({}); // {brId: unit_price}
  const [note, setNote] = useState({}); // {brId: note}
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    // get open bulk-requests (simple: fetch all, filter open)
    const [all, mine] = await Promise.all([
      client.get("/bulk-requests/"),
      client.get("/bids/mine/"),
    ]);
    setOpenBRs(all.data.filter(x=>x.status==="OPEN"));
    setMyBids(mine.data);
    setLoading(false);
  };

  useEffect(()=>{ load(); }, []);

  const placeBid = async (brId) => {
    const price = Number(amounts[brId] || 0);
    if (!price || price<=0) return alert("Enter valid price");
    await client.post("/bids/", { bulk_request: brId, unit_price: price, note: note[brId] || "" });
    await load();
  };

  if (loading) return <div style={{ padding: 16 }}>Loading…</div>;

  return (
    <div style={{ padding: 16, display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
      <div>
        <h1>Open Bulk Requests</h1>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr>
              <th align="left">#</th>
              <th>Material</th>
              <th>Qty</th>
              <th>Deadline</th>
              <th>Offer</th>
            </tr>
          </thead>
          <tbody>
            {openBRs.map(br=>(
              <tr key={br.id} style={{ borderTop:"1px solid #eee" }}>
                <td align="left">{br.id}</td>
                <td align="center">{br.material_title} ({br.material_sku})</td>
                <td align="center">{br.qty}</td>
                <td align="center">{br.deadline || "-"}</td>
                <td align="center">
                  <input type="number" min="1" placeholder="Unit price"
                    value={amounts[br.id] || ""} onChange={e=>setAmounts({...amounts, [br.id]: e.target.value})}
                    style={{ width: 110 }}
                  />
                  <input placeholder="Note" value={note[br.id] || ""} onChange={e=>setNote({...note, [br.id]: e.target.value})}
                    style={{ width: 160, marginLeft: 6 }}
                  />
                  <button onClick={()=>placeBid(br.id)} style={{ marginLeft: 6 }}>
                    Bid
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h1>My Bids</h1>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr>
              <th align="left">#</th>
              <th>BR#</th>
              <th>Material</th>
              <th>Unit Price</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {myBids.map(b=>(
              <tr key={b.id} style={{ borderTop:"1px solid #eee" }}>
                <td align="left">{b.id}</td>
                <td align="center">{b.bulk_request}</td>
                <td align="center">{b.material_title} ({b.material_sku})</td>
                <td align="right">{Number(b.unit_price).toLocaleString()}</td>
                <td align="center">{b.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
