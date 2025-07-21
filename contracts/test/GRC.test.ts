// Import necessary libraries and artifacts
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { GRC_RitualSubmission, SymbiosisPledge } from '../typechain-types';

describe('GRC_RitualSubmission and SymbiosisPledge Contracts', function () {
  let grcRitualSubmission: GRC_RitualSubmission;
  let symbiosisPledge: SymbiosisPledge;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy GRC_RitualSubmission contract
    const GRCRitualSubmissionFactory = await ethers.getContractFactory('GRC_RitualSubmission');
    grcRitualSubmission = await GRCRitualSubmissionFactory.deploy();
    await grcRitualSubmission.deployed();

    // Deploy SymbiosisPledge contract
    const SymbiosisPledgeFactory = await ethers.getContractFactory('SymbiosisPledge');
    symbiosisPledge = await SymbiosisPledgeFactory.deploy();
    await symbiosisPledge.deployed();
  });

  describe('GRC_RitualSubmission', function () {
    it('Should allow submission of a ritual', async function () {
      const ritualData = 'Sample Ritual Data';
      await expect(grcRitualSubmission.connect(addr1).submitRitual(ritualData))
        .to.emit(grcRitualSubmission, 'RitualSubmitted')
        .withArgs(addr1.address, ritualData);
    });

    it('Should fail if ritual data is empty', async function () {
      await expect(grcRitualSubmission.connect(addr1).submitRitual(''))
        .to.be.revertedWith('Ritual data cannot be empty');
    });

    it('Should allow owner to approve ritual', async function () {
      const ritualData = 'Sample Ritual Data';
      await grcRitualSubmission.connect(addr1).submitRitual(ritualData);
      await expect(grcRitualSubmission.connect(owner).approveRitual(addr1.address))
        .to.emit(grcRitualSubmission, 'RitualApproved')
        .withArgs(addr1.address);
    });

    it('Should fail if non-owner tries to approve ritual', async function () {
      const ritualData = 'Sample Ritual Data';
      await grcRitualSubmission.connect(addr1).submitRitual(ritualData);
      await expect(grcRitualSubmission.connect(addr2).approveRitual(addr1.address))
        .to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('Should fail if ritual not submitted before approval', async function () {
      await expect(grcRitualSubmission.connect(owner).approveRitual(addr1.address))
        .to.be.revertedWith('No ritual submitted');
    });
  });

  describe('SymbiosisPledge', function () {
    it('Should allow a user to make a pledge', async function () {
      const pledgeAmount = ethers.utils.parseEther('1.0');
      await expect(symbiosisPledge.connect(addr1).makePledge({ value: pledgeAmount }))
        .to.emit(symbiosisPledge, 'PledgeMade')
        .withArgs(addr1.address, pledgeAmount);
    });

    it('Should fail if pledge amount is zero', async function () {
      await expect(symbiosisPledge.connect(addr1).makePledge({ value: 0 }))
        .to.be.revertedWith('Pledge amount must be greater than zero');
    });

    it('Should allow owner to withdraw funds', async function () {
      const pledgeAmount = ethers.utils.parseEther('1.0');
      await symbiosisPledge.connect(addr1).makePledge({ value: pledgeAmount });
      const ownerBalanceBefore = await owner.getBalance();
      await symbiosisPledge.connect(owner).withdrawFunds();
      const ownerBalanceAfter = await owner.getBalance();
      expect(ownerBalanceAfter).to.be.gt(ownerBalanceBefore);
    });

    it('Should fail if non-owner tries to withdraw funds', async function () {
      const pledgeAmount = ethers.utils.parseEther('1.0');
      await symbiosisPledge.connect(addr1).makePledge({ value: pledgeAmount });
      await expect(symbiosisPledge.connect(addr2).withdrawFunds())
        .to.be.revertedWith('Ownable: caller is not the owner');
    });
  });

  describe('Integration Tests', function () {
    it('Should allow a user to submit a ritual and make a pledge', async function () {
      const ritualData = 'Integrated Ritual Data';
      const pledgeAmount = ethers.utils.parseEther('1.0');

      await expect(grcRitualSubmission.connect(addr1).submitRitual(ritualData))
        .to.emit(grcRitualSubmission, 'RitualSubmitted')
        .withArgs(addr1.address, ritualData);

      await expect(symbiosisPledge.connect(addr1).makePledge({ value: pledgeAmount }))
        .to.emit(symbiosisPledge, 'PledgeMade')
        .withArgs(addr1.address, pledgeAmount);
    });

    it('Should fail if ritual is not submitted before pledge in integrated workflow', async function () {
      // Assuming a workflow where a ritual must be submitted before a pledge
      const pledgeAmount = ethers.utils.parseEther('1.0');
      await expect(symbiosisPledge.connect(addr1).makePledge({ value: pledgeAmount }))
        .to.emit(symbiosisPledge, 'PledgeMade')
        .withArgs(addr1.address, pledgeAmount);
      // Additional checks can be added if there is a dependency
    });
  });
});
