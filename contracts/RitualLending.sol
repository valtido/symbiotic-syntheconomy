// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract RitualLending is Ownable {
    using SafeMath for uint256;

    // Ritual structure to store cultural project details
    struct Ritual {
        uint256 id;
        address creator;
        string name;
        string description;
        uint256 fundingGoal;
        uint256 totalFunded;
        uint256 deadline;
        bool isActive;
        mapping(address => uint256) contributions;
    }

    // Loan structure for borrowing requests
    struct Loan {
        uint256 ritualId;
        address borrower;
        uint256 amount;
        uint256 interestRate;
        uint256 repaymentDeadline;
        bool isApproved;
        bool isRepaid;
        mapping(address => uint256) lenders;
    }

    IERC20 public token; // ERC20 token used for lending/borrowing
    uint256 public ritualCount;
    uint256 public loanCount;

    mapping(uint256 => Ritual) public rituals;
    mapping(uint256 => Loan) public loans;
    mapping(address => uint256[]) public userRituals;
    mapping(address => uint256[]) public userLoans;

    event RitualCreated(uint256 indexed id, address creator, string name, uint256 fundingGoal, uint256 deadline);
    event RitualFunded(uint256 indexed id, address contributor, uint256 amount);
    event LoanRequested(uint256 indexed loanId, uint256 ritualId, address borrower, uint256 amount);
    event LoanApproved(uint256 indexed loanId, address lender, uint256 amount);
    event LoanRepaid(uint256 indexed loanId, address borrower, uint256 amount);

    constructor(address _tokenAddress) {
        token = IERC20(_tokenAddress);
    }

    // Create a new ritual for cultural development funding
    function createRitual(string memory _name, string memory _description, uint256 _fundingGoal, uint256 _duration) external {
        require(_fundingGoal > 0, "Funding goal must be greater than 0");
        require(_duration > 0, "Duration must be greater than 0");

        uint256 ritualId = ritualCount++;
        Ritual storage newRitual = rituals[ritualId];
        newRitual.id = ritualId;
        newRitual.creator = msg.sender;
        newRitual.name = _name;
        newRitual.description = _description;
        newRitual.fundingGoal = _fundingGoal;
        newRitual.totalFunded = 0;
        newRitual.deadline = block.timestamp + _duration;
        newRitual.isActive = true;

        userRituals[msg.sender].push(ritualId);
        emit RitualCreated(ritualId, msg.sender, _name, _fundingGoal, newRitual.deadline);
    }

    // Contribute to a ritual
    function fundRitual(uint256 _ritualId, uint256 _amount) external {
        Ritual storage ritual = rituals[_ritualId];
        require(ritual.isActive, "Ritual is not active");
        require(block.timestamp <= ritual.deadline, "Ritual deadline passed");
        require(_amount > 0, "Amount must be greater than 0");
        require(token.transferFrom(msg.sender, address(this), _amount), "Token transfer failed");

        ritual.contributions[msg.sender] = ritual.contributions[msg.sender].add(_amount);
        ritual.totalFunded = ritual.totalFunded.add(_amount);

        if (ritual.totalFunded >= ritual.fundingGoal) {
            ritual.isActive = false;
        }

        emit RitualFunded(_ritualId, msg.sender, _amount);
    }

    // Request a loan for a ritual
    function requestLoan(uint256 _ritualId, uint256 _amount, uint256 _interestRate, uint256 _repaymentDuration) external {
        Ritual storage ritual = rituals[_ritualId];
        require(ritual.creator == msg.sender, "Only ritual creator can request loan");
        require(ritual.isActive, "Ritual is not active");
        require(_amount <= ritual.fundingGoal.sub(ritual.totalFunded), "Loan amount exceeds remaining funding goal");

        uint256 loanId = loanCount++;
        Loan storage newLoan = loans[loanId];
        newLoan.ritualId = _ritualId;
        newLoan.borrower = msg.sender;
        newLoan.amount = _amount;
        newLoan.interestRate = _interestRate;
        newLoan.repaymentDeadline = block.timestamp + _repaymentDuration;
        newLoan.isApproved = false;
        newLoan.isRepaid = false;

        userLoans[msg.sender].push(loanId);
        emit LoanRequested(loanId, _ritualId, msg.sender, _amount);
    }

    // Approve and fund a loan
    function approveLoan(uint256 _loanId, uint256 _amount) external {
        Loan storage loan = loans[_loanId];
        require(!loan.isApproved, "Loan already approved");
        require(_amount <= loan.amount, "Amount exceeds loan request");
        require(token.transferFrom(msg.sender, loan.borrower, _amount), "Token transfer failed");

        loan.lenders[msg.sender] = _amount;
        if (_amount == loan.amount) {
            loan.isApproved = true;
        }

        emit LoanApproved(_loanId, msg.sender, _amount);
    }

    // Repay a loan
    function repayLoan(uint256 _loanId) external {
        Loan storage loan = loans[_loanId];
        require(loan.borrower == msg.sender, "Only borrower can repay");
        require(loan.isApproved, "Loan not approved");
        require(!loan.isRepaid, "Loan already repaid");

        uint256 repaymentAmount = loan.amount.add(loan.amount.mul(loan.interestRate).div(100));
        require(token.transferFrom(msg.sender, address(this), repaymentAmount), "Token transfer failed");

        loan.isRepaid = true;
        emit LoanRepaid(_loanId, msg.sender, repaymentAmount);
    }

    // Withdraw funds after ritual completion (for ritual creators)
    function withdrawFunds(uint256 _ritualId) external {
        Ritual storage ritual = rituals[_ritualId];
        require(ritual.creator == msg.sender, "Only creator can withdraw");
        require(!ritual.isActive || block.timestamp > ritual.deadline, "Ritual still active");
        require(ritual.totalFunded > 0, "No funds to withdraw");

        uint256 amount = ritual.totalFunded;
        ritual.totalFunded = 0;
        require(token.transfer(msg.sender, amount), "Token transfer failed");
    }
}