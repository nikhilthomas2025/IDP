const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Product = require("../models/Product");

const uploadDir = path.join(__dirname, "..", "..", "uploads");
fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({ dest: uploadDir, limits: { fileSize: 10 * 1024 * 1024 } });

// Create / store off-chain product details (+ optional invoice file)
router.post("/", upload.single("invoice"), async (req, res) => {
  try {
    const f = req.file;
    const product = await Product.create({
      ...req.body,
      invoiceFile: f && { originalName: f.originalname, storedName: f.filename, mimeType: f.mimetype, size: f.size },
    });
    res.status(201).json(product);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.get("/wallet/:address", async (req, res) => {
  res.json(await Product.find({ customerWallet: req.params.address.toLowerCase() }));
});

router.get("/:productId", async (req, res) => {
  const p = await Product.findOne({ productId: req.params.productId });
  if (!p) return res.status(404).json({ error: "Not found" });
  res.json(p);
});

module.exports = router;
