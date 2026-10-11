// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title ElectronicWarranty
 * @notice Registers electronic product warranties on-chain. Only the SHA-256 hash of the
 *         warranty/invoice document is stored on-chain; the file itself stays off-chain.
 *
 * Roles
 *  - DEFAULT_ADMIN_ROLE : grants / revokes the other roles
 *  - MANUFACTURER_ROLE  : may register warranties
 *  - SERVICE_ROLE       : may update claim statuses
 */
contract ElectronicWarranty is AccessControl {
    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");
    bytes32 public constant SERVICE_ROLE = keccak256("SERVICE_ROLE");

    enum ClaimStatus {
        Submitted,
        InReview,
        Approved,
        Rejected,
        Completed
    }

    struct Warranty {
        string productId;
        string productName;
        address manufacturer;
        address customer;
        bytes32 documentHash; // SHA-256 of the warranty / invoice document
        uint64 purchaseDate; // unix seconds
        uint64 expiryDate; // unix seconds
        bool exists;
    }

    struct Claim {
        uint256 id;
        string productId;
        address claimant;
        bytes32 descriptionHash; // hash of the off-chain claim description
        ClaimStatus status;
        uint64 createdAt;
        uint64 updatedAt;
    }

    mapping(bytes32 => Warranty) private warranties; // keyed by keccak256(productId)
    mapping(address => string[]) private customerProducts;

    Claim[] private claims;
    mapping(bytes32 => uint256[]) private claimsByProduct;

    event WarrantyRegistered(
        string indexed productIdIndexed,
        string productId,
        address indexed manufacturer,
        address indexed customer,
        bytes32 documentHash,
        uint64 expiryDate
    );
    event ClaimSubmitted(uint256 indexed claimId, string productId, address indexed claimant);
    event ClaimStatusUpdated(uint256 indexed claimId, ClaimStatus status, address indexed updatedBy);

    error EmptyProductId();
    error ProductAlreadyRegistered(string productId);
    error ProductNotFound(string productId);
    error InvalidCustomer();
    error InvalidWarrantyPeriod();
    error NotWarrantyOwner();
    error WarrantyExpired();
    error ClaimNotFound(uint256 claimId);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    // ------------------------------------------------------------------ writes

    function registerWarranty(
        string calldata productId,
        string calldata productName,
        address customer,
        bytes32 documentHash,
        uint64 purchaseDate,
        uint64 warrantyPeriodDays
    ) external onlyRole(MANUFACTURER_ROLE) {
        if (bytes(productId).length == 0) revert EmptyProductId();
        if (customer == address(0)) revert InvalidCustomer();
        if (warrantyPeriodDays == 0) revert InvalidWarrantyPeriod();

        bytes32 key = keccak256(bytes(productId));
        if (warranties[key].exists) revert ProductAlreadyRegistered(productId);

        uint64 expiry = purchaseDate + warrantyPeriodDays * 1 days;

        warranties[key] = Warranty({
            productId: productId,
            productName: productName,
            manufacturer: msg.sender,
            customer: customer,
            documentHash: documentHash,
            purchaseDate: purchaseDate,
            expiryDate: expiry,
            exists: true
        });
        customerProducts[customer].push(productId);

        emit WarrantyRegistered(productId, productId, msg.sender, customer, documentHash, expiry);
    }

    function submitClaim(string calldata productId, bytes32 descriptionHash) external returns (uint256 claimId) {
        bytes32 key = keccak256(bytes(productId));
        Warranty storage w = warranties[key];
        if (!w.exists) revert ProductNotFound(productId);
        if (w.customer != msg.sender) revert NotWarrantyOwner();
        if (block.timestamp > w.expiryDate) revert WarrantyExpired();

        claimId = claims.length;
        claims.push(
            Claim({
                id: claimId,
                productId: productId,
                claimant: msg.sender,
                descriptionHash: descriptionHash,
                status: ClaimStatus.Submitted,
                createdAt: uint64(block.timestamp),
                updatedAt: uint64(block.timestamp)
            })
        );
        claimsByProduct[key].push(claimId);

        emit ClaimSubmitted(claimId, productId, msg.sender);
    }

    function updateClaimStatus(uint256 claimId, ClaimStatus status) external onlyRole(SERVICE_ROLE) {
        if (claimId >= claims.length) revert ClaimNotFound(claimId);
        Claim storage c = claims[claimId];
        c.status = status;
        c.updatedAt = uint64(block.timestamp);
        emit ClaimStatusUpdated(claimId, status, msg.sender);
    }

    // ------------------------------------------------------------------- reads

    function getWarranty(string calldata productId) external view returns (Warranty memory) {
        Warranty memory w = warranties[keccak256(bytes(productId))];
        if (!w.exists) revert ProductNotFound(productId);
        return w;
    }

    /**
     * @return hashMatches true if the supplied document hash equals the registered one
     * @return isActive    true if the warranty has not yet expired
     */
    function verifyWarranty(string calldata productId, bytes32 documentHash)
        external
        view
        returns (bool hashMatches, bool isActive)
    {
        Warranty memory w = warranties[keccak256(bytes(productId))];
        if (!w.exists) revert ProductNotFound(productId);
        hashMatches = (w.documentHash == documentHash);
        isActive = block.timestamp <= w.expiryDate;
    }

    function getCustomerProducts(address customer) external view returns (string[] memory) {
        return customerProducts[customer];
    }

    function getClaim(uint256 claimId) external view returns (Claim memory) {
        if (claimId >= claims.length) revert ClaimNotFound(claimId);
        return claims[claimId];
    }

    function getClaimIdsByProduct(string calldata productId) external view returns (uint256[] memory) {
        return claimsByProduct[keccak256(bytes(productId))];
    }

    function totalClaims() external view returns (uint256) {
        return claims.length;
    }
}
