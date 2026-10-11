import { Link } from "react-router-dom";

export default function Home() {
  return (
    <>
      <section className="hero">
        <h1>Tamper-proof warranties, verified on the blockchain.</h1>
        <p>
          Manufacturers register a product warranty once. Only the SHA-256 fingerprint of the invoice is stored on
          Ethereum (Sepolia), so anyone can verify a document is unchanged without exposing private data.
        </p>
        <div className="actions">
          <Link className="btn" to="/register">Register a warranty</Link>
          <Link className="btn ghost" to="/verify">Verify a document</Link>
        </div>
      </section>

      <div className="grid">
        <div className="card"><h3>🔐 Role-based access</h3><p className="muted">Only manufacturers register warranties; only service staff update claims.</p></div>
        <div className="card"><h3>🧾 Document hashing</h3><p className="muted">Invoices are hashed in your browser. The file never goes on-chain.</p></div>
        <div className="card"><h3>🛠️ Transparent claims</h3><p className="muted">Every claim and status change is an auditable on-chain event.</p></div>
      </div>

      <div className="steps">
        <div className="card"><b>Manufacturer registers</b> <span className="muted">product + invoice hash</span></div>
        <div className="card"><b>Customer retrieves</b> <span className="muted">warranty from "My Warranties"</span></div>
        <div className="card"><b>Customer verifies</b> <span className="muted">by re-uploading the invoice</span></div>
        <div className="card"><b>Customer submits a claim</b>, <b>service centre updates it</b></div>
      </div>
    </>
  );
}
