import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('Hardhat Compilation Test', function () {
  it('should compile and run a basic test', async function () {
    // This test simply verifies that the Hardhat environment is set up correctly
    // and can compile and run tests without errors.
    expect(true).to.equal(true);

    // Optionally, check if ethers is properly loaded
    expect(ethers).to.not.be.undefined;
  });
});