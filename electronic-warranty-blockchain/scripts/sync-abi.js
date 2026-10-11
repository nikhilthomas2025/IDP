// Copies the compiler-generated ABI into the frontend so it is never written by hand.
// Usage: npm run compile && npm run sync-abi
const fs = require("fs");
const path = require("path");

const artifact = path.join(__dirname, "..", "artifacts", "contracts", "ElectronicWarranty.sol", "ElectronicWarranty.json");
const target = path.join(__dirname, "..", "frontend", "src", "abi", "ElectronicWarranty.json");

if (!fs.existsSync(artifact)) {
  console.error("Artifact not found. Run `npm run compile` first.");
  process.exit(1);
}
const { abi } = JSON.parse(fs.readFileSync(artifact, "utf8"));
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, JSON.stringify(abi, null, 2));
console.log(`ABI (${abi.length} entries) written to ${path.relative(process.cwd(), target)}`);
