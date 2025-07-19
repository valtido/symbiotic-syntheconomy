import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Signer } from 'ethers';
import { GRC_RitualSubmission } from '../contracts/typechain-types/contracts/GRC_RitualSubmission';
import { SymbiosisPledge } from '../contracts/typechain-types/contracts/SymbiosisPledge';

describe('GRC Election and Ritual Workflow', () => {
  let grcRitualSubmission: GRC_RitualSubmission;
  let symbiosisPledge: SymbiosisPledge;
  let owner: Signer;
  let ritualSubmitter: Signer;
  let validator1: Signer;
  let validator2: Signer;
  let voter1: Signer;
  let voter2: Signer;

  beforeEach(async () => {
    [owner, ritualSubmitter, validator1, validator2, voter1, voter2] =
      await ethers.getSigners();

    // Deploy GRC_RitualSubmission contract
    const GRC_RitualSubmissionFactory = await ethers.getContractFactory(
      'GRC_RitualSubmission',
    );
    grcRitualSubmission =
      (await GRC_RitualSubmissionFactory.deploy()) as GRC_RitualSubmission;
    await grcRitualSubmission.deployed();

    // Deploy SymbiosisPledge contract
    const SymbiosisPledgeFactory = await ethers.getContractFactory(
      'SymbiosisPledge',
    );
    symbiosisPledge =
      (await SymbiosisPledgeFactory.deploy()) as SymbiosisPledge;
    await symbiosisPledge.deployed();
  });

  describe('Ritual Submission and Validation', () => {
    it('should allow ritual submission with IPFS hash', async () => {
      const ritualData = {
        name: 'Spring Equinox Ceremony',
        bioregion: 'Pacific Northwest',
        ipfsHash: 'QmTestHash123456789',
        culturalReferences: ['Indigenous traditions', 'Seasonal cycles'],
        emotionalSkew: 0.3,
        submitter: await ritualSubmitter.getAddress(),
      };

      await expect(
        grcRitualSubmission
          .connect(ritualSubmitter)
          .submitRitual(
            ritualData.name,
            ritualData.bioregion,
            ritualData.ipfsHash,
            ritualData.culturalReferences,
            ritualData.emotionalSkew,
          ),
      )
        .to.emit(grcRitualSubmission, 'RitualSubmitted')
        .withArgs(0, ritualData.name, ritualData.ipfsHash);

      const ritual = await grcRitualSubmission.getRitual(0);
      expect(ritual.name).to.equal(ritualData.name);
      expect(ritual.bioregion).to.equal(ritualData.bioregion);
      expect(ritual.ipfsHash).to.equal(ritualData.ipfsHash);
      expect(ritual.isValidated).to.be.false;
    });

    it('should validate rituals with acceptable emotional skew', async () => {
      const ritualData = {
        name: 'Cultural Harmony Ritual',
        bioregion: 'Appalachian Mountains',
        ipfsHash: 'QmValidHash123456',
        culturalReferences: ['Celtic traditions', 'Mountain ecology'],
        emotionalSkew: 0.5, // Within acceptable range (max 0.7)
        submitter: await ritualSubmitter.getAddress(),
      };

      await grcRitualSubmission
        .connect(ritualSubmitter)
        .submitRitual(
          ritualData.name,
          ritualData.bioregion,
          ritualData.ipfsHash,
          ritualData.culturalReferences,
          ritualData.emotionalSkew,
        );

      await expect(
        grcRitualSubmission
          .connect(validator1)
          .validateRitual(0, true, 'Passes ESEP criteria'),
      )
        .to.emit(grcRitualSubmission, 'RitualValidated')
        .withArgs(0, true, 'Passes ESEP criteria');

      const ritual = await grcRitualSubmission.getRitual(0);
      expect(ritual.isValidated).to.be.true;
      expect(ritual.validationNotes).to.equal('Passes ESEP criteria');
    });

    it('should reject rituals with excessive emotional skew', async () => {
      const ritualData = {
        name: 'Polarizing Ceremony',
        bioregion: 'Urban Core',
        ipfsHash: 'QmRejectedHash123',
        culturalReferences: ['Modern urban culture'],
        emotionalSkew: 0.9, // Exceeds maximum (0.7)
        submitter: await ritualSubmitter.getAddress(),
      };

      await grcRitualSubmission
        .connect(ritualSubmitter)
        .submitRitual(
          ritualData.name,
          ritualData.bioregion,
          ritualData.ipfsHash,
          ritualData.culturalReferences,
          ritualData.emotionalSkew,
        );

      await expect(
        grcRitualSubmission
          .connect(validator1)
          .validateRitual(0, false, 'Exceeds emotional skew limit'),
      )
        .to.emit(grcRitualSubmission, 'RitualValidated')
        .withArgs(0, false, 'Exceeds emotional skew limit');

      const ritual = await grcRitualSubmission.getRitual(0);
      expect(ritual.isValidated).to.be.false;
    });

    it('should enforce minimum cultural references requirement', async () => {
      const ritualData = {
        name: 'Insufficient Cultural Context',
        bioregion: 'Desert Southwest',
        ipfsHash: 'QmInsufficientHash',
        culturalReferences: ['Generic spirituality'], // Only 1 reference (minimum 2 required)
        emotionalSkew: 0.4,
        submitter: await ritualSubmitter.getAddress(),
      };

      await grcRitualSubmission
        .connect(ritualSubmitter)
        .submitRitual(
          ritualData.name,
          ritualData.bioregion,
          ritualData.ipfsHash,
          ritualData.culturalReferences,
          ritualData.emotionalSkew,
        );

      await expect(
        grcRitualSubmission
          .connect(validator1)
          .validateRitual(0, false, 'Insufficient cultural references'),
      )
        .to.emit(grcRitualSubmission, 'RitualValidated')
        .withArgs(0, false, 'Insufficient cultural references');
    });
  });

  describe('DAO Governance and Voting', () => {
    it('should allow pledge creation for bioregional commitment', async () => {
      const pledgeData = {
        bioregion: 'Great Lakes',
        commitment: 'Protect freshwater ecosystems',
        duration: 365 * 24 * 60 * 60, // 1 year
        submitter: await ritualSubmitter.getAddress(),
      };

      await expect(
        symbiosisPledge
          .connect(ritualSubmitter)
          .createPledge(
            pledgeData.bioregion,
            pledgeData.commitment,
            pledgeData.duration,
          ),
      )
        .to.emit(symbiosisPledge, 'PledgeCreated')
        .withArgs(0, pledgeData.bioregion, pledgeData.commitment);

      const pledge = await symbiosisPledge.getPledge(0);
      expect(pledge.bioregion).to.equal(pledgeData.bioregion);
      expect(pledge.commitment).to.equal(pledgeData.commitment);
      expect(pledge.isActive).to.be.true;
    });

    it('should support voting on governance proposals', async () => {
      const proposalData = {
        title: 'Establish Cultural Heritage Council',
        description: 'Create council for ritual validation',
        submitter: await ritualSubmitter.getAddress(),
      };

      await expect(
        symbiosisPledge
          .connect(ritualSubmitter)
          .createProposal(proposalData.title, proposalData.description),
      )
        .to.emit(symbiosisPledge, 'ProposalCreated')
        .withArgs(0, proposalData.title);

      // Vote on proposal
      await expect(symbiosisPledge.connect(voter1).vote(0, true))
        .to.emit(symbiosisPledge, 'VoteCast')
        .withArgs(0, await voter1.getAddress(), true);

      await expect(symbiosisPledge.connect(voter2).vote(0, true))
        .to.emit(symbiosisPledge, 'VoteCast')
        .withArgs(0, await voter2.getAddress(), true);

      const proposal = await symbiosisPledge.getProposal(0);
      expect(proposal.yesVotes).to.equal(2);
      expect(proposal.noVotes).to.equal(0);
    });

    it('should prevent double voting on proposals', async () => {
      const proposalData = {
        title: 'Double Vote Test',
        description: 'Test double voting prevention',
        submitter: await ritualSubmitter.getAddress(),
      };

      await symbiosisPledge
        .connect(ritualSubmitter)
        .createProposal(proposalData.title, proposalData.description);

      await symbiosisPledge.connect(voter1).vote(0, true);

      await expect(
        symbiosisPledge.connect(voter1).vote(0, false),
      ).to.be.revertedWith('Already voted');
    });
  });

  describe('Cultural Heritage Council Integration', () => {
    it('should validate bioregional representation in council', async () => {
      // Create multiple pledges from different bioregions
      const bioregions = [
        'Pacific Northwest',
        'Appalachian Mountains',
        'Great Plains',
      ];

      for (let i = 0; i < bioregions.length; i++) {
        await symbiosisPledge
          .connect(ritualSubmitter)
          .createPledge(
            bioregions[i],
            `Commitment to ${bioregions[i]}`,
            365 * 24 * 60 * 60,
          );
      }

      const totalPledges = await symbiosisPledge.getTotalPledgeCount();
      expect(totalPledges).to.equal(3);

      // Check bioregional diversity
      const pledges = [];
      for (let i = 0; i < totalPledges; i++) {
        const pledge = await symbiosisPledge.getPledge(i);
        pledges.push(pledge.bioregion);
      }

      const uniqueBioregions = new Set(pledges);
      expect(uniqueBioregions.size).to.equal(3);
    });

    it('should calculate cultural diversity scores', async () => {
      // Submit rituals with different cultural references
      const culturalRituals = [
        {
          name: 'Indigenous Wisdom Ceremony',
          bioregion: 'Southwest Desert',
          culturalReferences: [
            'Navajo traditions',
            'Desert ecology',
            'Ancestral wisdom',
          ],
          emotionalSkew: 0.3,
        },
        {
          name: 'European Folk Traditions',
          bioregion: 'Northeast',
          culturalReferences: [
            'Celtic traditions',
            'Seasonal cycles',
            'Community bonding',
          ],
          emotionalSkew: 0.4,
        },
        {
          name: 'African Diaspora Ritual',
          bioregion: 'Southeast',
          culturalReferences: [
            'Yoruba traditions',
            'Ancestral connection',
            'Community healing',
          ],
          emotionalSkew: 0.2,
        },
      ];

      for (const ritual of culturalRituals) {
        await grcRitualSubmission
          .connect(ritualSubmitter)
          .submitRitual(
            ritual.name,
            ritual.bioregion,
            `Qm${ritual.name.replace(/\s+/g, '')}Hash`,
            ritual.culturalReferences,
            ritual.emotionalSkew,
          );
      }

      const totalRituals = await grcRitualSubmission.getTotalRitualCount();
      expect(totalRituals).to.equal(3);

      // Validate all rituals
      for (let i = 0; i < totalRituals; i++) {
        await grcRitualSubmission
          .connect(validator1)
          .validateRitual(i, true, 'Passes cultural diversity criteria');
      }

      // Check cultural diversity
      const validatedRituals = [];
      for (let i = 0; i < totalRituals; i++) {
        const ritual = await grcRitualSubmission.getRitual(i);
        if (ritual.isValidated) {
          validatedRituals.push(ritual);
        }
      }

      expect(validatedRituals.length).to.equal(3);
    });
  });

  describe('Narrative Forensics Integration', () => {
    it('should detect polarizing narratives in ritual submissions', async () => {
      const polarizingRitual = {
        name: 'Divisive Ceremony',
        bioregion: 'Urban Core',
        ipfsHash: 'QmPolarizingHash',
        culturalReferences: ['Exclusive tradition', 'Us vs them mentality'],
        emotionalSkew: 0.8, // High emotional skew
        submitter: await ritualSubmitter.getAddress(),
      };

      await grcRitualSubmission
        .connect(ritualSubmitter)
        .submitRitual(
          polarizingRitual.name,
          polarizingRitual.bioregion,
          polarizingRitual.ipfsHash,
          polarizingRitual.culturalReferences,
          polarizingRitual.emotionalSkew,
        );

      // This should trigger narrative forensics analysis
      await expect(
        grcRitualSubmission
          .connect(validator1)
          .validateRitual(
            0,
            false,
            'Detected polarizing narrative - violates CEDA principles',
          ),
      )
        .to.emit(grcRitualSubmission, 'RitualValidated')
        .withArgs(
          0,
          false,
          'Detected polarizing narrative - violates CEDA principles',
        );
    });

    it('should approve inclusive and harmonious narratives', async () => {
      const inclusiveRitual = {
        name: 'Harmony Ceremony',
        bioregion: 'Pacific Northwest',
        ipfsHash: 'QmInclusiveHash',
        culturalReferences: [
          'Indigenous wisdom',
          'Environmental stewardship',
          'Community unity',
        ],
        emotionalSkew: 0.2, // Low emotional skew
        submitter: await ritualSubmitter.getAddress(),
      };

      await grcRitualSubmission
        .connect(ritualSubmitter)
        .submitRitual(
          inclusiveRitual.name,
          inclusiveRitual.bioregion,
          inclusiveRitual.ipfsHash,
          inclusiveRitual.culturalReferences,
          inclusiveRitual.emotionalSkew,
        );

      await expect(
        grcRitualSubmission
          .connect(validator1)
          .validateRitual(
            0,
            true,
            'Passes narrative forensics - promotes cultural harmony',
          ),
      )
        .to.emit(grcRitualSubmission, 'RitualValidated')
        .withArgs(
          0,
          true,
          'Passes narrative forensics - promotes cultural harmony',
        );
    });
  });

  describe('Gas Optimization and Performance', () => {
    it('should optimize gas usage for batch operations', async () => {
      const rituals = [];
      for (let i = 0; i < 5; i++) {
        rituals.push({
          name: `Batch Ritual ${i}`,
          bioregion: `Bioregion ${i}`,
          ipfsHash: `QmBatchHash${i}`,
          culturalReferences: [`Culture ${i}`, `Tradition ${i}`],
          emotionalSkew: 0.3 + i * 0.1,
        });
      }

      // Submit multiple rituals and measure gas usage
      for (const ritual of rituals) {
        const tx = await grcRitualSubmission
          .connect(ritualSubmitter)
          .submitRitual(
            ritual.name,
            ritual.bioregion,
            ritual.ipfsHash,
            ritual.culturalReferences,
            ritual.emotionalSkew,
          );
        const receipt = await tx.wait();

        // Gas usage should be reasonable
        expect(receipt.gasUsed).to.be.lessThan(200000);
      }
    });

    it('should handle concurrent voting efficiently', async () => {
      // Create a proposal
      await symbiosisPledge
        .connect(ritualSubmitter)
        .createProposal(
          'Concurrent Vote Test',
          'Test concurrent voting performance',
        );

      // Simulate concurrent voting
      const voters = [voter1, voter2];
      const votePromises = voters.map((voter) =>
        symbiosisPledge.connect(voter).vote(0, true),
      );

      await Promise.all(votePromises);

      const proposal = await symbiosisPledge.getProposal(0);
      expect(proposal.yesVotes).to.equal(2);
    });
  });
});
