// Ritual Marketplace Service for Symbiotic Syntheconomy
// Implements trading, staking, and community rewards for cultural rituals

import { ethers } from 'ethers';
import { RitualNFT } from '../contracts/RitualNFT';
import { RitualToken } from '../contracts/RitualToken';
import { DatabaseService } from './databaseService';

interface Ritual {
  id: string;
  name: string;
  description: string;
  culturalOrigin: string;
  owner: string;
  price: ethers.BigNumber;
  stakedAmount: ethers.BigNumber;
  isListed: boolean;
}

interface Stake {
  ritualId: string;
  userAddress: string;
  amount: ethers.BigNumber;
  timestamp: number;
}

export class RitualMarketplaceService {
  private provider: ethers.providers.JsonRpcProvider;
  private signer: ethers.Signer;
  private ritualNFT: RitualNFT;
  private ritualToken: RitualToken;
  private db: DatabaseService;
  private readonly REWARD_RATE = ethers.utils.parseEther('0.01'); // Daily reward rate per staked token
  private readonly HERITAGE_FUND_PERCENTAGE = 10; // 10% of transaction fees to heritage fund

  constructor(
    providerUrl: string,
    nftContractAddress: string,
    tokenContractAddress: string
  ) {
    this.provider = new ethers.providers.JsonRpcProvider(providerUrl);
    this.signer = this.provider.getSigner();
    this.ritualNFT = new RitualNFT(nftContractAddress, this.signer);
    this.ritualToken = new RitualToken(tokenContractAddress, this.signer);
    this.db = new DatabaseService();
  }

  /**
   * Tokenize a new ritual as an NFT and list it in the marketplace
   */
  async tokenizeRitual(
    name: string,
    description: string,
    culturalOrigin: string,
    price: string
  ): Promise<string> {
    const priceInWei = ethers.utils.parseEther(price);
    const tx = await this.ritualNFT.mintRitual(name, description, culturalOrigin, priceInWei);
    const receipt = await tx.wait();
    const ritualId = receipt.events[0].args.tokenId.toString();

    await this.db.saveRitual({
      id: ritualId,
      name,
      description,
      culturalOrigin,
      owner: await this.signer.getAddress(),
      price: priceInWei,
      stakedAmount: ethers.BigNumber.from(0),
      isListed: true
    });

    return ritualId;
  }

  /**
   * List existing ritual for sale
   */
  async listRitual(ritualId: string, price: string): Promise<void> {
    const priceInWei = ethers.utils.parseEther(price);
    await this.ritualNFT.listRitual(ritualId, priceInWei);
    await this.db.updateRitual(ritualId, { price: priceInWei, isListed: true });
  }

  /**
   * Purchase a ritual NFT from the marketplace
   */
  async buyRitual(ritualId: string): Promise<void> {
    const ritual = await this.db.getRitual(ritualId);
    if (!ritual.isListed) throw new Error('Ritual not listed for sale');

    // Transfer tokens to seller and heritage fund
    const heritageFundAmount = ritual.price.mul(this.HERITAGE_FUND_PERCENTAGE).div(100);
    const sellerAmount = ritual.price.sub(heritageFundAmount);

    await this.ritualToken.transfer(ritual.owner, sellerAmount);
    await this.ritualToken.transfer(await this.getHeritageFundAddress(), heritageFundAmount);
    await this.ritualNFT.transferRitual(ritualId, await this.signer.getAddress());

    await this.db.updateRitual(ritualId, {
      owner: await this.signer.getAddress(),
      isListed: false
    });
  }

  /**
   * Stake tokens on a ritual to earn rewards and support cultural preservation
   */
  async stakeOnRitual(ritualId: string, amount: string): Promise<void> {
    const amountInWei = ethers.utils.parseEther(amount);
    await this.ritualToken.approve(this.ritualNFT.address, amountInWei);
    await this.ritualNFT.stakeRitual(ritualId, amountInWei);

    const stake: Stake = {
      ritualId,
      userAddress: await this.signer.getAddress(),
      amount: amountInWei,
      timestamp: Date.now()
    };
    await this.db.saveStake(stake);

    const ritual = await this.db.getRitual(ritualId);
    await this.db.updateRitual(ritualId, {
      stakedAmount: ritual.stakedAmount.add(amountInWei)
    });
  }

  /**
   * Unstake tokens from a ritual and claim rewards
   */
  async unstakeFromRitual(ritualId: string): Promise<void> {
    const stake = await this.db.getStake(ritualId, await this.signer.getAddress());
    if (!stake) throw new Error('No stake found');

    const rewards = await this.calculateRewards(stake);
    await this.ritualNFT.unstakeRitual(ritualId);
    await this.ritualToken.transfer(await this.signer.getAddress(), stake.amount.add(rewards));

    const ritual = await this.db.getRitual(ritualId);
    await this.db.updateRitual(ritualId, {
      stakedAmount: ritual.stakedAmount.sub(stake.amount)
    });
    await this.db.removeStake(ritualId, await this.signer.getAddress());
  }

  /**
   * Calculate staking rewards based on time and amount staked
   */
  async calculateRewards(stake: Stake): Promise<ethers.BigNumber> {
    const duration = (Date.now() - stake.timestamp) / (1000 * 60 * 60 * 24); // Days
    return stake.amount.mul(this.REWARD_RATE).mul(Math.floor(duration));
  }

  /**
   * Get the address of the heritage preservation fund
   */
  async getHeritageFundAddress(): Promise<string> {
    return this.ritualNFT.getHeritageFundAddress();
  }

  /**
   * Get marketplace statistics
   */
  async getMarketplaceStats(): Promise<{
    totalRituals: number;
    totalStaked: ethers.BigNumber;
    heritageFundBalance: ethers.BigNumber;
  }> {
    const rituals = await this.db.getAllRituals();
    const totalStaked = rituals.reduce(
      (sum, ritual) => sum.add(ritual.stakedAmount),
      ethers.BigNumber.from(0)
    );
    const heritageFundBalance = await this.ritualToken.balanceOf(
      await this.getHeritageFundAddress()
    );

    return {
      totalRituals: rituals.length,
      totalStaked,
      heritageFundBalance
    };
  }
}
