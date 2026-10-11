// All blockchain access lives here so pages never talk to ethers directly.
import { BrowserProvider, Contract } from "ethers";
import abi from "../abi/ElectronicWarranty.json";

export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
export const CLAIM_STATUSES = ["Submitted", "In review", "Approved", "Rejected", "Completed"];

export async function connectWallet() {
  if (!window.ethereum) throw new Error("MetaMask not found. Please install it.");
  const provider = new BrowserProvider(window.ethereum);
  const accounts = await provider.send("eth_requestAccounts", []);
  return accounts[0];
}

async function getContract(write = false) {
  if (!CONTRACT_ADDRESS) throw new Error("Set VITE_CONTRACT_ADDRESS in frontend/.env");
  if (!abi.length) throw new Error("ABI is empty. Run `npm run compile && npm run sync-abi` in the repo root.");
  const provider = new BrowserProvider(window.ethereum);
  const runner = write ? await provider.getSigner() : provider;
  return new Contract(CONTRACT_ADDRESS, abi, runner);
}

const toWarranty = (w) => ({
  productId: w.productId,
  productName: w.productName,
  manufacturer: w.manufacturer,
  customer: w.customer,
  documentHash: w.documentHash,
  purchaseDate: Number(w.purchaseDate),
  expiryDate: Number(w.expiryDate),
});

const toClaim = (c) => ({
  id: Number(c.id),
  productId: c.productId,
  claimant: c.claimant,
  descriptionHash: c.descriptionHash,
  status: Number(c.status),
  createdAt: Number(c.createdAt),
  updatedAt: Number(c.updatedAt),
});

export async function registerWarranty({ productId, productName, customer, documentHash, purchaseDate, periodDays }) {
  const c = await getContract(true);
  const tx = await c.registerWarranty(productId, productName, customer, documentHash, purchaseDate, periodDays);
  await tx.wait();
  return tx.hash;
}

export async function getWarranty(productId) {
  const c = await getContract();
  return toWarranty(await c.getWarranty(productId));
}

export async function getMyWarranties(address) {
  const c = await getContract();
  const ids = await c.getCustomerProducts(address);
  return Promise.all(ids.map((id) => getWarranty(id)));
}

export async function verifyWarranty(productId, documentHash) {
  const c = await getContract();
  const [hashMatches, isActive] = await c.verifyWarranty(productId, documentHash);
  return { hashMatches, isActive };
}

export async function submitClaim(productId, descriptionHash) {
  const c = await getContract(true);
  const tx = await c.submitClaim(productId, descriptionHash);
  await tx.wait();
  return tx.hash;
}

export async function getClaimsForProduct(productId) {
  const c = await getContract();
  const ids = await c.getClaimIdsByProduct(productId);
  return Promise.all(ids.map(async (id) => toClaim(await c.getClaim(id))));
}

export async function updateClaimStatus(claimId, status) {
  const c = await getContract(true);
  const tx = await c.updateClaimStatus(claimId, status);
  await tx.wait();
  return tx.hash;
}

export const formatDate = (unix) => new Date(unix * 1000).toLocaleDateString();
export const shortAddr = (a) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "");
export const friendlyError = (e) => e?.reason || e?.shortMessage || e?.message || "Something went wrong";
