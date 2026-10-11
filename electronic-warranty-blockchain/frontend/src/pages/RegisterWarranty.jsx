import { useState } from "react";
import { hashFile } from "../utils/hash.js";
import { registerWarranty, friendlyError } from "../utils/contract.js";

export default function RegisterWarranty({ account }) {
  const [form, setForm] = useState({
    productId: "",
    productName: "",
    customer: "",
    purchaseDate: new Date().toISOString().slice(0, 10),
    periodDays: 365,
  });
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState({ type: "", msg: "" });
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!account) return setStatus({ type: "error", msg: "Connect your wallet first." });
    if (!file) return setStatus({ type: "error", msg: "Upload the warranty / invoice document." });
    try {
      setBusy(true);
      setStatus({ type: "", msg: "" });
      const documentHash = await hashFile(file);
      const purchaseDate = Math.floor(new Date(form.purchaseDate).getTime() / 1000);
      const txHash = await registerWarranty({
        productId: form.productId.trim(),
        productName: form.productName.trim(),
        customer: form.customer.trim(),
        documentHash,
        purchaseDate,
        periodDays: Number(form.periodDays),
      });
      setStatus({ type: "success", msg: `Registered! Document hash ${documentHash.slice(0, 18)}… stored. Tx: ${txHash}` });
    } catch (err) {
      setStatus({ type: "error", msg: friendlyError(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <h2>Register a warranty</h2>
      <p className="muted">Manufacturer accounts only. The document is hashed locally; only the hash goes on-chain.</p>
      <form className="card" onSubmit={submit}>
        <div className="row">
          <label>Product ID / serial<input required value={form.productId} onChange={set("productId")} placeholder="SN-1001" /></label>
          <label>Product name<input required value={form.productName} onChange={set("productName")} placeholder="Smart TV 55&quot;" /></label>
        </div>
        <label>Customer wallet address<input required value={form.customer} onChange={set("customer")} placeholder="0x…" /></label>
        <div className="row">
          <label>Purchase date<input type="date" required value={form.purchaseDate} onChange={set("purchaseDate")} /></label>
          <label>Warranty period (days)<input type="number" min="1" required value={form.periodDays} onChange={set("periodDays")} /></label>
        </div>
        <label>Invoice / warranty document<input type="file" required onChange={(e) => setFile(e.target.files[0])} /></label>
        <button className="btn" disabled={busy}>{busy ? "Waiting for confirmation…" : "Register on blockchain"}</button>
        {status.msg && <div className={`alert ${status.type}`}>{status.msg}</div>}
      </form>
    </>
  );
}
