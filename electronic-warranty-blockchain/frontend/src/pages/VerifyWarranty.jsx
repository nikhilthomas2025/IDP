import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { hashFile } from "../utils/hash.js";
import { getWarranty, verifyWarranty, formatDate, friendlyError } from "../utils/contract.js";

export default function VerifyWarranty() {
  const [params] = useSearchParams();
  const [productId, setProductId] = useState(params.get("id") || "");
  const [file, setFile] = useState(null);
  const [warranty, setWarranty] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async (e) => {
    e.preventDefault();
    setError(""); setResult(null); setWarranty(null);
    try {
      setBusy(true);
      const id = productId.trim();
      setWarranty(await getWarranty(id));
      if (file) setResult(await verifyWarranty(id, await hashFile(file)));
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <h2>Verify a warranty</h2>
      <p className="muted">Look up a product, then optionally upload the invoice to check it matches the on-chain hash.</p>
      <form className="card" onSubmit={run}>
        <label>Product ID<input required value={productId} onChange={(e) => setProductId(e.target.value)} placeholder="SN-1001" /></label>
        <label>Invoice document (optional)<input type="file" onChange={(e) => setFile(e.target.files[0])} /></label>
        <button className="btn" disabled={busy}>{busy ? "Checking…" : "Verify"}</button>
      </form>

      {error && <div className="alert error">{error}</div>}
      {warranty && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3>{warranty.productName}</h3>
          <p className="muted">Purchased {formatDate(warranty.purchaseDate)} · Expires {formatDate(warranty.expiryDate)}</p>
          <div className="mono">Registered hash: {warranty.documentHash}</div>
        </div>
      )}
      {result && (
        <>
          <div className={`alert ${result.hashMatches ? "success" : "error"}`}>
            {result.hashMatches ? "✅ Document matches the on-chain record." : "❌ Hash mismatch — this document differs from the registered one."}
          </div>
          <div className={`alert ${result.isActive ? "success" : "warn"}`}>
            {result.isActive ? "Warranty is active." : "Warranty has expired."}
          </div>
          <p className="muted">A matching hash proves the file is unchanged; it does not prove the original invoice was genuine.</p>
        </>
      )}
    </>
  );
}
