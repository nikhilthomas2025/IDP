const router = require("express").Router();
const Claim = require("../models/Claim");

router.post("/", async (req, res) => {
  try {
    res.status(201).json(await Claim.create(req.body));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.get("/product/:productId", async (req, res) => {
  res.json(await Claim.find({ productId: req.params.productId }).sort({ createdAt: -1 }));
});

module.exports = router;
