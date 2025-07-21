import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('PathFix Test', function () {
  it('should verify Hardhat path resolution', async function () {
    // Simple test to ensure Hardhat environment is correctly set up
    const [deployer] = await ethers.getSigners();
    expect(deployer).to.not.be.undefined;
    console.log('Hardhat path resolution test passed. Deployer address:', deployer.address);
  });
});