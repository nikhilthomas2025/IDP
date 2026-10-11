import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { getMyWarranties, formatDate, friendlyError } from "../utils/contract.js";

export default function MyWarranties({ account }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!account) return;
    setLoading(true);
    setError("");
    getMyWarranties(account)
      .then(setItems)
      .catch((e) => setError(friendlyError(e)))
      .finally(() => setLoading(false));
  }, [account]);

  if (!account) return <div className="alert warn">Connect your wallet to see your warranties.</div>;

  const now = Date.now() / 1000;
  return (
    <>
      <h2>My warranties</h2>
      {loading && <p className="muted">Loading from blockchain…</p>}
      {error && <div className="alert error">{error}</div>}
      {!loading && !error && items.length === 0 && <p className="muted">No warranties registered to this wallet yet.</p>}
      <div className="grid">
        {items.map((w) => {
          const active = now <= w.expiryDate;
          return (
            <div className="card" key={w.productId}>
              <h3>{w.productName}</h3>
              <span className={`badge ${active ? "good" : "bad"}`}>{active ? "Active" : "Expired"}</span>
              <p className="muted">ID: {w.productId}<br />Purchased: {formatDate(w.purchaseDate)}<br />Expires: {formatDate(w.expiryDate)}</p>
              <div className="mono">{w.documentHash}</div>
              <div className="qr"><QRCodeSVG value={`${window.location.origin}/verify?id=${encodeURIComponent(w.productId)}`} size={96} /></div>
            </div>
          );
        })}
      </div>
    </>
  );
}
