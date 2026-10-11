import { NavLink, Link } from "react-router-dom";
import { shortAddr } from "../utils/contract.js";

export default function Navbar({ account, onConnect }) {
  return (
    <header className="navbar">
      <Link to="/" className="brand">🛡️ WarrantyChain</Link>
      <nav>
        <NavLink to="/register">Register</NavLink>
        <NavLink to="/my-warranties">My Warranties</NavLink>
        <NavLink to="/verify">Verify</NavLink>
        <NavLink to="/claims">Claims</NavLink>
      </nav>
      <button className="btn" onClick={onConnect}>
        {account ? shortAddr(account) : "Connect Wallet"}
      </button>
    </header>
  );
}
