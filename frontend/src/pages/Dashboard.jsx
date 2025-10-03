import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useContext(AuthContext);

  return (
    <div style={{ padding: 16 }}>
      <h1>Dashboard</h1>
      {user ? (
        <p>Welcome <b>{user.username}</b> — role: <b>{user.role}</b></p>
      ) : (
        <p>Loading profile…</p>
      )}
      <p>Next: wire Catalog, Orders, Cart pages day-by-day.</p>
    </div>
  );
}
