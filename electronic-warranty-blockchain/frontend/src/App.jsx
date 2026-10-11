import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Home from "./pages/Home.jsx";
import RegisterWarranty from "./pages/RegisterWarranty.jsx";
import MyWarranties from "./pages/MyWarranties.jsx";
import VerifyWarranty from "./pages/VerifyWarranty.jsx";
import Claims from "./pages/Claims.jsx";
import { connectWallet, friendlyError } from "./utils/contract.js";

export default function App() {
  const [account, setAccount] = useState("");
  const [error, setError] = useState("");

  const connect = async () => {
    try {
      setError("");
      setAccount(await connectWallet());
    } catch (e) {
      setError(friendlyError(e));
    }
  };

  return (
    <>
      <Navbar account={account} onConnect={connect} />
      <main className="container">
        {error && <div className="alert error">{error}</div>}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<RegisterWarranty account={account} />} />
          <Route path="/my-warranties" element={<MyWarranties account={account} />} />
          <Route path="/verify" element={<VerifyWarranty />} />
          <Route path="/claims" element={<Claims account={account} />} />
        </Routes>
      </main>
    </>
  );
}
