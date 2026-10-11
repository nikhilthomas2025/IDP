import { useState } from "react";
import { hashText } from "../utils/hash.js";
import {
  submitClaim, getClaimsForProduct, updateClaimStatus,
  CLAIM_STATUSES, formatDate, friendlyError,
} from "../utils/contract.js";

const API = import.meta.env.VITE_API_URL;

export default function Claims({ account }) {
  const [productId, setProductId] = useState("");
  const [description, setDescription] = useState("");
  const [claims, setClaims] = useState([]);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [busy, setBusy] = useState(false);

  const load = async (id = productId.trim()) => {
    setClaims(await getClaimsForProduct(id));
  };

  const run = async (fn, okText) => {
    if (!account) return setMsg({ type: "error", text: "Connect your wallet first." });
    try {
      setBusy(true);
      setMsg({ type: "", text: "" });
      await fn();
      setMsg({ type: "success", text: okText });
    } catch (e) {
      setMsg({ type: "error", text: friendlyError(e) });
    } finally {
      setBusy(false);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    run(async () => {
      const id = productId.trim();
      // The description itself stays off-chain (backend); only its hash is recorded.
      await submitClaim(id, await hashText(description));
      if (API) {
        fetch(`${API}/claims`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: id, claimant: account, description }),
        }).catch(() => {});
      }
      setDescription("");
      await load(id);
    }, "Claim submitted on-chain.");
  };

  return (
    <>
      <h2>Warranty claims</h2>
      <form className="card" onSubmit={submit}>
        <label>Product ID<input required value={productId} onChange={(e) => setProductId(e.target.value)} placeholder="SN-1001" /></label>
        <label>Describe the problem<textarea required rows={3} value={description} onChange={(e) => setDescription(e.target.value)} /></label>
        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn" disabled={busy}>{busy ? "Waiting…" : "Submit claim"}</button>
          <button type="button" className="btn ghost" disabled={!productId || busy} onClick={() => run(() => load(), "Claims loaded.")}>
            View claim status
          </button>
        </div>
        {msg.text && <div className={`alert ${msg.type}`}>{msg.text}</div>}
      </form>

      <h2 style={{ marginTop: 28 }}>Claims for this product</h2>
      {claims.length === 0 && <p className="muted">No claims loaded.</p>}
      <div className="grid">
        {claims.map((c) => (
          <div className="card" key={c.id}>
            <h3>Claim #{c.id}</h3>
            <span className="badge info">{CLAIM_STATUSES[c.status]}</span>
            <p className="muted">Filed {formatDate(c.createdAt)} · Updated {formatDate(c.updatedAt)}</p>
            <label>
              Service centre: update status
              <select value={c.status} disabled={busy}
                onChange={(e) => run(async () => { await updateClaimStatus(c.id, Number(e.target.value)); await load(); }, "Status updated.")}>
                {CLAIM_STATUSES.map((s, i) => <option key={s} value={i}>{s}</option>)}
              </select>
            </label>
          </div>
        ))}
      </div>
    </>
  );
}
