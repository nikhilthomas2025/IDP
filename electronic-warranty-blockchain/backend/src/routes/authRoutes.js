const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const sign = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || "dev-secret-change-me", { expiresIn: "7d" });

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, walletAddress, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: "name, email and password are required" });
    if (await User.findOne({ email })) return res.status(409).json({ error: "Email already registered" });
    // Public sign-up is always a customer; manufacturer/service roles are granted on-chain by the admin.
    const user = await User.create({ name, email, walletAddress, role: "customer", passwordHash: await bcrypt.hash(password, 10) });
    res.status(201).json({ token: sign(user), user: { id: user._id, name, email, role: user.role } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ error: "Invalid credentials" });
  res.json({ token: sign(user), user: { id: user._id, name: user.name, email, role: user.role } });
});

module.exports = router;
