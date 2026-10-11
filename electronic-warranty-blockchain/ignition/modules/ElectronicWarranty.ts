import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

// The deployer account becomes the admin who can grant MANUFACTURER_ROLE / SERVICE_ROLE.
const ElectronicWarrantyModule = buildModule("ElectronicWarrantyModule", (m) => {
  const admin = m.getAccount(0);
  const warranty = m.contract("ElectronicWarranty", [admin]);
  return { warranty };
});

export default ElectronicWarrantyModule;
