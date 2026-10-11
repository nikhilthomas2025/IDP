const mongoose = require("mongoose");

// Off-chain claim details. Status of record lives on-chain.
const claimSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true, index: true },
    claimant: { type: String, required: true, lowercase: true },
    description: { type: String, required: true },
    onchainClaimId: Number,
    notes: [{ author: String, text: String, at: { type: Date, default: Date.now } }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Claim", claimSchema);
