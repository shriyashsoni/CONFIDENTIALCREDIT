// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@fhenixprotocol/contracts/FHE.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ConfidentialCredit
 * @notice Computes a privacy-preserving credit score using Fully Homomorphic Encryption.
 *
 * How it works:
 *  1. User submits encrypted balance + encrypted monthly income via submitFinancialData()
 *  2. The FHE coprocessor (Fhenix CoFHE) computes:
 *       score = (balance * 6) + (income * 4)
 *     entirely on ciphertext - no plaintext ever reaches the chain.
 *  3. checkEligibility(threshold) decrypts only a boolean: is score > threshold?
 *  4. getCreditLimitSealed() returns a "sealed" version of the credit limit -
 *     only the user's own key can decrypt it client-side (permit pattern).
 *  5. revealDefaulter() allows the owner to decrypt a defaulter's raw score
 *     as a deterrent / for legal action.
 *
 * Score interpretation (balance & income in USD cents, e.g. $50,000 = 5000000):
 *   Poor      : score < 3,000,000   - LTV 0% (no loan)
 *   Fair      : score < 6,000,000   - LTV 30%
 *   Good      : score < 9,000,000   - LTV 60%
 *   Excellent : score >= 9,000,000  - LTV 80%
 */
contract ConfidentialCredit is Ownable {

    // Encrypted credit score per user: score = balance*6 + income*4
    mapping(address => euint64) private encryptedScores;

    // Encrypted credit limit per user (in mUSDC micro-units, 6 decimals)
    mapping(address => euint64) private encryptedCreditLimits;

    // Whether a user has submitted financial data
    mapping(address => bool) public hasScore;

    // The vault contract, allowed to query encrypted limits
    address public vault;

    // =======================================================================
    // Events
    // =======================================================================

    event ScoreSubmitted(address indexed user);
    event VaultSet(address indexed vault);
    event DefaulterRevealed(address indexed defaulter, uint64 score);

    // =======================================================================
    // Modifiers
    // =======================================================================

    modifier onlyVault() {
        require(msg.sender == vault, "ConfidentialCredit: caller is not vault");
        _;
    }

    // =======================================================================
    // Constructor
    // =======================================================================

    constructor() Ownable(msg.sender) {}

    // =======================================================================
    // Admin
    // =======================================================================

    /// @notice Set the lending vault address (called after deploying vault)
    function setVault(address _vault) external onlyOwner {
        require(_vault != address(0), "zero address");
        vault = _vault;
        emit VaultSet(_vault);
    }

    // =======================================================================
    // Core: FHE Credit Scoring
    // =======================================================================

    /**
     * @notice Submit encrypted financial data to compute a confidential credit score.
     * @param encBalance  Client-side encrypted average monthly bank balance (inEuint64)
     * @param encIncome   Client-side encrypted average monthly income (inEuint64)
     *
     * Score formula (all on ciphertext):
     *   score = (balance * 6) + (income * 4)
     *
     * Credit limit is stored as-is; thresholds in checkEligibility are scaled x10.
     */
    function submitFinancialData(
        inEuint64 calldata encBalance,
        inEuint64 calldata encIncome
    ) external {
        // Convert validated ciphertexts to FHE-native encrypted types
        euint64 balance = FHE.asEuint64(encBalance);
        euint64 income  = FHE.asEuint64(encIncome);

        // Weighted score: (balance * 6) + (income * 4)
        // All arithmetic happens on ciphertext via Fhenix CoFHE
        euint64 balanceWeighted = FHE.mul(balance, FHE.asEuint64(6));
        euint64 incomeWeighted  = FHE.mul(income,  FHE.asEuint64(4));
        euint64 score           = FHE.add(balanceWeighted, incomeWeighted);

        // Store raw score as credit limit reference (thresholds are scaled x10)
        euint64 creditLimit = score;

        encryptedScores[msg.sender]       = score;
        encryptedCreditLimits[msg.sender] = creditLimit;
        hasScore[msg.sender]              = true;

        emit ScoreSubmitted(msg.sender);
    }

    // =======================================================================
    // Eligibility Check (public boolean output)
    // =======================================================================

    /**
     * @notice Check whether the caller's encrypted score exceeds minScoreX10.
     * @param minScoreX10  Minimum score threshold x10 (avoids division in FHE).
     *                     E.g. minimum score of 300,000 -> pass 3,000,000
     * @return eligible    Public boolean - only Yes/No revealed, never the raw score.
     */
    function checkEligibility(uint64 minScoreX10) external view returns (bool eligible) {
        require(hasScore[msg.sender], "No financial data submitted");

        // FHE comparison: is score > minScoreX10? Happens on ciphertext.
        ebool isEligible = FHE.gt(encryptedScores[msg.sender], FHE.asEuint64(minScoreX10));

        // Only the boolean result is decrypted - raw score stays private
        eligible = FHE.decrypt(isEligible);
    }

    /**
     * @notice Check eligibility for a specific user - called by the vault.
     * @dev onlyVault ensures the vault itself is the only external caller.
     */
    function checkEligibilityFor(address user, uint64 minScoreX10) external view onlyVault returns (bool) {
        require(hasScore[user], "No financial data submitted");
        ebool isEligible = FHE.gt(encryptedScores[user], FHE.asEuint64(minScoreX10));
        return FHE.decrypt(isEligible);
    }

    // =======================================================================
    // Sealed Output (user sees their own score via permit key)
    // =======================================================================

    /**
     * @notice Return the caller's credit score as a sealed output.
     *         Only the owner of publicKey can decrypt this client-side.
     * @param publicKey  EIP-712 permit public key from cofhejs
     * @return           Sealed (re-encrypted) score string - decrypt off-chain with cofhejs
     */
    function getScoreSealed(bytes32 publicKey) external view returns (string memory) {
        require(hasScore[msg.sender], "No financial data submitted");
        return FHE.sealoutput(encryptedScores[msg.sender], publicKey);
    }

    /**
     * @notice Return the caller's credit limit as a sealed output.
     * @param publicKey  EIP-712 permit public key from cofhejs
     */
    function getCreditLimitSealed(bytes32 publicKey) external view returns (string memory) {
        require(hasScore[msg.sender], "No financial data submitted");
        return FHE.sealoutput(encryptedCreditLimits[msg.sender], publicKey);
    }

    // =======================================================================
    // Default Reveal (owner emergency)
    // =======================================================================

    /**
     * @notice Reveal a defaulter's raw credit score.
     *         This breaks their privacy - use only on confirmed defaulters.
     *         Acts as a deterrent: borrowers know their score CAN be revealed.
     * @param user  The address of the defaulter
     * @return      The raw (decrypted) credit score
     */
    function revealDefaulter(address user) external onlyOwner returns (uint64) {
        require(hasScore[user], "User has no score");
        uint64 score = FHE.decrypt(encryptedScores[user]);
        emit DefaulterRevealed(user, score);
        return score;
    }

    // =======================================================================
    // View helpers
    // =======================================================================

    /// @notice Returns whether the caller has submitted financial data
    function hasSubmitted() external view returns (bool) {
        return hasScore[msg.sender];
    }
}
