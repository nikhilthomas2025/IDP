import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("ElectronicWarranty", () => {
  async function deploy() {
    const [admin, manufacturer, service, customer, stranger] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("ElectronicWarranty");
    const warranty = await factory.deploy(admin.address);
    await warranty.waitForDeployment();

    await warranty.grantRole(await warranty.MANUFACTURER_ROLE(), manufacturer.address);
    await warranty.grantRole(await warranty.SERVICE_ROLE(), service.address);

    const docHash = ethers.sha256(ethers.toUtf8Bytes("invoice-contents"));
    const now = await time.latest();
    return { warranty, admin, manufacturer, service, customer, stranger, docHash, now };
  }

  async function register(ctx: Awaited<ReturnType<typeof deploy>>, id = "SN-1001") {
    return ctx.warranty
      .connect(ctx.manufacturer)
      .registerWarranty(id, "Smart TV 55", ctx.customer.address, ctx.docHash, ctx.now, 365);
  }

  it("lets a manufacturer register a warranty and emits an event", async () => {
    const ctx = await deploy();
    await expect(register(ctx)).to.emit(ctx.warranty, "WarrantyRegistered");
  });

  it("rejects a duplicate product ID", async () => {
    const ctx = await deploy();
    await register(ctx);
    await expect(register(ctx)).to.be.revertedWithCustomError(ctx.warranty, "ProductAlreadyRegistered");
  });

  it("lets a customer retrieve a registered warranty", async () => {
    const ctx = await deploy();
    await register(ctx);
    const w = await ctx.warranty.connect(ctx.customer).getWarranty("SN-1001");
    expect(w.productName).to.equal("Smart TV 55");
    expect(w.customer).to.equal(ctx.customer.address);
    expect(w.documentHash).to.equal(ctx.docHash);
    expect(await ctx.warranty.getCustomerProducts(ctx.customer.address)).to.deep.equal(["SN-1001"]);
  });

  it("blocks unauthorized users from registering or modifying records", async () => {
    const ctx = await deploy();
    await expect(
      ctx.warranty.connect(ctx.stranger).registerWarranty("X", "Y", ctx.customer.address, ctx.docHash, ctx.now, 30)
    ).to.be.revertedWithCustomError(ctx.warranty, "AccessControlUnauthorizedAccount");

    await register(ctx);
    await ctx.warranty.connect(ctx.customer).submitClaim("SN-1001", ethers.id("screen broken"));
    await expect(
      ctx.warranty.connect(ctx.stranger).updateClaimStatus(0, 2)
    ).to.be.revertedWithCustomError(ctx.warranty, "AccessControlUnauthorizedAccount");
    await expect(
      ctx.warranty.connect(ctx.customer).updateClaimStatus(0, 2)
    ).to.be.revertedWithCustomError(ctx.warranty, "AccessControlUnauthorizedAccount");
  });

  it("fails verification for an incorrect file hash", async () => {
    const ctx = await deploy();
    await register(ctx);
    const good = await ctx.warranty.verifyWarranty("SN-1001", ctx.docHash);
    expect(good.hashMatches).to.equal(true);
    expect(good.isActive).to.equal(true);

    const tampered = ethers.sha256(ethers.toUtf8Bytes("tampered-invoice"));
    const bad = await ctx.warranty.verifyWarranty("SN-1001", tampered);
    expect(bad.hashMatches).to.equal(false);
  });

  it("reports an expired warranty as inactive and blocks new claims", async () => {
    const ctx = await deploy();
    await register(ctx);
    await time.increase(366 * 24 * 60 * 60);
    const res = await ctx.warranty.verifyWarranty("SN-1001", ctx.docHash);
    expect(res.isActive).to.equal(false);
    await expect(
      ctx.warranty.connect(ctx.customer).submitClaim("SN-1001", ethers.id("late"))
    ).to.be.revertedWithCustomError(ctx.warranty, "WarrantyExpired");
  });

  it("runs the full journey: register -> claim -> service updates status", async () => {
    const ctx = await deploy();
    await register(ctx);
    await expect(ctx.warranty.connect(ctx.customer).submitClaim("SN-1001", ethers.id("no power")))
      .to.emit(ctx.warranty, "ClaimSubmitted");

    // only the owner of the warranty can claim
    await expect(
      ctx.warranty.connect(ctx.stranger).submitClaim("SN-1001", ethers.id("fake"))
    ).to.be.revertedWithCustomError(ctx.warranty, "NotWarrantyOwner");

    await expect(ctx.warranty.connect(ctx.service).updateClaimStatus(0, 2))
      .to.emit(ctx.warranty, "ClaimStatusUpdated");
    const claim = await ctx.warranty.getClaim(0);
    expect(claim.status).to.equal(2n); // Approved
    expect(await ctx.warranty.getClaimIdsByProduct("SN-1001")).to.deep.equal([0n]);
  });
});
