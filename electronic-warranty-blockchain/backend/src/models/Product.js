const mongoose = require("mongoose");

// Off-chain product details. The on-chain record only holds the document hash.
const productSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    brand: String,
    category: String,
    customerWallet: { type: String, lowercase: true },
    purchaseDate: Date,
    warrantyPeriodDays: Number,
    documentHash: String, // must equal the hash stored on-chain
    invoiceFile: { originalName: String, storedName: String, mimeType: String, size: Number },
    txHash: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
