// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IConfidentialCredit {
    function checkEligibilityFor(address user, uint64 minScoreX10) external view returns (bool);
    function revealDefaulter(address user) external returns (uint64);
}

/**
 * @title ConfidentialVault
 * @notice Undercollateralized lending vault.
 *         Loans are gated by a confidential FHE credit score - no collateral required
 *         if the credit score qualifies. Defaulters can be de-anonymized by the owner.
 *
 * Loan tiers (minScoreX10 values):
 *   Tier 1 - up to  500 mUSDC: minScoreX10 = 3,000,000
 *   Tier 2 - up to 1000 mUSDC: minScoreX10 = 6,000,000
 *   Tier 3 - up to 2000 mUSDC: minScoreX10 = 9,000,000
 *
 * Interest: 5% flat (simplified for testnet demo)
 * Loan duration: 30 days before liquidation is allowed
 */
contract ConfidentialVault is Ownable, ReentrancyGuard {

    // =======================================================================
    // Constants
    // =======================================================================

    uint64 public constant TIER1_MIN_SCORE  = 3_000_000;
    uint64 public constant TIER2_MIN_SCORE  = 6_000_000;
    uint64 public constant TIER3_MIN_SCORE  = 9_000_000;

    uint256 public constant TIER1_MAX_LOAN  = 500   * 1e6; // 500 mUSDC
    uint256 public constant TIER2_MAX_LOAN  = 1000  * 1e6; // 1,000 mUSDC
    uint256 public constant TIER3_MAX_LOAN  = 2000  * 1e6; // 2,000 mUSDC

    uint256 public constant INTEREST_BPS    = 500;         // 5%
    uint256 public constant BASIS_POINTS    = 10_000;
    uint256 public constant LOAN_PERIOD     = 30 days;

    // =======================================================================
    // State
    // =======================================================================

    IConfidentialCredit public immutable creditContract;
    IERC20              public immutable usdc;

    struct Loan {
        uint256 principal;
        uint256 startTime;
        bool    active;
    }

    mapping(address => Loan) public loans;

    // =======================================================================
    // Events
    // =======================================================================

    event LoanIssued(address indexed borrower, uint256 amount, uint8 tier);
    event LoanRepaid(address indexed borrower, uint256 principal, uint256 interest);
    event LoanLiquidated(address indexed defaulter, uint256 amount, uint64 revealedScore);

    // =======================================================================
    // Constructor
    // =======================================================================

    constructor(address _creditContract, address _usdc) Ownable(msg.sender) {
        require(_creditContract != address(0), "zero address");
        require(_usdc != address(0), "zero address");
        creditContract = IConfidentialCredit(_creditContract);
        usdc           = IERC20(_usdc);
    }

    // =======================================================================
    // Core: Borrow
    // =======================================================================

    /**
     * @notice Borrow mUSDC. Amount must be within the tier limit your score qualifies for.
     * @param amount  Amount to borrow in mUSDC (6 decimals, e.g. 500e6 = 500 mUSDC)
     *
     * Flow:
     *   1. Determine which tier the requested amount falls in
     *   2. Call ConfidentialCredit.checkEligibilityFor() - only bool returned
     *   3. If eligible, transfer mUSDC from vault to borrower
     *   4. Record loan (principal + start time)
     */
    function borrow(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(!loans[msg.sender].active, "Active loan exists -- repay first");

        // Determine tier
        uint64 requiredScore;
        uint8  tier;

        if (amount <= TIER1_MAX_LOAN) {
            requiredScore = TIER1_MIN_SCORE;
            tier = 1;
        } else if (amount <= TIER2_MAX_LOAN) {
            requiredScore = TIER2_MIN_SCORE;
            tier = 2;
        } else if (amount <= TIER3_MAX_LOAN) {
            requiredScore = TIER3_MIN_SCORE;
            tier = 3;
        } else {
            revert("Amount exceeds maximum loan size");
        }

        // FHE eligibility check
        bool eligible = creditContract.checkEligibilityFor(msg.sender, requiredScore);
        require(eligible, "Credit score insufficient for requested amount");

        // Disburse
        require(usdc.balanceOf(address(this)) >= amount, "Vault: insufficient liquidity");
        usdc.transfer(msg.sender, amount);

        loans[msg.sender] = Loan({
            principal:  amount,
            startTime:  block.timestamp,
            active:     true
        });

        emit LoanIssued(msg.sender, amount, tier);
    }

    // =======================================================================
    // Core: Repay
    // =======================================================================

    /**
     * @notice Repay the outstanding loan + 5% flat interest.
     *         Caller must have approved (principal + interest) mUSDC to this contract.
     */
    function repay() external nonReentrant {
        Loan storage loan = loans[msg.sender];
        require(loan.active, "No active loan");

        uint256 interest = (loan.principal * INTEREST_BPS) / BASIS_POINTS;
        uint256 total    = loan.principal + interest;

        usdc.transferFrom(msg.sender, address(this), total);

        emit LoanRepaid(msg.sender, loan.principal, interest);

        delete loans[msg.sender];
    }

    // =======================================================================
    // Core: Liquidate (default)
    // =======================================================================

    /**
     * @notice Liquidate a defaulter after the 30-day period.
     *         Calls ConfidentialCredit.revealDefaulter() to publicly expose their score
     *         - the privacy deterrent that keeps borrowers honest.
     * @param user  Address of the defaulter
     */
    function liquidate(address user) external onlyOwner {
        Loan storage loan = loans[user];
        require(loan.active, "No active loan for user");
        require(
            block.timestamp >= loan.startTime + LOAN_PERIOD,
            "Loan period not yet expired"
        );

        uint256 loanAmount = loan.principal;
        delete loans[user];

        // Reveal the defaulter's encrypted score - this is the privacy deterrent
        uint64 revealedScore = creditContract.revealDefaulter(user);

        emit LoanLiquidated(user, loanAmount, revealedScore);
    }

    // =======================================================================
    // Admin
    // =======================================================================

    /// @notice Fund the vault with mUSDC (owner calls after minting)
    function fundVault(uint256 amount) external onlyOwner {
        usdc.transferFrom(msg.sender, address(this), amount);
    }

    /// @notice View the total outstanding loan details
    function getLoanDetails(address user)
        external
        view
        returns (uint256 principal, uint256 interest, uint256 dueDate, bool active)
    {
        Loan memory loan = loans[user];
        principal = loan.principal;
        interest  = (loan.principal * INTEREST_BPS) / BASIS_POINTS;
        dueDate   = loan.startTime + LOAN_PERIOD;
        active    = loan.active;
    }

    /// @notice Emergency withdraw - owner only
    function emergencyWithdraw(uint256 amount) external onlyOwner {
        usdc.transfer(owner(), amount);
    }
}
